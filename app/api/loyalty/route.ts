import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getRequestSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Users can only see their own loyalty points unless admin
    const targetUserId = userId && ['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'].includes(session.user.role)
      ? userId
      : session.user.id

    const loyaltyPoint = await prisma.loyaltyPoint.findFirst({
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

    return NextResponse.json(loyaltyPoint || null)
  } catch (error: any) {
    console.error('Error fetching loyalty points:', error)
    return NextResponse.json(
      { error: 'Failed to fetch loyalty points', message: error.message },
      { status: 500 }
    )
  }
}

