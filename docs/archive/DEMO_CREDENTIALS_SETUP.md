# 🎬 Demo Credentials Setup - Ready to Show Customers

**This guide will help you set up all credentials needed for a professional customer demo.**

---

## ⚡ Quick Start (5 Minutes)

### Step 1: Create Demo Environment File

Run this command to auto-generate your demo environment:

```bash
npm run setup:demo
```

### Step 2: Get Free Test Accounts

Follow the steps below to get free test credentials for each service. All services have **free tiers** perfect for demos.

### Step 3: Update `.env.local`

Copy and paste the credentials you get from each service into `.env.local`

---

## 🔑 Service Setup Instructions

### 1. 📧 Email Service - Mailtrap (FREE - Best for Demos)

**Why Mailtrap:** Perfect for demos - emails are captured and displayed in a web interface, no real emails sent!

**Steps:**
1. Go to https://mailtrap.io
2. Click "Sign Up Free" (no credit card required)
3. Once logged in, go to **Email Testing → Inboxes**
4. Click on your default inbox
5. Copy the SMTP credentials:

**Update `.env.local` with:**
```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=<your-mailtrap-username>  # Copy from Mailtrap dashboard
SMTP_PASS=<your-mailtrap-password>  # Copy from Mailtrap dashboard
SMTP_FROM_EMAIL=noreply@smarthotel.com
SMTP_FROM_NAME=SmartHotel Demo
```

**Demo Benefit:** All emails appear in Mailtrap's web interface - perfect for showing customers how email notifications work!

---

### 2. 💳 Stripe Payments (FREE Test Mode)

**Why Stripe:** Industry-standard payment processing with generous free test mode.

**Steps:**
1. Go to https://stripe.com
2. Click "Start now" (no credit card required for test mode)
3. Complete quick signup
4. Once logged in, go to **Developers → API keys**
5. Make sure you're in **Test mode** (toggle in top right)
6. Copy your keys:

**Update `.env.local` with:**
```env
STRIPE_SECRET_KEY=sk_test_<your-test-secret-key>     # Starts with sk_test_
STRIPE_PUBLISHABLE_KEY=pk_test_<your-test-publishable-key>  # Starts with pk_test_
STRIPE_WEBHOOK_SECRET=whsec_<your-webhook-secret>   # Optional, for webhooks
```

**Demo Benefit:** Use test card `4242 4242 4242 4242` - works perfectly for demos!

---

### 3. 🗄️ Database - postgresql Atlas (FREE Tier)

**Why postgresql Atlas:** Free tier perfect for demos, no credit card required.

**Steps:**
1. Go to https://www.postgresql.com/cloud/atlas/register
2. Sign up for free
3. Choose **FREE (M0) Shared** cluster
4. Choose any cloud provider and region (closest to you)
5. Create cluster (takes 2-3 minutes)
6. Click **"Connect"** button
7. Choose **"Connect your application"**
8. Copy the connection string
9. Replace `<password>` with your database password
10. Replace `<dbname>` with `smarthotel`

**Update `.env.local` with:**
```env
DATABASE_URL=postgresql://user:pass@host:5432/db
```

**Demo Benefit:** Free tier includes 512MB storage - plenty for demos!

---

### 4. 🔐 NextAuth Secret (Auto-Generated)

**Already handled by setup script!** But if you need to generate manually:

```bash
openssl rand -base64 32
```

**Update `.env.local` with:**
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generated-secret-from-above>
```

---

### 5. 🔵 Google OAuth (Optional - For "Sign in with Google")

**Why:** Impressive demo feature showing social login.

**Steps:**
1. Go to https://console.cloud.google.com
2. Create a new project (or use existing)
3. Go to **APIs & Services → Credentials**
4. Click **"Create Credentials" → OAuth client ID**
5. If prompted, configure OAuth consent screen:
   - User Type: **External** (for testing)
   - App name: **SmartHotel Demo**
   - User support email: Your email
   - Developer contact: Your email
   - Click **Save and Continue** through all steps
6. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: **SmartHotel Demo Client**
   - Authorized redirect URIs: 
     - `http://localhost:3000/api/auth/callback/google`
     - `https://your-demo-domain.vercel.app/api/auth/callback/google` (if deploying)
7. Copy **Client ID** and **Client Secret**

**Update `.env.local` with:**
```env
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-google-client-id>
```

**Demo Benefit:** "Sign in with Google" button appears automatically on login page!

---

### 6. 🗺️ Google Maps (Optional - For Contact Page)

**Why:** Shows hotel location on contact page.

**Steps:**
1. Go to https://console.cloud.google.com
2. Select your project (same as OAuth)
3. Go to **APIs & Services → Library**
4. Search for **"Maps JavaScript API"**
5. Click **Enable**
6. Go to **APIs & Services → Credentials**
7. Click **"Create Credentials" → API Key**
8. Copy the API key

**Update `.env.local` with:**
```env
GOOGLE_MAPS_API_KEY=<your-google-maps-api-key>
```

