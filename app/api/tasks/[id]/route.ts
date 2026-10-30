import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { z } from 'zod'
import { logAction, AUDIT_ACTIONS } from '@/lib/audit'
import { Prisma } from '@prisma/client'
import { handleZodError } from '@/lib/api-utils'
import { getToken } from 'next-auth/jwt'
import { getBroadRole } from '@/lib/rbac-utils'

const taskUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().nullable().optional(),
  type: z.enum(['HOUSEKEEPING', 'MAINTENANCE', 'ROOM_SERVICE', 'GUEST_REQUEST', 'ADMINISTRATIVE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'VERIFIED']).optional(),
  assignedTo: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Note: Task model doesn't have staff or user relations defined in schema
    // Fetch related data separately if needed
    const task = await prisma.task.findUnique({
      where: { id: id }
    })
    
    // Fetch related data separately if task exists
    let staff, user
    if (task) {
      [staff, user] = await Promise.all([
        task.assignedTo ? prisma.staff.findUnique({ where: { id: task.assignedTo } }).catch(() => null) : null,
        task.createdBy ? prisma.user.findUnique({ where: { id: task.createdBy } }).catch(() => null) : null
      ])
    }

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Return task with related data
    return NextResponse.json({
      task: {
        ...task,
        staff: staff ? {
          id: staff.id,
          name: staff.name,
          email: staff.email,
          position: staff.position,
          department: staff.department,
        } : null,
        user: user ? {
          id: user.id,
          name: user.name,
          email: user.email,
        } : null,
      }
    })
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    let userRole = (session?.user as any)?.roleName || (session?.user as any)?.role?.name
    if (!userRole) {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        cookieName: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token'
      }).catch(() => null)
      if (token) {
        userRole = (token.roleName || token.role || '') as string
      }
    }
    const broadRole = getBroadRole(userRole || '')
    const allowedRoles = ['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING', 'MAINTENANCE']
    if (!allowedRoles.includes(broadRole)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = taskUpdateSchema.parse(body)

    const existingTask = await prisma.task.findUnique({
      where: { id: id }
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    const updateData: Prisma.TaskUncheckedUpdateInput = {
      ...validatedData,
      updatedAt: new Date(),
    }
    
    // Only update assignedTo if provided, otherwise keep existing value
    // Only update assignedTo if provided in the payload
    if ('assignedTo' in validatedData) {
      updateData.assignedTo = validatedData.assignedTo === '' ? null : validatedData.assignedTo;
    }
    if (validatedData.dueDate) {
      updateData.dueDate = new Date(validatedData.dueDate)
    }
    if (validatedData.completedAt !== undefined) {
      updateData.completedAt = validatedData.completedAt ? new Date(validatedData.completedAt) : null
    }
    
    const updatedTask = await prisma.task.update({
      where: { id: id },
      data: updateData
    })
    
    // Fetch related data separately
    const [updatedEmployee, updatedUser] = await Promise.all([
      updatedTask.assignedTo ? prisma.employee.findUnique({ where: { id: updatedTask.assignedTo } }).catch(() => null) : null,
      updatedTask.createdBy ? prisma.user.findUnique({ where: { id: updatedTask.createdBy } }).catch(() => null) : null
    ])

    // Log the action
    await logAction(
      request,
      session?.user?.id || 'system',
      AUDIT_ACTIONS.TASK_UPDATE,
      'Task',
      id,
      {
        oldStatus: existingTask.status,
        newStatus: validatedData.status,
        oldAssignedTo: existingTask.assignedTo,
        newAssignedTo: validatedData.assignedTo,
      }
    )

    // Return task with related data
    return NextResponse.json({
      task: {
        ...updatedTask,
        staff: updatedEmployee ? {
          id: updatedEmployee.id,
          name: `${updatedEmployee.firstName} ${updatedEmployee.lastName}`,
          email: updatedEmployee.email,
        } : null,
        user: updatedUser ? {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
        } : null,
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error)
    }

    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    let userRole = (session?.user as any)?.roleName || (session?.user as any)?.role?.name
    let userId = (session?.user as any)?.id
    if (!userRole) {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        cookieName: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token'
      }).catch(() => null)
      if (token) {
        userRole = (token.roleName || token.role || '') as string
        userId = (token.id || token.sub || '') as string
      }
    }
    const broadRole = getBroadRole(userRole || '')
    const allowedRoles = ['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING', 'MAINTENANCE']
    if (!allowedRoles.includes(broadRole)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('PATCH /api/tasks/[id] body:', body)
    const taskPatchSchema = z.object({
      title: z.string().optional(),
      description: z.any().optional(),
      type: z.any().optional(),
      priority: z.any().optional(),
      status: z.any().optional(),
      assignedTo: z.any().optional(),
      dueDate: z.any().optional(),
      completedAt: z.any().optional(),
    }).passthrough()
    const validatedData = taskPatchSchema.parse(body)

    const existingTask = await prisma.task.findUnique({
      where: { id: id }
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    const updateData: Prisma.TaskUncheckedUpdateInput = {
      ...validatedData,
      updatedAt: new Date(),
    }
    
    // Only update assignedTo if provided in the payload
    if ('assignedTo' in validatedData) {
      updateData.assignedTo = validatedData.assignedTo === '' ? null : validatedData.assignedTo;
    }
    if (validatedData.dueDate) {
      updateData.dueDate = new Date(validatedData.dueDate)
    }
    if (validatedData.completedAt !== undefined) {
      updateData.completedAt = validatedData.completedAt ? new Date(validatedData.completedAt) : null
    }
    
    const updatedTask = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const t = await tx.task.update({
        where: { id: id },
        data: updateData,
        include: { room: true }
      })

      // SIDE EFFECT: Housekeeping status syncs with Room status
      if (t.type === 'HOUSEKEEPING' && t.roomId) {
        if (validatedData.status === 'IN_PROGRESS') {
          await tx.room.update({
            where: { id: t.roomId },
            data: { status: 'CLEANING', lastStatusChangeAt: new Date() }
          })
        } else if (validatedData.status === 'COMPLETED') {
          await tx.room.update({
            where: { id: t.roomId },
            data: { status: 'INSPECTION_PENDING', lastStatusChangeAt: new Date() }
          })
        } else if (validatedData.status === 'VERIFIED') {
          await tx.room.update({
            where: { id: t.roomId },
            data: { status: 'AVAILABLE', lastStatusChangeAt: new Date() }
          })
        }
      }

      return t
    })
    
    // 3. REAL-TIME SYNCHRONIZATION
    const { RealtimeEvents } = await import('@/lib/realtime')
    await RealtimeEvents.emitTaskUpdated(updatedTask)
    if (updatedTask.room && updatedTask.type === 'HOUSEKEEPING') {
      let nextRoomStatus = null
      if (validatedData.status === 'IN_PROGRESS') nextRoomStatus = 'CLEANING'
      if (validatedData.status === 'COMPLETED') nextRoomStatus = 'INSPECTION_PENDING'
      if (validatedData.status === 'VERIFIED') nextRoomStatus = 'AVAILABLE'
      
      if (nextRoomStatus) {
        await RealtimeEvents.emitRoomStatusChanged({ ...updatedTask.room, status: nextRoomStatus })
      }
    }

    // Fetch related data separately
    const [updatedEmployee, updatedUser] = await Promise.all([
      updatedTask.assignedTo ? prisma.employee.findUnique({ where: { id: updatedTask.assignedTo } }).catch(() => null) : null,
      updatedTask.createdBy ? prisma.user.findUnique({ where: { id: updatedTask.createdBy } }).catch(() => null) : null
    ])

    // Log the action
    const actorId = session?.user?.id || userId || 'system'
    await logAction(
      request,
      actorId,
      AUDIT_ACTIONS.TASK_UPDATE,
      'Task',
      id,
      {
        oldStatus: existingTask.status,
        newStatus: validatedData.status,
        oldAssignedTo: existingTask.assignedTo,
        newAssignedTo: validatedData.assignedTo,
      }
    )

    // Return task with related data
    return NextResponse.json({
      task: {
        ...updatedTask,
        staff: updatedEmployee ? {
          id: updatedEmployee.id,
          name: `${updatedEmployee.firstName} ${updatedEmployee.lastName}`,
          email: updatedEmployee.email,
        } : null,
        user: updatedUser ? {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
        } : null,
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Task PATCH ZodError details:', JSON.stringify(error.format(), null, 2))
      return handleZodError(error)
    }

    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Failed to update task', details: String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user as any).roleName !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const task = await prisma.task.findUnique({
      where: { id: id }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    await prisma.task.delete({
      where: { id: id }
    })

    // Log the action
    await logAction(
      request,
      session.user.id,
      AUDIT_ACTIONS.TASK_DELETE,
      'Task',
      task.id,
      {
        title: task.title,
        type: task.type,
      }
    )

    return NextResponse.json({ message: 'Task deleted successfully' })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
} 