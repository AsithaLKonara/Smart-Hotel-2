import nodemailer from 'nodemailer'

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

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
}

// Email sending functions
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
  try {
    const template = emailTemplates.bookingConfirmation(data)
    
    await transporter.sendMail({
      from: `"Grand Palace Hotel" <${process.env.SMTP_USER}>`,
      to: data.guestEmail,
      subject: template.subject,
      html: template.html,
    })
    
    console.log(`Booking confirmation email sent to ${data.guestEmail}`)
  } catch (error) {
    console.error('Failed to send booking confirmation email:', error)
    throw error
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
  try {
    const template = emailTemplates.adminBookingAlert(data)
    
    await transporter.sendMail({
      from: `"Grand Palace Hotel" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL || 'admin@grandpalacehotel.com',
      subject: template.subject,
      html: template.html,
    })
    
    console.log(`Admin booking alert sent for booking ${data.bookingId}`)
  } catch (error) {
    console.error('Failed to send admin booking alert:', error)
    throw error
  }
}

export async function sendBookingReminder(data: {
  guestName: string
  guestEmail: string
  roomNumber: string
  checkIn: Date
  confirmationCode: string
}) {
  try {
    const template = emailTemplates.bookingReminder(data)
    
    await transporter.sendMail({
      from: `"Grand Palace Hotel" <${process.env.SMTP_USER}>`,
      to: data.guestEmail,
      subject: template.subject,
      html: template.html,
    })
    
    console.log(`Booking reminder sent to ${data.guestEmail}`)
  } catch (error) {
    console.error('Failed to send booking reminder:', error)
    throw error
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
      from: `"Grand Palace Hotel" <${process.env.SMTP_USER}>`,
      to: data.guestEmail,
      subject: template.subject,
      html: template.html,
    })
    
    console.log(`Booking status update sent to ${data.guestEmail}`)
  } catch (error) {
    console.error('Failed to send booking status update:', error)
    throw error
  }
}

// Test email configuration
export async function testEmailConfiguration() {
  try {
    await transporter.verify()
    console.log('Email configuration is valid')
    return true
  } catch (error) {
    console.error('Email configuration is invalid:', error)
    return false
  }
}