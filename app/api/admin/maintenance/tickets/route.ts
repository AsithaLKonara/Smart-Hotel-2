import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getRequestSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  try {
    const session = await getRequestSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workOrders = await prisma.maintenanceWorkOrder.findMany({
      include: {
        room: {
          select: { id: true, number: true }
        },
        asset: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const tickets = workOrders.map((wo: any) => ({
      id: wo.id,
      title: wo.issue || 'Maintenance Request',
      description: wo.issue,
      priority: wo.priority || (wo.issue?.toLowerCase().includes('urgent') ? 'urgent' : 'medium'),
      status: wo.status?.toLowerCase() || 'pending',
      createdAt: wo.createdAt,
      room: wo.room,
      asset: wo.asset
    }))

    return NextResponse.json({ tickets })
  } catch (error: any) {
    console.error('Fetch Maintenance Tickets Error:', error)
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getRequestSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { issue, title, description, roomId, assetId, priority } = body

    const newWorkOrder = await prisma.maintenanceWorkOrder.create({
      data: {
        issue: issue || title || description || 'Maintenance Request',
        roomId: roomId || undefined,
        assetId: assetId || undefined,
        status: 'PENDING'
      },
      include: {
        room: { select: { id: true, number: true } },
        asset: { select: { id: true, name: true } }
      }
    })

    return NextResponse.json({
      success: true,
      ticket: {
        id: newWorkOrder.id,
        title: newWorkOrder.issue,
        description: newWorkOrder.issue,
        priority: priority || 'medium',
        status: 'pending',
        createdAt: newWorkOrder.createdAt,
        room: newWorkOrder.room,
        asset: newWorkOrder.asset
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Create Maintenance Ticket Error:', error)
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getRequestSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, status } = body

    if (!id) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 })
    }

    const dbStatus = status ? status.toUpperCase() : 'RESOLVED'

    const updated = await prisma.maintenanceWorkOrder.update({
      where: { id },
      data: { status: dbStatus },
      include: {
        room: { select: { id: true, number: true } },
        asset: { select: { id: true, name: true } }
      }
    })

    return NextResponse.json({
      success: true,
      ticket: {
        id: updated.id,
        title: updated.issue,
        description: updated.issue,
        status: updated.status.toLowerCase(),
        createdAt: updated.createdAt,
        room: updated.room,
        asset: updated.asset
      }
    })
  } catch (error: any) {
    console.error('Update Maintenance Ticket Error:', error)
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
  }
}
