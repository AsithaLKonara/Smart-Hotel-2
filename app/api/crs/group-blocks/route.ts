import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  createMasterGroupContract,
  getMasterGroupContractByCode
} from '@/lib/crs/master-group-blocks'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code')
    if (code) {
      const contract = await getMasterGroupContractByCode(code)
      if (!contract) {
        return NextResponse.json({ error: 'Master contract not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, contract })
    }

    // List all distinct master contracts
    const events = await prisma.banquetingEvent.findMany({
      where: { type: 'MASTER_GROUP_CONTRACT' },
      select: { name: true, status: true, startDate: true, endDate: true, organizerName: true, organizerEmail: true },
      distinct: ['name']
    })

    const contracts = events.map((ev) => {
      const match = ev.name.match(/\[(.*?)\]\s*(.*)/)
      return {
        contractCode: match ? match[1] : ev.name,
        contractName: match ? match[2] : ev.name,
        organizerName: ev.organizerName,
        organizerEmail: ev.organizerEmail,
        startDate: ev.startDate,
        endDate: ev.endDate,
        status: ev.status
      }
    })

    return NextResponse.json({ success: true, contracts })
  } catch (error: any) {
    console.error('Error fetching master group contracts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch master group contracts', details: error?.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.roleName || (session?.user as any)?.role

    const allowedRoles = ['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST']
    if (session && !allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden', message: `Role [${userRole}] cannot create master contracts` },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      contractName,
      contractCode,
      organizerName,
      organizerEmail,
      startDate,
      endDate,
      expectedAttendees,
      allocations
    } = body

    if (!contractName || !organizerName || !organizerEmail || !startDate || !endDate || !allocations) {
      return NextResponse.json(
        { error: 'contractName, organizerName, organizerEmail, startDate, endDate, and allocations are required' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return NextResponse.json(
        { error: 'Invalid startDate or endDate' },
        { status: 400 }
      )
    }

    const result = await createMasterGroupContract({
      contractName,
      contractCode,
      organizerName,
      organizerEmail,
      startDate: start,
      endDate: end,
      expectedAttendees,
      allocations
    })

    return NextResponse.json({
      success: true,
      masterContract: result
    })
  } catch (error: any) {
    console.error('Error creating master group contract:', error)
    return NextResponse.json(
      { error: 'Failed to create master contract', message: error?.message || 'Internal error' },
      { status: 400 }
    )
  }
}
