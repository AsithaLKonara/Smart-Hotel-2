import { prisma } from '@/lib/db'

export type CertificationType =
  | 'FOOD_HYGIENE_HACCP'
  | 'FIRE_SAFETY_FIRST_AID'
  | 'LIFEGUARD_WATER_SAFETY'
  | 'CHEMICAL_COSHH'
  | 'SECURITY_SIA'
  | 'ALCOHOL_PERSONAL_LICENSE'
  | 'BRAND_SERVICE_STANDARDS'

export type ComplianceStatus = 'VALID' | 'EXPIRING_SOON' | 'EXPIRED'

export interface RecordCertificationInput {
  employeeId: string
  certificationType: CertificationType
  certificationName: string
  issuingAuthority: string
  licenseNumber: string
  issueDate: string // YYYY-MM-DD
  expiryDate: string // YYYY-MM-DD
  notes?: string
  actorUserId?: string
}

export interface RenewCertificationInput {
  certificationId: string
  newExpiryDate: string
  renewalReference?: string
  notes?: string
  actorUserId?: string
}

export interface StaffCertificationRecord {
  id: string
  employeeId: string
  employeeName?: string
  department?: string
  propertyId?: string
  propertyCode?: string
  certificationType: CertificationType
  certificationName: string
  issuingAuthority: string
  licenseNumber: string
  issueDate: string
  expiryDate: string
  status: ComplianceStatus
  daysUntilExpiry: number
  notes?: string
  renewedAt?: string
  createdAt: string
  updatedAt: string
}

export interface PropertyComplianceScore {
  propertyId: string
  propertyName: string
  propertyCode: string
  totalStaff: number
  certifiedStaffCount: number
  totalCertifications: number
  validCount: number
  expiringSoonCount: number
  expiredCount: number
  compliancePercentage: number
  criticalViolations: string[]
}

function evaluateComplianceStatus(expiryDateStr: string): { status: ComplianceStatus; daysUntilExpiry: number } {
  const now = new Date()
  const expiry = new Date(expiryDateStr)
  const diffMs = expiry.getTime() - now.getTime()
  const daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (daysUntilExpiry < 0) {
    return { status: 'EXPIRED', daysUntilExpiry }
  }
  if (daysUntilExpiry <= 30) {
    return { status: 'EXPIRING_SOON', daysUntilExpiry }
  }
  return { status: 'VALID', daysUntilExpiry }
}

/**
 * Records a staff statutory or brand compliance certification
 */
export async function recordStaffCertification(input: RecordCertificationInput) {
  const {
    employeeId,
    certificationType,
    certificationName,
    issuingAuthority,
    licenseNumber,
    issueDate,
    expiryDate,
    notes,
    actorUserId
  } = input

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      property: { select: { id: true, name: true, code: true } }
    }
  })

  if (!employee) {
    throw new Error(`Employee with ID ${employeeId} not found`)
  }

  const { status, daysUntilExpiry } = evaluateComplianceStatus(expiryDate)

  const certData = {
    employeeId: employee.id,
    employeeName: `${employee.firstName} ${employee.lastName}`,
    department: employee.department,
    propertyId: employee.property.id,
    propertyCode: employee.property.code,
    certificationType,
    certificationName,
    issuingAuthority,
    licenseNumber,
    issueDate,
    expiryDate,
    status,
    notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  const audit = await prisma.auditLog.create({
    data: {
      userId: actorUserId || null,
      actor: actorUserId ? `User:${actorUserId}` : 'HR_COMPLIANCE_SYSTEM',
      action: 'CERTIFICATION_RECORDED',
      resource: 'StaffCertification',
      resourceId: employee.id,
      details: certData
    }
  })

  return {
    id: audit.id,
    ...certData,
    daysUntilExpiry
  }
}

/**
 * Renews an existing staff certification
 */
