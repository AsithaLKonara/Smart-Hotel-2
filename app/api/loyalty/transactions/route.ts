import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getRequestSession } from '@/lib/session'
import { z } from 'zod'
import { handleZodError } from '@/lib/api-utils'

const transactionSchema = z.object({
  loyaltyPointId: z.string().min(1),
  type: z.enum(['earned', 'spent', 'expired']),
  points: z.number().int(),
  description: z.string().min(1),
  referenceId: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const loyaltyPointId = searchParams.get('loyaltyPointId')

    const where: any = {}
    if (loyaltyPointId) where.loyaltyPointId = loyaltyPointId

    const transactions = await prisma.loyaltyTransaction.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    })

    return NextResponse.json(transactions)
  } catch (error: any) {
    console.error('Error fetching loyalty transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch loyalty transactions', message: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request)
  
  if (!session || !['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'].includes((session.user as any).roleName as string)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = transactionSchema.parse(body)

    // Create transaction
    const transaction = await prisma.loyaltyTransaction.create({
      data: validatedData,
    })

    // Update loyalty points
    const loyaltyPoint = await prisma.loyaltyPoint.findUnique({
      where: { id: validatedData.loyaltyPointId },
    })

    if (!loyaltyPoint) {
      return NextResponse.json({ error: 'Loyalty point record not found' }, { status: 404 })
    }

    let newPoints = loyaltyPoint.points
    let newTotalEarned = loyaltyPoint.totalEarned
    let newTotalSpent = loyaltyPoint.totalSpent

    if (validatedData.type === 'earned') {
      newPoints += validatedData.points
      newTotalEarned += validatedData.points
    } else if (validatedData.type === 'spent') {
      newPoints = Math.max(0, newPoints - validatedData.points)
      newTotalSpent += validatedData.points
    } else if (validatedData.type === 'expired') {
      newPoints = Math.max(0, newPoints - validatedData.points)
    }

    // Update tier based on points
    let newTier = 'bronze'
    if (newPoints >= 5000) newTier = 'platinum'
    else if (newPoints >= 2000) newTier = 'gold'
    else if (newPoints >= 500) newTier = 'silver'

    await prisma.loyaltyPoint.update({
      where: { id: validatedData.loyaltyPointId },
      data: {
        points: newPoints,
        tier: newTier,
        totalEarned: newTotalEarned,
        totalSpent: newTotalSpent,
      },
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return handleZodError(error)
    }
    console.error('Error creating loyalty transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create loyalty transaction', message: error.message },
      { status: 500 }
    )
  }
}

