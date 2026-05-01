# 🔍 Database Connection Diagnostics Guide

**Issue:** Even though `DATABASE_URL` is configured in Vercel, the application still returns 500 errors.

**Root Cause:** The error is happening **before** API route code executes, likely during:
- Prisma Client initialization
- Next.js server startup
- Database connection attempt

---

## 🎯 Most Likely Causes (When DATABASE_URL is Set)

### 1. MongoDB Atlas IP Whitelist ⚠️ **MOST COMMON**

**Problem:** MongoDB Atlas blocks connections from Vercel's IP addresses.

**Symptoms:**
- 500 errors on all endpoints
- Connection timeout errors
- "Network access denied" errors

**Fix:**
1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com/)
2. Navigate to **Security** → **Network Access**
3. Click **"Add IP Address"**
4. Add **`0.0.0.0/0`** (allows all IPs) - **Required for Vercel**
5. Click **"Confirm"**
6. Wait 2-3 minutes for changes to propagate
7. Redeploy your Vercel application

**Why 0.0.0.0/0?**
- Vercel uses serverless functions with dynamic IPs
- IP addresses change on every deployment
- 0.0.0.0/0 is the standard solution for serverless deployments

**Security Note:**
- For production, you can restrict to specific IP ranges later
- For now, 0.0.0.0/0 is necessary for Vercel to work

---

### 2. Connection Timeout

**Problem:** MongoDB Atlas connection is timing out (default Prisma timeout is 10 seconds).

**Symptoms:**
- Requests hang for 10+ seconds then fail
- "Connection timeout" errors
- Works locally but fails in production

**Fix:**
Add connection timeout configuration to `lib/db.ts`:

```typescript
const prismaLogger = globalForPrisma.prisma ?? new PrismaClient({
  log: logDefinitions,
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})
```

Or add timeout to connection string:
```env
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/smarthotel?retryWrites=true&w=majority&connectTimeoutMS=30000&socketTimeoutMS=30000
```

---

### 3. Prisma Client Not Generated During Build

**Problem:** Prisma Client might not be generating correctly during Vercel build.

**Symptoms:**
- Build succeeds but runtime fails
- "Cannot find module @prisma/client" errors
- Prisma client errors

**Fix:**
1. Check `package.json` build script:
   ```json
   "build": "prisma generate && next build"
   ```
   ✅ This looks correct

2. Verify Prisma is in dependencies:
   ```json
   "dependencies": {
     "@prisma/client": "^5.7.1",
     "prisma": "^5.7.1"
   }
   ```
   ✅ This looks correct

3. Check Vercel build logs for:
   - `prisma generate` command running
   - No errors during Prisma generation

---

### 4. Connection String Format Issues

**Problem:** Connection string might have special characters or formatting issues.

**Symptoms:**
- Authentication errors
- Connection refused errors
- Works in one environment but not another

**Fix:**
1. Verify connection string format:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
   ```

2. Check for special characters in password:
   - If password has special characters, URL encode them:
     - `@` → `%40`
     - `#` → `%23`
     - `$` → `%24`
     - `%` → `%25`
     - `&` → `%26`
     - `+` → `%2B`
     - `=` → `%3D`

3. Test connection string locally:
   ```bash
   export DATABASE_URL="your-connection-string"
   npm run db:test
   ```

---

### 5. Database User Permissions

**Problem:** MongoDB user might not have correct permissions.

**Symptoms:**
- Authentication succeeds but queries fail
- "Access denied" errors
- Can connect but can't read/write

**Fix:**
1. Go to MongoDB Atlas → **Database Access**
2. Find your database user
3. Ensure user has **"Atlas admin"** or **"Read and write to any database"** permissions
4. If using custom role, ensure it has:
   - `find` permission
   - `insert` permission
   - `update` permission
   - `delete` permission

---

### 6. Vercel Environment Variable Not Applied

**Problem:** Environment variable is set but not applied to current deployment.

**Symptoms:**
- Variable shows in Vercel dashboard
- But application still fails
- Works after manual redeploy

**Fix:**
1. Go to Vercel Dashboard → **Settings** → **Environment Variables**
2. Verify `DATABASE_URL` is set for **Production** environment
3. **Redeploy** the application:
   - Go to **Deployments**
   - Click **"..."** on latest deployment
   - Click **"Redeploy"**
   - Wait for deployment to complete

**Important:** Environment variables are only applied on **new deployments**. Existing deployments won't pick up new variables.

---

### 7. Cold Start / Connection Pool Issues

**Problem:** Serverless functions have cold starts, and Prisma connection might not be ready.

