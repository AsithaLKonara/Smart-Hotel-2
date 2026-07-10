# 🔍 Debugging 500 Internal Server Errors

## Current Issue
All APIs and pages are returning 500 errors in production (Vercel deployment).

## Root Cause Analysis

### Primary Issue: Missing DATABASE_URL
The most likely cause is that `DATABASE_URL` environment variable is not set in Vercel, causing all database queries to fail.

### How to Verify

#### 1. Check Vercel Build Logs
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select **smarthotel-demo** project
3. Go to **Deployments** → Click on latest deployment
4. Click **Build Logs** tab
5. Look for errors like:
   - `Environment variable not found: DATABASE_URL`
   - `Can't reach database server`
   - `Prisma schema validation error`
   - `Connection timeout`

#### 2. Check Vercel Runtime Logs
1. In the same deployment page
2. Click **Runtime Logs** tab
3. Look for errors when accessing pages/APIs:
   - Database connection errors
   - Prisma client errors
   - Missing environment variables

#### 3. Test API Endpoints Directly
```bash
# Test rooms API
curl -v https://smarthotel-demo.vercel.app/api/rooms

# Test contact API
curl -v https://smarthotel-demo.vercel.app/api/settings/contact

# Check response headers and body for error details
```

#### 4. Check Browser Network Tab
1. Open Chrome DevTools (F12)
2. Go to **Network** tab
3. Reload the page
4. Click on failed requests (red, status 500)
5. Check **Response** tab for error message
6. Check **Headers** tab for error details

## Common Causes of 500 Errors

### 1. Missing Environment Variables
**Symptoms:**
- All database queries fail
- Prisma client initialization fails
- Error: "Environment variable not found"

**Fix:**
```bash
# Set in Vercel Dashboard → Settings → Environment Variables
DATABASE_URL=postgresql://user:pass@host:5432/db
NEXTAUTH_URL=https://smarthotel-demo.vercel.app
NEXTAUTH_SECRET=<your-secret>
```

### 2. Database Connection Issues
**Symptoms:**
- Connection timeout errors
- "Can't reach database server"
- Network access denied

**Fix:**
1. Check postgresql Atlas Network Access
   - Go to postgresql Atlas → Network Access
   - Ensure **0.0.0.0/0** is allowed (or add Vercel IPs)
2. Verify connection string format
3. Check database user permissions

### 3. Prisma Client Not Generated
**Symptoms:**
- "Prisma Client not found"
- "Cannot find module @prisma/client"

**Fix:**
```bash
# Ensure build script includes prisma generate
# Check package.json:
"build": "prisma generate && next build"
```

### 4. Code Errors in Server Components
**Symptoms:**
- Specific pages fail
- Error in server logs pointing to specific file/line

**Fix:**
- Check error stack trace in Vercel logs
- Review the specific file mentioned
- Add error handling around database queries

## Step-by-Step Debugging Process

### Step 1: Verify Environment Variables
```bash
# Check what's set in Vercel
vercel env ls

# Should see:
# DATABASE_URL (Production)
# NEXTAUTH_URL (Production)
# NEXTAUTH_SECRET (Production)
```

### Step 2: Check Build Success
- Go to Vercel Dashboard → Deployments
- Verify latest deployment shows ✅ **Ready**
- If ❌ **Error**, check Build Logs

### Step 3: Test Database Connection
```bash
# Test locally with production connection string
export DATABASE_URL="postgresql://user:pass@host:5432/db
npx prisma db pull
# Should succeed without errors
```

### Step 4: Check Runtime Errors
1. Visit: https://smarthotel-demo.vercel.app/
2. Open DevTools → Console
3. Check for JavaScript errors
4. Check Network tab for failed requests
5. Look at Response tab for error details

### Step 5: Review Application Logs
- Vercel Dashboard → Deployments → Latest → Runtime Logs
- Look for:
  - Database connection errors
  - Prisma errors
  - Missing module errors
  - Unhandled exceptions

## Quick Fix Checklist

- [ ] Set `DATABASE_URL` in Vercel (Production environment)
- [ ] Set `NEXTAUTH_URL` in Vercel (Production environment)
- [ ] Set `NEXTAUTH_SECRET` in Vercel (Production environment)
- [ ] Verify postgresql Atlas Network Access allows 0.0.0.0/0
- [ ] Redeploy application after setting environment variables
- [ ] Check build logs for errors
- [ ] Check runtime logs for errors
- [ ] Test API endpoints after deployment

## Expected Behavior After Fix

Once `DATABASE_URL` is set correctly:

✅ Homepage loads successfully
✅ `/api/rooms` returns 200 with room data
✅ `/api/settings/contact` returns 200 with contact info
✅ `/api/restaurant/menu` returns 200 with menu items
✅ `/api/auth/session` returns 200 with session data
✅ All pages load without 500 errors

## Getting Detailed Error Messages

### From Vercel Logs
```bash
# Install Vercel CLI
npm i -g vercel

# View logs
vercel logs https://smarthotel-demo.vercel.app --follow
```

### From Browser
1. Open DevTools (F12)
2. Network tab → Filter by "Failed"
3. Click on 500 error
4. Response tab shows server error message
5. Preview tab may show formatted error

### From API Response
```bash
# Get full error response
curl -v https://smarthotel-demo.vercel.app/api/rooms 2>&1 | grep -A 20 "< HTTP"
```

## Next Steps

1. **Set DATABASE_URL in Vercel** (most critical)
2. **Redeploy** the application
3. **Check logs** for any remaining errors
4. **Test endpoints** to verify fixes
5. **Report specific errors** if issues persist

---

**Note**: The connection string has been verified locally and works correctly. The issue is almost certainly missing environment variables in Vercel production environment.

