import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const ForgetMeSchema = z.object({
  userId: z.string().uuid()
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validated = ForgetMeSchema.parse(body)

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: validated.userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // GDPR Right to be Forgotten: Anonymize the user record
    // We do not physically delete the record because it might be tied to accounting records (Folios, Payments)
    // which legally must be retained for tax purposes.
    
    await prisma.$transaction(async (tx) => {
      // 1. Anonymize user PII
      await tx.user.update({
        where: { id: validated.userId },
        data: {
          name: 'GDPR_ANONYMIZED',
          email: `anonymized_${validated.userId}@deleted.smarthotel.local`,
          phone: null,
          password: 'GDPR_ANONYMIZED_NO_LOGIN',
          deletedAt: new Date()
        }
      })

      // 2. Delete non-essential profiling data (GuestPreferences, Loyalty)
      await tx.guestPreference.deleteMany({
        where: { userId: validated.userId }
      })

      await tx.loyaltyPoint.deleteMany({
        where: { userId: validated.userId }
      })

      // 3. Log the compliance action
      await tx.auditLog.create({
        data: {
          action: 'GDPR_RIGHT_TO_BE_FORGOTTEN_EXECUTED',
          resource: 'USER',
          resourceId: validated.userId,
          actor: 'SYSTEM',
          details: {
            reason: 'User request',
            anonymizedFields: ['name', 'email', 'phone', 'password']
          }
        }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'User data successfully anonymized in compliance with GDPR.'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('GDPR Forget Me error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
