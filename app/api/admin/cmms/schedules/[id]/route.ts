import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getEffectivePropertyId } from '@/lib/server-rbac'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const propertyId = await getEffectivePropertyId(req)
    if (!propertyId || propertyId === 'all') {
      return NextResponse.json({ error: 'Valid property context is required' }, { status: 400 })
    }

    const { id } = await params
    
    // Make sure the schedule belongs to the property before deleting
    const existing = await prisma.maintenanceSchedule.findUnique({
        where: { id }
    })

    if (!existing || existing.propertyId !== propertyId) {
        return NextResponse.json({ error: 'Schedule not found or unauthorized' }, { status: 404 })
    }

    await prisma.maintenanceSchedule.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete schedule:', error)
    return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 })
  }
}
