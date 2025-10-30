import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
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
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour

    // Store token (you'll need to add these fields to User model)
    // For now, we'll return the token for demonstration
    // In production, store in database and send via email

    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`

    // TODO: Send email with reset link
    // await sendEmail({
    //   to: email,
    //   subject: 'Reset Your Password - SmartHotel',
    //   html: passwordResetEmail({ name: user.name, resetUrl })
    // })

    console.log('Password reset link:', resetUrl)
    console.log('Reset token:', resetToken)

    return NextResponse.json({
      success: true,
      message: 'If an account exists, a password reset email has been sent',
      // Remove these in production:
      resetUrl, // For testing only
      resetToken // For testing only
    })
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    )
  }
}









