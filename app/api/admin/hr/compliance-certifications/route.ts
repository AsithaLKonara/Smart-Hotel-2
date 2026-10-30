import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  recordStaffCertification,
  renewStaffCertification,
  getStaffCertifications,
  getPropertyComplianceAuditMatrix
} from '@/lib/hr/compliance-certifications'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.roleName || (session?.user as any)?.role

    const allowedRoles = ['SUPER_ADMIN', 'MANAGER']
    if (session && !allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden', message: `Role [${userRole}] cannot access compliance certifications` },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')
    const employeeId = searchParams.get('employeeId')
    const propertyId = searchParams.get('propertyId') || undefined

    if (type === 'audit-matrix') {
      const matrix = await getPropertyComplianceAuditMatrix(propertyId)
      return NextResponse.json({ success: true, ...matrix })
    }

    if (employeeId) {
      const certs = await getStaffCertifications(employeeId)
      return NextResponse.json({ success: true, count: certs.length, certifications: certs })
    }

    const matrix = await getPropertyComplianceAuditMatrix(propertyId)
    return NextResponse.json({ success: true, ...matrix })
  } catch (error: any) {
    console.error('Error fetching compliance certifications:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve compliance records', details: error?.message },
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
        { error: 'Forbidden', message: `Role [${userRole}] cannot modify compliance certifications` },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action = 'RECORD' } = body

    if (action === 'RECORD') {
      const {
        employeeId,
        certificationType,
        certificationName,
        issuingAuthority,
        licenseNumber,
        issueDate,
        expiryDate,
        notes
      } = body

      if (!employeeId || !certificationType || !certificationName || !licenseNumber || !issueDate || !expiryDate) {
        return NextResponse.json(
          { error: 'employeeId, certificationType, certificationName, licenseNumber, issueDate, and expiryDate are required' },
          { status: 400 }
        )
      }

      const cert = await recordStaffCertification({
        employeeId,
        certificationType,
        certificationName,
        issuingAuthority: issuingAuthority || 'Statutory Authority',
        licenseNumber,
        issueDate,
        expiryDate,
        notes,
        actorUserId: session?.user?.id
      })
      return NextResponse.json({ success: true, certification: cert })
    }

    if (action === 'RENEW') {
      const { certificationId, newExpiryDate, renewalReference, notes } = body
      if (!certificationId || !newExpiryDate) {
        return NextResponse.json(
          { error: 'certificationId and newExpiryDate are required to renew certification' },
          { status: 400 }
        )
      }

      const renewed = await renewStaffCertification({
        certificationId,
        newExpiryDate,
        renewalReference,
        notes,
        actorUserId: session?.user?.id
      })
      return NextResponse.json({ success: true, certification: renewed })
    }

    return NextResponse.json({ error: `Unsupported action [${action}]` }, { status: 400 })
  } catch (error: any) {
    console.error('Error processing compliance certification action:', error)
    return NextResponse.json(
      { error: 'Failed to process compliance certification', details: error?.message },
      { status: 400 }
    )
  }
}
