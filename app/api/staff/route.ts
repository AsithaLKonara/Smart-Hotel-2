import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getEffectivePropertyId } from '@/lib/server-rbac'

export async function GET(request: NextRequest) {
  try {
    const propertyId = await getEffectivePropertyId(request)
    const propertyWhere = propertyId && propertyId !== 'all' ? { propertyId } : {}

    // Fetch employees for task assignment
    const employees = await prisma.employee.findMany({
      where: {
        status: 'ACTIVE',
        ...propertyWhere
      }
    })

    const staff = employees.map((emp: any) => ({
      ...emp,
      name: `${emp.firstName} ${emp.lastName}`
    }))

    return NextResponse.json({ staff })
  } catch (error: any) {
    console.error('Fetch Staff Error:', error)
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
  }
}