import { NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const EmailRequestSchema = z.object({
  bookingId: z.string().uuid(),
  template: z.enum(['PRE_ARRIVAL', 'POST_DEPARTURE', 'BOOKING_CONFIRMATION', 'PAYMENT_RECEIPT'])
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validatedData = EmailRequestSchema.parse(body)

    const booking = await prisma.booking.findUnique({
      where: { id: validatedData.bookingId },
      include: {
        guest: true
      }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (!booking.guest.email) {
      return NextResponse.json({ error: 'Guest does not have an email address' }, { status: 400 })
    }

    // Mock Email Dispatch (e.g. via SendGrid / AWS SES)
    const emailPayload = {
      to: booking.guest.email,
      from: 'reservations@smarthotel.local',
      subject: `SmartHotel: Your ${validatedData.template.replace('_', ' ').toLowerCase()} info`,
      html: `<html><body><h1>Hello ${booking.guest.name}</h1><p>Here is your ${validatedData.template} information.</p></body></html>`
    }

    // In production, we'd do: await sgMail.send(emailPayload)

    await prisma.auditLog.create({
      data: {
        action: 'EMAIL_DISPATCHED',
        resource: 'BOOKING',
        resourceId: booking.id,
        actor: 'SYSTEM',
        details: {
          template: validatedData.template,
          recipient: booking.guest.email
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Email dispatched successfully',
      dispatchedTemplate: validatedData.template
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('Email dispatch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
