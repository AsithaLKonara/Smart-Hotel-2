import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { sendPasswordResetEmail } from '@/lib/email'
import crypto from 'crypto'
import { enhancedRateLimit, createEnhancedRateLimitResponse } from '@/lib/rate-limit-enhanced'

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await enhancedRateLimit(request, 'auth')
  if (!rateLimitResult.allowed) {
    return createEnhancedRateLimitResponse(rateLimitResult)
  }

  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: { email }
    })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists, a password reset email has been sent'
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    
    // Note: User model doesn't have resetToken fields in schema
    // Token would need to be stored in a separate table or cache for production
    // For now, we'll generate the token and send email
    // The reset-password route would need to be updated to handle token validation differently
    
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`

    // Send email with reset link via Outbox
    try {
      await prisma.outbox.create({
        data: {
          topic: 'EMAIL_PASSWORD_RESET',
          payload: {
            name: user.name,
            email: user.email,
            resetUrl
          } as any
        }
      })
    } catch (emailError) {
      console.error('Failed to enqueue password reset email:', emailError)
      // Continue even if outbox fails - don't expose configuration issues
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists, a password reset email has been sent'
    })
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    )
  }
}









