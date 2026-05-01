# 🎬 START HERE - Customer Demo Setup

**Get your SmartHotel demo ready in 30 minutes!**

---

## 🎯 What You Need

All services below have **FREE tiers** - perfect for demos:

1. ✅ **Mailtrap** (Email) - FREE
2. ✅ **Stripe** (Payments - Test Mode) - FREE
3. ✅ **MongoDB Atlas** (Database) - FREE
4. ✅ **Google Cloud** (OAuth/Maps) - FREE (optional)

**Total Cost: $0** 🎉

---

## ⚡ Quick Start (Choose One)

### Option A: Automated Setup (Recommended)

```bash
# 1. Create demo environment file
npm run setup:demo:credentials

# 2. Follow the on-screen instructions
# 3. Get credentials from free services
# 4. Update .env.local with your credentials
# 5. Run: npm run dev
```

### Option B: Read Detailed Guide

👉 **See: `DEMO_CREDENTIALS_SETUP.md`** (Complete step-by-step guide)

### Option C: Quick Checklist

👉 **See: `DEMO_QUICK_START.md`** (Quick reference checklist)

---

## 📚 Documentation Files

| File | Purpose | When to Use |
|------|---------|-------------|
| **START_HERE_DEMO.md** | This file - Overview | Start here! |
| **DEMO_QUICK_START.md** | Quick 30-min setup | When you want fast setup |
| **DEMO_CREDENTIALS_SETUP.md** | Detailed instructions | When you need step-by-step help |
| **DEMO_CREDENTIALS_SUMMARY.md** | Quick reference | After setup is done |

---

## 🚀 What Happens After Setup

Once configured, you'll have:

✅ **Full booking system** - Customers can book rooms  
✅ **Payment processing** - Stripe integration (test mode)  
✅ **Email notifications** - Professional email templates  
✅ **Admin dashboard** - Complete management interface  
✅ **Guest features** - Browse rooms, gallery, contact  
✅ **Social login** - "Sign in with Google" (if configured)  
✅ **Live chat** - Customer support widget  
✅ **Real-time updates** - WebSocket integration  

---

## ⏱️ Time Estimate

| Task | Time |
|------|------|
| Create environment file | 2 min |
| Get Mailtrap credentials | 5 min |
| Get Stripe test keys | 5 min |
| Setup MongoDB Atlas | 10 min |
| Configure Google OAuth (optional) | 10 min |
| Setup & test | 5 min |
| **Total (Essential)** | **~30 min** |
| **Total (With Optional)** | **~45 min** |

---

## 🎬 Demo Checklist

After setup, you can show customers:

- [ ] Homepage with room listings
- [ ] Room booking flow (guest checkout works!)
- [ ] Payment processing (use test card: `4242 4242 4242 4242`)
- [ ] Email notifications (check Mailtrap inbox)
- [ ] Admin dashboard
- [ ] Social login (if Google OAuth configured)
- [ ] Live chat widget
- [ ] Contact page with map (if Google Maps configured)

---

## 🔗 Essential Links

### Get Free Accounts:

- **Mailtrap (Email)**: https://mailtrap.io
- **Stripe (Payments)**: https://stripe.com
- **MongoDB Atlas (Database)**: https://www.mongodb.com/cloud/atlas/register
- **Google Cloud (OAuth/Maps)**: https://console.cloud.google.com

### Test Credentials:

- **Stripe Test Card**: `4242 4242 4242 4242` (any future date, any CVC)
- **Demo Admin Login**: Check `prisma/seed.ts` for default admin credentials

---

## 📖 Next Steps

1. **Read**: `DEMO_QUICK_START.md` (for quick setup)
2. **Or Read**: `DEMO_CREDENTIALS_SETUP.md` (for detailed instructions)
3. **Get Credentials**: From free services listed above
4. **Update**: `.env.local` with your credentials
5. **Test**: Run `npm run validate:env`
6. **Start**: Run `npm run dev`
7. **Demo**: Visit http://localhost:3000

---

## 🆘 Need Help?

1. Check `DEMO_CREDENTIALS_SETUP.md` for detailed instructions
2. Run `npm run validate:env` to check configuration
3. Check service dashboards to verify credentials
4. Review error messages in console

---

## ✅ Success Criteria

You're ready when:

- ✅ `npm run validate:env` passes
- ✅ `npm run db:push` succeeds
- ✅ `npm run dev` starts without errors
- ✅ http://localhost:3000 loads correctly
- ✅ You can make a test booking
- ✅ Emails appear in Mailtrap inbox
- ✅ Test payment works with card `4242 4242 4242 4242`

---

**🎉 Ready to start?** Run: `npm run setup:demo:credentials`

Then follow: `DEMO_QUICK_START.md`

