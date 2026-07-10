import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createComplaintSchema = z.object({
  subject: z.string().min(3, "Subject must be at least 3 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(2),
  bookingId: z.string().uuid().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional()
})

const updateComplaintSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
  resolvedAt: z.string().datetime().optional().nullable()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const where: any = {}
    const isAdmin = ['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)

    if (!isAdmin) {
      where.userId = session.user.id
    } else if (userId) {
      where.userId = userId
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

    const validation = createComplaintSchema.safeParse(await request.json())
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation Error', details: validation.error.flatten().fieldErrors }, { status: 400 })
    }

    const { subject, description, category, bookingId, priority } = validation.data

    if (bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId }
      })
      if (!booking || booking.primaryGuestId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden: Cannot link complaint to this booking' }, { status: 403 })
      }
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

    const validation = updateComplaintSchema.safeParse(await request.json())
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation Error', details: validation.error.flatten().fieldErrors }, { status: 400 })
    }

    const { id, status, resolvedAt } = validation.data

    const complaint = await prisma.complaint.update({
      where: { id },
      data: { 
        status,
        resolvedAt: status === 'RESOLVED' ? new Date() : (resolvedAt ? new Date(resolvedAt) : null)
      }
    })

    return NextResponse.json(complaint)
  } catch (error) {
    console.error('Error updating complaint:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
