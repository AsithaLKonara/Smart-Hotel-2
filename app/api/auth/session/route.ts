import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic';

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
        role: (session.user as any).roleName,
        // Note: User model doesn't have hotelId field in schema
      },
      session: {
        expires: session.expires
      }
    })

  } catch (error) {
    console.error('Error fetching session:', error)
    // Always return JSON, never HTML error pages
    return NextResponse.json(
      { 
        authenticated: false,
        error: 'Failed to fetch session'
      },
      { 
        status: 200, // Return 200 instead of 500 to prevent error page rendering
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
  }
}
