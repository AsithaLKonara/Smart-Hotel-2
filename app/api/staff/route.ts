import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { logAction, AUDIT_ACTIONS } from '@/lib/audit'
import { getRequestSession } from '@/lib/session'
import { prisma } from '@/lib/db'

const staffSchema = z.object({
  employeeId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  position: z.string().min(1),
  department: z.string().min(1),
  hireDate: z.string().datetime(),
  salary: z.number().positive(),
  isActive: z.boolean().default(true),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getRequestSession(request)
    const { searchParams } = new URL(request.url)
    const department = searchParams.get('department')
    const isActive = searchParams.get('isActive')

    // Basic protection - allow department filters for operational hubs
    if (!session && !department) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const staff = await prisma.staff.findMany({
      where: {
        ...(department ? { department: { equals: department, mode: 'insensitive' } } : {}),
        ...(isActive ? { isActive: isActive === 'true' } : {})
      },
      include: {
        _count: {
          select: { tasks: { where: { status: { in: ['PENDING', 'IN_PROGRESS'] } } } }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(staff.map(s => ({
      ...s,
      taskCount: s._count.tasks,
      workloadPercentage: Math.min(100, (s._count.tasks / 5) * 100) // Scale: 5 tasks = 100% load
    })))
  } catch (error) {
    console.error('[STAFF_API_ERROR]', error)
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request)
  if (!session || !['SUPER_ADMIN', 'MANAGER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validated = staffSchema.parse(body)

    const staff = await prisma.staff.create({
      data: {
        employeeId: validated.employeeId,
        name: validated.name,
        email: validated.email,
        phone: validated.phone,
        position: validated.position,
        department: validated.department,
        salary: validated.salary,
        hireDate: new Date(validated.hireDate),
        isActive: validated.isActive,
        user: {
          connectOrCreate: {
            where: { email: validated.email },
            create: {
              email: validated.email,
              name: validated.name,
              password: await bcrypt.hash('SmartHotel@Staff2025', 12),
              role: validated.department.toUpperCase() as any || 'RECEPTIONIST'
            }
          }
        }
      }
    })

    await logAction(request, session.user.id, AUDIT_ACTIONS.STAFF_CREATE, 'Staff', staff.id, { name: staff.name })
    return NextResponse.json(staff, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Conflict: Employee ID or Email already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message || 'Failed to create staff' }, { status: 400 })
  }
}