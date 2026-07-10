# 🌱 Seed Production Database - Quick Guide

**Date:** January 2025  
**Vercel Project:** https://vercel.com/asithalkonaras-projects/smarthotel-demo

---

## 🎯 Quick Steps

Since DATABASE_URL is already configured on Vercel, you can seed the database in two ways:

### Option 1: Get DATABASE_URL from Vercel and Run Locally (Recommended)

1. **Get DATABASE_URL from Vercel:**
   - Go to: https://vercel.com/asithalkonaras-projects/smarthotel-demo
   - Click **Settings** → **Environment Variables**
   - Copy the `DATABASE_URL` value

2. **Run seed script:**
   ```bash
   DATABASE_URL="your-connection-string-here" npm run db:seed:demo
   ```

   Or use the helper script:
   ```bash
   DATABASE_URL="your-connection-string-here" ./scripts/seed-with-env.sh
   ```

### Option 2: Link Vercel Project and Pull Environment Variables

```bash
# Link project
vercel link

# Pull environment variables
vercel env pull .env.local

# Run seed script
npm run db:seed:demo
```

---

## ✅ What Will Be Seeded

- **10 Users** (Admin, Manager, Receptionist, 7 Guests)
- **10 Staff Members**
- **10 Rooms** (various types)
- **10 Bookings** (various statuses)
- **12+ Menu Items**
- **10+ Food Orders**
- **10+ Tasks**
- **12+ Inventory Items**
- **12+ Gallery Items**

---

## 🔍 After Seeding - Verification

1. **Check Admin Dashboard:**
   - Visit: https://smarthotel-demo.vercel.app/admin/dashboard
   - Sign in: `admin@smarthotel.com` / `admin123`
   - Verify metrics show non-zero values

2. **Test All Dashboards:**
   - Admin Rooms - Should show 10 rooms
   - Admin Bookings - Should show bookings
   - Admin Staff - Should show staff members
   - Admin Menu - Should show menu items
   - Kitchen Dashboard - Should show orders

3. **Test Authentication:**
   - Manager: `manager@smarthotel.com` / `manager123`
   - Receptionist: `receptionist@smarthotel.com` / `receptionist123`
   - Guest: `emily.carter@example.com` / `guest123`

---

## 🐛 If Seeding Fails

### Error: "Environment variable not found: DATABASE_URL"
- Make sure you're passing DATABASE_URL correctly
- Check the connection string format

### Error: "Can't reach database server"
- Check postgresql Atlas Network Access (should include `0.0.0.0/0`)
- Verify connection string is correct
- Check postgresql Atlas cluster is running

### Error: "Authentication failed"
- Verify database user credentials in connection string
- Check user has read/write permissions

---

**Ready to seed!** Get your DATABASE_URL from Vercel and run the seed script.

