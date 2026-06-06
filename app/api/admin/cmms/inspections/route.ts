import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const inspections = await prisma.inspectionLog.findMany({
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

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const inspection = await prisma.inspectionLog.create({
      data: {
        assetId: data.assetId,
        technicianName: data.technicianName,
        status: data.status,
        notes: data.notes,
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
