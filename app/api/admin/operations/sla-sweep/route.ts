import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requirePermission } from '@/lib/server-rbac'

export async function POST() {
  try {
    const authError = await requirePermission('pos:write')
    if (authError) return authError

    const cutoffTime = new Date(Date.now() - 20 * 60000) // 20 mins ago

    // Mathematically escalate all unassigned/pending tasks exceeding the 20 minute SLA window
    const result = await prisma.task.updateMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: cutoffTime }
      },
      data: {
        priority: 'URGENT',
      }
    })

    return NextResponse.json({ success: true, escalatedCount: result.count })

  } catch (error) {
    console.error('SLA Sweep Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
