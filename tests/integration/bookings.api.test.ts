import { NextRequest } from 'next/server'
import { seedTestData, cleanupTestData } from '../fixtures/seed'

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined)

type StoreRecord = Record<string, any>

type BookingStores = {
  user: Map<string, StoreRecord>
  room: Map<string, StoreRecord>
  foodMenu: Map<string, StoreRecord>
  booking: Map<string, StoreRecord>
  invoice: Map<string, StoreRecord>
  notification: Map<string, StoreRecord>
}

function getBookingStores(): BookingStores {
  const globalRef = globalThis as any
  if (!globalRef.__BOOKING_STORES__) {
    globalRef.__BOOKING_STORES__ = {
      user: new Map<string, StoreRecord>(),
      room: new Map<string, StoreRecord>(),
      foodMenu: new Map<string, StoreRecord>(),
      booking: new Map<string, StoreRecord>(),
      invoice: new Map<string, StoreRecord>(),
      notification: new Map<string, StoreRecord>(),
    } satisfies BookingStores
  }
  return globalRef.__BOOKING_STORES__ as BookingStores
}

function clone<T>(value: T): T {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : (JSON.parse(JSON.stringify(value)) as T)
}

function matchCondition(value: any, condition: any): boolean {
  if (condition == null) return true
  if (typeof condition === 'object' && !(condition instanceof Date) && !Array.isArray(condition)) {
    if ('in' in condition) {
      return condition.in.includes(value)
    }
    if ('gte' in condition) {
      return new Date(value) >= new Date(condition.gte)
    }
    if ('lte' in condition) {
      return new Date(value) <= new Date(condition.lte)
    }
    if ('startsWith' in condition) {
      return typeof value === 'string' && value.startsWith(condition.startsWith)
    }
    if ('equals' in condition) {
      return value === condition.equals
    }
  }
  return value === condition
}

function matchWhere(record: StoreRecord, where?: Record<string, any>): boolean {
  if (!where) return true

  return Object.entries(where).every(([key, condition]) => {
    if (key === 'OR' && Array.isArray(condition)) {
      return condition.some((sub) => matchWhere(record, sub))
    }
    const value = record[key]
    return matchCondition(value, condition)
  })
}

function pick(record: StoreRecord | undefined, select?: Record<string, boolean>) {
  if (!record) return null
  if (!select) return clone(record)
  const picked: StoreRecord = {}
  for (const [key, enabled] of Object.entries(select)) {
    if (enabled && key in record) {
      picked[key] = clone(record[key])
    }
  }
  return picked
}

function attachBookingIncludes(record: StoreRecord, include?: Record<string, any>) {
  if (!include) return record
  const enriched = { ...record }
  if (include.room) {
    const room = bookingStores.room.get(record.roomId)
    enriched.room =
      include.room === true ? clone(room) : pick(room, include.room.select)
  }
  if (include.user) {
    const user = bookingStores.user.get(record.primaryGuestId)
    enriched.user =
      include.user === true ? clone(user) : pick(user as any, include.user.select)
  }
  if (include.invoice) {
    const invoice = [...bookingStores.invoice.values()].find(
      (item) => item.bookingId === record.id
    )
    enriched.invoice =
      include.invoice === true ? clone(invoice) : pick(invoice, include.invoice.select)
  }
  return enriched
}