**Symptoms:**
- Intermittent failures
- Works after first request
- Timeout on first request

**Fix:**
Add connection retry logic in `lib/db.ts`:

```typescript
let prismaClient: PrismaClient

function getPrismaClient(): PrismaClient {
  if (!prismaClient) {
    prismaClient = new PrismaClient({
      log: logDefinitions,
    })
  }
  return prismaClient
}

// Add connection retry wrapper
async function connectWithRetry(retries = 3): Promise<void> {
  const prisma = getPrismaClient()
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect()
      return
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}
```

---

## 🔧 Diagnostic Steps

### Step 1: Check MongoDB Atlas Network Access

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Navigate to **Security** → **Network Access**
3. Check if **0.0.0.0/0** is in the list
4. If not, add it and wait 2-3 minutes

### Step 2: Test Connection String Locally

```bash
# Set the connection string (from Vercel)
export DATABASE_URL="mongodb+srv://asviaai2025_db_user:1234@cluster0.1tpj8te.mongodb.net/smarthotel?retryWrites=true&w=majority"

# Test connection
npm run db:test

# If this fails, the issue is with the connection string or MongoDB Atlas
```

### Step 3: Check Vercel Build Logs

1. Go to Vercel Dashboard → **Deployments**
2. Click on latest deployment
3. Click **Build Logs** tab
4. Look for:
   - `prisma generate` command
   - Any Prisma errors
   - Database connection errors

### Step 4: Check Vercel Runtime Logs

1. In the same deployment page
2. Click **Runtime Logs** tab
3. Try accessing the site
4. Look for:
   - Database connection errors
   - Prisma client errors
   - Timeout errors

### Step 5: Test Debug Endpoint

```bash
# This should return JSON, not HTML
curl https://smarthotel-demo.vercel.app/api/debug

# If it returns HTML 500, the error is happening before the route code runs
```

### Step 6: Check Environment Variables in Vercel

1. Go to Vercel Dashboard → **Settings** → **Environment Variables**
2. Verify `DATABASE_URL` exists
3. Check it's set for **Production** environment
4. Verify the value is correct (check for typos)

---

## 🚨 Quick Fix Checklist

If `DATABASE_URL` is already set in Vercel, check these in order:

- [ ] **MongoDB Atlas IP Whitelist** - Add `0.0.0.0/0` (MOST COMMON FIX)
- [ ] **Redeploy Vercel** - Environment variables only apply to new deployments
- [ ] **Test connection string locally** - Verify it works outside Vercel
- [ ] **Check Vercel build logs** - Look for Prisma generation errors
- [ ] **Check Vercel runtime logs** - Look for connection errors
- [ ] **Verify database user permissions** - User needs read/write access
- [ ] **Check connection string format** - URL encode special characters in password

---

## 🎯 Most Likely Solution

**90% of cases:** MongoDB Atlas IP Whitelist issue

**Fix:**
1. MongoDB Atlas → Security → Network Access
2. Add `0.0.0.0/0`
3. Wait 2-3 minutes
4. Redeploy Vercel application

**Why this is the most common issue:**
- MongoDB Atlas blocks all IPs by default
- Vercel uses dynamic IPs that change frequently
- Without `0.0.0.0/0`, Vercel can't connect to MongoDB

---

## 📊 Testing After Fix

After applying fixes, test these endpoints:

```bash
# Should return JSON, not HTML
curl https://smarthotel-demo.vercel.app/api/debug

# Should return rooms array (even if empty)
curl https://smarthotel-demo.vercel.app/api/rooms

# Should return contact info
curl https://smarthotel-demo.vercel.app/api/settings/contact
```

All should return **JSON responses**, not HTML error pages.

---

## 🔍 Advanced Debugging

If the issue persists, check:

1. **MongoDB Atlas Cluster Status**
   - Is the cluster running?
   - Any maintenance windows?

2. **Vercel Function Logs**
   - Check for specific error messages
   - Look for stack traces

3. **Network Connectivity**
   - Can Vercel reach MongoDB Atlas?
   - Any firewall rules blocking?

4. **Prisma Client Version**
   - Ensure Prisma version matches
   - Check for compatibility issues

---

## 📝 Next Steps

1. **First:** Check MongoDB Atlas IP whitelist (add `0.0.0.0/0`)
2. **Second:** Redeploy Vercel application
3. **Third:** Test endpoints and verify JSON responses
4. **Fourth:** If still failing, check Vercel runtime logs for specific errors

---

**Most Common Fix:** MongoDB Atlas → Network Access → Add `0.0.0.0/0` → Redeploy Vercel

