import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserLevel, ROLE_HIERARCHY } from '@/lib/rbac-helpers'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || getUserLevel(session) < ROLE_HIERARCHY.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

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
