import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getRequestSession } from '@/lib/session'
import { z } from 'zod'

const updateMaintenanceRequestSchema = z.object({
  assignedTo: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  completedAt: z.string().datetime().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRequestSession(request)
  
  if (!session || !['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = updateMaintenanceRequestSchema.parse(body)

    const updateData: any = { ...validatedData }
    if (validatedData.status === 'completed' && !validatedData.completedAt) {
      updateData.completedAt = new Date()
    }

    const request = await prisma.maintenanceRequest.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(request)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating maintenance request:', error)
    return NextResponse.json(
      { error: 'Failed to update maintenance request', message: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRequestSession(request)
  
  if (!session || !['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params

    await prisma.maintenanceRequest.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Maintenance request deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting maintenance request:', error)
    return NextResponse.json(
      { error: 'Failed to delete maintenance request', message: error.message },
      { status: 500 }
    )
  }
}

