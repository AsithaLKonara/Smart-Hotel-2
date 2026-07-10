# 🔧 DATABASE_URL Configuration Fix Guide

**Issue**: API endpoints return 503 with message "DATABASE_URL environment variable is not set"  
**Status**: Environment variable not accessible at runtime in Vercel

---

## 🔍 Problem Diagnosis

The API is returning:
```json
{
  "error": "Database not configured",
  "message": "DATABASE_URL environment variable is not set",
  "rooms": []
}
```

This means `process.env.DATABASE_URL` is `undefined` at runtime, even though you've configured it in Vercel.

---

## ✅ Solution Steps

### Step 1: Verify DATABASE_URL in Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **SmartHotel** project
3. Go to **Settings** → **Environment Variables**
4. Check if `DATABASE_URL` exists
5. **IMPORTANT**: Verify it's set for **Production** environment (not just Development/Preview)

### Step 2: Check Environment Variable Settings

The variable must be set for the correct environment:
- ✅ **Production** - Required for your live site
- ⚠️ **Preview** - Only for preview deployments
- ⚠️ **Development** - Only for local development

**Action**: Ensure `DATABASE_URL` is checked for **Production**.

### Step 3: Verify Variable Name

The variable name must be exactly:
```
DATABASE_URL
```

**Common mistakes**:
- ❌ `DATABASE_URI`
- ❌ `DB_URL`
- ❌ `postgresql_URL`
- ❌ `DATABASE_CONNECTION_STRING`

### Step 4: Check Variable Value Format

Your `DATABASE_URL` should look like:
```
postgresql://user:pass@host:5432/db
```

**Important checks**:
- ✅ Starts with `postgresql://user:pass@host:5432/db
- ✅ Contains username and password
- ✅ Contains cluster address
- ✅ Contains database name
- ✅ Contains query parameters

### Step 5: Redeploy After Setting Variables

**CRITICAL**: Environment variables are only applied on **new deployments**.

After setting/updating `DATABASE_URL`:

1. Go to **Deployments** tab in Vercel
2. Click **"..."** on the latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete (2-5 minutes)

**OR** trigger a new deployment:
```bash
git commit --allow-empty -m "Trigger redeploy for DATABASE_URL"
git push origin main
```

---

## 🧪 Testing After Fix

### Test 1: Check API Endpoint
```bash
curl https://smart-hotel-gtjz4w8js-asithalkonaras-projects.vercel.app/api/rooms
```

**Expected**: Should return rooms array (even if empty) or proper error, NOT "DATABASE_URL not set"

### Test 2: Check Diagnostic Endpoint
```bash
curl https://smart-hotel-gtjz4w8js-asithalkonaras-projects.vercel.app/api/debug-env
```

**Expected**: Should show `DATABASE_URL.exists: true`

### Test 3: Check Rooms Page
Visit: https://smart-hotel-gtjz4w8js-asithalkonaras-projects.vercel.app/rooms

**Expected**: Should load without "Loading rooms..." stuck state

---

## 🔍 Alternative: Check via Vercel CLI

If you have Vercel CLI installed:

```bash
# Check environment variables
vercel env ls

# Pull environment variables (to verify)
vercel env pull .env.production

# Check if DATABASE_URL is in the file
cat .env.production | grep DATABASE_URL
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Variable Set But Not Applied
**Symptom**: Variable shows in dashboard but API still returns 503

**Solution**: 
- Redeploy the application
- Environment variables only apply to new deployments

### Issue 2: Variable Set for Wrong Environment
**Symptom**: Variable exists but only for Development/Preview

**Solution**:
- Edit the variable in Vercel Dashboard
- Ensure **Production** checkbox is checked
- Redeploy

### Issue 3: Variable Name Typo
**Symptom**: Variable exists but with different name

**Solution**:
- Delete the incorrectly named variable
- Create new variable with exact name: `DATABASE_URL`
- Set for Production environment
- Redeploy

### Issue 4: postgresql Atlas Network Access
**Symptom**: DATABASE_URL is set but connection still fails

**Solution**:
1. Go to [postgresql Atlas](https://cloud.postgresql.com/)
2. Navigate to **Security** → **Network Access**
3. Click **"Add IP Address"**
4. Add `0.0.0.0/0` (allows all IPs - required for Vercel)
5. Click **"Confirm"**
6. Wait 2-3 minutes
7. Redeploy Vercel application

---

## 📋 Quick Checklist

- [ ] DATABASE_URL exists in Vercel Dashboard
- [ ] DATABASE_URL is set for **Production** environment
- [ ] Variable name is exactly `DATABASE_URL` (case-sensitive)
- [ ] Variable value is a valid postgresql connection string
- [ ] Application has been **redeployed** after setting variable
- [ ] postgresql Atlas Network Access allows `0.0.0.0/0`
- [ ] Tested API endpoint returns data (not 503 error)

---

## 🚀 After Fix is Applied

Once `DATABASE_URL` is properly configured:

1. ✅ API endpoints will return actual data
2. ✅ Rooms page will show available rooms
3. ✅ Restaurant menu will load items
4. ✅ All database-dependent features will work

The application will gracefully handle database errors, but with `DATABASE_URL` set, it should connect successfully.

---

## 📞 Need Help?

If the issue persists after following these steps:

1. Check Vercel deployment logs for errors
2. Verify postgresql Atlas connection string is correct
3. Test connection string locally with postgresql Compass
4. Check Vercel function logs for detailed error messages

---

**Last Updated**: November 19, 2025

