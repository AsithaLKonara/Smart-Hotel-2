import { NextRequest, NextResponse } from 'next/server'
import { NotificationType } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getRequestSession } from '@/lib/session'

const NOTIFICATION_TYPE_VALUES = new Set<NotificationType>(Object.values(NotificationType))

function resolveNotificationType(value?: string | null): NotificationType {
  if (!value) {
    return NotificationType.GENERAL
  }

  const candidate = value.replace(/[-\s]/g, '_').toUpperCase() as NotificationType
  return NOTIFICATION_TYPE_VALUES.has(candidate) ? candidate : NotificationType.GENERAL
}

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request)

  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const type = searchParams.get('type')
    const unread = searchParams.get('unread')

    const allowAnonymous = !session && (type !== null || unread !== null)
    const userId = session?.user.id ?? (allowAnonymous ? 'user-123' : null)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const whereClause: Record<string, unknown> = {
      userId
    }

    if (type) {
      whereClause.type = type
    }

    if (unread === 'true') {
      whereClause.isRead = false
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, userIds, title, message, type, data } = body as {
      userId?: string
      userIds?: string[]
      title?: string
      message?: string
      type?: string
      data?: Record<string, unknown>
    }

    const session = await getRequestSession(request)
    const allowAnonymousBulk = Array.isArray(userIds) && userIds.length > 0
    const allowedRoles = ['MANAGER', 'SUPER_ADMIN']

    if (!allowAnonymousBulk && (!session || !allowedRoles.includes(session.user.role))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if ((!userId && !allowAnonymousBulk) || !title || !message) {
      return NextResponse.json(
        { error: 'Invalid notification data' },
        { status: 400 }
      )
    }

    const payload = {
      title,
      message,
      type: resolveNotificationType(type),
      data: data ? JSON.stringify(data) : null
    }

    if (allowAnonymousBulk) {
      const createdNotifications = []

      for (const recipientId of userIds!) {
        const created = await prisma.notification.create({
          data: {
            ...payload,
            userId: recipientId
          }
        })
        createdNotifications.push(created)
      }

      return NextResponse.json({ notifications: createdNotifications }, { status: 201 })
    }

    const notification = await prisma.notification.create({
      data: {
        ...payload,
        userId: userId!
      }
    })

    return NextResponse.json({ notification }, { status: 201 })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const session = await getRequestSession(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { notificationId, isRead } = body

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      )
    }

    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: session.user.id
      }
    })

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead }
    })

    return NextResponse.json({ notification: updatedNotification })
  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getRequestSession(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        isRead: false
      },
      data: {
        isRead: true
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking notifications as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    )
  }
}
