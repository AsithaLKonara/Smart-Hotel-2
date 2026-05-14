import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { z } from 'zod'
import { logAction, AUDIT_ACTIONS } from '@/lib/audit'

const taskUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  type: z.enum(['HOUSEKEEPING', 'MAINTENANCE', 'ROOM_SERVICE', 'GUEST_REQUEST', 'ADMINISTRATIVE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
  completedAt: z.string().optional(),
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
    
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes(session.user.role)) {
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

    const updateData: any = {
      ...validatedData,
      updatedAt: new Date(),
    }
    
    // Only update assignedTo if provided, otherwise keep existing value
    if (validatedData.assignedTo !== undefined) {
      updateData.assignedTo = validatedData.assignedTo || existingTask.assignedTo
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
    
    // Fetch related data separately (relations don't exist in schema)
    const [updatedStaff, updatedUser] = await Promise.all([
      updatedTask.assignedTo ? prisma.staff.findUnique({ where: { id: updatedTask.assignedTo } }).catch(() => null) : null,
      updatedTask.createdBy ? prisma.user.findUnique({ where: { id: updatedTask.createdBy } }).catch(() => null) : null
    ])

    // Log the action
    await logAction(
      request,
      session.user.id,
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
        staff: updatedStaff ? {
          id: updatedStaff.id,
          name: updatedStaff.name,
          email: updatedStaff.email,
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
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
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
    
    if (!session || !['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST'].includes(session.user.role)) {
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

    const updateData: any = {
      ...validatedData,
      updatedAt: new Date(),
    }
    
    // Only update assignedTo if provided, otherwise keep existing value
    if (validatedData.assignedTo !== undefined) {
      updateData.assignedTo = validatedData.assignedTo || existingTask.assignedTo
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
    
    // Fetch related data separately (relations don't exist in schema)
    const [updatedStaff, updatedUser] = await Promise.all([
      updatedTask.assignedTo ? prisma.staff.findUnique({ where: { id: updatedTask.assignedTo } }).catch(() => null) : null,
      updatedTask.createdBy ? prisma.user.findUnique({ where: { id: updatedTask.createdBy } }).catch(() => null) : null
    ])

    // Log the action
    await logAction(
      request,
      session.user.id,
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
        staff: updatedStaff ? {
          id: updatedStaff.id,
          name: updatedStaff.name,
          email: updatedStaff.email,
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
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
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
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
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