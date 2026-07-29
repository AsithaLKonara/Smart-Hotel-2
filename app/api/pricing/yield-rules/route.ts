import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const rules = await prisma.yieldRule.findMany({
      where: { isActive: true },
      orderBy: { startDate: 'asc' }
    })
    return NextResponse.json({ success: true, yieldRules: rules })
  } catch (error: any) {
    console.error('YieldRule GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch yield rules' }, { status: 500 })
  }
}
