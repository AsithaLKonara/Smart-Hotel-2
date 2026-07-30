import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const assets = await prisma.asset.findMany({
      include: {
        schedules: true,
        inspections: true,
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(assets)
  } catch (error) {
    console.error('Failed to fetch assets:', error)
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const asset = await prisma.asset.create({
      data: {
        name: data.name,
        category: data.category,
        location: data.location,
        serialNumber: data.serialNumber,
        installationDate: data.installationDate ? new Date(data.installationDate) : null,
        warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : null,
        notes: data.notes,
      },
    })
    return NextResponse.json(asset, { status: 201 })
  } catch (error) {
    console.error('Failed to create asset:', error)
    return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 })
  }
}
