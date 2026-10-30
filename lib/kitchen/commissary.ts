import { prisma } from '@/lib/db'

export interface IndentItemInput {
  name: string
  category: 'BAKERY' | 'PASTRY' | 'BUTCHERY' | 'SAUCE_PREP' | 'READY_TO_COOK'
  quantity: number
  unit: string
  unitCost: number
  specialInstructions?: string
}

export interface CreateIndentInput {
  orderingPropertyId: string
  commissaryPropertyId: string
  outletId?: string
  deliveryDate: string // YYYY-MM-DD
  items: IndentItemInput[]
  notes?: string
  actorUserId?: string
}

export interface DispatchIndentInput {
  indentId: string
  dispatchTempC: number
  driverName?: string
  vehicleNumber?: string
  notes?: string
  actorUserId?: string
}

export interface ReceiveIndentInput {
  indentId: string
  receivingTempC: number
  acceptedItems: Array<{ name: string; quantity: number }>
  rejectedItems?: Array<{ name: string; quantity: number; reason: string }>
  qualityRating?: number // 1 to 5
  receiverNotes?: string
  actorUserId?: string
}

export type IndentStatus =
  | 'SUBMITTED'
  | 'IN_PRODUCTION'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'DELIVERED_WITH_EXCEPTIONS'
  | 'CANCELLED'

export interface CommissaryIndent {
  id: string
  indentNumber: string
  orderingPropertyId: string
  orderingProperty?: { id: string; name: string; code: string }
  commissaryPropertyId: string
  commissaryProperty?: { id: string; name: string; code: string }
  outletId?: string
  deliveryDate: string
  status: IndentStatus
  items: Array<IndentItemInput & { subtotal: number }>
  totalCost: number
  notes?: string
  dispatchTempC?: number
  receivingTempC?: number
  haccpCompliant?: boolean
  rejectionSummary?: {
    totalRejected: number
    details: Array<{ name: string; quantity: number; reason: string }>
  }
  createdAt: string
  updatedAt: string
}

/**
 * Creates a daily commissary food indent from a satellite hotel outlet to the central production kitchen
 */