export async function renewStaffCertification(input: RenewCertificationInput) {
  const { certificationId, newExpiryDate, renewalReference, notes, actorUserId } = input

  const audit = await prisma.auditLog.findUnique({ where: { id: certificationId } })
  if (!audit || audit.resource !== 'StaffCertification') {
    throw new Error(`Staff Certification with ID ${certificationId} not found`)
  }

  const details = audit.details as any
  const { status, daysUntilExpiry } = evaluateComplianceStatus(newExpiryDate)

  const updatedDetails = {
    ...details,
    expiryDate: newExpiryDate,
    status,
    renewalReference,
    renewalNotes: notes,
    renewedAt: new Date().toISOString(),
    renewedBy: actorUserId || 'HR_MANAGER',
    updatedAt: new Date().toISOString()
  }

  await prisma.auditLog.update({
    where: { id: certificationId },
    data: { details: updatedDetails }
  })

  return {
    id: certificationId,
    ...updatedDetails,
    daysUntilExpiry
  }
}

/**
 * Retrieves all certifications for a specific employee
 */
export async function getStaffCertifications(employeeId: string): Promise<StaffCertificationRecord[]> {
  const logs = await prisma.auditLog.findMany({
    where: {
      resource: 'StaffCertification',
      resourceId: employeeId
    },
    orderBy: { createdAt: 'desc' }
  })

  return logs.map((log) => {
    const details = log.details as any
    const { status, daysUntilExpiry } = evaluateComplianceStatus(details.expiryDate)
    return {
      id: log.id,
      ...details,
      status,
      daysUntilExpiry
    }
  })
}

/**
 * Computes chain-wide or property-level compliance audit matrix
 */
export async function getPropertyComplianceAuditMatrix(filterPropertyId?: string): Promise<{
  chainOverallCompliancePercentage: number
  properties: PropertyComplianceScore[]
}> {
  const properties = await prisma.property.findMany({
    where: filterPropertyId ? { id: filterPropertyId } : {},
    select: { id: true, name: true, code: true }
  })

  const certLogs = await prisma.auditLog.findMany({
    where: { resource: 'StaffCertification' },
    orderBy: { createdAt: 'desc' }
  })

  const propertyScores: PropertyComplianceScore[] = []
  let totalChainCerts = 0
  let totalChainValid = 0

  for (const prop of properties) {
    const employees = await prisma.employee.findMany({
      where: { propertyId: prop.id, status: 'ACTIVE' },
      select: { id: true, firstName: true, lastName: true, department: true }
    })

    const propCerts: StaffCertificationRecord[] = []
    for (const log of certLogs) {
      const details = log.details as any
      if (details.propertyId === prop.id) {
        const { status, daysUntilExpiry } = evaluateComplianceStatus(details.expiryDate)
        propCerts.push({ id: log.id, ...details, status, daysUntilExpiry })
      }
    }

    let validCount = 0
    let expiringSoonCount = 0
    let expiredCount = 0
    const criticalViolations: string[] = []

    for (const c of propCerts) {
      if (c.status === 'VALID') validCount++
      if (c.status === 'EXPIRING_SOON') expiringSoonCount++
      if (c.status === 'EXPIRED') {
        expiredCount++
        criticalViolations.push(
          `NON-COMPLIANCE: [${c.employeeName || 'Staff'}] in [${c.department}] has expired ${c.certificationName} (Expired ${Math.abs(c.daysUntilExpiry)} days ago)`
        )
      }
    }

    const totalCerts = propCerts.length
    const compliancePercentage =
      totalCerts > 0
        ? Number((((validCount + expiringSoonCount) / totalCerts) * 100).toFixed(1))
        : 100.0

    totalChainCerts += totalCerts
    totalChainValid += validCount + expiringSoonCount

    // Unique certified staff
    const certifiedStaffIds = new Set(propCerts.map((c) => c.employeeId))

    propertyScores.push({
      propertyId: prop.id,
      propertyName: prop.name,
      propertyCode: prop.code,
      totalStaff: employees.length,
      certifiedStaffCount: certifiedStaffIds.size,
      totalCertifications: totalCerts,
      validCount,
      expiringSoonCount,
      expiredCount,
      compliancePercentage,
      criticalViolations
    })
  }

  const chainOverallCompliancePercentage =
    totalChainCerts > 0
      ? Number(((totalChainValid / totalChainCerts) * 100).toFixed(1))
      : 100.0

  return {
    chainOverallCompliancePercentage,
    properties: propertyScores
  }
}
