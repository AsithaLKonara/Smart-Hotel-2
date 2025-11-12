# Vercel Database Configuration Guide

## MongoDB Connection String

Your MongoDB Atlas connection string:
```
mongodb+srv://asviaai2025_db_user:1234@cluster0.1tpj8te.mongodb.net/smarthotel?retryWrites=true&w=majority
```

## Steps to Configure in Vercel

### Method 1: Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **smarthotel-demo**
3. Navigate to **Settings** → **Environment Variables**
4. Add the following variable:
   - **Name**: `DATABASE_URL`
   - **Value**: `mongodb+srv://asviaai2025_db_user:1234@cluster0.1tpj8te.mongodb.net/smarthotel?retryWrites=true&w=majority`
   - **Environment**: Select all (Production, Preview, Development)
5. Click **Save**
6. **Redeploy** your application (go to Deployments → click "..." → Redeploy)

### Method 2: Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Set the DATABASE_URL environment variable
vercel env add DATABASE_URL production
# When prompted, paste: mongodb+srv://asviaai2025_db_user:1234@cluster0.1tpj8te.mongodb.net/smarthotel?retryWrites=true&w=majority

# Also set for preview and development environments
vercel env add DATABASE_URL preview
vercel env add DATABASE_URL development

# Redeploy
vercel --prod
```

## Verify MongoDB Atlas Network Access

1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com/)
2. Navigate to **Network Access**
3. Ensure **0.0.0.0/0** is allowed (or add Vercel's IP ranges)
4. This allows Vercel servers to connect to your database

## Required Environment Variables for Production

Make sure these are also set in Vercel:

```env
DATABASE_URL=mongodb+srv://asviaai2025_db_user:1234@cluster0.1tpj8te.mongodb.net/smarthotel?retryWrites=true&w=majority
NEXTAUTH_URL=https://smarthotel-demo.vercel.app
NEXTAUTH_SECRET=<your-secret-key-minimum-32-characters>
```

## After Setting Environment Variables

1. **Redeploy** your application in Vercel
2. Wait for deployment to complete
3. Test the endpoints:
   - https://smarthotel-demo.vercel.app/api/rooms
   - https://smarthotel-demo.vercel.app/api/settings/contact
   - https://smarthotel-demo.vercel.app/

## Troubleshooting

If you still see 500 errors after setting DATABASE_URL:

1. **Check Vercel Build Logs**:
   - Go to Deployments → Latest deployment → Build Logs
   - Look for database connection errors

2. **Verify MongoDB Atlas**:
   - Check cluster is running
   - Verify network access allows 0.0.0.0/0
   - Check database user has correct permissions

3. **Test Connection Locally**:
   ```bash
   # Set DATABASE_URL in your terminal
   export DATABASE_URL="mongodb+srv://asviaai2025_db_user:1234@cluster0.1tpj8te.mongodb.net/smarthotel?retryWrites=true&w=majority"
   
   # Test connection
   npx prisma db pull
   ```

4. **Check Vercel Environment Variables**:
   - Ensure DATABASE_URL is set for Production environment
   - Check for typos in the connection string
   - Verify no extra spaces or quotes

