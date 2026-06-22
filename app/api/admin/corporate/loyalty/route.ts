import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const accounts = await prisma.loyaltyPoint.findMany({
      include: {
        user: {
            select: { name: true, email: true }
        },
      },
      orderBy: { points: 'desc' },
    })
    return NextResponse.json(accounts)
  } catch (error) {
    console.error('Failed to fetch loyalty accounts:', error)
    return NextResponse.json({ error: 'Failed to fetch loyalty accounts' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    
    // 1. Get current points
    const account = await prisma.loyaltyPoint.findUnique({
        where: { id: data.accountId }
    })
    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

    const newPoints = account.points + parseInt(data.points)
    const newTotalEarned = data.points > 0 ? account.totalEarned + parseInt(data.points) : account.totalEarned
    const newTotalSpent = data.points < 0 ? account.totalSpent + Math.abs(parseInt(data.points)) : account.totalSpent

    // Calculate tier
    let newTier = "SILVER"
    if (newTotalEarned >= 50000) newTier = "PLATINUM"
    else if (newTotalEarned >= 10000) newTier = "GOLD"

    // 2. Update account
    await prisma.loyaltyPoint.update({
        where: { id: data.accountId },
        data: {
            points: newPoints,
            totalEarned: newTotalEarned,
            totalSpent: newTotalSpent,
            tier: newTier
        }
    })

    // 3. Log transaction
    const transaction = await prisma.loyaltyTransaction.create({
        data: {
            loyaltyPointId: data.accountId,
            type: data.points > 0 ? 'EARN' : 'REDEEM',
            points: parseInt(data.points),
            description: data.description,
        }
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error('Failed to process loyalty transaction:', error)
    return NextResponse.json({ error: 'Failed to process transaction' }, { status: 500 })
  }
}
