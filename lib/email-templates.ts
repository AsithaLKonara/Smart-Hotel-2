import { hotelData } from './hotel-data'

export interface BookingEmailData {
  guestName: string
  guestEmail: string
  bookingId: string
  confirmationCode: string
  roomType: string
  checkIn: string
  checkOut: string
  guests: number
  totalAmount: number
  paymentStatus: string
}

export function getBookingConfirmationEmail(data: BookingEmailData): { subject: string; html: string } {
  const { 
    guestName, 
    bookingId, 
    confirmationCode, 
    roomType, 
    checkIn, 
    checkOut, 
    guests,
    totalAmount,
    paymentStatus
  } = data

  const subject = `Booking Confirmed - ${confirmationCode}`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmation</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Grand Palace Hotel</h1>
          <p style="color: white; margin: 10px 0 0 0;">Luxury 5-Star Accommodation</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 40px 20px; border: 1px solid #e0e0e0; border-top: none;">
          <h2 style="color: #f59e0b; margin-top: 0;">Booking Confirmation</h2>
          
          <p>Dear ${guestName},</p>
          
          <p>Thank you for choosing Grand Palace Hotel. Your reservation has been confirmed and we look forward to welcoming you!</p>
          
          <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="margin-top: 0; color: #333;">Booking Details</h3>
            <p><strong>Confirmation Code:</strong> <span style="color: #f59e0b; font-size: 18px; font-weight: bold;">${confirmationCode}</span></p>
            <p><strong>Booking ID:</strong> ${bookingId}</p>
            <p><strong>Room Type:</strong> ${roomType}</p>
            <p><strong>Check-in:</strong> ${new Date(checkIn).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><strong>Check-out:</strong> ${new Date(checkOut).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><strong>Guests:</strong> ${guests}</p>
            <p><strong>Total Amount:</strong> $${totalAmount.toFixed(2)}</p>
            <p><strong>Payment Status:</strong> ${paymentStatus}</p>
          </div>
          
          <div style="background: #fff3cd; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Important Information:</strong></p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px;">
              <li>Check-in time: 3:00 PM</li>
              <li>Check-out time: 11:00 AM</li>
              <li>Valid government-issued photo ID required</li>
              <li>Please keep this confirmation code for your records</li>
            </ul>
          </div>
          
          <p>If you have any questions or need to modify your reservation, please contact us:</p>
          
          <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: left;">
            <p style="margin: 5px 0;"><strong>Phone:</strong> ${hotelData.hotel.contact.phone}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${hotelData.hotel.contact.email}</p>
            <p style="margin: 5px 0;"><strong>Address:</strong> ${hotelData.hotel.contact.address}</p>
          </div>
          
          <p>We look forward to hosting you at Grand Palace Hotel!</p>
          
          <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>Grand Palace Hotel Team</strong>
          </p>
        </div>
        
        <div style="background: #333; color: #fff; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Grand Palace Hotel. All rights reserved.</p>
        </div>
      </body>
    </html>
  `

  return { subject, html }
}

export function getWelcomeEmail(data: { guestName: string; checkIn: string }): { subject: string; html: string } {
  const subject = `Welcome to Grand Palace Hotel`
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Grand Palace Hotel!</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 40px 20px; border: 1px solid #e0e0e0; border-top: none;">
          <p>Dear ${data.guestName},</p>
          
          <p>We are delighted to welcome you to Grand Palace Hotel!</p>
          
          <p>Your upcoming stay begins on <strong>${new Date(data.checkIn).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>.</p>
          
          <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="color: #f59e0b; margin-top: 0;">What to Expect:</h3>
            <ul>
              <li>Luxurious accommodations with premium amenities</li>
              <li>24/7 concierge service</li>
              <li>Award-winning dining at our restaurant</li>
              <li>State-of-the-art fitness center</li>
              <li>Rooftop pool with stunning city views</li>
              <li>Spa & wellness center</li>
            </ul>
          </div>
          
          <p>If you need any assistance before your arrival, our concierge team is ready to help.</p>
          
          <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>Grand Palace Hotel Team</strong>
          </p>
        </div>
        
        <div style="background: #333; color: #fff; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Grand Palace Hotel. All rights reserved.</p>
        </div>
      </body>
    </html>
  `

  return { subject, html }
}

export function getCheckInReminderEmail(data: { guestName: string; checkIn: string }): { subject: string; html: string } {
  const subject = `Reminder: Check-in Tomorrow - Grand Palace Hotel`
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Check-in Reminder</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Check-in Reminder</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 40px 20px; border: 1px solid #e0e0e0; border-top: none;">
          <p>Dear ${data.guestName},</p>
          
          <p>We're excited to welcome you to Grand Palace Hotel tomorrow at 3:00 PM!</p>
          
          <div style="background: #fff3cd; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Your Check-in:</strong></p>
            <p style="margin: 10px 0 0 0; font-size: 18px;"><strong>${new Date(data.checkIn).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at 3:00 PM</strong></p>
          </div>
          
          <p><strong>What to bring:</strong></p>
          <ul>
            <li>Valid government-issued photo ID</li>
            <li>Confirmation code or booking reference</li>
            <li>Credit card for incidental charges</li>
          </ul>
          
          <p>If you have any questions, please don't hesitate to contact us.</p>
          
          <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>Grand Palace Hotel Team</strong>
          </p>
        </div>
        
        <div style="background: #333; color: #fff; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Grand Palace Hotel. All rights reserved.</p>
        </div>
      </body>
    </html>
  `

  return { subject, html }
}

export function getCheckOutReminderEmail(data: { guestName: string; checkOut: string }): { subject: string; html: string } {
  const subject = `Check-out Reminder - Grand Palace Hotel`
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Check-out Reminder</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Check-out Reminder</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 40px 20px; border: 1px solid #e0e0e0; border-top: none;">
          <p>Dear ${data.guestName},</p>
          
          <p>We hope you've enjoyed your stay at Grand Palace Hotel!</p>
          
          <div style="background: #fff3cd; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Your Check-out:</strong></p>
            <p style="margin: 10px 0 0 0; font-size: 18px;"><strong>${new Date(data.checkOut).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at 11:00 AM</strong></p>
          </div>
          
          <p><strong>Check-out process:</strong></p>
          <ul>
            <li>Please return your room keys to the front desk</li>
            <li>Any incidental charges will be processed</li>
            <li>We can arrange luggage storage if needed</li>
            <li>Airport transfer can be arranged</li>
          </ul>
          
          <p>Thank you for choosing Grand Palace Hotel. We look forward to welcoming you back!</p>
          
          <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>Grand Palace Hotel Team</strong>
          </p>
        </div>
        
        <div style="background: #333; color: #fff; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Grand Palace Hotel. All rights reserved.</p>
        </div>
      </body>
    </html>
  `

  return { subject, html }
}

export function getNewsletterEmail(data: { guestName: string; offers: string[] }): { subject: string; html: string } {
  const subject = `Exclusive Offers - Grand Palace Hotel`
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Newsletter</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Exclusive Offers</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 40px 20px; border: 1px solid #e0e0e0; border-top: none;">
          <p>Dear ${data.guestName},</p>
          
          <p>As a valued guest, we're excited to share these exclusive offers with you:</p>
          
          ${data.offers.map(offer => `
            <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; font-weight: bold; color: #f59e0b;">${offer}</p>
            </div>
          `).join('')}
          
          <div style="background: #fff3cd; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Book now and save!</strong></p>
            <p style="margin: 10px 0 0 0;">Contact our reservations team to redeem these exclusive offers.</p>
          </div>
          
          <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>Grand Palace Hotel Team</strong>
          </p>
        </div>
        
        <div style="background: #333; color: #fff; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Grand Palace Hotel. All rights reserved.</p>
        </div>
      </body>
    </html>
  `

  return { subject, html }
}

export function getAdminBookingAlertEmail(data: BookingEmailData): { subject: string; html: string } {
  const subject = `New Booking Alert - ${data.confirmationCode}`
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Booking Alert</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">New Booking Alert</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 40px 20px; border: 1px solid #e0e0e0; border-top: none;">
          <h2 style="color: #dc2626; margin-top: 0;">Booking Details</h2>
          
          <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p><strong>Guest:</strong> ${data.guestName}</p>
            <p><strong>Email:</strong> ${data.guestEmail}</p>
            <p><strong>Confirmation Code:</strong> <span style="color: #dc2626; font-size: 18px; font-weight: bold;">${data.confirmationCode}</span></p>
            <p><strong>Booking ID:</strong> ${data.bookingId}</p>
            <p><strong>Room Type:</strong> ${data.roomType}</p>
            <p><strong>Check-in:</strong> ${new Date(data.checkIn).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><strong>Check-out:</strong> ${new Date(data.checkOut).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><strong>Guests:</strong> ${data.guests}</p>
            <p><strong>Total Amount:</strong> $${data.totalAmount.toFixed(2)}</p>
            <p><strong>Payment Status:</strong> ${data.paymentStatus}</p>
          </div>
          
          <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Action Required:</strong></p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px;">
              <li>Prepare room for guest arrival</li>
              <li>Confirm special requests if any</li>
              <li>Prepare welcome amenities</li>
              <li>Update housekeeping schedule</li>
            </ul>
          </div>
          
          <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>SmartHotel System</strong>
          </p>
        </div>
        
        <div style="background: #333; color: #fff; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Grand Palace Hotel. All rights reserved.</p>
        </div>
      </body>
    </html>
  `

  return { subject, html }
}


