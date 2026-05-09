import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isDatabaseConfigured } from '@/lib/db-helpers'

// High-fidelity fallback notifications cache
let MOCK_NOTIFICATIONS: any[] = [
  {
    id: "notif-1",
    userId: "mock-user-id",
    type: "booking",
    title: "New Premium Booking",
    message: "Sir Richard Branson completed booking for Room 401 (Presidential Suite).",
    link: "/admin/receptionist",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString()
  },
  {
    id: "notif-2",
    userId: "mock-user-id",
    type: "system",
    title: "Kitchen SLA Warning",
    message: "Order #K104 (Room 202) has exceeded SLA target limit of 20 minutes.",
    link: "/kitchen/dashboard",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString()
  },
  {
    id: "notif-3",
    userId: "mock-user-id",
    type: "task",
    title: "Room Release Confirmed",
    message: "Room 102 transitioned to AVAILABLE after final supervisor inspection check.",
    link: "/admin/housekeeping",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString()
  }
];

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Session missing.' }, { status: 401 })
  }

  const userId = (session.user as any)?.id

  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      notifications: MOCK_NOTIFICATIONS,
      isMock: true,
      message: 'Utilizing local simulated notifications queue.'
    })
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
      notifications: MOCK_NOTIFICATIONS,
      isMock: true,
      error: error.message,
      message: 'Fell back to simulated notification context.'
    })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Action blocked.' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { type, title, message, link, targetUserId } = body

    if (!type || !title || !message) {
      return NextResponse.json({ error: 'Bad Request: Missing notification properties.' }, { status: 400 })
    }

    const userId = targetUserId || (session.user as any)?.id || null

    const notificationPayload = {
      type,
      title,
      message,
      link: link || null,
      read: false,
      userId: userId && userId.length === 24 ? userId : null
    }

    if (!isDatabaseConfigured() || !notificationPayload.userId) {
      const mockNotifEntry = {
        id: `notif-${Date.now()}`,
        ...notificationPayload,
        userId: notificationPayload.userId || "mock-user-id",
        createdAt: new Date().toISOString()
      }
      MOCK_NOTIFICATIONS = [mockNotifEntry, ...MOCK_NOTIFICATIONS]
      return NextResponse.json({ notification: mockNotifEntry, isMock: true })
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
  const session = await getServerSession(authOptions)
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
      if (markAllRead) {
        MOCK_NOTIFICATIONS = MOCK_NOTIFICATIONS.map(n => ({ ...n, read: true, readAt: new Date().toISOString() }))
      } else {
        MOCK_NOTIFICATIONS = MOCK_NOTIFICATIONS.map(n => n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n)
      }
      return NextResponse.json({ success: true, isMock: true })
    }

    if (markAllRead) {
      const userId = (session.user as any)?.id
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
