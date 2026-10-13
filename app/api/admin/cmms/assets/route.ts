import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getEffectivePropertyId } from '@/lib/server-rbac'

export async function GET(req: NextRequest) {
  try {
    const propertyId = await getEffectivePropertyId(req)
    const propertyWhere = propertyId && propertyId !== 'all' ? { propertyId } : {}

    const assets = await prisma.asset.findMany({
      where: propertyWhere,
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

export async function POST(req: NextRequest) {
  try {
    const propertyId = await getEffectivePropertyId(req)
    if (!propertyId || propertyId === 'all') {
      return NextResponse.json({ error: 'Valid property context is required' }, { status: 400 })
    }

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
        propertyId: propertyId,
      },
    })
    return NextResponse.json(asset, { status: 201 })
  } catch (error) {
    console.error('Failed to create asset:', error)
    return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 })
  }
}
