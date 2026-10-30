import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  submitBrandStandardsAudit,
  resolveCorrectiveAction,
  getChainPropertyQARankings,
  getPropertyAuditHistory
} from '@/lib/governance/brand-audit'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.roleName || (session?.user as any)?.role

    const allowedRoles = ['SUPER_ADMIN', 'MANAGER', 'REGIONAL_DIRECTOR']
    if (session && !allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden', message: `Role [${userRole}] cannot access brand audit inspections` },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')
    const propertyId = searchParams.get('propertyId')

    if (type === 'chain-rankings') {
      const rankings = await getChainPropertyQARankings()
      return NextResponse.json({ success: true, count: rankings.length, rankings })
    }

    if (propertyId) {
      const history = await getPropertyAuditHistory(propertyId)
      return NextResponse.json({ success: true, count: history.length, audits: history })
    }

    const rankings = await getChainPropertyQARankings()
    return NextResponse.json({ success: true, count: rankings.length, rankings })
  } catch (error: any) {
    console.error('Error fetching audit inspections:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve audit inspection data', details: error?.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.roleName || (session?.user as any)?.role

    const allowedRoles = ['SUPER_ADMIN', 'MANAGER', 'REGIONAL_DIRECTOR']
    if (session && !allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden', message: `Role [${userRole}] cannot record or modify audit inspections` },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action = 'SUBMIT_AUDIT' } = body

    if (action === 'SUBMIT_AUDIT') {
      const { propertyId, inspectionDate, inspectorName, checklistItems, generalNotes } = body

      if (!propertyId || !inspectionDate || !checklistItems) {
        return NextResponse.json(
          { error: 'propertyId, inspectionDate, and checklistItems are required' },
          { status: 400 }
        )
      }

      const audit = await submitBrandStandardsAudit({
        propertyId,
        inspectionDate,
        inspectorName: inspectorName || (session?.user as any)?.name || 'Brand Standards Auditor',
        inspectorUserId: session?.user?.id,
        checklistItems,
        generalNotes,
        actorUserId: session?.user?.id
      })

      return NextResponse.json({ success: true, audit })
    }

    if (action === 'RESOLVE_CAP') {
      const { auditId, actionId, resolutionNotes } = body

      if (!auditId || !actionId || !resolutionNotes) {
        return NextResponse.json(
          { error: 'auditId, actionId, and resolutionNotes are required to resolve corrective action' },
          { status: 400 }
        )
      }

      const resolved = await resolveCorrectiveAction({
        auditId,
        actionId,
        resolutionNotes,
        actorUserId: session?.user?.id
      })

      return NextResponse.json({ success: true, ...resolved })
    }

    return NextResponse.json({ error: `Unsupported action [${action}]` }, { status: 400 })
  } catch (error: any) {
    console.error('Error processing audit inspection action:', error)
    return NextResponse.json(
      { error: 'Failed to process audit action', details: error?.message },
      { status: 400 }
    )
  }
}
