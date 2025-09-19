import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { 
          authenticated: false,
          message: 'No active session'
        },
        { status: 200 }
      )
    }

    // Return session data in a more structured format
    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        hotelId: session.user.hotelId
      },
      session: {
        expires: session.expires
      }
    })

  } catch (error) {
    console.error('Error fetching session:', error)
    return NextResponse.json(
      { 
        authenticated: false,
        error: 'Failed to fetch session'
      },
      { status: 500 }
    )
  }
}
