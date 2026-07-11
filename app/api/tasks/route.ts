import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { z } from 'zod'
import { logAction, AUDIT_ACTIONS } from '@/lib/audit'
import { Prisma, TaskStatus, TaskType, Task } from '@prisma/client'
import { getEffectivePropertyId } from '@/lib/server-rbac'
import { handleZodError } from '@/lib/api-utils'

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['HOUSEKEEPING', 'MAINTENANCE', 'ROOM_SERVICE', 'GUEST_REQUEST', 'ADMINISTRATIVE']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const assignedTo = searchParams.get('assignedTo')

    let whereClause: Prisma.TaskWhereInput = {}

    if (status && status !== 'all') {
      whereClause.status = status as TaskStatus
    }

    if (type && type !== 'all') {
      whereClause.type = type as TaskType
    }

    const propertyId = await getEffectivePropertyId(request)
    if (propertyId) {
      whereClause.propertyId = propertyId
    }

    // Enforce role-based visibility
    if ((session.user as any).roleName === 'GUEST') {
      whereClause.createdBy = session.user.id
    } else if (assignedTo) {
      whereClause.assignedTo = assignedTo
    }

    // Note: Task model doesn't have staff or user relations defined in schema
    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: { room: true },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    // Fetch related data separately for each task
    const tasksWithRelations = await Promise.all(
      tasks.map(async (task: Task) => {
        const [staff, user] = await Promise.all([
          task.assignedTo ? prisma.staff.findUnique({ where: { id: task.assignedTo } }).catch(() => null) : null,
          task.createdBy ? prisma.user.findUnique({ where: { id: task.createdBy } }).catch(() => null) : null
        ])
        
        return {
          ...task,
          staff: staff ? {
            id: staff.id,
            name: staff.name,
            email: staff.email,
          } : null,
          user: user ? {
            id: user.id,
            name: user.name,
            email: user.email,
          } : null,
        }
      })
    )

    return NextResponse.json({ tasks: tasksWithRelations })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = taskSchema.parse(body)

    // Authorization logic
    if ((session.user as any).roleName === 'GUEST') {
      // Guests can only create GUEST_REQUEST or HOUSEKEEPING or MAINTENANCE
      if (!['GUEST_REQUEST', 'HOUSEKEEPING', 'MAINTENANCE'].includes(validatedData.type)) {
        return NextResponse.json({ error: 'Forbidden: Guests can only create service requests.' }, { status: 403 })
      }
    } else if (!['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST'].includes((session.user as any).roleName as string)) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const propertyId = await getEffectivePropertyId(request)

    const task = await prisma.task.create({
      data: {
        title: validatedData.title,
        description: validatedData.description || '',
        type: validatedData.type as any,
        priority: validatedData.priority as any,
        assignedTo: validatedData.assignedTo || null, 
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        createdBy: session.user.id,
        propertyId: propertyId,
        status: 'PENDING',
      }
    })
    
    // Fetch related data separately
    const [staff, user] = await Promise.all([
      task.assignedTo ? prisma.staff.findUnique({ where: { id: task.assignedTo } }).catch(() => null) : null,
      task.createdBy ? prisma.user.findUnique({ where: { id: task.createdBy } }).catch(() => null) : null
    ])
    
    const taskWithRelations = {
      ...task,
      staff: staff ? {
        id: staff.id,
        name: staff.name,
        email: staff.email,
      } : null,
      user: user ? {
        id: user.id,
        name: user.name,
        email: user.email,
      } : null,
    }

    // Log the action
    await logAction(
      request,
      session.user.id,
      AUDIT_ACTIONS.TASK_CREATE,
      'Task',
      task.id,
      {
        title: validatedData.title,
        type: validatedData.type,
        priority: validatedData.priority,
        assignedTo: validatedData.assignedTo,
      }
    )

    return NextResponse.json({ task: taskWithRelations }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error)
    }

    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
} 