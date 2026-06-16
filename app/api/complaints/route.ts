import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const where: any = {}
    if (userId) {
      where.userId = userId
    } else if (!['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)) {
      where.userId = session.user.id
    }

    const complaints = await prisma.complaint.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { 
        user: { select: { name: true, email: true } },
        booking: { select: { confirmationCode: true } }
      }
    })

    return NextResponse.json(complaints)
  } catch (error) {
    console.error('Error fetching complaints:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { subject, description, category, bookingId, priority } = body

    if (!subject || !description || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const complaint = await prisma.complaint.create({
      data: {
        subject,
        description,
        category,
        priority: priority || 'MEDIUM',
        userId: session.user.id,
        bookingId: bookingId || null,
        status: 'OPEN'
      }
    })

    return NextResponse.json(complaint, { status: 201 })
  } catch (error) {
    console.error('Error creating complaint:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, status, resolvedAt } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const complaint = await prisma.complaint.update({
      where: { id },
      data: { 
        status,
        resolvedAt: status === 'RESOLVED' ? new Date() : resolvedAt
      }
    })

    return NextResponse.json(complaint)
  } catch (error) {
    console.error('Error updating complaint:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
