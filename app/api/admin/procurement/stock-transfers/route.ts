import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  createStockTransferOrder,
  approveStockTransferOrder,
  dispatchStockTransferOrder,
  receiveStockTransferOrder,
  getStockTransferOrder,
  listStockTransferOrders
} from '@/lib/procurement/stock-transfers'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.roleName || (session?.user as any)?.role

    const allowedRoles = ['SUPER_ADMIN', 'MANAGER']
    if (session && !allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden', message: `Role [${userRole}] cannot access procurement stock transfers` },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const stoId = searchParams.get('id')
    const propertyId = searchParams.get('propertyId') || undefined
    const status = (searchParams.get('status') as any) || undefined

    if (stoId) {
      const sto = await getStockTransferOrder(stoId)
      if (!sto) {
        return NextResponse.json({ error: 'Stock Transfer Order not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, transferOrder: sto })
    }

    const orders = await listStockTransferOrders({ propertyId, status })
    return NextResponse.json({
      success: true,
      count: orders.length,
      transferOrders: orders
    })
  } catch (error: any) {
    console.error('Error fetching stock transfers:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve stock transfer orders', details: error?.message },
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
        { error: 'Forbidden', message: `Role [${userRole}] cannot modify stock transfer orders` },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action = 'CREATE' } = body

    if (action === 'CREATE') {
      const { sourcePropertyId, destinationPropertyId, items, notes, priority } = body
      if (!sourcePropertyId || !destinationPropertyId || !items || !Array.isArray(items)) {
        return NextResponse.json(
          { error: 'sourcePropertyId, destinationPropertyId, and items array are required' },
          { status: 400 }
        )
      }

      const sto = await createStockTransferOrder({
        sourcePropertyId,
        destinationPropertyId,
        items,
        notes,
        priority,
        actorUserId: session?.user?.id
      })
      return NextResponse.json({ success: true, transferOrder: sto })
    }

    if (action === 'APPROVE') {
      const { stoId } = body
      if (!stoId) {
        return NextResponse.json({ error: 'stoId is required to approve' }, { status: 400 })
      }
      const approved = await approveStockTransferOrder(stoId, session?.user?.id)
      return NextResponse.json({ success: true, transferOrder: approved })
    }

    if (action === 'DISPATCH') {
      const { stoId, itemsDispatched, carrier, waybillNumber, notes } = body
      if (!stoId) {
        return NextResponse.json({ error: 'stoId is required to dispatch' }, { status: 400 })
      }
      const dispatched = await dispatchStockTransferOrder({
        stoId,
        itemsDispatched,
        carrier,
        waybillNumber,
        notes,
        actorUserId: session?.user?.id
      })
      return NextResponse.json({ success: true, transferOrder: dispatched })
    }

    if (action === 'RECEIVE') {
      const { stoId, itemsReceived, receivingNotes } = body
      if (!stoId || !itemsReceived || !Array.isArray(itemsReceived)) {
        return NextResponse.json(
          { error: 'stoId and itemsReceived array are required to receive transfer' },
          { status: 400 }
        )
      }
      const received = await receiveStockTransferOrder({
        stoId,
        itemsReceived,
        receivingNotes,
        actorUserId: session?.user?.id
      })
      return NextResponse.json({ success: true, transferOrder: received })
    }

    return NextResponse.json({ error: `Unsupported action [${action}]` }, { status: 400 })
  } catch (error: any) {
    console.error('Error executing stock transfer action:', error)
    return NextResponse.json(
      { error: 'Failed to process stock transfer order', details: error?.message },
      { status: 400 }
    )
  }
}
