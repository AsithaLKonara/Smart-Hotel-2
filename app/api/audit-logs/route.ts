import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isDatabaseConfigured } from '@/lib/db-helpers'

// SIMULATED_AUDIT_LOGS removed to enforce production constraints.

import { requirePermission } from '@/lib/server-rbac'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 })
  }

  // Authorize: require either VIEW_REPORTS or MANAGE_ROLES
  const reportGuard = await requirePermission('VIEW_REPORTS')
  const roleGuard = await requirePermission('MANAGE_ROLES')
  if (reportGuard && roleGuard) {
    return reportGuard
  }

  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get('cursor')
  const limit = Math.min(Number(searchParams.get('limit')) || 50, 100)
  const action = searchParams.get('action') || undefined

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured or missing connection.' }, { status: 501 })
  }

  try {
    const whereClause: any = {}
    if (action) {
      whereClause.action = action
    }

    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0
    })

    let nextCursor: string | undefined = undefined
    if (logs.length > limit) {
      const nextItem = logs.pop()
      nextCursor = nextItem!.id
    }

    return NextResponse.json({ 
      logs,
      nextCursor,
      hasMore: !!nextCursor
    })
  } catch (error: any) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json({
      error: error.message,
      message: 'Failed to load audit logs.'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Action blocked.' }, { status: 401 })
  }

  // Authorize: require MANAGE_ROLES for executing manual rollbacks/audit records
  const roleGuard = await requirePermission('MANAGE_ROLES')
  if (roleGuard) return roleGuard

  try {
    const body = await request.json()
    const { action, details } = body

    if (!action || !details) {
      return NextResponse.json({ error: 'Bad Request: Missing action or details properties.' }, { status: 400 })
    }

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    const actor = session.user?.email || session.user?.name || 'Anonymous Staff'
    const userId = (session.user as any)?.id || null

    const newLogData: any = {
      actor,
      action,
      resource: body.resource || 'System',
      resourceId: body.resourceId || 'global',
      details: {
        ...(typeof details === 'object' ? details : { message: details }),
        ip
      },
      userId: userId && userId.length === 24 ? userId : null // MongoDB ObjectId 24-hex safety check
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured.' }, { status: 501 })
    }

    const log = await prisma.auditLog.create({
      data: newLogData
    })

    return NextResponse.json({ log })
  } catch (error: any) {
    console.error('Error recording audit log:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}
