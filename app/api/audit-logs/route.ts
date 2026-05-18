import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isDatabaseConfigured } from '@/lib/db-helpers'

// Simulated fallback cache of administrative audit events
let SIMULATED_AUDIT_LOGS: any[] = [
  {
    id: "mock-log-1",
    actor: "manager@smarthotel.com",
    action: "CHAOS_TOGGLE",
    details: JSON.stringify({ scenario: "DB_LATENCY", status: "ENABLED", trigger: "Manual Control" }),
    ip: "127.0.0.1",
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString()
  },
  {
    id: "mock-log-2",
    actor: "receptionist@smarthotel.com",
    action: "ROOM_REASSIGNMENT",
    details: JSON.stringify({ room: "401", guest: "Richard Branson", originalRoom: "302" }),
    ip: "192.168.1.102",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  },
  {
    id: "mock-log-3",
    actor: "chef@smarthotel.com",
    action: "KITCHEN_ORDER_TRANSITION",
    details: JSON.stringify({ orderId: "K102", state: "Preparing", elapsed: "12 mins" }),
    ip: "192.168.1.150",
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString()
  }
];

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const limit = Math.min(Number(searchParams.get('limit')) || 50, 100)
  const action = searchParams.get('action') || undefined

  if (!isDatabaseConfigured()) {
    let filtered = SIMULATED_AUDIT_LOGS;
    if (action) {
      filtered = filtered.filter(l => l.action === action);
    }
    return NextResponse.json({
      logs: filtered.slice(0, limit),
      isMock: true,
      message: 'Utilizing local simulated memory stream due to connection status.'
    })
  }

  try {
    const whereClause: any = {}
    if (action) {
      whereClause.action = action
    }

    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    return NextResponse.json({ logs, isMock: false })
  } catch (error: any) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json({
      logs: SIMULATED_AUDIT_LOGS,
      isMock: true,
      error: error.message,
      message: 'Fell back to simulated memory index.'
    })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Action blocked.' }, { status: 401 })
  }

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
      const mockLogEntry = {
        id: `mock-log-${Date.now()}`,
        ...newLogData,
        createdAt: new Date().toISOString()
      }
      SIMULATED_AUDIT_LOGS = [mockLogEntry, ...SIMULATED_AUDIT_LOGS]
      return NextResponse.json({ log: mockLogEntry, isMock: true })
    }

    const log = await prisma.auditLog.create({
      data: newLogData
    })

    return NextResponse.json({ log, isMock: false })
  } catch (error: any) {
    console.error('Error recording audit log:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}
