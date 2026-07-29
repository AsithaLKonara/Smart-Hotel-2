import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requirePermission } from '@/lib/server-rbac'

export async function GET() {
  try {
    const authError = await requirePermission('pos:read')
    if (authError) return authError

    // 1. Fetch Rooms and map to UI schema
    const roomsData = await prisma.room.findMany({
      include: {
        bookings: {
          where: { status: 'CHECKED_IN' },
          take: 1,
          include: { guest: true }
        }
      }
    })

    const rooms = roomsData.map(r => {
      const activeBooking = r.bookings[0]
      const guestName = activeBooking ? `${activeBooking.guest.firstName} ${activeBooking.guest.lastName}` : ''
      const isVip = activeBooking?.guest.isVip || false

      let statusString = 'Maintenance'
      if (r.status === 'AVAILABLE') statusString = 'Vacant Clean'
      if (r.status === 'DIRTY') statusString = 'Vacant Dirty'
      if (r.status === 'OCCUPIED') statusString = 'Occupied Clean'
      if (r.status === 'INSPECTION_PENDING') statusString = 'Inspected'
      if (r.status === 'OUT_OF_ORDER') statusString = 'Maintenance'
      
      return {
        id: r.id,
        number: r.number,
        type: r.type,
        floor: r.floor,
        price: 250, 
        status: statusString,
        guest: guestName,
        vip: isVip,
        eta: activeBooking ? 'In-House' : 'Ready',
        maintenanceNotes: '',
        laundrySla: 'SLA OK'
      }
    })

    // 2. Fetch Tasks for Dispatch (General Maintenance, Housekeeping)
    const tasks = await prisma.task.findMany({
      where: {
        type: { in: ['HOUSEKEEPING', 'MAINTENANCE', 'ADMINISTRATIVE', 'GUEST_REQUEST'] },
        status: { not: 'COMPLETED' }
      },
      orderBy: { createdAt: 'desc' }
    })

    const dispatches = tasks.map(t => ({
      id: t.id,
      domain: t.type,
      priority: t.priority,
      state: t.status === 'PENDING' ? 'CREATED' : (t.priority === 'URGENT' ? 'SLA_BREACHED' : t.status),
      title: t.title,
      description: t.description || '',
      location: t.roomId ? `Room ${t.roomId}` : 'General',
      assignedStaffId: t.assignedTo || '',
      slaMinutes: 20, 
      createdAt: t.createdAt.toISOString(),
      history: []
    }))

    // 3. Fetch Kitchen Orders (ROOM_SERVICE tasks)
    const kitchenTasks = await prisma.task.findMany({
      where: {
        type: 'ROOM_SERVICE',
        status: { not: 'COMPLETED' }
      }
    })

    const kitchenOrders = kitchenTasks.map(t => {
      const elapsedMinutes = Math.floor((Date.now() - new Date(t.createdAt).getTime()) / 60000)
      return {
        id: t.id,
        roomNumber: t.roomId || 'N/A',
        items: t.title,
        status: t.status === 'PENDING' ? 'PLACED' : (t.status === 'IN_PROGRESS' ? 'PREPARING' : 'READY'),
        elapsed: elapsedMinutes,
        notes: t.description || '',
        runner: t.assignedTo || ''
      }
    })

    return NextResponse.json({ rooms, dispatches, kitchenOrders })

  } catch (error) {
    console.error('Live Rack Aggregation Error:', error)
    return NextResponse.json({ error: 'Internal Server Error generating Live Rack' }, { status: 500 })
  }
}
