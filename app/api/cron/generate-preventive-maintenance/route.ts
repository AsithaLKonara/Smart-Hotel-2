import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Secure the cron endpoint
const CRON_SECRET = process.env.CRON_SECRET || 'dev-secret-key'

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // In a real application, there would be a PreventiveMaintenanceSchedule model.
    // For this mock, we will check all rooms and generate an AC filter cleaning task if they
    // haven't had one generated in the last 3 months.

    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    // Find all rooms
    const rooms = await prisma.room.findMany({
      select: { id: true, number: true }
    })

    const generatedTasks = []

    for (const room of rooms) {
      // Check if a maintenance task for AC exists in the last 3 months
      const recentTask = await prisma.task.findFirst({
        where: {
          roomId: room.id,
          type: 'MAINTENANCE',
          title: 'AC Filter Cleaning',
          createdAt: { gte: threeMonthsAgo }
        }
      })

      if (!recentTask) {
        const newTask = await prisma.task.create({
          data: {
            title: 'AC Filter Cleaning',
            description: `Quarterly preventive maintenance for AC unit in Room ${room.number}.`,
            type: 'MAINTENANCE',
            priority: 'MEDIUM',
            status: 'PENDING',
            roomId: room.id
          }
        })
        generatedTasks.push(newTask.id)
      }
    }

    if (generatedTasks.length > 0) {
      await prisma.auditLog.create({
        data: {
          action: 'PREVENTIVE_MAINTENANCE_GENERATED',
          resource: 'SYSTEM',
          actor: 'CRON_JOB',
          details: {
            taskCount: generatedTasks.length
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${generatedTasks.length} preventive maintenance tasks.`
    })

  } catch (error) {
    console.error('Preventive maintenance cron error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
