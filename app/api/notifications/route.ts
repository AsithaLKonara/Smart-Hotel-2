import { NextRequest, NextResponse } from 'next/server'
import { getRequestSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { isDatabaseConfigured } from '@/lib/db-helpers'

// MOCK_NOTIFICATIONS removed to enforce production constraints.

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Session missing.' }, { status: 401 })
  }

  const userId = session.user.id

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured or missing connection.' }, { status: 501 })
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: userId && userId.length === 24 ? { userId } : {}, // Safe ObjectId check
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    return NextResponse.json({ notifications, isMock: false })
  } catch (error: any) {
    console.error('Error loading notifications:', error)
    return NextResponse.json({
      error: error.message,
      message: 'Failed to load notifications.'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Action blocked.' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { type, title, message, link, targetUserId } = body

    if (!type || !title || !message) {
      return NextResponse.json({ error: 'Bad Request: Missing notification properties.' }, { status: 400 })
    }

    const userId = targetUserId || session.user.id

    const notificationPayload = {
      type,
      title,
      message,
      link: link || null,
      read: false,
      userId: userId && userId.length === 24 ? userId : null
    }

    if (!isDatabaseConfigured() || !notificationPayload.userId) {
      return NextResponse.json({ error: 'Database not configured or invalid userId.' }, { status: 501 })
    }

    const notification = await prisma.notification.create({
      data: notificationPayload as any
    })

    return NextResponse.json({ notification, isMock: false })
  } catch (error: any) {
    console.error('Error creating notification:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getRequestSession(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Action blocked.' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, markAllRead } = body

    if (!id && !markAllRead) {
      return NextResponse.json({ error: 'Bad Request: Missing target notification id or modifier.' }, { status: 400 })
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured.' }, { status: 501 })
    }

    if (markAllRead) {
      const userId = session.user.id
      await prisma.notification.updateMany({
        where: userId && userId.length === 24 ? { userId, read: false } : { read: false },
        data: { read: true, readAt: new Date() }
      })
    } else {
      await prisma.notification.update({
        where: { id },
        data: { read: true, readAt: new Date() }
      })
    }

    return NextResponse.json({ success: true, isMock: false })
  } catch (error: any) {
    console.error('Error updating notifications:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}