**Demo Benefit:** Interactive map showing hotel location!

---

### 7. 📊 Google Analytics (Optional - For Tracking)

**Why:** Shows analytics integration.

**Steps:**
1. Go to https://analytics.google.com
2. Sign up (free)
3. Create account and property
4. Get your **Measurement ID** (starts with `G-`)

**Update `.env.local` with:**
```env
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

### 8. 📸 Cloudinary (Optional - For Image Uploads)

**Why:** Dynamic image management for rooms/gallery.

**Steps:**
1. Go to https://cloudinary.com
2. Sign up free
3. Go to **Dashboard**
4. Copy your credentials:

**Update `.env.local` with:**
```env
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
```

---

### 9. 🔔 Push Notifications (Optional - VAPID Keys)

**Why:** Browser push notifications for demos.

**Generate VAPID Keys:**
```bash
npm install -g web-push
web-push generate-vapid-keys
```

Copy the generated keys:

**Update `.env.local` with:**
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public-key-from-above>
VAPID_PRIVATE_KEY=<private-key-from-above>
```

---

## 📋 Complete Demo `.env.local` Template

```env
# ===========================================
# SmartHotel Demo Environment Variables
# ===========================================

# Database (postgresql Atlas)
DATABASE_URL=postgresql://user:pass@host:5432/db

# NextAuth (Auto-generated by setup script)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<auto-generated-by-setup-script>

# Email (Mailtrap - FREE)
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=<your-mailtrap-username>
SMTP_PASS=<your-mailtrap-password>
SMTP_FROM_EMAIL=noreply@smarthotel.com
SMTP_FROM_NAME=SmartHotel Demo
ADMIN_EMAIL=admin@smarthotel.com

# Stripe (Test Mode - FREE)
STRIPE_SECRET_KEY=sk_test_<your-stripe-secret-key>
STRIPE_PUBLISHABLE_KEY=pk_test_<your-stripe-publishable-key>
STRIPE_WEBHOOK_SECRET=whsec_<your-webhook-secret>

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-google-client-id>

# Google Maps (Optional)
GOOGLE_MAPS_API_KEY=<your-google-maps-api-key>

# Google Analytics (Optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Cloudinary (Optional)
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>

# Push Notifications (Optional)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<your-vapid-public-key>
VAPID_PRIVATE_KEY=<your-vapid-private-key>

# Socket.IO
SOCKET_IO_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

---

## 🚀 Demo Setup Checklist

### Essential (Required for Core Demo)
- [ ] Database: postgresql Atlas free tier
- [ ] Email: Mailtrap account (for email notifications)
- [ ] NextAuth: Secret generated
- [ ] Stripe: Test mode keys (for payment demo)

### Recommended (Makes Demo More Impressive)
- [ ] Google OAuth: For "Sign in with Google" button
- [ ] Google Maps: For location display
- [ ] Push Notifications: VAPID keys (for notifications)

### Optional (Nice to Have)
- [ ] Google Analytics: For tracking
- [ ] Cloudinary: For image uploads

---

## 🎯 Quick Demo Script

After setting up all credentials:

```bash
# 1. Validate environment
npm run validate:env

# 2. Setup database
npm run db:push

# 3. Seed demo data (optional but recommended)
npm run db:seed

# 4. Start development server
npm run dev
```

Visit: **http://localhost:3000**

---

## 💡 Demo Tips

### For Customer Presentation:

1. **Test Payment Flow:**
   - Use card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any CVC
   - Any ZIP code

2. **Show Email Notifications:**
   - Make a booking
   - Check Mailtrap inbox (all emails appear there)
   - Show customer the professional email templates

3. **Show Social Login:**
   - Click "Sign in with Google" button
   - Demonstrates OAuth integration

4. **Show Real-time Features:**
   - Open two browser windows
   - Make a booking in one
   - See it appear in real-time in the other (if WebSocket configured)

5. **Show Admin Dashboard:**
   - Login as admin
   - Show booking management
   - Show analytics
   - Show room management

---

## 🔒 Security Notes for Demo

- ✅ All test credentials are safe to use
- ✅ Stripe test mode doesn't process real payments
- ✅ Mailtrap doesn't send real emails
- ✅ postgresql Atlas free tier is isolated
- ⚠️ Never commit `.env.local` to git (already in `.gitignore`)

---

## 📞 Support

If you encounter issues:

1. Run `npm run validate:env` to check configuration
2. Check service dashboards to verify credentials
3. Review error messages in console
4. Verify all environment variables are correctly formatted

---

## ✅ Verification

After setup, test each feature:

```bash
# Test database connection
npm run db:push

# Test email sending (if SMTP configured)
# Make a booking and check Mailtrap inbox

# Test Stripe (if configured)
# Try making a booking with test card

# Test Google OAuth (if configured)
# Click "Sign in with Google" button

# Run app
npm run dev
```

---

**🎉 You're ready for your customer demo!**

All services are free for testing, and the setup takes about 30-60 minutes total. Once configured, you'll have a fully functional demo environment.

