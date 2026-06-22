import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const properties = await prisma.property.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(properties)
  } catch (error) {
    console.error('Failed to fetch properties:', error)
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const property = await prisma.property.create({
      data: {
        name: data.name,
        code: data.code,
        address: data.address,
        city: data.city,
        country: data.country,
        timezone: data.timezone,
        totalRooms: parseInt(data.totalRooms) || 0,
        status: data.status,
      },
    })
    return NextResponse.json(property, { status: 201 })
  } catch (error) {
    console.error('Failed to create property:', error)
    return NextResponse.json({ error: 'Failed to create property' }, { status: 500 })
  }
}
