import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUnifiedGuestDossier, updateCrossPropertyPreferences } from '@/lib/crm/guest-dossier'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.roleName || (session?.user as any)?.role

    const allowedRoles = ['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST']
    if (session && !allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden', message: `Role [${userRole}] cannot access guest dossier` },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId') || undefined
    const email = searchParams.get('email') || undefined
    const phone = searchParams.get('phone') || undefined
    const viewingPropertyId = searchParams.get('propertyId') || undefined

    if (!userId && !email && !phone) {
      return NextResponse.json(
        { error: 'At least one query parameter (userId, email, or phone) is required' },
        { status: 400 }
      )
    }

    const dossier = await getUnifiedGuestDossier({
      userId,
      email,
      phone,
      viewingPropertyId
    })

    if (!dossier) {
      return NextResponse.json(
        { error: 'Guest dossier not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      dossier
    })
  } catch (error: any) {
    console.error('Error fetching guest dossier:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve guest dossier', details: error?.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.roleName || (session?.user as any)?.role

    const allowedRoles = ['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST']
    if (session && !allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden', message: `Role [${userRole}] cannot update guest dossier` },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      userId,
      dietaryRestrictions,
      allergies,
      roomPreferences,
      conciergeNotes,
      updatedByPropertyId
    } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const result = await updateCrossPropertyPreferences({
      userId,
      dietaryRestrictions,
      allergies,
      roomPreferences,
      conciergeNotes,
      updatedByPropertyId,
      actorUserId: session?.user?.id
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error updating guest dossier preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences', details: error?.message },
      { status: 400 }
    )
  }
}
