import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { z } from 'zod'
import { postCharge } from '@/lib/accounting'
import { handleZodError } from '@/lib/api-utils'

const orderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1)
})

const posOrderSchema = z.object({
  outletId: z.string().uuid(),
  items: z.array(orderItemSchema).min(1),
  paymentType: z.enum(['CASH', 'CARD', 'ROOM_CHARGE']),
  bookingId: z.string().uuid().optional(),
  specialRequests: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = posOrderSchema.parse(body)

    if (data.paymentType === 'ROOM_CHARGE' && !data.bookingId) {
      return NextResponse.json({ error: 'bookingId is required for ROOM_CHARGE' }, { status: 400 })
    }

    // 1. Fetch products to calculate totals securely
    const productIds = data.items.map(item => item.productId)
    const products = await prisma.pOSProduct.findMany({
      where: { id: { in: productIds } }
    })

    let subtotal = 0
    const orderItemsData = data.items.map(item => {
      const product = products.find((p: any) => p.id === item.productId)
      if (!product) throw new Error(`Product not found: ${item.productId}`)
      
      const itemSubtotal = product.price * item.quantity
      subtotal += itemSubtotal
      
      return {
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
        subtotal: itemSubtotal
      }
    })

    // Add generic taxes/fees (e.g. 10% service charge)
    const totalAmount = subtotal * 1.10

    // 2. Create the POS Order (InternalOrder)
    const internalOrder = await prisma.internalOrder.create({
      data: {
        orderType: 'POS_OUTLET',
        outletId: data.outletId,
        status: 'COMPLETED',
        totalAmount,
        paymentType: data.paymentType,
        specialRequests: data.specialRequests,
        items: {
          create: orderItemsData
        }
      },
      include: {
        outlet: true
      }
    })

    // 3. If ROOM_CHARGE, post directly to the accounting engine
    if (data.paymentType === 'ROOM_CHARGE' && data.bookingId) {
      const chargeResult = await postCharge({
        bookingId: data.bookingId,
        amount: totalAmount,
        category: 'F_AND_B', // Category mapped for routing
        description: `POS Charge: ${internalOrder.outlet?.name || 'Restaurant'} (Order #${internalOrder.id.slice(0,8)})`
      })

      // Link order to the generated folio
      await prisma.internalOrder.update({
        where: { id: internalOrder.id },
        data: { folioId: chargeResult.targetFolioId }
      })
    }

    return NextResponse.json({ success: true, order: internalOrder }, { status: 201 })

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return handleZodError(error)
    }
    console.error('Error processing POS order:', error)
    return NextResponse.json({ error: error.message || 'Failed to process POS order' }, { status: 500 })
  }
}
