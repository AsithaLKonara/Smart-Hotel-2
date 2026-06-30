import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
  try {
    // Fetch users who are NOT guests
    const staff = await prisma.user.findMany({
      where: {
        role: {
          name: { not: 'GUEST' }
        }
      },
      include: {
        role: true
      }
    })

    return NextResponse.json({ staff })
  } catch (error: any) {
    console.error('Fetch Staff Error:', error)
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
  }
}