import { prisma } from '@/lib/db'

export interface STOItemInput {
  itemId: string
  requestedQuantity: number
}

export interface CreateSTOInput {
  sourcePropertyId: string
  destinationPropertyId: string
  notes?: string
  priority?: 'NORMAL' | 'URGENT' | 'EMERGENCY'
  items: STOItemInput[]
  actorUserId?: string
}

export interface DispatchSTOInput {
  stoId: string
  itemsDispatched?: Array<{ itemId: string; dispatchedQuantity: number }>
  carrier?: string
  waybillNumber?: string
  notes?: string
  actorUserId?: string
}

export interface ReceiveSTOInput {
  stoId: string
  itemsReceived: Array<{
    itemId: string
    receivedQuantity: number
    damagedQuantity?: number
    notes?: string
  }>
  receivingNotes?: string
  actorUserId?: string
}

export type STOStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'DISPATCHED'
  | 'RECEIVED'
  | 'RECEIVED_WITH_DISCREPANCY'
  | 'CANCELLED'

export interface StockTransferOrder {
  id: string
  transferNumber: string
  sourcePropertyId: string
  sourceProperty?: { id: string; name: string; code: string }
  destinationPropertyId: string
  destinationProperty?: { id: string; name: string; code: string }
  status: STOStatus
  priority: 'NORMAL' | 'URGENT' | 'EMERGENCY'
  notes?: string
  carrier?: string
  waybillNumber?: string
  dispatchedAt?: string
  receivedAt?: string
  items: Array<{
    itemId: string
    itemName?: string
    sku?: string
    unit?: string
    requestedQuantity: number
    dispatchedQuantity?: number
    receivedQuantity?: number
    damagedQuantity?: number
    discrepancyQuantity?: number
  }>
  discrepancySummary?: {
    hasDiscrepancy: boolean
    totalMissing: number
    totalDamaged: number
    details: string[]
  }
  createdAt: string
  updatedAt: string
}

/**
 * Creates an Internal Stock Transfer Order (STO)
 */
