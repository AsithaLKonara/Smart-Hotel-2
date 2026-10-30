import { prisma } from '@/lib/db'

export type AuditCategory =
  | 'CLEANLINESS_HOUSEKEEPING'
  | 'SERVICE_STANDARDS'
  | 'FOOD_SAFETY_FNB'
  | 'PHYSICAL_PLANT_FACILITIES'
  | 'BRAND_COMPLIANCE'

export type AuditGrade =
  | 'PASSED_WITH_DISTINCTION'
  | 'PASSED'
  | 'CONDITIONAL_PASS'
  | 'FAILED'

export interface ChecklistItemInput {
  category: AuditCategory
  itemTitle: string
  score: number // 0 to 100
  notes?: string
  photoEvidenceUrl?: string
}

export interface CorrectiveActionItem {
  id: string
  category: AuditCategory
  issueDescription: string
  remediationPlan: string
  deadlineDays: number
  dueDate: string
  status: 'PENDING' | 'RESOLVED'
  resolvedAt?: string
  resolutionNotes?: string
}

export interface SubmitAuditInput {
  propertyId: string
  inspectionDate: string // YYYY-MM-DD
  inspectorName?: string
  inspectorUserId?: string
  checklistItems: ChecklistItemInput[]
  generalNotes?: string
  actorUserId?: string
}

export interface BrandStandardsAuditRecord {
  id: string
  auditNumber: string
  propertyId: string
  propertyName: string
  propertyCode: string
  inspectionDate: string
  inspectorName: string
  overallScore: number
  grade: AuditGrade
  categoryScores: Record<AuditCategory, number>
  checklistItems: ChecklistItemInput[]
  correctiveActions: CorrectiveActionItem[]
  generalNotes?: string
  createdAt: string
  updatedAt: string
}

export interface PropertyQARanking {
  propertyId: string
  propertyName: string
  propertyCode: string
  latestScore: number
  latestGrade: AuditGrade
  lastInspectedDate: string
  pendingCorrectiveActions: number
}

function calculateGrade(overallScore: number): AuditGrade {
  if (overallScore >= 90.0) return 'PASSED_WITH_DISTINCTION'
  if (overallScore >= 80.0) return 'PASSED'
  if (overallScore >= 70.0) return 'CONDITIONAL_PASS'
  return 'FAILED'
}

/**
 * Submits a completed on-site brand standards QA audit for a property
 */
export async function submitBrandStandardsAudit(input: SubmitAuditInput) {
  const {
    propertyId,
    inspectionDate,
    inspectorName = 'Corporate QA Inspector',
    inspectorUserId,
    checklistItems,
    generalNotes,
    actorUserId
  } = input

  if (!checklistItems || checklistItems.length === 0) {
    throw new Error('At least one checklist item is required for property inspection')
  }

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, name: true, code: true }
  })

  if (!property) {
    throw new Error(`Property with ID ${propertyId} not found`)
  }

  // Calculate scores per category and overall
  const categoryTotals: Record<string, { sum: number; count: number }> = {}
  let totalScoreSum = 0
  const correctiveActions: CorrectiveActionItem[] = []

  const now = new Date()

  checklistItems.forEach((item, index) => {
    if (!categoryTotals[item.category]) {
      categoryTotals[item.category] = { sum: 0, count: 0 }
    }
    categoryTotals[item.category].sum += item.score
    categoryTotals[item.category].count += 1
    totalScoreSum += item.score

    // Any score below 70 automatically triggers a mandatory Corrective Action Plan (CAP)
    if (item.score < 70) {
      const deadlineDays = item.score < 50 ? 7 : 14
      const dueDate = new Date(now.getTime() + deadlineDays * 86400000).toISOString().split('T')[0]

      correctiveActions.push({
        id: `CAP-${index + 1}`,
        category: item.category,
        issueDescription: `Substandard score (${item.score}/100) for [${item.itemTitle}]: ${item.notes || 'Did not meet brand threshold'}`,
        remediationPlan: `Execute immediate remediation and staff retraining for [${item.itemTitle}] within ${deadlineDays} days.`,
        deadlineDays,
        dueDate,
        status: 'PENDING'
      })
    }
  })

  const categoryScores: Record<string, number> = {}
  for (const [cat, data] of Object.entries(categoryTotals)) {
    categoryScores[cat] = Number((data.sum / data.count).toFixed(1))
  }

  const overallScore = Number((totalScoreSum / checklistItems.length).toFixed(1))
  const grade = calculateGrade(overallScore)
  const auditNumber = `QA-${property.code}-${Date.now().toString().slice(-6)}`

  const auditData: BrandStandardsAuditRecord = {
    id: '', // Will be assigned by AuditLog
    auditNumber,
    propertyId: property.id,
    propertyName: property.name,
    propertyCode: property.code,
    inspectionDate,
    inspectorName,
    overallScore,
    grade,
    categoryScores: categoryScores as any,
    checklistItems,
    correctiveActions,
    generalNotes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  const audit = await prisma.auditLog.create({
    data: {
      userId: inspectorUserId || actorUserId || null,
      actor: inspectorName,
      action: 'BRAND_STANDARDS_AUDIT_SUBMITTED',
      resource: 'BrandStandardsAudit',
      resourceId: property.id,
      details: auditData
    }
  })

  auditData.id = audit.id

  return auditData
}

