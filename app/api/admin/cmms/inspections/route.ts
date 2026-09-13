import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getEffectivePropertyId } from '@/lib/server-rbac'

export async function GET(req: NextRequest) {
  try {
    const propertyId = await getEffectivePropertyId(req)
    const propertyWhere = propertyId && propertyId !== 'all' ? { propertyId } : {}

    const inspections = await prisma.inspectionLog.findMany({
      where: propertyWhere,
      include: {
        asset: true,
      },
      orderBy: { inspectionDate: 'desc' },
    })
    return NextResponse.json(inspections)
  } catch (error) {
    console.error('Failed to fetch inspections:', error)
    return NextResponse.json({ error: 'Failed to fetch inspections' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const propertyId = await getEffectivePropertyId(req)
    if (!propertyId || propertyId === 'all') {
      return NextResponse.json({ error: 'Valid property context is required' }, { status: 400 })
    }

    const data = await req.json()
    const inspection = await prisma.inspectionLog.create({
      data: {
        assetId: data.assetId,
        technicianName: data.technicianName,
        status: data.status,
        notes: data.notes,
        propertyId: propertyId,
      },
      include: {
        asset: true
      }
    })
    return NextResponse.json(inspection, { status: 201 })
  } catch (error) {
    console.error('Failed to log inspection:', error)
    return NextResponse.json({ error: 'Failed to log inspection' }, { status: 500 })
  }
}
