import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Persistent in-memory incidents dataset
let INCIDENTS: any[] = [
  {
    id: "inc-101",
    title: "Double-Booking Conflict: Presidential Suite",
    category: "RECEPTION",
    severity: "CRITICAL",
    status: "OPEN",
    owner: "Amanda Reception Desk",
    slaMinutesRemaining: 12,
    message: "Two VIP bookings mapped to Presidential Suite 405 for consecutive night slots.",
    notes: "Reviewing calendar override allocations to re-assign booking-id 503 to Suite 401.",
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString()
  },
  {
    id: "inc-102",
    title: "KDS Late Breach: Ticket #82",
    category: "DINING",
    severity: "HIGH",
    status: "ACKNOWLEDGED",
    owner: "Chef Henri",
    slaMinutesRemaining: 25,
    message: "Main course steak frites ticket delay exceeded 30 minutes threshold.",
    notes: "Prioritizing dish with floor staff. Runner dispatched.",
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString()
  },
  {
    id: "inc-103",
    title: "Water Condenser Leak: Room 304",
    category: "MAINTENANCE",
    severity: "CRITICAL",
    status: "INVESTIGATING",
    owner: "Marcus HVAC Crew",
    slaMinutesRemaining: 5,
    message: "AC compressor drip tray overflowing. Standing water reported under desk.",
    notes: "Main shutoff valve locked. Pruning water line.",
    createdAt: new Date(Date.now() - 1000 * 60 * 55).toISOString()
  },
  {
    id: "inc-104",
    title: "OTA Channel Sync Drift",
    category: "SECURITY",
    severity: "MEDIUM",
    status: "MITIGATED",
    owner: "SRE Platform Team",
    slaMinutesRemaining: 110,
    message: "Booking.com connection timed out. Sync logs reporting timezone offsets.",
    notes: "Reconciliation sweep triggered. Cache flushed. Awaiting manual confirmation.",
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString()
  }
];

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Admin context missing.' }, { status: 401 })
  }

  return NextResponse.json({ incidents: INCIDENTS })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Admin context missing.' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { title, category, severity, owner, message } = body

    if (!title || !category || !severity) {
      return NextResponse.json({ error: 'Bad Request: Missing incident parameters.' }, { status: 400 })
    }

    const newIncident = {
      id: `inc-${Date.now().toString().substr(9, 4)}`,
      title,
      category,
      severity,
      status: "OPEN",
      owner: owner || "Unassigned Operator Queue",
      slaMinutesRemaining: severity === "CRITICAL" ? 15 : severity === "HIGH" ? 30 : 120,
      message: message || "Direct operator ticket generated.",
      notes: "Awaiting triage investigation.",
      createdAt: new Date().toISOString()
    }

    INCIDENTS = [newIncident, ...INCIDENTS]

    // Push into audit logs
    await fetch(`${request.nextUrl.origin}/api/audit-logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify({
        action: 'INCIDENT_OPENED',
        details: { incidentId: newIncident.id, title: newIncident.title, severity: newIncident.severity }
      })
    }).catch(() => {})

    return NextResponse.json({ success: true, incident: newIncident })
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Session required.' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, status, notes, owner } = body

    if (!id) {
      return NextResponse.json({ error: 'Bad Request: Missing target incident identifier.' }, { status: 400 })
    }

    const index = INCIDENTS.findIndex(i => i.id === id)
    if (index === -1) {
      return NextResponse.json({ error: 'Not Found: Incident ticket not found.' }, { status: 404 })
    }

    // Update keys
    if (status) INCIDENTS[index].status = status
    if (notes) INCIDENTS[index].notes = notes
    if (owner) INCIDENTS[index].owner = owner

    // Dispatch logs
    await fetch(`${request.nextUrl.origin}/api/audit-logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify({
        action: 'INCIDENT_MODIFIED',
        details: { incidentId: id, status: INCIDENTS[index].status, owner: INCIDENTS[index].owner }
      })
    }).catch(() => {})

    return NextResponse.json({ success: true, incident: INCIDENTS[index] })
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 })
  }
}
