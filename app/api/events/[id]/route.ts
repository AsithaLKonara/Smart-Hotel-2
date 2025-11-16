import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getRequestSession } from '@/lib/session'

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

    const updateData: any = { ...body }
    if (body.eventDate) {
      updateData.eventDate = new Date(body.eventDate)
    }

    const event = await prisma.event.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(event)
  } catch (error: any) {
    console.error('Error updating event:', error)
    return NextResponse.json(
      { error: 'Failed to update event', message: error.message },
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

    await prisma.event.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Event deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting event:', error)
    return NextResponse.json(
      { error: 'Failed to delete event', message: error.message },
      { status: 500 }
    )
  }
}

