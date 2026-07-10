# 🚀 Quick Fix: Set DATABASE_URL in Vercel

## Problem
All APIs are returning 500 errors because `DATABASE_URL` is not set in Vercel production environment.

## Solution
Set the postgresql connection string in Vercel environment variables.

## Your postgresql Connection String
```
postgresql://user:pass@host:5432/db
```

## Steps to Fix (5 minutes)

### Option 1: Vercel Dashboard (Easiest)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select project: **smarthotel-demo**

2. **Navigate to Environment Variables**
   - Click **Settings** → **Environment Variables**

3. **Add DATABASE_URL**
   - Click **Add New**
   - **Key**: `DATABASE_URL`
   - **Value**: `postgresql://user:pass@host:5432/db
   - **Environment**: Select **Production** (and optionally Preview/Development)
   - Click **Save**

4. **Redeploy**
   - Go to **Deployments** tab
   - Click **"..."** on latest deployment
   - Click **Redeploy**
   - Wait 2-3 minutes for deployment to complete

### Option 2: Vercel CLI

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login
vercel login

# Add DATABASE_URL for production
vercel env add DATABASE_URL production
# When prompted, paste: postgresql://user:pass@host:5432/db

# Redeploy
vercel --prod
```

## Verify postgresql Atlas Network Access

1. Go to [postgresql Atlas](https://cloud.postgresql.com/)
2. Navigate to **Network Access**
3. Ensure **0.0.0.0/0** is in the IP whitelist (allows all IPs)
   - Or add Vercel's IP ranges if you prefer more restrictive access

## Test After Deployment

After redeploying, test these endpoints:

- ✅ Homepage: https://smarthotel-demo.vercel.app/
- ✅ Rooms API: https://smarthotel-demo.vercel.app/api/rooms
- ✅ Contact API: https://smarthotel-demo.vercel.app/api/settings/contact
- ✅ Menu API: https://smarthotel-demo.vercel.app/api/restaurant/menu

All should return 200 OK instead of 500 errors.

## Additional Environment Variables Needed

For full functionality, also set these in Vercel:

```env
NEXTAUTH_URL=https://smarthotel-demo.vercel.app
NEXTAUTH_SECRET=<generate-a-32-character-secret>
```

Generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

## Troubleshooting

### Still seeing 500 errors?

1. **Check Build Logs**
   - Vercel Dashboard → Deployments → Latest → Build Logs
   - Look for database connection errors

2. **Verify Environment Variable**
   - Settings → Environment Variables
   - Ensure DATABASE_URL is set for **Production** environment
   - Check for typos or extra spaces

3. **Test Connection Locally**
   ```bash
   export DATABASE_URL="postgresql://user:pass@host:5432/db
   npm run dev
   # Visit http://localhost:3000 - should work!
   ```

4. **Check postgresql Atlas**
   - Verify cluster is running
   - Check network access allows 0.0.0.0/0
   - Verify database user has read/write permissions

---

**✅ Connection String Verified**: Successfully tested locally!

