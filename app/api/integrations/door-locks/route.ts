import { NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { handleZodError } from '@/lib/api-utils'

const prisma = new PrismaClient()

const DoorLockRequestSchema = z.object({
  bookingId: z.string().uuid(),
  roomId: z.string().uuid(),
  provider: z.enum(['ASSA_ABLOY', 'SALTO', 'VINGCARD', 'GENERIC']),
  action: z.enum(['ENCODE', 'READ', 'REVOKE']),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime(),
  keyCount: z.number().int().min(1).max(5).default(1)
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validatedData = DoorLockRequestSchema.parse(body)

    // 1. Verify Booking & Room Association
    const booking = await prisma.booking.findUnique({
      where: { id: validatedData.bookingId },
      select: { status: true }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.status !== 'CHECKED_IN' && booking.status !== 'CONFIRMED') {
      return NextResponse.json({ error: 'Invalid booking status for keycard encoding' }, { status: 400 })
    }

    // 2. Audit Log the Request
    await prisma.auditLog.create({
      data: {
        action: `KEYCARD_${validatedData.action}`,
        resource: 'ROOM',
        resourceId: validatedData.roomId,
        actor: 'SYSTEM', // In real app: session.user.id
        details: {
          provider: validatedData.provider,
          keyCount: validatedData.keyCount,
          validUntil: validatedData.validUntil
        }
      }
    })

    // 3. Simulate hardware encoder response (In production, this bridges to a TCP/WebSocket proxy connected to the physical encoder on LAN)
    const simulatedResponse = {
      success: true,
      provider: validatedData.provider,
      action: validatedData.action,
      uid: `KEY-${Math.random().toString(36).substring(7).toUpperCase()}`,
      message: `${validatedData.provider} keycard successfully ${validatedData.action.toLowerCase()}ed.`,
      timestamp: new Date().toISOString()
    }

    // 4. Update Room lock status if applicable
    if (validatedData.action === 'ENCODE') {
      await prisma.room.update({
        where: { id: validatedData.roomId },
        data: {
          lockId: simulatedResponse.uid,
          lockExpiresAt: new Date(validatedData.validUntil)
        }
      })
    } else if (validatedData.action === 'REVOKE') {
      await prisma.room.update({
        where: { id: validatedData.roomId },
        data: {
          lockId: null,
          lockExpiresAt: null
        }
      })
    }

    return NextResponse.json(simulatedResponse)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error)
    }
    console.error('Door lock integration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
