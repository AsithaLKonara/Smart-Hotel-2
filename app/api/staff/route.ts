import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
  try {
    // Fetch employees for task assignment
    const employees = await prisma.employee.findMany({
      where: {
        status: 'ACTIVE'
      }
    })

    const staff = employees.map(emp => ({
      ...emp,
      name: `${emp.firstName} ${emp.lastName}`
    }))

    return NextResponse.json({ staff })
  } catch (error: any) {
    console.error('Fetch Staff Error:', error)
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
  }
}