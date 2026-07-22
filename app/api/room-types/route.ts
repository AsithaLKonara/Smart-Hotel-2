import { NextRequest, NextResponse } from 'next/server'
import { getRequestSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { isDatabaseConfigured, getDatabaseErrorMessage } from '@/lib/db-helpers'
import { z } from 'zod'
import { handleZodError } from '@/lib/api-utils'

const roomTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().default(''),
  baseRate: z.number().min(0, 'Base rate must be non-negative'),
  capacity: z.number().int().min(1).default(2),
  amenities: z.array(z.string()).optional().default([]),
  images: z.array(z.string()).optional().default([]),
  minLengthOfStay: z.number().int().min(1).optional().default(1),
  maxLengthOfStay: z.number().int().min(1).optional().default(30),
})

export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured', roomTypes: [] }, { status: 503 })
  }

  try {
    const roomTypes = await prisma.roomType.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { rooms: true }
        }
      }
    })

    return NextResponse.json(roomTypes)
  } catch (error: any) {
    console.error('Error fetching room types:', error)
    return NextResponse.json({ error: 'Failed to fetch room types', message: getDatabaseErrorMessage(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getRequestSession(request)
    const rawRole = (session?.user as any)?.roleName || (session?.user as any)?.role || ''
    
    const { getBroadRole } = await import('@/lib/rbac-utils')
    const userRole = getBroadRole(rawRole)
    
    const allowedRoles = ['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST']
    
    if (!session || !allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = roomTypeSchema.parse(body)

    const existing = await prisma.roomType.findUnique({
      where: { name: validatedData.name }
    })

    if (existing) {
      return NextResponse.json({ error: 'Room Type name already exists' }, { status: 400 })
    }

    const roomType = await prisma.roomType.create({
      data: validatedData
    })

    return NextResponse.json(roomType, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error)
    }
    console.error('Error creating room type:', error)
    return NextResponse.json({ 
      error: 'Failed to create room type', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
