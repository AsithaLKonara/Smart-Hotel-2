# 🚀 SmartHotel Quick Start Guide

Get your SmartHotel demo environment up and running in minutes!

## ⚡ Quick Setup (3 Steps)

### Step 1: Setup Environment Variables

```bash
# Option A: Automated setup (recommended)
npm run setup:demo

# Option B: Manual setup
cp .env.example .env.local
# Then edit .env.local with your values
```

### Step 2: Configure Services

You need accounts for these services (all have free tiers):

1. **MongoDB Atlas** (Database)
   - Sign up: https://www.mongodb.com/cloud/atlas/register
   - Create free cluster
   - Get connection string → Update `DATABASE_URL` in `.env.local`

2. **Stripe** (Payments - Test Mode)
   - Sign up: https://stripe.com
   - Get test keys: https://dashboard.stripe.com/test/apikeys
   - Update `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` in `.env.local`

3. **Mailtrap** (Email Testing)
   - Sign up: https://mailtrap.io
   - Get SMTP credentials → Update `SMTP_*` variables in `.env.local`

### Step 3: Validate & Run

```bash
# Validate environment
npm run validate:env

# Setup database
npm run db:push

# Start development server
npm run dev
```

Visit: **http://localhost:3000** 🎉

## 📋 Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MongoDB connection string | `mongodb://localhost:27017/smarthotel` |
| `NEXTAUTH_URL` | App URL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Auth secret (32+ chars) | Generate: `openssl rand -base64 32` |
| `STRIPE_SECRET_KEY` | Stripe secret key (test) | `sk_test_...` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe public key (test) | `pk_test_...` |
| `SMTP_HOST` | SMTP server | `sandbox.smtp.mailtrap.io` |
| `SMTP_PORT` | SMTP port | `2525` |
| `SMTP_USER` | SMTP username | Your Mailtrap username |
| `SMTP_PASS` | SMTP password | Your Mailtrap password |
| `SMTP_FROM_EMAIL` | From-address for outbound messages | `noreply@smarthotel.com` |
| `SMTP_FROM_NAME` | Display name for outbound messages | `SmartHotel` |
| `ADMIN_EMAIL` | Back-office alerts/contact recipients | `admin@smarthotel.com` |

## 🔍 Validation

After setting up `.env.local`, validate your configuration:

```bash
npm run validate:env
```

This will check:
- ✅ All required variables are set
- ✅ Variables have correct format
- ✅ Security best practices (e.g., NEXTAUTH_SECRET length)

## 🛠️ Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Production build
npm run start           # Start production server

# Database
npm run db:push         # Push schema to database
npm run db:seed:demo    # Seed demo data
npm run db:studio       # Open Prisma Studio

# Testing
npm run validate:env    # Validate environment
npm run type-check      # TypeScript check
npm run lint            # Lint code
npm run test            # Run tests

# Setup
npm run setup:demo      # Setup demo environment
```

## 📚 Detailed Documentation

- **Full Setup Guide**: See `DEMO_SETUP.md`
- **Testing Plan**: See `deep-testing-plan.plan.md`
- **API Documentation**: Check `/app/api` routes
- **Email Templates**: Review `lib/email.ts` for booking/contact/reset layouts

## 🆘 Troubleshooting

### Database Connection Issues
```bash
# Test database connection
npm run db:test

# Debug connection
npm run db:debug
```

### Environment Validation Fails
```bash
# Re-run validation
npm run validate:env

# Check what's missing/invalid
# Fix issues in .env.local
# Run validation again
```

### Build Errors
```bash
# Regenerate Prisma client
npm run db:generate

# Type check
npm run type-check

# Clean build
rm -rf .next node_modules
npm install
npm run build
```

## 🎯 Next Steps

1. ✅ **Setup complete** - Environment configured
2. ⏭️ **Database** - Run migrations and seed data
3. ⏭️ **Development** - Start coding!
4. ⏭️ **Testing** - Run test suite
5. ⏭️ **Deployment** - Deploy to production

## 💡 Tips

- **Always use test/demo credentials** in development
- **Never commit** `.env.local` to git (it's ignored)
- **Rotate secrets** regularly for security
- **Use `SMTP_FROM_EMAIL/NAME`** to control branding in transactional emails
- **Use Mailtrap** for email testing (no real emails sent)
- **Use Stripe test mode** (no real charges)

## 🆘 Need Help?

- Check `DEMO_SETUP.md` for detailed instructions
- Review error messages carefully
- Ensure all services (MongoDB, Stripe, Mailtrap) are configured
- Verify environment variables with `npm run validate:env`

---

**Ready to go?** Run `npm run dev` and visit http://localhost:3000! 🚀

## 📧 Email Testing Checklist

- Run `npx tsx -e "import { testEmailConfiguration } from './lib/email'; testEmailConfiguration()"` to verify SMTP credentials.
- Trigger the contact form (`/contact`) to confirm admin alerts are stored in the database and mailed to `ADMIN_EMAIL`.
- Booking events (`sendBookingConfirmation`, `sendAdminBookingAlert`) live in `lib/email.ts`; update templates as needed to match your branding.





