import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
  try {
    // In a real app we'd filter by role="GUEST", but here we just find users who have guest profiles/history
    const guests = await prisma.user.findMany({
      where: {
        OR: [
          { guestHistory: { isNot: null } },
          { guestProfile: { isNot: null } },
          { vipStatus: { not: 'STANDARD' } },
          { role: { name: 'GUEST' } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        vipStatus: true,
        guestHistory: {
          select: {
            totalStays: true,
            totalSpend: true
          }
        },
        loyalty: {
          select: {
            tier: true,
            points: true
          }
        }
      },
      orderBy: {
        guestHistory: { totalSpend: 'desc' }
      },
      take: 50
    })

    return NextResponse.json(guests)
  } catch (error: any) {
    console.error('Fetch CRM Guests Error:', error)
    return NextResponse.json({ error: 'Failed to fetch guests' }, { status: 500 })
  }
}
