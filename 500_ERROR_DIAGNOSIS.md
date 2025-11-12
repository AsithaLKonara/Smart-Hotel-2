# 🔍 500 Internal Server Error - Diagnosis Guide

## Understanding 500 Errors

A **500 Internal Server Error** means the web server encountered an unexpected condition that prevented it from fulfilling the request. This is a **server-side issue**, not a client-side problem.

## How to Diagnose 500 Errors

### Method 1: Check Browser Network Tab (Quickest)

1. **Open Chrome DevTools** (F12 or Right-click → Inspect)
2. **Go to Network tab**
3. **Reload the page** (F5)
4. **Look for red/failed requests** (status 500)
5. **Click on the failed request**
6. **Check the Response tab** - This shows the actual error message from the server
7. **Check the Headers tab** - Look for error details

**What to look for:**
- Error messages mentioning "DATABASE_URL"
- Prisma connection errors
- Missing environment variables
- Stack traces pointing to specific files

### Method 2: Check Vercel Logs (Most Detailed)

#### Build Logs
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select **smarthotel-demo** project
3. Go to **Deployments** → Click latest deployment
4. Click **Build Logs** tab
5. Look for:
   - `Environment variable not found: DATABASE_URL`
   - `Prisma schema validation error`
   - `Cannot find module @prisma/client`
   - Build failures

#### Runtime Logs
1. Same deployment page
2. Click **Runtime Logs** tab
3. Access a page/API that returns 500
4. Check logs for:
   - Database connection errors
   - Prisma query errors
   - Unhandled exceptions
   - Stack traces

### Method 3: Use Debug Endpoint

Visit: `https://smarthotel-demo.vercel.app/api/debug`

This endpoint checks:
- ✅ Environment variables (DATABASE_URL, NEXTAUTH_URL)
- ✅ Database connection status
- ✅ Prisma client availability
- ✅ Specific error messages

**Expected output if DATABASE_URL is missing:**
```json
{
  "status": "unhealthy",
  "errors": ["DATABASE_URL environment variable is not set"],
  "checks": {
    "DATABASE_URL": {
      "exists": false,
      "value": "NOT SET"
    },
    "databaseConnection": {
      "status": "failed",
      "error": "Environment variable not found: DATABASE_URL"
    }
  }
}
```

### Method 4: Test API Endpoints Directly

```bash
# Test rooms API
curl -v https://smarthotel-demo.vercel.app/api/rooms

# Test debug endpoint
curl https://smarthotel-demo.vercel.app/api/debug | jq

# Test contact API
curl -v https://smarthotel-demo.vercel.app/api/settings/contact
```

Check the response body for error details.

## Common Causes of 500 Errors

### 1. Missing Environment Variables ⚠️ MOST COMMON

**Error Messages:**
- `Environment variable not found: DATABASE_URL`
- `Prisma schema validation error`
- `Cannot read property of undefined`

**Fix:**
Set `DATABASE_URL` in Vercel:
```
mongodb+srv://asviaai2025_db_user:1234@cluster0.1tpj8te.mongodb.net/smarthotel?retryWrites=true&w=majority
```

### 2. Database Connection Failure

**Error Messages:**
- `Can't reach database server`
- `Connection timeout`
- `Authentication failed`
- `Network access denied`

**Fix:**
1. Check MongoDB Atlas Network Access allows `0.0.0.0/0`
2. Verify connection string is correct
3. Check database user permissions

### 3. Prisma Client Not Generated

**Error Messages:**
- `Cannot find module @prisma/client`
- `Prisma Client is not generated`

**Fix:**
Ensure build script includes:
```json
"build": "prisma generate && next build"
```

### 4. Code Errors in Server Components

**Error Messages:**
- Stack traces pointing to specific files
- `Cannot read property X of undefined`
- `TypeError: ...`

**Fix:**
- Check the file mentioned in stack trace
- Add error handling around database queries
- Review server component code

## Step-by-Step Fix Process

### Step 1: Identify the Error
- Check browser Network tab → Response
- Check Vercel Runtime Logs
- Use `/api/debug` endpoint

### Step 2: Set Missing Environment Variables
```bash
# In Vercel Dashboard → Settings → Environment Variables
DATABASE_URL=mongodb+srv://asviaai2025_db_user:1234@cluster0.1tpj8te.mongodb.net/smarthotel?retryWrites=true&w=majority
NEXTAUTH_URL=https://smarthotel-demo.vercel.app
NEXTAUTH_SECRET=<your-secret>
```

### Step 3: Verify MongoDB Atlas
- Network Access → Allow `0.0.0.0/0`
- Database Access → User has read/write permissions
- Cluster is running

### Step 4: Redeploy
- Vercel Dashboard → Deployments → Redeploy
- Wait for deployment to complete

### Step 5: Verify Fix
- Test `/api/debug` endpoint
- Test `/api/rooms` endpoint
- Test homepage

## Quick Diagnostic Checklist

- [ ] Check browser Network tab for error details
- [ ] Check Vercel Runtime Logs for stack traces
- [ ] Visit `/api/debug` to see environment status
- [ ] Verify `DATABASE_URL` is set in Vercel
- [ ] Verify MongoDB Atlas Network Access
- [ ] Check build logs for Prisma errors
- [ ] Test database connection locally
- [ ] Redeploy after fixing environment variables

## Expected Behavior After Fix

✅ `/api/debug` returns 200 with `status: "healthy"`
✅ `/api/rooms` returns 200 with room data
✅ Homepage loads without 500 error
✅ All APIs return 200 instead of 500

---

**Next Step**: Visit `https://smarthotel-demo.vercel.app/api/debug` to see the exact error!

