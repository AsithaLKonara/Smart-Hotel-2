import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'

export interface GoodsReceiptDTO {
  purchaseOrderId: string
  notes?: string
  targetLocation: string // e.g. "Main Kitchen Storage" or "Rooftop Bar Storage"
}

export interface VendorInvoiceDTO {
  purchaseOrderId: string
  invoiceNumber: string
  amount: number
  receivedDate?: Date
}

/**
 * Service: Procurement & Multi-Location Inventory Engine
 * Purpose: Activating dead schema models GoodsReceipt, VendorInvoice, and InventoryStock
 */
export class ProcurementService {
  /**
   * Records physical goods received at the loading dock against an approved Purchase Order.
   * Atomically increments location-specific stock totals in InventoryStock.
   */
  static async receiveGoods(dto: GoodsReceiptDTO) {
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Validate Purchase Order existence
      const po = await tx.purchaseOrder.findUnique({
        where: { id: dto.purchaseOrderId },
        include: { items: true }
      })

      if (!po) {
        throw new Error(`PurchaseOrder with ID ${dto.purchaseOrderId} not found`)
      }

      // 2. Create GoodsReceipt audit log row (Activating Dead Schema: GoodsReceipt)
      const receipt = await tx.goodsReceipt.create({
        data: {
          purchaseOrderId: po.id,
          receivedDate: new Date(),
          notes: dto.notes || `Received physical delivery at location: ${dto.targetLocation}`
        }
      })

      // 3. Atomically increment InventoryStock per storeroom location (Activating Dead Schema: InventoryStock)
      for (const item of po.items) {
        // Upsert multi-location stock tally
        await tx.inventoryStock.upsert({
          where: {
            itemId_location: {
              itemId: item.itemId,
              location: dto.targetLocation
            }
          },
          update: {
            quantity: { increment: item.quantity },
            lastCountedAt: new Date()
          },
          create: {
            itemId: item.itemId,
            location: dto.targetLocation,
            quantity: item.quantity,
            lastCountedAt: new Date()
          }
        })

        // Also record immutable inventory movement audit row
        await tx.inventoryMovement.create({
          data: {
            itemId: item.itemId,
            type: 'GOODS_RECEIPT_PO',
            quantity: item.quantity,
            notes: `Received via PO #${po.orderNumber} into ${dto.targetLocation} (Receipt ID: ${receipt.id})`
          }
        })
      }

      // 4. Update PO status if previously ordered
      if (po.status === 'ORDERED' || po.status === 'PENDING') {
        await tx.purchaseOrder.update({
          where: { id: po.id },
          data: { status: 'RECEIVED' }
        })
      }

      return receipt
    })
  }

  /**
   * Registers a supplier bill against a Purchase Order and performs Three-Way Match checks against physical Goods Receipts.
   * Activating Dead Schema: VendorInvoice
   */
  static async registerVendorInvoice(dto: VendorInvoiceDTO) {
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id: dto.purchaseOrderId },
        include: { goodsReceipts: true }
      })

      if (!po) {
        throw new Error(`PurchaseOrder with ID ${dto.purchaseOrderId} not found`)
      }

      // Record Vendor Invoice (Activating Dead Schema: VendorInvoice)
      const invoice = await tx.vendorInvoice.create({
        data: {
          purchaseOrderId: po.id,
          invoiceNumber: dto.invoiceNumber,
          amount: dto.amount,
          receivedDate: dto.receivedDate || new Date()
        }
      })

      // Three-Way Match Verification Audit:
      // Compare invoice amount against PO total amount
      const poTotal = Number(po.totalAmount || 0)
      const invoiceTotal = Number(dto.amount)
      const variance = Math.abs(invoiceTotal - poTotal)
      const hasReceipts = po.goodsReceipts.length > 0

      let matchStatus = 'MATCHED'
      if (!hasReceipts) {
        matchStatus = 'UNMATCHED_NO_RECEIPT'
      } else if (variance > 5.0) { // $5.00 tolerance ceiling from RBAC bible
        matchStatus = 'DISCREPANCY_VARIANCE_EXCEEDED'
      }

      return {
        invoice,
        audit: {
          purchaseOrderNumber: po.orderNumber,
          poTotal,
          invoiceTotal,
          variance,
          receiptsCount: po.goodsReceipts.length,
          threeWayMatchStatus: matchStatus
        }
      }
    })
  }

  /**
   * Retrieve all multi-location inventory stock balances.
   */
  static async getLocationStocks(location?: string) {
    return await prisma.inventoryStock.findMany({
      where: location ? { location } : undefined,
      include: { item: { include: { vendor: true } } },
      orderBy: { updatedAt: 'desc' }
    })
  }
}
