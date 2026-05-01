# 🚀 Demo Quick Start - Get Ready in 30 Minutes

**Perfect for customer demos! All services have FREE tiers.**

---

## ⚡ 3-Step Setup

### Step 1: Create Demo Environment (2 minutes)

```bash
npm run setup:demo:credentials
```

This creates `.env.local` with all placeholders ready to fill.

### Step 2: Get Free Test Accounts (20 minutes)

Follow these in order - all are FREE:

#### ✅ Essential Services:

1. **📧 Mailtrap (Email)** - 5 min
   - Go to: https://mailtrap.io
   - Sign up free → Email Testing → Inboxes
   - Copy SMTP credentials → Paste into `.env.local`

2. **💳 Stripe (Payments)** - 5 min
   - Go to: https://stripe.com
   - Sign up free → Developers → API keys (TEST mode)
   - Copy keys → Paste into `.env.local`

3. **🗄️ MongoDB Atlas (Database)** - 10 min
   - Go to: https://www.mongodb.com/cloud/atlas/register
   - Create FREE M0 cluster → Get connection string
   - Paste into `.env.local` → Replace `<password>` with your password

#### 🎯 Recommended (Better Demo):

4. **🔵 Google OAuth** - 10 min
   - Go to: https://console.cloud.google.com
   - Create project → OAuth Client ID
   - Copy credentials → Paste into `.env.local`
   - **Result:** "Sign in with Google" button appears!

### Step 3: Setup & Run (5 minutes)

```bash
# Validate everything
npm run validate:env

# Setup database
npm run db:push

# Seed demo data
npm run db:seed

# Start demo server
npm run dev
```

Visit: **http://localhost:3000** 🎉

---

## 📋 Quick Checklist

Copy this checklist and check off as you complete:

```
ESSENTIAL (Required):
[ ] Mailtrap account created → SMTP credentials added
[ ] Stripe test account created → Test keys added
[ ] MongoDB Atlas cluster created → Connection string added
[ ] NextAuth secret generated (auto-done by script)

RECOMMENDED (Better Demo):
[ ] Google OAuth credentials → "Sign in with Google" works
[ ] Google Maps API key → Map shows on contact page

OPTIONAL (Nice to Have):
[ ] Google Analytics ID → Tracking enabled
[ ] Cloudinary account → Image uploads work
[ ] VAPID keys generated → Push notifications work

VALIDATION:
[ ] npm run validate:env passes
[ ] npm run db:push succeeds
[ ] npm run dev starts without errors
[ ] http://localhost:3000 loads correctly
```

---

## 🎬 Demo Features to Show Customers

### 1. **Payment Flow** 💳
- Use test card: `4242 4242 4242 4242`
- Any future date, any CVC
- Shows complete payment integration

### 2. **Email Notifications** 📧
- Make a booking
- Check Mailtrap inbox (all emails appear there)
- Show professional email templates

### 3. **Social Login** 🔵
- Click "Sign in with Google" (if configured)
- Shows OAuth integration

### 4. **Admin Dashboard** 📊
- Login as admin
- Show booking management
- Show analytics
- Show room management

### 5. **Guest Features** 🏨
- Browse rooms
- Make booking without account (guest checkout)
- View gallery
- Contact page

---

## 🔗 Quick Links

| Service | Link | Time |
|---------|------|------|
| **Mailtrap** | https://mailtrap.io | 5 min |
| **Stripe** | https://stripe.com | 5 min |
| **MongoDB Atlas** | https://www.mongodb.com/cloud/atlas/register | 10 min |
| **Google Cloud** | https://console.cloud.google.com | 10 min |

---

## 📖 Detailed Instructions

For step-by-step instructions with screenshots and troubleshooting:
👉 **See: `DEMO_CREDENTIALS_SETUP.md`**

---

## ✅ Verification

After setup, test each feature:

```bash
# Test database
npm run db:push

# Test email (if SMTP configured)
# Make a booking → Check Mailtrap inbox

# Test Stripe (if configured)
# Use test card: 4242 4242 4242 4242

# Test Google OAuth (if configured)
# Click "Sign in with Google" button

# Start demo
npm run dev
```

---

## 💡 Pro Tips

1. **Mailtrap is perfect for demos** - Shows all emails in web interface
2. **Use Stripe test mode** - Safe, no real charges
3. **MongoDB Atlas free tier** - 512MB is plenty for demos
4. **Test card works everywhere** - `4242 4242 4242 4242`
5. **Google OAuth is impressive** - Easy to set up, big impact

---

## 🆘 Troubleshooting

### Database Connection Error
- Check MongoDB Atlas IP whitelist (allow `0.0.0.0/0` for dev)
- Verify connection string format
- Ensure database user password is correct

### Email Not Sending
- Check Mailtrap credentials
- Verify SMTP settings in `.env.local`
- Check Mailtrap inbox (emails might be there!)

### Stripe Payment Failing
- Ensure you're using **TEST** mode keys (sk_test_...)
- Check test card number is correct
- Verify keys are copied correctly (no spaces)

### Google OAuth Not Working
- Verify redirect URI matches exactly
- Check OAuth consent screen is configured
- Ensure client ID and secret are correct

---

## 🎉 You're Ready!

Once all checkboxes are done, you have a fully functional demo environment!

**Estimated Time:** 30-60 minutes (depending on optional features)

**All services are FREE** - Perfect for demos without any costs!

---

**Need help?** Check `DEMO_CREDENTIALS_SETUP.md` for detailed instructions.