jest.mock('@/lib/db', () => {
  const bookingStores = getBookingStores()
  const makeFindMany =
    (store: Map<string, StoreRecord>, opts: { includeHandler?: (record: StoreRecord, include?: Record<string, any>) => StoreRecord } = {}) =>
    async (params: Record<string, any> = {}) => {
      const { where, include, orderBy, take } = params
      let results = [...store.values()].filter((record) => matchWhere(record, where)).map(clone)

      if (orderBy) {
        const [field, direction] = Object.entries(orderBy)[0]
        results.sort((a, b) => {
          const aVal = a[field]
          const bVal = b[field]
          if (aVal === bVal) return 0
          const comparison = aVal > bVal ? 1 : -1
          return direction === 'desc' ? -comparison : comparison
        })
      }

      if (typeof take === 'number') {
        results = results.slice(0, take)
      }

      if (opts.includeHandler) {
        results = results.map((record) => opts.includeHandler!(record, include))
      }

      return results
    }

  const ensureRoomStatus = (record: StoreRecord | null | undefined) => {
    if (!record) return record
    if (record.status) {
      return record
    }
    return { ...record, status: 'AVAILABLE' }
  }

  const roomFindManyBase = makeFindMany(bookingStores.room)

  const prisma = {
    user: {
      upsert: async ({ where, update, create }: any) => {
        const id = where.id
        const existing = bookingStores.user.get(id)
        const record = existing ? { ...existing, ...update } : { ...create, id }
        bookingStores.user.set(id, record)
        return clone(record)
      },
      findUnique: async ({ where }: any) => {
        if (where.id) {
          return clone(bookingStores.user.get(where.id) || null)
        }
        if (where.email) {
          const user = [...bookingStores.user.values()].find((item) => item.email === where.email)
          return clone(user || null)
        }
        return null
      },
      create: async ({ data }: any) => {
        const id = data.id || `user-${bookingStores.user.size + 1}`
        const record = { ...data, id }
        bookingStores.user.set(id, record)
        return clone(record)
      },
      deleteMany: async ({ where }: any) => {
        for (const [id] of bookingStores.user) {
          if (matchWhere({ id }, where)) {
            bookingStores.user.delete(id)
          }
        }
      },
    },
    room: {
      upsert: async ({ where, update, create }: any) => {
        const id = where.id
        const existing = bookingStores.room.get(id)
        const record = existing ? { ...existing, ...update } : { ...create, id }
        const normalized = ensureRoomStatus({ status: 'AVAILABLE', ...record }) as any
        bookingStores.room.set(id, normalized)
        return clone(normalized)
      },
      findUnique: async ({ where }: any) => {
        if (where.id) {
          const record = bookingStores.room.get(where.id) || null
          return record ? clone(ensureRoomStatus(record)) : null
        }
        if (where.number) {
          const room = [...bookingStores.room.values()].find((item) => item.number === where.number)
          return room ? clone(ensureRoomStatus(room)) : null
        }
        return null
      },
      findMany: async (params: Record<string, any> = {}) => {
        const results = await roomFindManyBase(params)
        return results.map((record) => clone(ensureRoomStatus(record)))
      },
      findFirst: async (params: Record<string, any> = {}) => {
        const results = await roomFindManyBase({ ...params, take: 1 })
        const first = results[0]
        return first ? clone(ensureRoomStatus(first)) : null
      },
      deleteMany: async ({ where }: any) => {
        for (const [id] of bookingStores.room) {
          if (matchWhere({ id }, where)) {
            bookingStores.room.delete(id)
          }
        }
      },
    },
    foodMenu: {
      upsert: async ({ where, update, create }: any) => {
        const id = where.id
        const existing = bookingStores.foodMenu.get(id)
        const record = existing ? { ...existing, ...update } : { ...create, id }
        bookingStores.foodMenu.set(id, record)
        return clone(record)
      },
      findUnique: async ({ where }: any) => {
        return clone(bookingStores.foodMenu.get(where.id) || null)
      },
      findMany: makeFindMany(bookingStores.foodMenu),
      deleteMany: async ({ where }: any) => {
        for (const [id] of bookingStores.foodMenu) {
          if (matchWhere({ id }, where)) {
            bookingStores.foodMenu.delete(id)
          }
        }
      },
    },
    booking: {
      upsert: async ({ where, update, create }: any) => {
        const id = where.id
        const existing = bookingStores.booking.get(id)
        const record = existing ? { ...existing, ...update } : { ...create, id }
        bookingStores.booking.set(id, record)
        return clone(record)
      },
      findMany: makeFindMany(bookingStores.booking, { includeHandler: attachBookingIncludes }),
      findFirst: async ({ where }: any) => {
        const records = await prisma.booking.findMany({ where })
        return records[0] ?? null
      },
      count: async ({ where }: any = {}) => {
        return (await prisma.booking.findMany({ where })).length
      },
      aggregate: async ({ where, _sum, _count }: any = {}) => {
        const records = await prisma.booking.findMany({ where })
        const sum = records.reduce((total, record) => total + (record.totalAmount ?? record.totalPrice ?? 0), 0)
        return {
          _sum: {
            totalPrice: _sum?.totalPrice ? sum : undefined,
          },
          _count: {
            id: _count?.id ? records.length : undefined,
          },
        }
      },
      create: async ({ data }: any) => {
        const id = data.id || `booking-${bookingStores.booking.size + 1}`
        const record = { ...data, id }
        bookingStores.booking.set(id, record)
        return clone(record)
      },
      update: async ({ where, data }: any) => {
        const existing = bookingStores.booking.get(where.id)
        if (!existing) {
          throw new Error('Booking not found')
        }
        const record = { ...existing, ...data }
        bookingStores.booking.set(where.id, record)
        return clone(record)
      },
      deleteMany: async ({ where }: any) => {
        for (const [id, record] of bookingStores.booking) {
          if (matchWhere({ ...record, id }, where)) {
            bookingStores.booking.delete(id)
          }
        }
      },
    },
    invoice: {
      create: async ({ data }: any) => {
        const id = data.id || `invoice-${bookingStores.invoice.size + 1}`
        const record = { ...data, id }
        bookingStores.invoice.set(id, record)
        return clone(record)
      },
    },
    notification: {
      create: async ({ data }: any) => {
        const id = data.id || `notification-${bookingStores.notification.size + 1}`
        const record = { ...data, id }
        bookingStores.notification.set(id, record)
        return clone(record)
      },
      updateMany: async ({ where, data }: any) => {
        for (const [id, record] of bookingStores.notification) {
          if (matchWhere({ ...record, id }, where)) {
            bookingStores.notification.set(id, { ...record, ...data })
          }
        }
      },
      findMany: makeFindMany(bookingStores.notification),
    },
  }

  return { prisma }
})

