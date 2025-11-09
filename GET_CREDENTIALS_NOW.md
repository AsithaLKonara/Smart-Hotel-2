# 🎯 Get All Demo Credentials - Step-by-Step Guide

**I'll guide you through getting all credentials in the right order.**

---

## ⚡ Quick Summary

You need to manually sign up for these services (they're all FREE):
1. **Mailtrap** (5 min) - Email testing
2. **Stripe** (5 min) - Payment processing (test mode)
3. **MongoDB Atlas** (10 min) - Database
4. **Google Cloud** (10 min, optional) - OAuth/Maps

**Total Time: ~30 minutes**

---

## 📧 Step 1: Mailtrap (Email Testing)

### Why Mailtrap?
- Perfect for demos - emails appear in web interface
- FREE tier available
- No real emails sent

### Steps:
1. Go to: **https://mailtrap.io**
2. Click **"Sign Up"** (top right)
3. Choose: **"Sign up with Email"**
4. Enter your email and password
5. Verify your email (check inbox)
6. Once logged in:
   - Click **"Email Testing"** in left sidebar
   - Click **"Inboxes"**
   - Click on your default inbox (or create new one)
   - Find **"SMTP Settings"** section
   - Copy these values:

### Copy These to `.env.local`:
```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=<copy-username-from-mailtrap>
SMTP_PASS=<copy-password-from-mailtrap>
```

✅ **Done!** All emails will appear in Mailtrap's web interface.

---

## 💳 Step 2: Stripe (Payment Processing)

### Why Stripe?
- Industry standard
- FREE test mode (no credit card required)
- Perfect for demos

### Steps:
1. Go to: **https://stripe.com**
2. Click **"Start now"** or **"Sign up"**
3. Enter your email and create account
4. Complete basic setup (company name, etc.)
5. Once in dashboard:
   - Make sure you're in **TEST mode** (toggle in top right - should say "Test mode")
   - Go to **Developers** → **API keys**
   - You'll see:
     - **Publishable key** (starts with `pk_test_...`)
     - **Secret key** (starts with `sk_test_...`) - click "Reveal test key"

### Copy These to `.env.local`:
```env
STRIPE_SECRET_KEY=sk_test_<your-secret-key>
STRIPE_PUBLISHABLE_KEY=pk_test_<your-publishable-key>
```

✅ **Done!** Use test card: `4242 4242 4242 4242` for demos.

---

## 🗄️ Step 3: MongoDB Atlas (Database)

### Why MongoDB Atlas?
- FREE tier (512MB)
- Managed database
- Perfect for demos

### Steps:
1. Go to: **https://www.mongodb.com/cloud/atlas/register**
2. Click **"Try Free"**
3. Sign up with email or Google
4. Choose **"Free" (M0) Shared** cluster
5. Select:
   - Cloud provider: Any (AWS, Google Cloud, Azure)
   - Region: Closest to you
6. Click **"Create"** (takes 2-3 minutes)
7. Set up security:
   - **Database Access**: Create user
     - Username: `smarthotel_admin` (or any name)
     - Password: Generate secure password (save it!)
     - Database User Privileges: **Atlas admin**
   - **Network Access**: Add IP
     - Click **"Add IP Address"**
     - Click **"Allow Access from Anywhere"** (for development)
     - Or add `0.0.0.0/0`
8. Get connection string:
   - Click **"Connect"** on your cluster
   - Choose **"Connect your application"**
   - Driver: **Node.js**
   - Version: **5.5 or later**
   - Copy the connection string (looks like: `mongodb+srv://...`)

### Copy This to `.env.local`:
```env
DATABASE_URL=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/smarthotel?retryWrites=true&w=majority
```

**Important:** Replace:
- `<username>` with your MongoDB username
- `<password>` with your MongoDB password
- `cluster0.xxxxx` is already in the string (don't change)
- Add `/smarthotel` before the `?` to specify database name

✅ **Done!** Your database is ready.

---

## 🔵 Step 4: Google OAuth (Optional - For "Sign in with Google")

### Why Google OAuth?
- Impressive demo feature
- One-click sign-in
- FREE

### Steps:
1. Go to: **https://console.cloud.google.com**
2. Click **"Select a project"** → **"New Project"**
3. Project name: `SmartHotel Demo`
4. Click **"Create"**
5. Wait for project to be created, then select it
6. Configure OAuth consent screen:
   - Go to **APIs & Services** → **OAuth consent screen**
   - User Type: **External** (for testing)
   - Click **"Create"**
   - Fill in:
     - App name: `SmartHotel Demo`
     - User support email: Your email
     - Developer contact: Your email
   - Click **"Save and Continue"**
   - Scopes: Click **"Add or Remove Scopes"** → Select:
     - `userinfo.email`
     - `userinfo.profile`
     - `openid`
   - Click **"Update"** → **"Save and Continue"**
   - Test users: Add your email (optional for now)
   - Click **"Save and Continue"** → **"Back to Dashboard"**
7. Create OAuth credentials:
   - Go to **APIs & Services** → **Credentials**
   - Click **"Create Credentials"** → **"OAuth client ID"**
   - Application type: **Web application**
   - Name: `SmartHotel Web Client`
   - Authorized redirect URIs: Click **"Add URI"**
     - Add: `http://localhost:3000/api/auth/callback/google`
     - (Add production URL later if needed)
   - Click **"Create"**
   - Copy **Client ID** and **Client Secret**

### Copy These to `.env.local`:
```env
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<same-client-id>
```

✅ **Done!** "Sign in with Google" button will appear automatically.

---

## 🗺️ Step 5: Google Maps (Optional)

### Steps (Continue in same Google Cloud project):
1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for: **"Maps JavaScript API"**
3. Click on it → Click **"Enable"**
4. Go to **APIs & Services** → **Credentials**
5. Click **"Create Credentials"** → **"API Key"**
6. Copy the API key
7. (Optional) Click on the API key to restrict it:
   - Application restrictions: **HTTP referrers**
   - Add: `http://localhost:3000/*`
   - API restrictions: **Restrict key** → Select **"Maps JavaScript API"**
   - Click **"Save"**

### Copy This to `.env.local`:
```env
GOOGLE_MAPS_API_KEY=<your-api-key>
```

✅ **Done!** Map will show on contact page.

---

## ✅ Final Checklist

After getting all credentials:

```bash
# 1. Update .env.local with all credentials above

# 2. Validate environment
npm run validate:env

# 3. Setup database
npm run db:push

# 4. Seed demo data
npm run db:seed

# 5. Start demo server
npm run dev
```

---

## 🎬 Demo Login Credentials

After seeding database, use these to login:

```
👑 Super Admin:
   Email: admin@smarthotel.com
   Password: admin123

👨‍💼 Manager:
   Email: manager@smarthotel.com
   Password: manager123

👩‍💼 Receptionist:
   Email: receptionist@smarthotel.com
   Password: receptionist123

👤 Guest:
   Email: guest@example.com
   Password: guest123
```

---

## 💡 Pro Tips

1. **Mailtrap** - Perfect for showing customers email notifications
2. **Stripe** - Use test card `4242 4242 4242 4242` for demos
3. **MongoDB Atlas** - Free tier is enough for demos
4. **Google OAuth** - Makes demo more impressive
5. Keep all credentials secure - never commit `.env.local` to git

---

## 🆘 Troubleshooting

### Mailtrap emails not sending?
- Check SMTP credentials are correct
- Verify emails appear in Mailtrap inbox (they might be there!)

### Stripe payment failing?
- Ensure you're using TEST mode keys (sk_test_...)
- Check test card number is correct: `4242 4242 4242 4242`

### MongoDB connection error?
- Check IP is whitelisted (allow `0.0.0.0/0` for development)
- Verify username/password in connection string
- Ensure cluster is running (green status)

### Google OAuth not working?
- Verify redirect URI matches exactly
- Check OAuth consent screen is published (or add test user)
- Ensure client ID and secret are correct

---

**🎉 Once all credentials are in `.env.local`, you're ready for your demo!**

Run `npm run dev` and visit **http://localhost:3000**

