import { NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const InspectionSchema = z.object({
  roomId: z.string().uuid(),
  supervisorId: z.string().uuid(),
  passed: z.boolean(),
  notes: z.string().optional()
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validatedData = InspectionSchema.parse(body)

    const room = await prisma.room.findUnique({
      where: { id: validatedData.roomId }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    if (room.status !== 'INSPECTION_PENDING') {
      return NextResponse.json({ error: 'Only INSPECTION_PENDING rooms can be inspected' }, { status: 400 })
    }

    const newStatus = validatedData.passed ? 'AVAILABLE' : 'DIRTY'

    const updatedRoom = await prisma.room.update({
      where: { id: room.id },
      data: {
        status: newStatus,
        lastInspectedAt: new Date()
      }
    })

    // Log the inspection history
    await prisma.roomStatusHistory.create({
      data: {
        roomId: room.id,
        oldStatus: room.status,
        newStatus: newStatus,
        reason: validatedData.passed 
          ? 'Supervisor Inspection Passed' 
          : `Supervisor Inspection Failed: ${validatedData.notes || 'No reason provided'}`,
        actorId: validatedData.supervisorId
      }
    })

    return NextResponse.json({
      success: true,
      message: `Room inspection ${validatedData.passed ? 'passed' : 'failed'}. Room is now ${newStatus}.`,
      room: updatedRoom
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('Inspection error:', error)
    return NextResponse.json({ error: 'Internal server error processing inspection' }, { status: 500 })
  }
}