const bookingStores = getBookingStores()

describe('Bookings API Integration Tests', () => {
  beforeAll(async () => {
    for (const store of Object.values(bookingStores)) {
      store.clear()
    }
    await seedTestData()
  })

  afterAll(async () => {
    await cleanupTestData()
    for (const store of Object.values(bookingStores)) {
      store.clear()
    }
    consoleErrorSpy.mockRestore()
    consoleLogSpy.mockRestore()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/bookings', () => {
    it('should return bookings for authenticated user', async () => {
      const { getServerSession } = await import('next-auth')
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'test-user-1', role: 'GUEST' }
      })

      const req = new NextRequest('http://localhost:3000/api/bookings')
      req.headers.set('x-forwarded-for', '192.168.1.1')

      const { GET } = await import('@/app/api/bookings/route')
      const response = await GET(req)

      expect(response).toBeDefined()
      if (response) {
        expect(response.status).toBe(200)
        const data = await response.json()
        expect(Array.isArray(data.bookings)).toBe(true)
      }
    })

    it('should return 401 for unauthenticated user', async () => {
      const { getServerSession } = await import('next-auth')
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const req = new NextRequest('http://localhost:3000/api/bookings')

      const { GET } = await import('@/app/api/bookings/route')
      const response = await GET(req)

      expect(response).toBeDefined()
      if (response) {
        expect(response.status).toBe(401)
      }
    })
  })

  describe('POST /api/bookings', () => {
    it('should create booking for authenticated user', async () => {
      const { getServerSession } = await import('next-auth')
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'test-user-1', role: 'GUEST' }
      })

      const bookingData = {
        roomId: 'test-room-1',
        checkIn: '2025-10-01T00:00:00Z',
        checkOut: '2025-10-03T00:00:00Z',
        guests: 2,
        specialRequests: 'Test booking'
      }

      const req = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1'
        }
      })

      const { POST } = await import('@/app/api/bookings/route')
      const response = await POST(req)

      expect(response).toBeDefined()
      if (response) {
        expect(response.status).toBe(201)
        const data = await response.json()
        expect(data).toHaveProperty('booking')
        expect(data.booking).toHaveProperty('id')
      }
    })

    it('should return 400 for invalid booking data', async () => {
      const { getServerSession } = await import('next-auth')
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'test-user-1', role: 'GUEST' }
      })

      const invalidData = {
        roomId: '', // Invalid: empty room ID
        checkIn: 'invalid-date',
        guests: -1 // Invalid: negative guests
      }

      const req = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const { POST } = await import('@/app/api/bookings/route')
      const response = await POST(req)

      expect(response).toBeDefined()
      if (response) {
        expect(response.status).toBe(400)
      }
    })

    it('should return 401 for unauthenticated user', async () => {
      const { getServerSession } = await import('next-auth')
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const bookingData = {
        roomId: 'test-room-1',
        checkIn: '2025-10-01T00:00:00Z',
        checkOut: '2025-10-03T00:00:00Z',
        guests: 2
      }

      const req = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const { POST } = await import('@/app/api/bookings/route')
      const response = await POST(req)

      expect(response).toBeDefined()
      if (response) {
        expect(response.status).toBe(401)
      }
    })
  })
})