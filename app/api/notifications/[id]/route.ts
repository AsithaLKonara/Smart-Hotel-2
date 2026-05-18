import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getRequestSession } from '@/lib/session'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRequestSession(request)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()

    // Check if user owns this notification
    const notification = await prisma.notification.findUnique({
      where: { id },
      select: { userId: true, read: true },
    })

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    // Only allow users to update their own notifications, or admins
    if (notification.userId !== session.user.id && 
        !['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Mark as read if updating read status
    const updateData: any = { ...body }
    if (body.read === true && !notification.read) {
      updateData.readAt = new Date()
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Error updating notification:', error)
    return NextResponse.json(
      { error: 'Failed to update notification', message: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRequestSession(request)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params

    // Check if user owns this notification
    const notification = await prisma.notification.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    // Only allow users to delete their own notifications, or admins
    if (notification.userId !== session.user.id && 
        !['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.notification.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Notification deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting notification:', error)
    return NextResponse.json(
      { error: 'Failed to delete notification', message: error.message },
      { status: 500 }
    )
  }
}

