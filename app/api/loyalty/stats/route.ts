import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !['MANAGER', 'SUPER_ADMIN'].includes(session.user?.roleName || '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const totalMembers = await prisma.loyaltyPoint.count()
    const platinumMembers = await prisma.loyaltyPoint.count({ where: { tier: 'PLATINUM' } })
    const reviews = await prisma.feedback.aggregate({ _avg: { rating: true } })
    
    return NextResponse.json({
      totalMembers,
      platinumCount: platinumMembers,
      guestSatisfactionScore: reviews._avg.rating ? Number(((reviews._avg.rating / 5) * 100).toFixed(1)) : 0
    })
  } catch (error) {
    console.error('Failed to get loyalty stats', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
