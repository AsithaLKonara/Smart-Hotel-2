import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  createCommissaryIndent,
  getProductionSchedule,
  dispatchCommissaryIndent,
  receiveCommissaryIndent,
  listCommissaryIndents
} from '@/lib/kitchen/commissary'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.roleName || (session?.user as any)?.role

    const allowedRoles = ['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST']
    if (session && !allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden', message: `Role [${userRole}] cannot access commissary operations` },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')
    const commissaryPropertyId = searchParams.get('commissaryPropertyId')
    const deliveryDate = searchParams.get('deliveryDate')

    if (type === 'schedule') {
      if (!commissaryPropertyId || !deliveryDate) {
        return NextResponse.json(
          { error: 'commissaryPropertyId and deliveryDate are required to view production schedule' },
          { status: 400 }
        )
      }
      const schedule = await getProductionSchedule({ commissaryPropertyId, deliveryDate })
      return NextResponse.json({ success: true, schedule })
    }

    const orderingPropertyId = searchParams.get('orderingPropertyId') || undefined
    const status = (searchParams.get('status') as any) || undefined

    const indents = await listCommissaryIndents({
      orderingPropertyId,
      commissaryPropertyId: commissaryPropertyId || undefined,
      status,
      deliveryDate: deliveryDate || undefined
    })

    return NextResponse.json({
      success: true,
      count: indents.length,
      indents
    })
  } catch (error: any) {
    console.error('Error fetching commissary indents:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve commissary data', details: error?.message },
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
        { error: 'Forbidden', message: `Role [${userRole}] cannot modify commissary indents` },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action = 'CREATE_INDENT' } = body

    if (action === 'CREATE_INDENT') {
      const {
        orderingPropertyId,
        commissaryPropertyId,
        outletId,
        deliveryDate,
        items,
        notes
      } = body

      if (!orderingPropertyId || !commissaryPropertyId || !deliveryDate || !items) {
        return NextResponse.json(
          { error: 'orderingPropertyId, commissaryPropertyId, deliveryDate, and items are required' },
          { status: 400 }
        )
      }

      const indent = await createCommissaryIndent({
        orderingPropertyId,
        commissaryPropertyId,
        outletId,
        deliveryDate,
        items,
        notes,
        actorUserId: session?.user?.id
      })
      return NextResponse.json({ success: true, indent })
    }

    if (action === 'DISPATCH') {
      const { indentId, dispatchTempC, driverName, vehicleNumber, notes } = body
      if (!indentId || dispatchTempC === undefined) {
        return NextResponse.json(
          { error: 'indentId and dispatchTempC are required to dispatch' },
          { status: 400 }
        )
      }

      const dispatched = await dispatchCommissaryIndent({
        indentId,
        dispatchTempC,
        driverName,
        vehicleNumber,
        notes,
        actorUserId: session?.user?.id
      })
      return NextResponse.json({ success: true, indent: dispatched })
    }

    if (action === 'RECEIVE') {
      const {
        indentId,
        receivingTempC,
        acceptedItems,
        rejectedItems,
        qualityRating,
        receiverNotes
      } = body

      if (!indentId || receivingTempC === undefined || !acceptedItems) {
        return NextResponse.json(
          { error: 'indentId, receivingTempC, and acceptedItems are required to receive delivery' },
          { status: 400 }
        )
      }

      const received = await receiveCommissaryIndent({
        indentId,
        receivingTempC,
        acceptedItems,
        rejectedItems,
        qualityRating,
        receiverNotes,
        actorUserId: session?.user?.id
      })
      return NextResponse.json({ success: true, indent: received })
    }

    return NextResponse.json({ error: `Unsupported action [${action}]` }, { status: 400 })
  } catch (error: any) {
    console.error('Error processing commissary action:', error)
    return NextResponse.json(
      { error: 'Failed to process commissary action', details: error?.message },
      { status: 400 }
    )
  }
}
