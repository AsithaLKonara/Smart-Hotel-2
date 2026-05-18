import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // If userId provided, filter by it (Guest view). 
    // Otherwise, if Admin/Manager, show all.
    const where: any = {}
    if (userId) {
      where.userId = userId
    } else if (!['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST'].includes(session.user.role)) {
      where.userId = session.user.id
    }

    const bookings = await prisma.tableBooking.findMany({
      where,
      orderBy: { bookingDate: 'desc' },
      include: { user: { select: { name: true, email: true } } }
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error('Error fetching table bookings:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    
    const { name, email, phone, guests, bookingDate, bookingTime, specialRequests } = body

    if (!name || !email || !guests || !bookingDate || !bookingTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const booking = await prisma.tableBooking.create({
      data: {
        name,
        email,
        phone,
        guests: parseInt(guests),
        bookingDate: new Date(bookingDate),
        bookingTime,
        specialRequests,
        userId: session?.user?.id || null,
        status: 'PENDING'
      }
    })

    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    console.error('Error creating table booking:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const booking = await prisma.tableBooking.update({
      where: { id },
      data: { status }
    })

    return NextResponse.json(booking)
  } catch (error) {
    console.error('Error updating table booking:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