export async function createCommissaryIndent(input: CreateIndentInput) {
  const {
    orderingPropertyId,
    commissaryPropertyId,
    outletId,
    deliveryDate,
    items,
    notes,
    actorUserId
  } = input

  if (!items || items.length === 0) {
    throw new Error('At least one production item is required for commissary indent')
  }

  if (orderingPropertyId === commissaryPropertyId) {
    throw new Error('Ordering property and Commissary kitchen property cannot be identical')
  }

  const [orderingProp, commissaryProp] = await Promise.all([
    prisma.property.findUnique({ where: { id: orderingPropertyId }, select: { id: true, name: true, code: true } }),
    prisma.property.findUnique({ where: { id: commissaryPropertyId }, select: { id: true, name: true, code: true } })
  ])

  if (!orderingProp || !commissaryProp) {
    throw new Error('Invalid ordering or commissary property ID')
  }

  let totalCost = 0
  const enrichedItems = items.map((item) => {
    const subtotal = Number((item.quantity * item.unitCost).toFixed(2))
    totalCost += subtotal
    return {
      ...item,
      subtotal
    }
  })

  const indentNumber = `IND-${Date.now().toString().slice(-6)}`

  const audit = await prisma.auditLog.create({
    data: {
      userId: actorUserId || null,
      actor: actorUserId ? `User:${actorUserId}` : 'COMMISSARY_SYSTEM',
      action: 'COMMISSARY_INDENT_CREATED',
      resource: 'CommissaryIndent',
      details: {
        indentNumber,
        orderingPropertyId,
        orderingProperty: orderingProp,
        commissaryPropertyId,
        commissaryProperty: commissaryProp,
        outletId,
        deliveryDate,
        status: 'SUBMITTED' as IndentStatus,
        items: enrichedItems,
        totalCost,
        notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }
  })

  return {
    id: audit.id,
    indentNumber,
    status: 'SUBMITTED' as IndentStatus,
    orderingProperty: orderingProp,
    commissaryProperty: commissaryProp,
    totalCost,
    items: enrichedItems
  }
}

/**
 * Aggregates all indents for a specific delivery date to generate the commissary master production plan
 */
export async function getProductionSchedule(params: { commissaryPropertyId: string; deliveryDate: string }) {
  const { commissaryPropertyId, deliveryDate } = params

  const allIndents = await prisma.auditLog.findMany({
    where: {
      resource: 'CommissaryIndent'
    },
    orderBy: { createdAt: 'desc' }
  })

  const matchingIndents: CommissaryIndent[] = []
  const itemAggregate: Record<string, { name: string; category: string; unit: string; totalQuantity: number; totalCost: number; outlets: string[] }> = {}

  for (const log of allIndents) {
    const details = log.details as any
    if (
      details.commissaryPropertyId === commissaryPropertyId &&
      details.deliveryDate === deliveryDate &&
      details.status !== 'CANCELLED'
    ) {
      matchingIndents.push({ id: log.id, ...details })

      for (const item of details.items || []) {
        const key = item.name.toLowerCase().trim()
        if (!itemAggregate[key]) {
          itemAggregate[key] = {
            name: item.name,
            category: item.category,
            unit: item.unit,
            totalQuantity: 0,
            totalCost: 0,
            outlets: []
          }
        }
        itemAggregate[key].totalQuantity += item.quantity
        itemAggregate[key].totalCost += item.subtotal || 0
        const propCode = details.orderingProperty?.code || 'SATELLITE'
        if (!itemAggregate[key].outlets.includes(propCode)) {
          itemAggregate[key].outlets.push(propCode)
        }
      }
    }
  }

  return {
    commissaryPropertyId,
    deliveryDate,
    totalIndents: matchingIndents.length,
    productionItems: Object.values(itemAggregate),
    indents: matchingIndents
  }
}

/**
 * Dispatches commissary delivery with food safety temperature validation (HACCP)
 */
export async function dispatchCommissaryIndent(input: DispatchIndentInput) {
  const { indentId, dispatchTempC, driverName, vehicleNumber, notes, actorUserId } = input

  const audit = await prisma.auditLog.findUnique({ where: { id: indentId } })
  if (!audit || audit.resource !== 'CommissaryIndent') {
    throw new Error(`Commissary Indent with ID ${indentId} not found`)
  }

  const details = audit.details as any
  if (details.status !== 'SUBMITTED' && details.status !== 'IN_PRODUCTION') {
    throw new Error(`Cannot dispatch indent in status [${details.status}]. Must be SUBMITTED or IN_PRODUCTION.`)
  }

  // Food safety check: Cold chain items should be <= 5°C
  const isColdChainRequired = details.items.some((i: any) =>
    ['BUTCHERY', 'READY_TO_COOK'].includes(i.category)
  )
  const haccpCompliant = isColdChainRequired ? dispatchTempC <= 5.0 : true

  const updatedDetails = {
    ...details,
    status: 'DISPATCHED' as IndentStatus,
    dispatchTempC,
    haccpCompliant,
    driverName,
    vehicleNumber,
    dispatchNotes: notes,
    dispatchedAt: new Date().toISOString(),
    dispatchedBy: actorUserId || 'CENTRAL_CHEF',
    updatedAt: new Date().toISOString()
  }

  await prisma.auditLog.update({
    where: { id: indentId },
    data: { details: updatedDetails }
  })

  return {
    id: indentId,
    indentNumber: details.indentNumber,
    status: 'DISPATCHED' as IndentStatus,
    dispatchTempC,
    haccpCompliant,
    dispatchedAt: updatedDetails.dispatchedAt
  }
}

/**
 * Receives commissary delivery at satellite restaurant outlet and reconciles quality/freshness
 */
export async function receiveCommissaryIndent(input: ReceiveIndentInput) {
  const {
    indentId,
    receivingTempC,
    acceptedItems,
    rejectedItems = [],
    qualityRating = 5,
    receiverNotes,
    actorUserId
  } = input

  const audit = await prisma.auditLog.findUnique({ where: { id: indentId } })
  if (!audit || audit.resource !== 'CommissaryIndent') {
    throw new Error(`Commissary Indent with ID ${indentId} not found`)
  }

  const details = audit.details as any
  if (details.status !== 'DISPATCHED') {
    throw new Error(`Cannot receive indent in status [${details.status}]. Must be DISPATCHED.`)
  }

  let totalRejected = 0
  for (const r of rejectedItems) {
    totalRejected += r.quantity
  }

  const hasExceptions = totalRejected > 0 || receivingTempC > 8.0 // Temp breach
  const newStatus: IndentStatus = hasExceptions ? 'DELIVERED_WITH_EXCEPTIONS' : 'DELIVERED'

  const updatedDetails = {
    ...details,
    status: newStatus,
    receivingTempC,
    qualityRating,
    receiverNotes,
    rejectionSummary: {
      totalRejected,
      details: rejectedItems
    },
    receivedAt: new Date().toISOString(),
    receivedBy: actorUserId || 'RECEIVING_CHEF',
    updatedAt: new Date().toISOString()
  }

  await prisma.auditLog.update({
    where: { id: indentId },
    data: { details: updatedDetails }
  })

  return {
    id: indentId,
    indentNumber: details.indentNumber,
    status: newStatus,
    receivingTempC,
    rejectionSummary: updatedDetails.rejectionSummary,
    receivedAt: updatedDetails.receivedAt
  }
}

/**
 * Lists commissary indents with optional filtering
 */
export async function listCommissaryIndents(filter?: {
  orderingPropertyId?: string
  commissaryPropertyId?: string
  status?: IndentStatus
  deliveryDate?: string
}) {
  const logs = await prisma.auditLog.findMany({
    where: {
      resource: 'CommissaryIndent'
    },
    orderBy: { createdAt: 'desc' }
  })

  let list = logs.map((log) => ({
    id: log.id,
    ...(log.details as any)
  })) as CommissaryIndent[]

  if (filter?.orderingPropertyId) {
    list = list.filter((i) => i.orderingPropertyId === filter.orderingPropertyId)
  }
  if (filter?.commissaryPropertyId) {
    list = list.filter((i) => i.commissaryPropertyId === filter.commissaryPropertyId)
  }
  if (filter?.status) {
    list = list.filter((i) => i.status === filter.status)
  }
  if (filter?.deliveryDate) {
    list = list.filter((i) => i.deliveryDate === filter.deliveryDate)
  }

  return list
}
