import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getRequestSession } from '@/lib/session'
import { z } from 'zod'

const guestPreferenceSchema = z.object({
  userId: z.string().min(1),
  dietaryRestrictions: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
  roomPreferences: z.array(z.string()).default([]),
  bedType: z.string().optional(),
  specialNeeds: z.string().optional(),
  preferences: z.string().optional(), // JSON string
})

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Users can only see their own preferences unless they're admin
    const targetUserId = userId && ['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'].includes(session.user.role)
      ? userId
      : session.user.id

    const preference = await prisma.guestPreference.findUnique({
      where: { userId: targetUserId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(preference || null)
  } catch (error: any) {
    console.error('Error fetching guest preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch guest preferences', message: error.message },
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
    const validatedData = guestPreferenceSchema.parse(body)

    // Users can only create/update their own preferences
    if (validatedData.userId !== session.user.id && 
        !['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const preference = await prisma.guestPreference.upsert({
      where: { userId: validatedData.userId },
      update: validatedData,
      create: validatedData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(preference, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error saving guest preferences:', error)
    return NextResponse.json(
      { error: 'Failed to save guest preferences', message: error.message },
      { status: 500 }
    )
  }
}

