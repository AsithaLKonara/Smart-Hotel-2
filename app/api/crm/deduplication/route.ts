import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  scanForDuplicateGuests,
  mergeGuestIntoGoldenRecord
} from '@/lib/crm/identity-resolution'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.roleName || (session?.user as any)?.role

    const allowedRoles = ['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST']
    if (session && !allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden', message: `Role [${userRole}] cannot access guest deduplication` },
        { status: 403 }
      )
    }

    const candidates = await scanForDuplicateGuests()

    return NextResponse.json({
      success: true,
      duplicateCandidates: candidates,
      count: candidates.length
    })
  } catch (error: any) {
    console.error('Error scanning duplicate guests:', error)
    return NextResponse.json(
      { error: 'Failed to scan for duplicate guests', details: error?.message },
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
        { error: 'Forbidden', message: `Role [${userRole}] cannot merge guest profiles` },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { primaryId, secondaryId } = body

    if (!primaryId || !secondaryId) {
      return NextResponse.json(
        { error: 'primaryId and secondaryId are required' },
        { status: 400 }
      )
    }

    const result = await mergeGuestIntoGoldenRecord(primaryId, secondaryId, session?.user?.id)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error merging guest profile:', error)
    return NextResponse.json(
      { error: 'Failed to merge guest profiles', message: error?.message || 'Internal error' },
      { status: 400 }
    )
  }
}
