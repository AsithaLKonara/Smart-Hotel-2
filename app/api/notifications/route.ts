import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getRequestSession } from '@/lib/session'
import { z } from 'zod'

const notificationSchema = z.object({
  userId: z.string().min(1),
  type: z.string().min(1),
  title: z.string().min(1),
  message: z.string().min(1),
  link: z.string().url().optional(),
})

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const read = searchParams.get('read')
    const type = searchParams.get('type')

    // Users can only see their own notifications unless they're admin
    const where: any = {}
    if (['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'].includes(session.user.role)) {
      if (userId) where.userId = userId
    } else {
      where.userId = session.user.id
    }

    if (read !== null) {
      where.read = read === 'true'
    }
    if (type) {
      where.type = type
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to recent 50
    })

    return NextResponse.json(notifications)
  } catch (error: any) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications', message: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request)
  
  if (!session || !['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = notificationSchema.parse(body)

    const notification = await prisma.notification.create({
      data: validatedData,
    })

    return NextResponse.json(notification, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification', message: error.message },
      { status: 500 }
    )
  }
}
