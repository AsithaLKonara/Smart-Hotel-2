# 🚀 Vercel Environment Configuration for SmartHotel

## **Static Production URL**
**Live URL**: `https://smarthotel-demo.vercel.app`

## **Required Environment Variables**

### **Database Configuration**
```bash
DATABASE_URL="mongodb+srv://asviaai2025_db_user:1234@cluster0.1tpj8te.mongodb.net/smarthotel?retryWrites=true&w=majority"
```

**✅ Verified**: Connection string tested and working!

### **Authentication Configuration**
```bash
NEXTAUTH_SECRET="your-production-secret-key-minimum-32-characters"
NEXTAUTH_URL="https://smarthotel-demo.vercel.app"
```

### **Stripe Configuration (Demo)**
```bash
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
```

### **Email Configuration (Optional)**
```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
ADMIN_EMAIL="admin@smarthotel.com"
```

### **Cloudinary Configuration (Optional)**
```bash
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### **Security Configuration**
```bash
RATE_LIMIT_ENABLED="true"
MAX_LOGIN_ATTEMPTS="5"
LOGIN_TIMEOUT_MINUTES="15"
SESSION_TIMEOUT_HOURS="8"
ENABLE_CSP="true"
ENABLE_HSTS="true"
TRUST_PROXY="true"
```

### **Monitoring Configuration**
```bash
HEALTH_CHECK_ENABLED="true"
HEALTH_CHECK_TIMEOUT="5000"
SNYK_TOKEN="your-snyk-token"
```

## **Setting Environment Variables in Vercel**

### **Method 1: Vercel Dashboard**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `smarthotel-demo` project
3. Go to **Settings** → **Environment Variables**
4. Add each variable with the appropriate value
5. Set environment to **Production**

### **Method 2: Vercel CLI**
```bash
# Set production environment variables
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_PUBLISHABLE_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production

# Redeploy with new environment variables
vercel --prod
```

## **Authentication Flow Configuration**

### **Static URL Benefits**
- ✅ **Consistent callback URLs** - No more deployment ID mismatches
- ✅ **Reliable authentication** - Same URL for all authentication flows
- ✅ **QR code consistency** - Room ordering URLs work correctly
- ✅ **Session persistence** - Cookies work across deployments

### **Callback URL Configuration**
The authentication system is now configured to use the static URL:
- **Production**: `https://smarthotel-demo.vercel.app`
- **Development**: `http://localhost:3000`

## **Testing Authentication Flow**

### **1. Sign In Flow**
```bash
# Test sign in
curl -X POST https://smarthotel-demo-8nkmogjtg-asithalkonaras-projects.vercel.app/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@smarthotel.test","password":"password123"}'
```

### **2. Session Verification**
```bash
# Check session
curl -X GET https://smarthotel-demo-8nkmogjtg-asithalkonaras-projects.vercel.app/api/auth/session \
  -H "Cookie: next-auth.session-token=your-session-token"
```

### **3. QR Code Generation**
```bash
# Test QR code URL generation
curl -X GET https://smarthotel-demo-8nkmogjtg-asithalkonaras-projects.vercel.app/api/admin/qr-generator
```

## **Deployment Commands**

### **Deploy to Production**
```bash
# Deploy with environment variables
vercel --prod --yes

# Check deployment status
vercel ls

# View logs
vercel logs https://smarthotel-demo-8nkmogjtg-asithalkonaras-projects.vercel.app
```

### **Environment Variable Management**
```bash
# List current environment variables
vercel env ls

# Pull environment variables
vercel env pull .env.local

# Update specific variable
vercel env add VARIABLE_NAME production
```

## **Troubleshooting**

### **Authentication Issues**
1. **Callback URL Mismatch**: Ensure `NEXTAUTH_URL` matches the static URL
2. **Session Not Persisting**: Check cookie settings and HTTPS configuration
3. **CSRF Token Errors**: Verify `NEXTAUTH_SECRET` is set correctly

### **Database Connection Issues**
1. **Connection String**: Verify MongoDB Atlas connection string
2. **Network Access**: Ensure IP whitelist includes Vercel IPs
3. **Authentication**: Check database user credentials

### **Environment Variable Issues**
1. **Missing Variables**: Use `vercel env ls` to check
2. **Wrong Environment**: Ensure variables are set for `production`
3. **Redeployment**: Run `vercel --prod` after adding variables

## **Security Considerations**

### **Production Secrets**
- ✅ Use strong `NEXTAUTH_SECRET` (minimum 32 characters)
- ✅ Use production Stripe keys
- ✅ Enable HTTPS and secure cookies
- ✅ Configure CORS and CSP headers

### **Database Security**
- ✅ Use MongoDB Atlas with IP whitelisting
- ✅ Enable authentication and encryption
- ✅ Use connection string with SSL

## **Monitoring & Health Checks**

### **Health Check Endpoints**
- **Liveness**: `https://smarthotel-demo-8nkmogjtg-asithalkonaras-projects.vercel.app/api/health/live`
- **Readiness**: `https://smarthotel-demo-8nkmogjtg-asithalkonaras-projects.vercel.app/api/health/ready`

### **Monitoring Setup**
```bash
# Check application health
curl https://smarthotel-demo-8nkmogjtg-asithalkonaras-projects.vercel.app/api/health/live

# Monitor logs
vercel logs --follow
```

---

**🎯 Ready for Production**: Configure these environment variables in Vercel to enable full functionality!