/**
 * Resolves a pending corrective action plan
 */
export async function resolveCorrectiveAction(input: {
  auditId: string
  actionId: string
  resolutionNotes: string
  actorUserId?: string
}) {
  const { auditId, actionId, resolutionNotes, actorUserId } = input

  const audit = await prisma.auditLog.findUnique({ where: { id: auditId } })
  if (!audit || audit.resource !== 'BrandStandardsAudit') {
    throw new Error(`Audit with ID ${auditId} not found`)
  }

  const details = audit.details as any
  const actionIndex = (details.correctiveActions || []).findIndex((a: any) => a.id === actionId)

  if (actionIndex === -1) {
    throw new Error(`Corrective action [${actionId}] not found in audit [${details.auditNumber}]`)
  }

  details.correctiveActions[actionIndex].status = 'RESOLVED'
  details.correctiveActions[actionIndex].resolvedAt = new Date().toISOString()
  details.correctiveActions[actionIndex].resolutionNotes = resolutionNotes
  details.correctiveActions[actionIndex].resolvedBy = actorUserId || 'PROPERTY_GM'
  details.updatedAt = new Date().toISOString()

  await prisma.auditLog.update({
    where: { id: auditId },
    data: { details }
  })

  return {
    success: true,
    action: details.correctiveActions[actionIndex],
    auditNumber: details.auditNumber
  }
}

/**
 * Ranks all chain properties by latest QA score
 */
export async function getChainPropertyQARankings(): Promise<PropertyQARanking[]> {
  const properties = await prisma.property.findMany({
    select: { id: true, name: true, code: true }
  })

  const logs = await prisma.auditLog.findMany({
    where: { resource: 'BrandStandardsAudit' },
    orderBy: { createdAt: 'desc' }
  })

  const latestAuditMap = new Map<string, any>()
  for (const log of logs) {
    const details = log.details as any
    if (!latestAuditMap.has(details.propertyId)) {
      latestAuditMap.set(details.propertyId, details)
    }
  }

  const rankings: PropertyQARanking[] = properties.map((prop) => {
    const audit = latestAuditMap.get(prop.id)
    if (audit) {
      const pendingCaps = (audit.correctiveActions || []).filter((a: any) => a.status === 'PENDING').length
      return {
        propertyId: prop.id,
        propertyName: prop.name,
        propertyCode: prop.code,
        latestScore: audit.overallScore,
        latestGrade: audit.grade,
        lastInspectedDate: audit.inspectionDate,
        pendingCorrectiveActions: pendingCaps
      }
    }

    return {
      propertyId: prop.id,
      propertyName: prop.name,
      propertyCode: prop.code,
      latestScore: 0,
      latestGrade: 'FAILED',
      lastInspectedDate: 'NEVER',
      pendingCorrectiveActions: 0
    }
  })

  // Sort descending by score
  return rankings.sort((a, b) => b.latestScore - a.latestScore)
}

/**
 * Retrieves audit history for a specific property
 */
export async function getPropertyAuditHistory(propertyId: string): Promise<BrandStandardsAuditRecord[]> {
  const logs = await prisma.auditLog.findMany({
    where: {
      resource: 'BrandStandardsAudit',
      resourceId: propertyId
    },
    orderBy: { createdAt: 'desc' }
  })

  return logs.map((log) => ({
    id: log.id,
    ...(log.details as any)
  }))
}
