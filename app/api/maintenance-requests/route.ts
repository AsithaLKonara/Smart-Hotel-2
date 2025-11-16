import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getRequestSession } from '@/lib/session'
import { z } from 'zod'

const maintenanceRequestSchema = z.object({
  roomId: z.string().optional(),
  userId: z.string().min(1),
  assignedTo: z.string().optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(['plumbing', 'electrical', 'hvac', 'general', 'other']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).default('pending'),
})

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')
    const assignedTo = searchParams.get('assignedTo')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')

    const where: any = {}

    // Regular users can only see their own requests
    if (!['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'].includes(session.user.role)) {
      where.userId = session.user.id
    }

    if (roomId) where.roomId = roomId
    if (assignedTo) where.assignedTo = assignedTo
    if (status) where.status = status
    if (priority) where.priority = priority

    const requests = await prisma.maintenanceRequest.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(requests)
  } catch (error: any) {
    console.error('Error fetching maintenance requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch maintenance requests', message: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = maintenanceRequestSchema.parse(body)

    // Users can only create requests for themselves unless admin
    if (validatedData.userId !== session.user.id && 
        !['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const maintenanceRequest = await prisma.maintenanceRequest.create({
      data: validatedData,
    })

    return NextResponse.json(maintenanceRequest, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating maintenance request:', error)
    return NextResponse.json(
      { error: 'Failed to create maintenance request', message: error.message },
      { status: 500 }
    )
  }
}

