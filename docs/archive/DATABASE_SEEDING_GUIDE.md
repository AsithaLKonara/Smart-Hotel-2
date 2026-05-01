# 🌱 Database Seeding Guide - Production

**Date:** January 2025  
**Purpose:** Seed production database with comprehensive demo data

---

## 📋 Prerequisites

1. **DATABASE_URL** - MongoDB Atlas connection string
2. **Node.js** - v18+ installed
3. **Dependencies** - All npm packages installed

---

## 🚀 Quick Start

### Option 1: Using Environment Variable (Recommended)

```bash
# Set DATABASE_URL
export DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/smarthotel?retryWrites=true&w=majority"

# Generate Prisma client
npx prisma generate

# Run seed script
npm run db:seed:demo
```

### Option 2: Using .env File

```bash
# Create .env file
echo 'DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/smarthotel?retryWrites=true&w=majority"' > .env

# Generate Prisma client
npx prisma generate

# Run seed script
npm run db:seed:demo
```

### Option 3: Using Vercel CLI

```bash
# Link project (if not already linked)
vercel link

# Pull environment variables
vercel env pull .env.local

# Generate Prisma client
npx prisma generate

# Run seed script
npm run db:seed:demo
```

---

## 📊 What Gets Seeded

### Users (10)
- **Admin:** `admin@smarthotel.com` / `admin123` (SUPER_ADMIN)
- **Manager:** `manager@smarthotel.com` / `manager123` (MANAGER)
- **Receptionist:** `receptionist@smarthotel.com` / `receptionist123` (RECEPTIONIST)
- **Guests:** 7 guest accounts with various emails

### Staff (10)
- Front Desk Supervisor
- Chief Concierge
- Executive Chef
- Events Manager
- Spa Director
- Facilities Engineer
- Housekeeping Supervisor
- Security Chief
- Revenue Analyst
- IT Systems Manager

### Rooms (10)
- Deluxe King (101) - $325/night
- Deluxe Twin (102) - $315/night
- Executive Suite (201) - $520/night
- Executive Corner Suite (202) - $560/night
- Presidential Suite (301) - $980/night
- Skyline Suite (302) - $680/night
- Grand Deluxe King (401) - $360/night
- Grand Deluxe Accessible (402) - $340/night
- Junior Suite (501) - $410/night
- Family Suite (502) - $445/night

### Bookings (10)
- Various booking statuses (PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT)
- Different room assignments
- Multiple guests

### Menu Items (12+)
- Breakfast items
- Lunch items
- Dinner items
- Beverages
- Snacks

### Food Orders (10+)
- Various order statuses
- Multiple menu items per order

### Tasks (10+)
- Cleaning tasks
- Maintenance tasks
- Room service tasks
- Concierge tasks

### Inventory Items (12+)
- Various categories
- Stock levels

### Gallery Items (12+)
- Room photos
- Restaurant photos
- Facility photos

---

## ✅ Expected Output

```
🌱 Rebuilding comprehensive SmartHotel demo dataset...
✅ Clearing existing data...
👥 Creating users...
✅ Created 10 users
👔 Creating staff...
✅ Created 10 staff members
🏨 Creating rooms...
✅ Created 10 rooms
📅 Creating bookings...
✅ Created 10 bookings
🍽️ Creating menu items...
✅ Created 12 menu items
🥂 Creating food orders...
✅ Created 10 food orders
🧹 Creating tasks...
✅ Created 10 tasks
📦 Creating inventory items...
✅ Created 12 inventory items
🖼️ Creating gallery items...
✅ Created 12 gallery items

✅ Seeding complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👥 Users: 10
👔 Staff: 10
🏨 Rooms: 10
📅 Bookings: 10
🧹 Tasks: 10
🍽️ Menu Items: 12
🥂 Orders: 10
📦 Inventory Items: 12
🖼️ Gallery Items: 12
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔍 Verification Steps

After seeding, verify the data:

1. **Check Admin Dashboard:**
   - Visit: https://smarthotel-demo.vercel.app/admin/dashboard
   - Sign in: `admin@smarthotel.com` / `admin123`
   - Verify metrics show non-zero values

2. **Check Rooms:**
   - Visit: https://smarthotel-demo.vercel.app/admin/rooms
   - Verify 10 rooms are displayed

3. **Check Bookings:**
   - Visit: https://smarthotel-demo.vercel.app/admin/bookings
   - Verify bookings are displayed

4. **Check Menu:**
   - Visit: https://smarthotel-demo.vercel.app/admin/menu
   - Verify menu items are displayed

5. **Test Authentication:**
   - Test Manager: `manager@smarthotel.com` / `manager123`
   - Test Receptionist: `receptionist@smarthotel.com` / `receptionist123`
   - Test Guest: `emily.carter@example.com` / `guest123`

---

## 🐛 Troubleshooting

### Error: "Environment variable not found: DATABASE_URL"

**Solution:**
- Ensure DATABASE_URL is set in your environment
- Check `.env` file exists and contains DATABASE_URL
- Verify connection string format is correct

### Error: "PrismaClientInitializationError"

**Solution:**
- Verify DATABASE_URL is correct
- Check MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Verify network connectivity

### Error: "Transform failed"

**Solution:**
- Run `npx prisma generate` first
- Ensure all dependencies are installed: `npm install`
- Check TypeScript version compatibility

### Error: "Cannot connect to database"

**Solution:**
- Verify MongoDB Atlas cluster is running
- Check connection string credentials
- Verify network firewall settings

---

## 🔒 Security Notes

1. **Never commit DATABASE_URL** to version control
2. **Use environment variables** for sensitive data
3. **Restrict database access** to necessary IPs only
4. **Use strong passwords** for database users
5. **Enable MongoDB Atlas authentication** and encryption

---

## 📝 Next Steps After Seeding

1. ✅ Verify data in production
2. ✅ Test all user roles
3. ✅ Test CRUD operations
4. ✅ Test end-to-end flows
5. ✅ Verify analytics display correctly

---

**Last Updated:** January 2025  
**Status:** Ready for execution

