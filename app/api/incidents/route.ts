import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Admin context missing.' }, { status: 401 })
  }

  try {
    const incidents = await prisma.incident.findMany({
      orderBy: { createdAt: 'desc' }
    })

    const activeIncidents = incidents.filter((i: any) => !['RESOLVED', 'CLOSED'].includes(i.status))

    const pressure = ['RECEPTION', 'HOUSEKEEPING', 'DINING', 'MAINTENANCE'].map((dept: any) => {
      const activeCount = activeIncidents.filter((i: any) => i.category === dept).length
      // 1 incident = 20% pressure baseline. 0 incidents = 5% background load.
      const index = activeCount === 0 ? 5 : Math.min(100, activeCount * 25)
      const workload = index < 40 ? 'Normal Pacing' : index < 80 ? 'High Overload Risk' : 'CRITICAL PRESSURE'
      const color = index < 40 ? 'bg-emerald-500' : index < 80 ? 'bg-amber-500 animate-pulse' : 'bg-rose-500 animate-ping'
      
      const names: Record<string, string> = {
        'RECEPTION': 'Reception / Front Desk',
        'HOUSEKEEPING': 'Housekeeping Desk',
        'DINING': 'Kitchen / Dining SLA',
        'MAINTENANCE': 'Maintenance HVAC'
      }
      return { name: names[dept], index, workload, color }
    })

    return NextResponse.json({ incidents, pressure })
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
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

    const slaMinutesRemaining = severity === "CRITICAL" || severity === "EMERGENCY" ? 15 : severity === "HIGH" ? 30 : 120

    const newIncident = await prisma.incident.create({
      data: {
        title,
        category,
        severity,
        status: "OPEN",
        owner: owner || "Unassigned Operator Queue",
        slaMinutesRemaining,
        message: message || "Direct operator ticket generated.",
        notes: "Awaiting triage investigation."
      }
    })

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

    const updatedIncident = await prisma.incident.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(owner && { owner })
      }
    })

    // Dispatch logs
    await fetch(`${request.nextUrl.origin}/api/audit-logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify({
        action: 'INCIDENT_MODIFIED',
        details: { incidentId: id, status: updatedIncident.status, owner: updatedIncident.owner }
      })
    }).catch(() => {})

    return NextResponse.json({ success: true, incident: updatedIncident })
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 })
  }
}
