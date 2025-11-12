import { NextRequest, NextResponse } from 'next/server'

// NextAuth internal logging endpoint
// This endpoint is called by NextAuth for debugging/logging purposes
export async function POST(request: NextRequest) {
  try {
    // Optionally log the request body for debugging
    const body = await request.json().catch(() => ({}))
    
    // Log to server console if needed
    if (process.env.NODE_ENV === 'development') {
      console.log('[NextAuth Log]', body)
    }
    
    // Return success response
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    // Always return JSON, never HTML
    return NextResponse.json(
      { success: false, error: 'Logging failed' },
      { 
        status: 200, // Return 200 to prevent error page
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
  }
}

// Some clients might use GET, so handle that too
export async function GET() {
  return NextResponse.json({ success: true }, { status: 200 })
}

