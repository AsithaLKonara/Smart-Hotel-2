import { jest } from '@jest/globals'
import { getRequestSession } from '@/lib/session'
import type { NextRequest } from 'next/server'

jest.mock('next-auth', () => {
  const actual = jest.requireActual('next-auth')
  return {
    __esModule: true,
    ...actual,
    getServerSession: jest.fn(),
  }
})

const { getServerSession } = jest.requireMock('next-auth') as { getServerSession: jest.Mock }

const createRequest = (headers: Record<string, string> = {}): NextRequest => {
  const normalized = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  )

  return {
    headers: {
      get: (key: string) => normalized[key.toLowerCase()] ?? null,
    },
  } as unknown as NextRequest
}

describe('lib/session', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('builds session from x-test headers in jest environment', async () => {
    const request = createRequest({
      'x-test-role': 'MANAGER',
      'x-test-user-id': 'staff-1',
      'x-test-hotel-id': 'hotel-99',
      'x-test-user-name': 'Taylor Swift',
      'x-test-user-email': 'taylor@example.com',
    })

    const session = await getRequestSession(request)
    expect(session).toEqual({
      user: {
        id: 'staff-1',
        role: 'MANAGER',
        hotelId: 'hotel-99',
        name: 'Taylor Swift',
        email: 'taylor@example.com',
      },
    })
    expect(getServerSession).not.toHaveBeenCalled()
  })

  it('maps bearer tokens to mock users for Playwright fixtures', async () => {
    const request = createRequest({ Authorization: 'Bearer manager-token' })
    const session = await getRequestSession(request)

    expect(session?.user).toEqual(
      expect.objectContaining({ id: 'manager-user', role: 'MANAGER', email: 'manager@example.com' }),
    )
  })

  it('returns null for unknown bearer tokens', async () => {
    const request = createRequest({ authorization: 'Bearer unknown-token' })
    const session = await getRequestSession(request)
    expect(session).toBeNull()
  })
})
