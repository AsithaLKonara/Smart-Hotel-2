# 🔍 Vercel Environment Variable Verification Guide

**Issue**: DATABASE_URL configured in Vercel but API still returns "not set" error

---

## 🔍 How to Verify via Vercel CLI

### Option 1: Link Project First
```bash
# Link the project
vercel link

# Then check environment variables
vercel env ls
```

### Option 2: Check Specific Project
```bash
# List all projects
vercel projects ls

# Check env vars for specific project (if you know the project name)
vercel env ls <project-name>
```

### Option 3: Pull Environment Variables
```bash
# Pull environment variables to local file
vercel env pull .env.production

# Check if DATABASE_URL is in the file
cat .env.production | grep DATABASE_URL
```

---

## ⚠️ Common Issues

### Issue 1: Variable Set But Not for Production
**Symptom**: Variable shows in `vercel env ls` but API still fails

**Solution**:
- Check which environments the variable is set for
- Ensure **Production** is checked
- Redeploy after updating

### Issue 2: Variable Set But Not Redeployed
**Symptom**: Variable exists but deployment is old

**Solution**:
- Environment variables only apply to NEW deployments
- Must redeploy after setting/updating variable
- Check deployment timestamp in Vercel Dashboard

### Issue 3: Wrong Project
**Symptom**: Variable exists in different project

**Solution**:
- Verify correct project name
- Check which project the production URL belongs to
- Set variable in correct project

---

## ✅ Quick Verification Commands

```bash
# 1. Check if project is linked
vercel link

# 2. List environment variables
vercel env ls

# 3. Pull environment variables
vercel env pull .env.production

# 4. Check DATABASE_URL
cat .env.production | grep DATABASE_URL

# 5. Test production API
curl https://smart-hotel-gtjz4w8js-asithalkonaras-projects.vercel.app/api/rooms
```

---

## 🎯 Expected Results

### If DATABASE_URL is Configured:
- `vercel env ls` should show `DATABASE_URL`
- `vercel env pull` should include `DATABASE_URL=...`
- API should return data (not 503 error)

### If DATABASE_URL is NOT Configured:
- `vercel env ls` shows "No Environment Variables found"
- API returns 503: "DATABASE_URL environment variable is not set"

---

**Current Status**: API still returns error - verification needed

