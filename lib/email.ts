import nodemailer from 'nodemailer'
import prisma from '@/lib/db'

type NodemailerModule = typeof nodemailer

function resolveNodemailer(): NodemailerModule {
  const candidate = nodemailer as unknown as {
    createTransport?: NodemailerModule['createTransport']
    createTransporter?: NodemailerModule['createTransport']
    default?: NodemailerModule
  }

  if (typeof candidate.createTransport === 'function') {
    return candidate as NodemailerModule
  }

  if (typeof candidate.createTransporter === 'function') {
    return {
      ...candidate,
      createTransport: candidate.createTransporter,
    } as NodemailerModule
  }

  if (candidate.default && typeof candidate.default.createTransport === 'function') {
    return candidate.default
  }

  throw new Error('Failed to resolve nodemailer module')
}

const nodemailerInstance = resolveNodemailer()

// Email configuration with fallback for missing credentials
const isEmailConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)

const transporter = isEmailConfigured
  ? nodemailerInstance.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null

const defaultFromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noreply@smarthotel.com'
const defaultFromName = process.env.SMTP_FROM_NAME || 'SmartHotel'
const adminNotificationEmail = process.env.ADMIN_EMAIL || defaultFromEmail

// Email templates
export const emailTemplates = {
  bookingConfirmation: (data: any) => ({
    subject: `Booking Confirmation - ${data.confirmationCode}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Booking Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #eee; }
            .total { font-weight: bold; font-size: 18px; color: #f59e0b; }
            .footer { text-align: center; margin-top: 30px; color: #666; }
            .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏨 Grand Palace Hotel</h1>
              <h2>Booking Confirmation</h2>
              <p>Confirmation Code: <strong>${data.confirmationCode}</strong></p>
            </div>
            
            <div class="content">
              <p>Dear ${data.guestName},</p>
              <p>Thank you for choosing Grand Palace Hotel! Your booking has been confirmed.</p>
              
              <div class="booking-details">
                <h3>Booking Details</h3>
                <div class="detail-row">
                  <span>Room:</span>
                  <span>${data.roomNumber} - ${data.roomType}</span>
                </div>
                <div class="detail-row">
                  <span>Check-in:</span>
                  <span>${new Date(data.checkIn).toLocaleDateString()}</span>
                </div>
                <div class="detail-row">
                  <span>Check-out:</span>
                  <span>${new Date(data.checkOut).toLocaleDateString()}</span>
                </div>
                <div class="detail-row">
                  <span>Guests:</span>
                  <span>${data.guests}</span>
                </div>
                <div class="detail-row">
                  <span>Total Amount:</span>
                  <span class="total">$${data.totalAmount}</span>
                </div>
                ${data.specialRequests ? `
                <div class="detail-row">
                  <span>Special Requests:</span>
                  <span>${data.specialRequests}</span>
                </div>
                ` : ''}
              </div>
              
              <h3>Important Information</h3>
              <ul>
                <li>Check-in time: 3:00 PM</li>
                <li>Check-out time: 11:00 AM</li>
                <li>Please bring a valid ID for check-in</li>
                <li>Free WiFi is available throughout the hotel</li>
                <li>Valet parking is complimentary</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/my-bookings" class="button">View My Bookings</a>
              </div>
              
              <div class="footer">
                <p>If you have any questions, please contact us at:</p>
                <p>📞 +1 (555) 123-4567 | ✉️ info@grandpalacehotel.com</p>
                <p>📍 123 Luxury Avenue, Downtown District</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  adminBookingAlert: (data: any) => ({
    subject: `New Booking Alert - ${data.bookingId}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>New Booking Alert</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .booking-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 8px 0; padding: 5px 0; border-bottom: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 New Booking Alert</h1>
              <p>Booking ID: ${data.bookingId}</p>
            </div>
            
            <div class="content">
              <div class="booking-details">
                <h3>Guest Information</h3>
                <div class="detail-row">
                  <span>Name:</span>
                  <span>${data.guestName}</span>
                </div>
                <div class="detail-row">
                  <span>Email:</span>
                  <span>${data.guestEmail}</span>
                </div>
                <div class="detail-row">
                  <span>Room:</span>
                  <span>${data.roomNumber}</span>
                </div>
                <div class="detail-row">
                  <span>Check-in:</span>
                  <span>${new Date(data.checkIn).toLocaleDateString()}</span>
                </div>
                <div class="detail-row">
                  <span>Check-out:</span>
                  <span>${new Date(data.checkOut).toLocaleDateString()}</span>
                </div>
                <div class="detail-row">
                  <span>Total Amount:</span>
                  <span>$${data.totalAmount}</span>
                </div>
              </div>
              
              <p><strong>Action Required:</strong> Please prepare the room and coordinate with housekeeping for the guest arrival.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  bookingReminder: (data: any) => ({
    subject: `Check-in Reminder - Tomorrow at Grand Palace Hotel`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Check-in Reminder</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #059669; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏨 Grand Palace Hotel</h1>
              <h2>Check-in Reminder</h2>
            </div>
            
            <div class="content">
              <p>Dear ${data.guestName},</p>
              <p>We're excited to welcome you to Grand Palace Hotel tomorrow!</p>
              
              <h3>Your Stay Details</h3>
              <p><strong>Check-in:</strong> ${new Date(data.checkIn).toLocaleDateString()} at 3:00 PM</p>
              <p><strong>Room:</strong> ${data.roomNumber}</p>
              <p><strong>Confirmation:</strong> ${data.confirmationCode}</p>
              
              <h3>What to Expect</h3>
              <ul>
                <li>Complimentary valet parking</li>
                <li>Free WiFi throughout the hotel</li>
                <li>24/7 concierge service</li>
                <li>Access to our fitness center and pool</li>
              </ul>
              
              <p>We look forward to making your stay exceptional!</p>
              
              <p>Best regards,<br>Grand Palace Hotel Team</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  passwordReset: (data: { name: string; resetUrl: string }) => ({
    subject: 'Reset Your Password - SmartHotel',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Reset Your Password</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏨 SmartHotel</h1>
              <h2>Password Reset Request</h2>
            </div>
            
            <div class="content">
              <p>Dear ${data.name},</p>
              <p>We received a request to reset your password for your SmartHotel account.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.resetUrl}" class="button">Reset Password</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #059669;">${data.resetUrl}</p>
              
              <div class="warning">
                <strong>⚠️ Important Security Information:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>This link will expire in 1 hour</li>
                  <li>If you didn't request a password reset, please ignore this email</li>
                  <li>For your security, never share your password reset link with anyone</li>
                </ul>
              </div>
              
              <p>If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
              
              <div class="footer">
                <p>This is an automated email. Please do not reply.</p>
                <p>© SmartHotel - All rights reserved</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  passwordResetConfirmation: (data: { name: string; email: string }) => ({
    subject: 'Password Changed Successfully - SmartHotel',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Password Changed</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #059669, #047857); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .success-box { background: #d1fae5; border-left: 4px solid #059669; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .security-tip { background: #fef3c7; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Password Changed Successfully</h1>
            </div>
            
            <div class="content">
              <p>Dear ${data.name},</p>
              
              <div class="success-box">
                <h3 style="margin-top: 0; color: #059669;">✓ Your password has been successfully changed</h3>
                <p>This confirms that your account password was updated on ${new Date().toLocaleString()}.</p>
              </div>
              
              <div class="security-tip">
                <strong>🔒 Security Reminder:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>If you didn't make this change, please contact our support immediately</li>
                  <li>Consider using a strong, unique password</li>
                  <li>Never share your password with anyone</li>
                </ul>
              </div>
              
              <p>If you have any questions or concerns about this change, please contact our support team.</p>
              
              <div class="footer">
                <p>This is an automated security notification.</p>
                <p>© SmartHotel - All rights reserved</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
}

// Email sending functions with fallback for missing SMTP configuration
export async function sendBookingConfirmation(data: {
  guestName: string
  guestEmail: string
  roomNumber: string
  roomType: string
  checkIn: Date
  checkOut: Date
  guests: number
  totalAmount: number
  bookingId: string
  confirmationCode: string
  specialRequests?: string
}) {
  if (!isEmailConfigured || !transporter) {
    console.warn('SMTP not configured - email not sent. Booking confirmation would be sent to:', data.guestEmail)
    console.log('Email template:', emailTemplates.bookingConfirmation(data).subject)
    return // Gracefully skip email sending
  }

  try {
    const template = emailTemplates.bookingConfirmation(data)
    
    await transporter.sendMail({
      from: `"${defaultFromName}" <${defaultFromEmail}>`,
      to: data.guestEmail,
      subject: template.subject,
      html: template.html,
    })
    
    console.log(`Booking confirmation email sent to ${data.guestEmail}`)
  } catch (error) {
    console.error('Failed to send booking confirmation email:', error)
    // Don't throw - log error but don't break the flow
  }
}

export async function sendAdminBookingAlert(data: {
  bookingId: string
  guestName: string
  guestEmail: string
  roomNumber: string
  checkIn: Date
  checkOut: Date
  totalAmount: number
}) {
  if (!isEmailConfigured || !transporter) {
    console.warn('SMTP not configured - admin alert not sent for booking:', data.bookingId)
    return
  }

  try {
    const template = emailTemplates.adminBookingAlert(data)
    
    await transporter.sendMail({
      from: `"${defaultFromName}" <${defaultFromEmail}>`,
      to: adminNotificationEmail,
      subject: template.subject,
      html: template.html,
    })
    
    console.log(`Admin booking alert sent for booking ${data.bookingId}`)
  } catch (error) {
    console.error('Failed to send admin booking alert:', error)
    // Don't throw - log error but don't break the flow
  }
}

export async function sendBookingReminder(data: {
  guestName: string
  guestEmail: string
  roomNumber: string
  checkIn: Date
  confirmationCode: string
}) {
  if (!isEmailConfigured || !transporter) {
    console.warn('SMTP not configured - booking reminder not sent to:', data.guestEmail)
    return
  }

  try {
    const template = emailTemplates.bookingReminder(data)
    
    await transporter.sendMail({
      from: `"${defaultFromName}" <${defaultFromEmail}>`,
      to: data.guestEmail,
      subject: template.subject,
      html: template.html,
    })
    
    console.log(`Booking reminder sent to ${data.guestEmail}`)
  } catch (error) {
    console.error('Failed to send booking reminder:', error)
    // Don't throw - log error but don't break the flow
  }
}

// Send booking status update
export async function sendBookingStatusUpdate(data: {
  guestName: string
  guestEmail: string
  bookingId: string
  status: string
  roomNumber: string
  checkIn: Date
  checkOut: Date
}) {
  if (!isEmailConfigured || !transporter) {
    console.warn('SMTP not configured - booking status update not sent to:', data.guestEmail)
    return
  }

  try {
    const template = {
      subject: `Booking Update - ${data.status}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Booking Update</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🏨 Grand Palace Hotel</h1>
                <h2>Booking Update</h2>
              </div>
              <div class="content">
                <p>Dear ${data.guestName},</p>
                <p>Your booking status has been updated to: <strong>${data.status}</strong></p>
                <p>Booking ID: ${data.bookingId}</p>
                <p>Room: ${data.roomNumber}</p>
                <p>Check-in: ${new Date(data.checkIn).toLocaleDateString()}</p>
                <p>Check-out: ${new Date(data.checkOut).toLocaleDateString()}</p>
                <p>If you have any questions, please contact us.</p>
                <p>Best regards,<br>Grand Palace Hotel Team</p>
              </div>
            </div>
          </body>
        </html>
      `,
    }
    
    await transporter.sendMail({
      from: `"${defaultFromName}" <${defaultFromEmail}>`,
      to: data.guestEmail,
      subject: template.subject,
      html: template.html,
    })
    
    console.log(`Booking status update sent to ${data.guestEmail}`)
  } catch (error) {
    console.error('Failed to send booking status update:', error)
    // Don't throw - log error but don't break the flow
  }
}

// Password reset email functions
export async function sendPasswordResetEmail(data: {
  name: string
  email: string
  resetUrl: string
}) {
  if (!isEmailConfigured || !transporter) {
    console.warn('SMTP not configured - password reset email not sent. Reset URL would be:', data.resetUrl)
    console.log('Email would be sent to:', data.email)
    // Return success to prevent email enumeration, but log the attempt
    return
  }

  try {
    const template = emailTemplates.passwordReset(data)
    
    await transporter.sendMail({
      from: `"${defaultFromName}" <${defaultFromEmail}>`,
      to: data.email,
      subject: template.subject,
      html: template.html,
    })
    
    console.log(`Password reset email sent to ${data.email}`)
  } catch (error) {
    console.error('Failed to send password reset email:', error)
    // Don't throw - return gracefully to prevent email enumeration
  }
}

export async function sendPasswordResetConfirmation(data: {
  name: string
  email: string
}) {
  if (!isEmailConfigured || !transporter) {
    console.warn('SMTP not configured - password reset confirmation not sent to:', data.email)
    return
  }

  try {
    const template = emailTemplates.passwordResetConfirmation(data)
    
    await transporter.sendMail({
      from: `"${defaultFromName}" <${defaultFromEmail}>`,
      to: data.email,
      subject: template.subject,
      html: template.html,
    })
    
    console.log(`Password reset confirmation sent to ${data.email}`)
  } catch (error) {
    console.error('Failed to send password reset confirmation:', error)
    // Don't throw - this is a confirmation, not critical
  }
}

// Test email configuration
export async function testEmailConfiguration() {
  if (!isEmailConfigured || !transporter) {
    console.warn('Email configuration not set up - SMTP credentials missing')
    return false
  }

  try {
    await transporter.verify()
    console.log('Email configuration is valid')
    return true
  } catch (error) {
    console.error('Email configuration is invalid:', error)
    return false
  }
}

export async function sendContactEmail(data: {
  name: string
  email: string
  subject: string
  message: string
}) {
  if (!isEmailConfigured || !transporter) {
    console.warn('SMTP not configured - contact email not sent. Message details:')
    console.log('From:', data.name, `<${data.email}>`)
    console.log('Subject:', data.subject)
    console.log('Message:', data.message)
    return
  }

  const recipient =
    process.env.CONTACT_EMAIL ||
    adminNotificationEmail ||
    'info@smarthotel.com'

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>New Contact Form Submission</title>
        <style>
          body { font-family: Arial, sans-serif; color: #1f2937; }
          .container { max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; padding: 24px; }
          .content { padding: 24px; background-color: #f9fafb; }
          .footer { padding: 16px 24px; background-color: #111827; color: #d1d5db; font-size: 12px; text-align: center; }
          .field { margin-bottom: 16px; }
          .label { font-weight: bold; color: #374151; margin-bottom: 4px; display: block; }
          .value { background: #fff; border-radius: 8px; padding: 12px; border: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">New Contact Message</h1>
            <p style="margin: 8px 0 0 0;">SmartHotel Website Contact Form</p>
          </div>
          <div class="content">
            <div class="field">
              <span class="label">From</span>
              <div class="value">
                <strong>${data.name}</strong><br />
                <a href="mailto:${data.email}" style="color: #2563eb;">${data.email}</a>
              </div>
            </div>
            <div class="field">
              <span class="label">Subject</span>
              <div class="value">${data.subject}</div>
            </div>
            <div class="field">
              <span class="label">Message</span>
              <div class="value" style="white-space: pre-wrap;">${data.message}</div>
            </div>
          </div>
          <div class="footer">
            This message was sent from the SmartHotel contact form.
          </div>
        </div>
      </body>
    </html>
  `

  try {
    await transporter.sendMail({
      from: `"${defaultFromName}" <${defaultFromEmail}>`,
      replyTo: data.email,
      to: recipient,
      subject: `[Contact] ${data.subject}`,
      html,
    })

    console.log('Contact email sent:', { to: recipient, subject: `[Contact] ${data.subject}` })
  } catch (error) {
    console.error('Failed to send contact email:', error)
    // Don't throw - log error but don't break the flow
  }
}