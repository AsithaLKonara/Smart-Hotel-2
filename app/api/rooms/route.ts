import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getToken } from 'next-auth/jwt'
import { getBroadRole } from '@/lib/rbac-utils'
import { prisma } from '@/lib/db'
import { isDatabaseConfigured, getDatabaseErrorMessage } from '@/lib/db-helpers'
import { getEffectivePropertyId } from '@/lib/server-rbac'
import { z } from 'zod'
import { unstable_cache, revalidatePath } from 'next/cache'
import { handleZodError, toPublicRoomDTO } from '@/lib/api-utils'

const roomSchema = z.object({
  number: z.string().min(1, 'Room number is required'),
  roomTypeId: z.string().min(1, 'Room Type ID is required'),
  floor: z.number().int().min(0).optional().default(0),
  size: z.number().int().min(0).optional().default(25),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'DIRTY', 'CLEANING', 'INSPECTION_PENDING', 'MAINTENANCE', 'OUT_OF_ORDER']).default('AVAILABLE'),
  images: z.array(z.string()).optional()
})

export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured', rooms: [] }, { status: 503 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const typeId = searchParams.get('roomTypeId')
    const status = searchParams.get('status')
    const availableOnly = searchParams.get('available') === 'true'
    const reqPropertyId = searchParams.get('propertyId')
    const effectivePropertyId = await getEffectivePropertyId(request)
    const rawPropertyId = reqPropertyId || effectivePropertyId
    const propertyId = rawPropertyId && rawPropertyId !== 'all' ? rawPropertyId : null

    const session = await getServerSession(authOptions)
    let userRole = (session?.user as any)?.roleName || (session?.user as any)?.role?.name
    if (!userRole) {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        cookieName: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token'
      }).catch(() => null)
      if (token) {
        userRole = (token.roleName || token.role || '') as string
      }
    }
    const broadRole = getBroadRole(userRole || '')
    const isAuthenticatedStaff = ['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING', 'MAINTENANCE'].includes(broadRole)

    let rooms;
    if (isAuthenticatedStaff) {
      // Operational staff require live, zero-latency room status for front desk & housekeeping
      const whereClause: any = { deletedAt: null }
      if (typeId) whereClause.roomTypeId = typeId
      if (status) whereClause.status = status
      if (availableOnly) whereClause.status = 'AVAILABLE'
      if (propertyId) whereClause.propertyId = propertyId

      rooms = await prisma.room.findMany({
        where: whereClause,
        include: {
          roomType: true,
          roomImages: true
        } as any,
        orderBy: { number: 'asc' }
      })
    } else {
      const getCachedRooms = async (tId: string | null, stat: string | null, availOnly: boolean, pId: string | null) => {
        const fetchRooms = unstable_cache(
          async () => {
            const whereClause: any = {
              deletedAt: null
            }
            if (tId) whereClause.roomTypeId = tId
            if (stat) whereClause.status = stat
            if (availOnly) whereClause.status = 'AVAILABLE'
            if (pId) whereClause.propertyId = pId

            return prisma.room.findMany({
              where: whereClause,
              include: {
                roomType: true,
                roomImages: true
              } as any,
              orderBy: { number: 'asc' }
            })
          },
          ['public-rooms-list', tId || 'all', stat || 'all', availOnly ? 'avail' : 'all', pId || 'all'],
          { revalidate: 60, tags: ['rooms'] }
        )
        return fetchRooms()
      }
      rooms = await getCachedRooms(typeId, status, availableOnly, propertyId)
    }

    const returnRooms = isAuthenticatedStaff ? rooms : rooms.map(toPublicRoomDTO)

    return NextResponse.json({
      rooms: returnRooms,
      count: returnRooms.length
    })
  } catch (error: any) {
    console.error('Error fetching rooms:', error)
    return NextResponse.json({ error: 'Failed to fetch rooms', message: getDatabaseErrorMessage(error) }, { status: 503 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (!['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = roomSchema.parse(body)
    const propertyId = await getEffectivePropertyId(request)

    const existingRoom = await prisma.room.findFirst({
      where: { 
        number: validatedData.number,
        propertyId: propertyId 
      }
    })

    if (existingRoom) {
      return NextResponse.json({ error: 'Room number already exists' }, { status: 400 })
    }

    const room = await prisma.room.create({
      data: {
        number: validatedData.number,
        floor: validatedData.floor,
        size: validatedData.size,
        status: validatedData.status as any,
        version: 1,
        ...(propertyId ? { property: { connect: { id: propertyId } } } : {}),
        roomType: {
          connect: { id: validatedData.roomTypeId }
        },
        ...(validatedData.images && validatedData.images.length > 0 ? {
          roomImages: {
            create: validatedData.images.map((url, idx) => ({
              imageUrl: url,
              isMain: idx === 0,
              displayOrder: idx
            }))
          }
        } : {})
      } as any,
      include: { 
        roomType: true,
        roomImages: true
      } as any
    })

    revalidatePath('/', 'layout')

    return NextResponse.json(room, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return handleZodError(error)
    }
    console.error('Error creating room:', error)
    
    // Check for Prisma P2025 "Record to update not found" / connection error for missing property
    if (error.code === 'P2025' && error.meta?.cause?.includes('Property')) {
      return NextResponse.json({ 
        error: 'Invalid Property selected. Please clear your cache or select a valid property in the top bar.' 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      error: 'Failed to create room', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}