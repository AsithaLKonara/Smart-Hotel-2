import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { z } from 'zod'
import { getRequestSession } from '@/lib/session'

const routingSchema = z.object({
  sourceFolioId: z.string().uuid(),
  targetFolioId: z.string().uuid(),
  category: z.string().optional(),
  transactionCodeId: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getRequestSession(request)
    if (!session || !['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    const data = routingSchema.parse(body)

    if (!data.category && !data.transactionCodeId) {
      return NextResponse.json({ error: 'Must specify category or transactionCodeId for routing' }, { status: 400 })
    }

    const rule = await prisma.$transaction(async (tx: any) => {
      return await tx.routingRule.create({
        data: {
          sourceFolioId: data.sourceFolioId,
          targetFolioId: data.targetFolioId,
          criteria: {
            category: data.category,
            transactionCodeId: data.transactionCodeId
          }
        }
      })
    })

    return NextResponse.json({ rule }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error creating routing rule:', error)
    return NextResponse.json({ error: error.message || 'Failed to create routing rule' }, { status: 500 })
  }
}
