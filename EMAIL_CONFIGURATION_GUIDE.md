# 📧 Email Service Configuration Guide

## Overview
This guide will help you configure email services for SmartHotel to send booking confirmations, notifications, and other automated emails.

---

## Option 1: Gmail/Google Workspace (Recommended for Development)

### Step 1: Enable App Password

1. Go to your Google Account settings
2. Navigate to **Security** → **2-Step Verification**
3. Scroll down to **App passwords**
4. Create a new app password for "Mail"
5. Copy the generated 16-character password

### Step 2: Update Environment Variables

Add to your `.env` file:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
ADMIN_EMAIL=admin@smarthotel.com
```

---

## Option 2: SendGrid (Recommended for Production)

### Step 1: Create SendGrid Account

1. Sign up at https://sendgrid.com
2. Verify your account and sender identity
3. Create an API key with "Mail Send" permissions

### Step 2: Update Environment Variables

```bash
SENDGRID_API_KEY=SG.your-api-key-here
ADMIN_EMAIL=noreply@smarthotel.com
```

### Step 3: Update Email Service Code

Create `lib/email-sendgrid.ts`:

```typescript
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export async function sendEmail({
  to,
  subject,
  html,
  from = process.env.ADMIN_EMAIL!
}: {
  to: string
  subject: string
  html: string
  from?: string
}) {
  try {
    await sgMail.send({
      to,
      from,
      subject,
      html
    })
    return { success: true }
  } catch (error) {
    console.error('SendGrid error:', error)
    return { success: false, error }
  }
}
```

---

## Option 3: AWS SES (Enterprise Solution)

### Step 1: Setup AWS SES

1. Go to AWS SES Console
2. Verify your domain or email address
3. Request production access (starts in sandbox mode)
4. Create SMTP credentials

### Step 2: Update Environment Variables

```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-aws-smtp-username
SMTP_PASS=your-aws-smtp-password
ADMIN_EMAIL=noreply@smarthotel.com
```

---

## Email Templates

### Booking Confirmation Template

Create `lib/email-templates.ts`:

```typescript
export const bookingConfirmationEmail = ({
  guestName,
  roomType,
  roomNumber,
  checkIn,
  checkOut,
  totalAmount,
  confirmationCode
}: any) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
              color: white; padding: 30px; text-align: center; }
    .content { background: #f9fafb; padding: 30px; }
    .booking-details { background: white; padding: 20px; border-radius: 8px; 
                       margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Booking Confirmed!</h1>
      <p>Thank you for choosing SmartHotel</p>
    </div>
    
    <div class="content">
      <h2>Dear ${guestName},</h2>
      <p>We're excited to confirm your reservation at SmartHotel!</p>
      
      <div class="booking-details">
        <h3>Booking Details</h3>
        <p><strong>Confirmation Code:</strong> ${confirmationCode}</p>
        <p><strong>Room:</strong> ${roomType} - Room ${roomNumber}</p>
        <p><strong>Check-in:</strong> ${checkIn}</p>
        <p><strong>Check-out:</strong> ${checkOut}</p>
        <p><strong>Total Amount:</strong> $${totalAmount}</p>
      </div>
      
      <p><strong>Check-in time:</strong> 3:00 PM<br>
         <strong>Check-out time:</strong> 11:00 AM</p>
      
      <p>If you have any questions, please contact us at +1 (800) 555-HOTEL</p>
    </div>
    
    <div class="footer">
      <p>SmartHotel | 123 Grand Boulevard, City Center<br>
         © 2025 SmartHotel. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`
```

---

## Implementation in Booking Flow

Update your booking API to send emails:

```typescript
// In app/api/bookings/route.ts
import { sendEmail } from '@/lib/email'
import { bookingConfirmationEmail } from '@/lib/email-templates'

export async function POST(request: Request) {
  // ... create booking logic ...
  
  // Send confirmation email
  await sendEmail({
    to: booking.user.email,
    subject: `Booking Confirmation - ${booking.confirmationCode}`,
    html: bookingConfirmationEmail({
      guestName: booking.user.name,
      roomType: booking.room.type,
      roomNumber: booking.room.number,
      checkIn: formatDate(booking.checkIn),
      checkOut: formatDate(booking.checkOut),
      totalAmount: booking.totalAmount,
      confirmationCode: booking.confirmationCode
    })
  })
  
  return NextResponse.json(booking)
}
```

---

## Testing

### Test Email Configuration

Create `scripts/test-email.js`:

```javascript
const nodemailer = require('nodemailer')

async function testEmail() {
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  })

  try {
    const info = await transporter.sendMail({
      from: process.env.ADMIN_EMAIL,
      to: 'your-test-email@example.com',
      subject: 'SmartHotel Email Test',
      html: '<h1>Email is working!</h1><p>Your email configuration is correct.</p>'
    })
    
    console.log('✅ Email sent successfully!')
    console.log('Message ID:', info.messageId)
  } catch (error) {
    console.error('❌ Email failed:', error)
  }
}

testEmail()
```

Run: `node scripts/test-email.js`

---

## Email Types to Implement

1. **Booking Confirmation** - When reservation is made
2. **Check-in Reminder** - 24 hours before arrival
3. **Check-out Reminder** - Morning of check-out
4. **Booking Cancellation** - When booking is cancelled
5. **Password Reset** - Forgot password flow
6. **Welcome Email** - New user registration
7. **Order Confirmation** - Food orders
8. **Payment Receipt** - Payment confirmations

---

## Best Practices

1. **Use Templates** - Create reusable email templates
2. **Test Before Production** - Always test emails in development
3. **Handle Failures** - Log email failures for debugging
4. **Queue Emails** - For high volume, use a queue system
5. **Unsubscribe Links** - Include for marketing emails
6. **Responsive Design** - Ensure emails look good on mobile
7. **Plain Text Fallback** - Include plain text version

---

## Troubleshooting

**Problem:** "Authentication failed"
- **Solution:** Check SMTP credentials, enable "Less secure apps" or use app password

**Problem:** "Connection timeout"
- **Solution:** Check firewall, verify SMTP port is correct

**Problem:** Emails going to spam
- **Solution:** Setup SPF, DKIM, and DMARC records for your domain

**Problem:** Rate limits exceeded
- **Solution:** Upgrade to paid plan or implement email queuing

---

## Production Checklist

- [ ] Configure production email service
- [ ] Verify sender domain
- [ ] Setup SPF/DKIM records
- [ ] Test all email templates
- [ ] Implement error handling
- [ ] Setup email logging
- [ ] Configure bounce handling
- [ ] Add unsubscribe functionality

---

**Status:** Configuration guide complete. Update `.env` file with your chosen service credentials.









