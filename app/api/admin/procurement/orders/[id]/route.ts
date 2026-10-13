import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await req.json()
    const { status } = data
    
    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    const po = await prisma.purchaseOrder.update({
      where: { id },
      data: { status }
    })

    return NextResponse.json(po)
  } catch (error) {
    console.error('Failed to update PO status:', error)
    return NextResponse.json({ error: 'Failed to update PO status' }, { status: 500 })
  }
}
