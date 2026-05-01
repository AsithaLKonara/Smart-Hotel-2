# 🚀 Apply Database Indexes to Production

**Quick Guide for Production Database Index Application**

---

## ✅ Prerequisites

1. **DATABASE_URL** from your Vercel project
2. **MongoDB Atlas** access with write permissions
3. **Network access** configured in MongoDB Atlas

---

## 🎯 Method 1: Using Vercel Environment Variables (Recommended)

### Step 1: Get DATABASE_URL from Vercel

**Option A: Vercel Dashboard**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `smarthotel-demo` (or your project name)
3. Go to **Settings** > **Environment Variables**
4. Find `DATABASE_URL` and copy the value

**Option B: Vercel CLI**
```bash
# Login to Vercel (if not already)
vercel login

# Link project (if needed)
vercel link

# Pull environment variables
vercel env pull .env.production

# DATABASE_URL will be in .env.production
cat .env.production | grep DATABASE_URL
```

### Step 2: Apply Indexes

```bash
# Set DATABASE_URL and apply
export DATABASE_URL="your-mongodb-connection-string"
npm run db:apply-indexes:simple
```

Or use the interactive script:
```bash
npm run db:apply-indexes:simple
# It will prompt you for DATABASE_URL if not set
```

---

## 🎯 Method 2: Direct Application

### Step 1: Set DATABASE_URL

```bash
export DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/smarthotel?retryWrites=true&w=majority"
```

### Step 2: Apply Indexes

```bash
# Generate Prisma Client
npx prisma generate

# Apply indexes
npx prisma db push
```

---

## 🎯 Method 3: One-Line Command

If you have DATABASE_URL:

```bash
DATABASE_URL="your-connection-string" npx prisma db push
```

---

## ✅ Verification

### Check in MongoDB Atlas

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Select your cluster
3. Click **Browse Collections**
4. Select a collection (e.g., `Booking`)
5. Click **Indexes** tab
6. Verify indexes are listed:
   - `status_1`
   - `checkIn_1`
   - `checkOut_1`
   - `userId_1`
   - `roomId_1`
   - `createdAt_1`

### Test Performance

**Before:**
- `/api/rooms` takes ~5.6 seconds

**After:**
- `/api/rooms` should take ~1-2 seconds (50-70% improvement)

---

## 🔒 Security Note

⚠️ **Important:** Never commit DATABASE_URL to git!

- Use environment variables
- Use `.env.production` (already in .gitignore)
- Delete `.env.production` after use if created locally

---

## 📊 What Gets Created

### Booking Collection
- `status_1` - Fast status filtering
- `checkIn_1` - Quick date range queries
- `checkOut_1` - Quick date range queries
- `userId_1` - Fast user lookups
- `roomId_1` - Fast room lookups
- `createdAt_1` - Efficient sorting

### Room Collection
- `status_1` - Availability checks
- `type_1` - Room type filtering
- `price_1` - Price range queries
- `number_1` - Room number lookups
- `createdAt_1` - Efficient sorting

### User Collection
- `email_1` - Fast authentication
- `role_1` - Role-based queries
- `createdAt_1` - Efficient sorting

### FoodOrder Collection
- `status_1` - Order status filtering
- `guestId_1` - Guest order lookups
- `roomNumber_1` - Room-based queries
- `createdAt_1` - Efficient sorting

### Task Collection
- `status_1` - Task status filtering
- `assignedTo_1` - Assignment lookups
- `priority_1` - Priority sorting
- `dueDate_1` - Due date queries
- `createdAt_1` - Efficient sorting

**Total: 23 indexes across 5 collections**

---

## 🐛 Troubleshooting

### Error: "Authentication failed"

**Solution:**
- Verify database credentials in DATABASE_URL
- Check MongoDB Atlas user permissions
- Ensure user has `readWrite` role

### Error: "Network timeout"

**Solution:**
- Check MongoDB Atlas network access
- Add your IP to whitelist (or use `0.0.0.0/0` for Vercel)
- Verify cluster is running

### Error: "Index already exists"

**Solution:**
- This is normal - indexes are idempotent
- Prisma will skip existing indexes
- No action needed

---

## ✅ Success Indicators

After successful application, you should see:

```
✅ Prisma Client generated
✅ Schema changes applied
✅ Indexes created successfully
```

And in MongoDB Atlas:
- Indexes visible in Collections > Indexes tab
- Index build status: "Ready"

---

## 📈 Expected Results

- **Query Performance:** 50-70% faster
- **API Response Times:** Reduced by 2-4 seconds
- **Database Load:** 40-60% reduction
- **Scalability:** Handle 2-3x more concurrent users

---

## 🎉 Next Steps

1. ✅ Indexes applied
2. ✅ Test API endpoints
3. ✅ Monitor performance improvements
4. ✅ Enjoy faster queries!

---

**Ready to apply? Run:**
```bash
npm run db:apply-indexes:simple
```

