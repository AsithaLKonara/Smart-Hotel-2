import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const facilities = await prisma.resortFacility.findMany({
        include: {
            services: true,
            bookings: {
                include: { guest: { select: { name: true } } },
                orderBy: { startTime: 'asc' }
            }
        }
    })
    return NextResponse.json(facilities)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch resort data' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()

    // Conflict check
    const conflicts = await prisma.resortBooking.findMany({
        where: {
            facilityId: data.facilityId,
            status: 'CONFIRMED',
            AND: [
                { startTime: { lt: new Date(data.endTime) } },
                { endTime: { gt: new Date(data.startTime) } }
            ]
        }
    })

    if (conflicts.length > 0) {
        return NextResponse.json({ error: 'Time slot is already booked' }, { status: 400 })
    }

    const booking = await prisma.resortBooking.create({
      data: {
        facilityId: data.facilityId,
        guestId: data.guestId,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        notes: data.notes
      }
    })
    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
  }
}