export async function createStockTransferOrder(input: CreateSTOInput) {
  const {
    sourcePropertyId,
    destinationPropertyId,
    notes,
    priority = 'NORMAL',
    items,
    actorUserId
  } = input

  if (!items || items.length === 0) {
    throw new Error('At least one inventory item is required to create a Stock Transfer Order')
  }

  if (sourcePropertyId === destinationPropertyId) {
    throw new Error('Source and destination properties cannot be the same')
  }

  const [sourceProp, destProp] = await Promise.all([
    prisma.property.findUnique({ where: { id: sourcePropertyId }, select: { id: true, name: true, code: true } }),
    prisma.property.findUnique({ where: { id: destinationPropertyId }, select: { id: true, name: true, code: true } })
  ])

  if (!sourceProp || !destProp) {
    throw new Error('Invalid source or destination property ID')
  }

  // Fetch items to enrich with names and units
  const itemIds = items.map((i) => i.itemId)
  const dbItems = await prisma.inventoryItem.findMany({
    where: { id: { in: itemIds } },
    select: { id: true, name: true, sku: true, unit: true }
  })

  const itemMap = new Map(dbItems.map((i) => [i.id, i]))

  const enrichedItems = items.map((item) => {
    const meta = itemMap.get(item.itemId)
    return {
      itemId: item.itemId,
      itemName: meta?.name || 'Unknown Item',
      sku: meta?.sku || undefined,
      unit: meta?.unit || 'pcs',
      requestedQuantity: item.requestedQuantity,
      dispatchedQuantity: 0,
      receivedQuantity: 0,
      damagedQuantity: 0,
      discrepancyQuantity: 0
    }
  })

  const transferNumber = `STO-${Date.now().toString().slice(-6)}`

  // Store STO in AuditLog
  const audit = await prisma.auditLog.create({
    data: {
      userId: actorUserId || null,
      actor: actorUserId ? `User:${actorUserId}` : 'PROCUREMENT_SYSTEM',
      action: 'STO_CREATED',
      resource: 'StockTransferOrder',
      details: {
        transferNumber,
        sourcePropertyId,
        sourceProperty: sourceProp,
        destinationPropertyId,
        destinationProperty: destProp,
        status: 'REQUESTED' as STOStatus,
        priority,
        notes,
        items: enrichedItems,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }
  })

  return {
    id: audit.id,
    transferNumber,
    status: 'REQUESTED' as STOStatus,
    sourceProperty: sourceProp,
    destinationProperty: destProp,
    items: enrichedItems
  }
}

/**
 * Approves a Stock Transfer Order
 */
export async function approveStockTransferOrder(stoId: string, actorUserId?: string) {
  const existingAudit = await prisma.auditLog.findUnique({ where: { id: stoId } })
  if (!existingAudit || existingAudit.resource !== 'StockTransferOrder') {
    throw new Error(`Stock Transfer Order with ID ${stoId} not found`)
  }

  const details = existingAudit.details as any
  if (details.status !== 'REQUESTED') {
    throw new Error(`Cannot approve STO in status [${details.status}]. Must be in [REQUESTED].`)
  }

  const updatedDetails = {
    ...details,
    status: 'APPROVED' as STOStatus,
    approvedAt: new Date().toISOString(),
    approvedBy: actorUserId || 'SYSTEM',
    updatedAt: new Date().toISOString()
  }

  await prisma.auditLog.update({
    where: { id: stoId },
    data: { details: updatedDetails }
  })

  return {
    id: stoId,
    transferNumber: details.transferNumber,
    status: 'APPROVED' as STOStatus,
    approvedAt: updatedDetails.approvedAt
  }
}

/**
 * Dispatches items from Source Property Warehouse
 * Atomically decrements source warehouse stock and logs TRANSFER_OUT movements
 */
export async function dispatchStockTransferOrder(input: DispatchSTOInput) {
  const { stoId, itemsDispatched, carrier, waybillNumber, notes, actorUserId } = input

  const existingAudit = await prisma.auditLog.findUnique({ where: { id: stoId } })
  if (!existingAudit || existingAudit.resource !== 'StockTransferOrder') {
    throw new Error(`Stock Transfer Order with ID ${stoId} not found`)
  }

  const details = existingAudit.details as any
  if (details.status !== 'APPROVED' && details.status !== 'REQUESTED') {
    throw new Error(`Cannot dispatch STO in status [${details.status}]. Must be APPROVED.`)
  }

  const dispatchMap = new Map((itemsDispatched || []).map((i) => [i.itemId, i.dispatchedQuantity]))

  const updatedItems = details.items.map((item: any) => {
    const qtyToDispatch = dispatchMap.has(item.itemId)
      ? dispatchMap.get(item.itemId)!
      : item.requestedQuantity
    return {
      ...item,
      dispatchedQuantity: qtyToDispatch
    }
  })

  // Prisma Transaction: Decrement stock at source property & record movements
  await prisma.$transaction(async (tx) => {
    for (const item of updatedItems) {
      if (item.dispatchedQuantity <= 0) continue

      // Find stock at source property
      const stock = await tx.inventoryStock.findFirst({
        where: {
          itemId: item.itemId,
          propertyId: details.sourcePropertyId
        }
      })

      if (stock) {
        const newQty = Math.max(0, stock.quantity - item.dispatchedQuantity)
        await tx.inventoryStock.update({
          where: { id: stock.id },
          data: { quantity: newQty, lastCountedAt: new Date() }
        })
      }

      // Record movement
      await tx.inventoryMovement.create({
        data: {
          itemId: item.itemId,
          propertyId: details.sourcePropertyId,
          type: 'TRANSFER_OUT',
          quantity: -item.dispatchedQuantity,
          notes: `Dispatched for STO ${details.transferNumber} to ${details.destinationProperty?.code || 'Destination'}`
        }
      })
    }
  })

  const updatedDetails = {
    ...details,
    status: 'DISPATCHED' as STOStatus,
    carrier,
    waybillNumber,
    dispatchNotes: notes,
    dispatchedAt: new Date().toISOString(),
    dispatchedBy: actorUserId || 'SYSTEM',
    items: updatedItems,
    updatedAt: new Date().toISOString()
  }

  await prisma.auditLog.update({
    where: { id: stoId },
    data: { details: updatedDetails }
  })

  return {
    id: stoId,
    transferNumber: details.transferNumber,
    status: 'DISPATCHED' as STOStatus,
    dispatchedAt: updatedDetails.dispatchedAt,
    carrier,
    waybillNumber,
    items: updatedItems
  }
}

/**
 * Receives items at Destination Property
 * Reconciles quantities, handles damaged goods, credits destination stock, and logs TRANSFER_IN movements
 */
export async function receiveStockTransferOrder(input: ReceiveSTOInput) {
  const { stoId, itemsReceived, receivingNotes, actorUserId } = input

  const existingAudit = await prisma.auditLog.findUnique({ where: { id: stoId } })
  if (!existingAudit || existingAudit.resource !== 'StockTransferOrder') {
    throw new Error(`Stock Transfer Order with ID ${stoId} not found`)
  }

  const details = existingAudit.details as any
  if (details.status !== 'DISPATCHED') {
    throw new Error(`Cannot receive STO in status [${details.status}]. Must be DISPATCHED.`)
  }

  const receiveMap = new Map(itemsReceived.map((i) => [i.itemId, i]))

  let hasDiscrepancy = false
  let totalMissing = 0
  let totalDamaged = 0
  const discrepancyDetails: string[] = []

  const finalizedItems = details.items.map((item: any) => {
    const rcv = receiveMap.get(item.itemId)
    const receivedQty = rcv?.receivedQuantity ?? item.dispatchedQuantity ?? item.requestedQuantity
    const damagedQty = rcv?.damagedQuantity ?? 0
    const dispatchedQty = item.dispatchedQuantity || item.requestedQuantity

    // Missing = dispatched - received - damaged
    const missingQty = Math.max(0, dispatchedQty - (receivedQty + damagedQty))

    if (missingQty > 0 || damagedQty > 0) {
      hasDiscrepancy = true
      totalMissing += missingQty
      totalDamaged += damagedQty
      discrepancyDetails.push(
        `Item [${item.itemName}]: Dispatched=${dispatchedQty}, Received=${receivedQty}, Damaged=${damagedQty}, Missing=${missingQty}`
      )
    }

    return {
      ...item,
      receivedQuantity: receivedQty,
      damagedQuantity: damagedQty,
      discrepancyQuantity: missingQty
    }
  })

  // Prisma Transaction: Increment destination property stock and record movements
  await prisma.$transaction(async (tx) => {
    for (const item of finalizedItems) {
      if (item.receivedQuantity > 0) {
        // Upsert destination stock
        const existingStock = await tx.inventoryStock.findFirst({
          where: {
            itemId: item.itemId,
            propertyId: details.destinationPropertyId
          }
        })

        if (existingStock) {
          await tx.inventoryStock.update({
            where: { id: existingStock.id },
            data: {
              quantity: existingStock.quantity + item.receivedQuantity,
              lastCountedAt: new Date()
            }
          })
        } else {
          await tx.inventoryStock.create({
            data: {
              itemId: item.itemId,
              propertyId: details.destinationPropertyId,
              location: 'MAIN_STORE',
              quantity: item.receivedQuantity
            }
          })
        }

        // Record TRANSFER_IN movement
        await tx.inventoryMovement.create({
          data: {
            itemId: item.itemId,
            propertyId: details.destinationPropertyId,
            type: 'TRANSFER_IN',
            quantity: item.receivedQuantity,
            notes: `Received from STO ${details.transferNumber} dispatched by ${details.sourceProperty?.code || 'Warehouse'}`
          }
        })
      }

      // Record DAMAGE movement if damaged items reported
      if (item.damagedQuantity > 0) {
        await tx.inventoryMovement.create({
          data: {
            itemId: item.itemId,
            propertyId: details.destinationPropertyId,
            type: 'TRANSFER_DAMAGE',
            quantity: -item.damagedQuantity,
            notes: `Transit damage for STO ${details.transferNumber}: ${item.damagedQuantity} units damaged`
          }
        })
      }
    }
  })

  const newStatus: STOStatus = hasDiscrepancy ? 'RECEIVED_WITH_DISCREPANCY' : 'RECEIVED'

  const updatedDetails = {
    ...details,
    status: newStatus,
    receivingNotes,
    receivedAt: new Date().toISOString(),
    receivedBy: actorUserId || 'SYSTEM',
    items: finalizedItems,
    discrepancySummary: {
      hasDiscrepancy,
      totalMissing,
      totalDamaged,
      details: discrepancyDetails
    },
    updatedAt: new Date().toISOString()
  }

  await prisma.auditLog.update({
    where: { id: stoId },
    data: { details: updatedDetails }
  })

  return {
    id: stoId,
    transferNumber: details.transferNumber,
    status: newStatus,
    receivedAt: updatedDetails.receivedAt,
    discrepancySummary: updatedDetails.discrepancySummary,
    items: finalizedItems
  }
}

/**
 * Retrieves details for a specific STO
 */
export async function getStockTransferOrder(stoId: string): Promise<StockTransferOrder | null> {
  const audit = await prisma.auditLog.findUnique({ where: { id: stoId } })
  if (!audit || audit.resource !== 'StockTransferOrder') {
    return null
  }
  const details = audit.details as any
  return {
    id: audit.id,
    ...details
  }
}

/**
 * Lists STOs with optional property or status filters
 */
export async function listStockTransferOrders(filter?: { propertyId?: string; status?: STOStatus }) {
  const logs = await prisma.auditLog.findMany({
    where: {
      resource: 'StockTransferOrder',
      action: 'STO_CREATED'
    },
    orderBy: { createdAt: 'desc' }
  })

  let list = logs.map((log) => ({
    id: log.id,
    ...(log.details as any)
  })) as StockTransferOrder[]

  if (filter?.propertyId) {
    list = list.filter(
      (sto) =>
        sto.sourcePropertyId === filter.propertyId ||
        sto.destinationPropertyId === filter.propertyId
    )
  }

  if (filter?.status) {
    list = list.filter((sto) => sto.status === filter.status)
  }

  return list
}
