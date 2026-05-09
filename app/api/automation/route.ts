import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// In-Memory persistent automation recipes list
let AUTOMATION_RULES: any[] = [
  {
    id: "rule-1",
    name: "VIP Departure Room Clean",
    trigger: "GUEST_CHECKOUT",
    conditions: { guestClass: "VIP", roomType: "PRESIDENTIAL" },
    action: "AUTO_ASSIGN_HOUSEKEEPING",
    actionTarget: "Senior Housekeeping Supervisor",
    active: true,
    runCount: 14,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
  },
  {
    id: "rule-2",
    name: "Late Night Emergency Alert",
    trigger: "SECURITY_ANOMALY",
    conditions: { severity: "CRITICAL", hourAfter: 22 },
    action: "ESCALATE_SMS_ALERT",
    actionTarget: "Operations General Manager",
    active: true,
    runCount: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
  },
  {
    id: "rule-3",
    name: "Standard Booking Auto-Welcome",
    trigger: "BOOKING_CREATED",
    conditions: { channel: "DIRECT_BOOKING" },
    action: "HOLD_ROOM_BLOCK",
    actionTarget: "Room Dispatcher Queue",
    active: false,
    runCount: 0,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
  }
];

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Session missing.' }, { status: 401 })
  }

  return NextResponse.json({ rules: AUTOMATION_RULES })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Admin context required.' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, trigger, conditions, action, actionTarget } = body

    if (!name || !trigger || !action) {
      return NextResponse.json({ error: 'Bad Request: Missing operational parameters.' }, { status: 400 })
    }

    const newRule = {
      id: `rule-${Date.now()}`,
      name,
      trigger,
      conditions: conditions || {},
      action,
      actionTarget: actionTarget || "Default Operational Queue",
      active: true,
      runCount: 0,
      createdAt: new Date().toISOString()
    }

    AUTOMATION_RULES = [newRule, ...AUTOMATION_RULES]

    // Create Audit Log entries
    await fetch(`${request.nextUrl.origin}/api/audit-logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify({
        action: 'AUTOMATION_RULE_CREATED',
        details: { ruleId: newRule.id, name: newRule.name, trigger: newRule.trigger, action: newRule.action }
      })
    }).catch(() => {})

    return NextResponse.json({ success: true, rule: newRule })
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Admin context required.' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Bad Request: Missing target rule identifier.' }, { status: 400 })
    }

    const initialLength = AUTOMATION_RULES.length
    AUTOMATION_RULES = AUTOMATION_RULES.filter(r => r.id !== id)

    if (AUTOMATION_RULES.length < initialLength) {
      // Create Audit Log
      await fetch(`${request.nextUrl.origin}/api/audit-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || ''
        },
        body: JSON.stringify({
          action: 'AUTOMATION_RULE_DELETED',
          details: { ruleId: id }
        })
      }).catch(() => {})

      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: 'Not Found: Rule identifier not resolved.' }, { status: 44 })
    }
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 })
  }
}
