import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  flagGuestSecurityStatus,
  checkGuestSecurityClearance,
  clearGuestSecurityStatus
} from '@/lib/crm/security-alerts'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.roleName || (session?.user as any)?.role

    const allowedRoles = ['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST']
    if (session && !allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden', message: `Role [${userRole}] cannot access security clearance` },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId') || undefined
    const email = searchParams.get('email') || undefined
    const phone = searchParams.get('phone') || undefined
    const currentPropertyId = searchParams.get('propertyId') || 'GLOBAL'

    const clearance = await checkGuestSecurityClearance({
      userId,
      email,
      phone,
      currentPropertyId
    })

    return NextResponse.json({
      success: true,
      clearance
    })
  } catch (error: any) {
    console.error('Error checking security clearance:', error)
    return NextResponse.json(
      { error: 'Failed to evaluate security clearance', details: error?.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.roleName || (session?.user as any)?.role

    const allowedRoles = ['SUPER_ADMIN', 'MANAGER']
    if (session && !allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden', message: `Role [${userRole}] cannot modify guest security flags` },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action = 'FLAG', userId, blacklistStatus, blacklistReason, vipStatus, flaggedByPropertyId, incidentReference, pardonReason } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    if (action === 'CLEAR') {
      const cleared = await clearGuestSecurityStatus(userId, pardonReason || 'Manager review pardon', session?.user?.id)
      return NextResponse.json(cleared)
    }

    if (!flaggedByPropertyId) {
      return NextResponse.json({ error: 'flaggedByPropertyId is required' }, { status: 400 })
    }

    const result = await flagGuestSecurityStatus({
      userId,
      blacklistStatus,
      blacklistReason,
      vipStatus,
      flaggedByPropertyId,
      incidentReference,
      actorUserId: session?.user?.id
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error modifying security flags:', error)
    return NextResponse.json(
      { error: 'Failed to modify security flag', message: error?.message || 'Internal error' },
      { status: 400 }
    )
  }
}
