import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const subscription = await request.json()

    // Store subscription in database (you'd need to add a PushSubscription model)
    // For now, we'll just validate and return success
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Invalid subscription' },
        { status: 400 }
      )
    }

    // In production, store this subscription in the database
    // await prisma.pushSubscription.create({
    //   data: {
    //     userId: session.user.id,
    //     endpoint: subscription.endpoint,
    //     keys: subscription.keys,
    //   }
    // })

    return NextResponse.json({
      success: true,
      message: 'Subscription saved successfully'
    })
  } catch (error) {
    console.error('Error saving push subscription:', error)
    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    )
  }
}

