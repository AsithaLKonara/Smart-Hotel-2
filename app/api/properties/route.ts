import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
  try {
    const properties = await prisma.property.findMany({
      select: { id: true, name: true }
    })
    return NextResponse.json(properties)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 })
  }
}
