# 🚀 SmartHotel Demo Environment Setup Guide

This guide will help you set up environment variables for running SmartHotel in demo/development mode.

## Quick Start

### Option 1: Automatic Setup (Recommended)

Run the automated setup script:

```bash
node scripts/setup-demo-env.js
```

This will:
- Create `.env.local` with demo-friendly default values
- Auto-generate a secure `NEXTAUTH_SECRET`
- Provide step-by-step instructions

### Option 2: Manual Setup

1. Copy the example file:
```bash
cp .env.example .env.local
```

2. Update `.env.local` with your actual values (see sections below)

## Required Environment Variables

### 1. Database (MongoDB)

**Option A: MongoDB Atlas (Recommended for Demo)**

1. Sign up for free tier: https://www.mongodb.com/cloud/atlas/register
2. Create a new cluster (free tier available)
3. Create a database user
4. Get connection string and update `DATABASE_URL`

**Option B: Local MongoDB**

```bash
# Install MongoDB locally (macOS)
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Use local connection string
DATABASE_URL=mongodb://localhost:27017/smarthotel
```

### 2. NextAuth (Authentication)

```bash
# Generate a secure secret (32+ characters)
openssl rand -base64 32
```

Add to `.env.local`:
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generated-secret>
```

### 3. Stripe (Payments - Test Mode)

1. Sign up for Stripe: https://stripe.com
2. Go to Developers → API keys
3. Copy **Test mode** keys (sk_test_... and pk_test_...)
4. Add to `.env.local`:

```
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

⚠️ **Important**: Use TEST keys for development, not live keys!

### 4. Email (SMTP)

**Option A: Mailtrap (Recommended for Testing)**

1. Sign up for free tier: https://mailtrap.io
2. Go to Email Testing → Inboxes
3. Copy SMTP credentials
4. Add to `.env.local`:

```
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-username
SMTP_PASS=your-mailtrap-password
SMTP_FROM_EMAIL=noreply@smarthotel.com
SMTP_FROM_NAME=SmartHotel
```

**Option B: Gmail (For Testing)**

1. Enable 2-factor authentication on Gmail
2. Generate app-specific password: https://myaccount.google.com/apppasswords
3. Add to `.env.local`:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
```

**Option C: SendGrid (Alternative)**

1. Sign up: https://sendgrid.com (free tier available)
2. Get API key from dashboard
3. Add to `.env.local`:

```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### 5. Socket.IO (Real-time Features - Optional)

Defaults to `NEXTAUTH_URL` if not set:

```
SOCKET_IO_URL=http://localhost:3000
```

## Complete .env.local Example

```env
# Database
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/smarthotel?retryWrites=true&w=majority

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-generated-secret-here-minimum-32-characters

# Stripe (Test Mode)
STRIPE_SECRET_KEY=sk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz
STRIPE_PUBLISHABLE_KEY=pk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef

# Email (Mailtrap)
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-username
SMTP_PASS=your-mailtrap-password
SMTP_FROM_EMAIL=noreply@smarthotel.com
SMTP_FROM_NAME=SmartHotel

# Socket.IO
SOCKET_IO_URL=http://localhost:3000

# Node Environment
NODE_ENV=development
```

## Verification

After setting up, verify your configuration:

```bash
# Check environment variables are loaded
npm run type-check

# Test database connection
node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.\$connect().then(() => console.log('✅ Database connected')).catch(e => console.error('❌ Database error:', e.message))"

# Run the app
npm run dev
```

## Troubleshooting

### Database Connection Errors
- Ensure MongoDB is running (if local)
- Verify connection string format
- Check network access (for Atlas)

### Stripe Errors
- Ensure you're using **test mode** keys (sk_test_... / pk_test_...)
- Verify keys are correct (no spaces/typos)

### Email Errors
- Check SMTP credentials
- For Gmail: Ensure app-specific password is used (not regular password)
- Check firewall/network restrictions

### NextAuth Errors
- Ensure `NEXTAUTH_SECRET` is at least 32 characters
- Verify `NEXTAUTH_URL` matches your local URL

## Security Notes

⚠️ **Important**:
- Never commit `.env.local` to git (it's in `.gitignore`)
- Use test/demo credentials for development
- Use production credentials only in production environment
- Keep secrets secure and rotate regularly

## Next Steps

1. ✅ Set up environment variables (this guide)
2. ✅ Run database migrations: `npm run db:push`
3. ✅ Seed demo data: `npm run db:seed:demo` (if available)
4. ✅ Start development server: `npm run dev`
5. ✅ Visit http://localhost:3000

## Support

For issues:
- Check the main README.md
- Review error messages in console
- Verify all environment variables are set correctly


