# 🏨 SmartHotel - Configuration Guide

This guide will help you customize your SmartHotel application with your actual hotel information.

---

## 📞 **Contact Information**

### **Current Placeholder Values:**
```
Hotel Name: Grand Palace Hotel
Phone: +1 (555) 123-4567
Email: info@grandpalacehotel.com
Address: 123 Luxury Avenue, Downtown District, City, State 12345
```

### **Files to Update:**

#### **1. Homepage (`app/page.tsx`)**
Search for these placeholder values and replace with your real information:
- Line ~450: Hotel name and description
- Line ~500: Contact information section
- Line ~550: Address and phone

#### **2. Contact Page (`app/contact/page.tsx`)**
Update all contact details including:
- Phone number
- Email address
- Physical address
- Office hours

#### **3. Footer (`app/layout.tsx`)**
Update footer contact information:
- Company name
- Address
- Phone
- Email

#### **4. Navigation (`components/navigation/hotel-navigation.tsx`)**
Update header contact information if displayed

---

## 🔐 **Environment Variables (Vercel)**

### **Required Configuration:**

#### **1. Email Service (SMTP)**
Choose one provider and configure:

**Option A: Gmail**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-hotel-email@gmail.com
SMTP_PASS=your-app-specific-password
```

**Option B: SendGrid**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

**Option C: AWS SES**
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-aws-access-key
SMTP_PASS=your-aws-secret-key
```

#### **2. Payment Gateway (Stripe)**
Get your production keys from https://dashboard.stripe.com

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

#### **3. Google Services**

**Google Analytics:**
```env
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```
Get from: https://analytics.google.com

**Google Maps:**
```env
GOOGLE_MAPS_API_KEY=YOUR_API_KEY
```
Get from: https://console.cloud.google.com/apis/credentials

**Google Search Console:**
Update meta tag in `app/layout.tsx`:
```html
<meta name="google-site-verification" content="YOUR_VERIFICATION_CODE" />
```

---

## 🎨 **Visual Assets**

### **1. OG Image (Social Sharing)**
Create and upload to `/public/og-image.png`:
- Size: 1200x630 pixels
- Format: PNG or JPG
- Content: Hotel logo + tagline + beautiful image

### **2. Favicons**
Create and upload to `/public/icons/`:
- `icon-16x16.png`
- `icon-32x32.png`
- `icon-192x192.png`
- `icon-512x512.png`

Use a tool like https://realfavicongenerator.net/

### **3. Browser Config**
Create `/public/browserconfig.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square150x150logo src="/icons/mstile-150x150.png"/>
      <TileColor>#f59e0b</TileColor>
    </tile>
  </msapplication>
</browserconfig>
```

---

## 📱 **Social Media**

### **Update Social Links**
File: `app/layout.tsx` (Footer section)

Replace `#` with your actual social media URLs:
```tsx
<a href="https://facebook.com/yourhotel">Facebook</a>
<a href="https://instagram.com/yourhotel">Instagram</a>
<a href="https://twitter.com/yourhotel">Twitter/X</a>
<a href="https://youtube.com/@yourhotel">YouTube</a>
```

---

## 📝 **Content Customization**

### **Hotel Information**

#### **Homepage Content (`app/page.tsx`)**
Update:
1. Hotel name (Line ~50)
2. Hero tagline (Line ~80)
3. Description (Line ~120)
4. Amenities list (Line ~200)
5. About section (Line ~350)

#### **Room Descriptions (`app/rooms/page.tsx`)**
Enhance room descriptions with:
- Unique features
- View details
- Amenities specifics
- Square footage

#### **About Page**
Create or update `app/about/page.tsx` with:
- Hotel history
- Mission statement
- Team introductions
- Awards and recognitions

---

## 🚀 **Deployment Steps**

### **1. Update Environment Variables on Vercel:**
```bash
vercel env add SMTP_HOST production
vercel env add SMTP_USER production
vercel env add SMTP_PASS production
vercel env add STRIPE_SECRET_KEY production
vercel env add NEXT_PUBLIC_GA_ID production
vercel env add GOOGLE_MAPS_API_KEY production
```

### **2. Deploy Changes:**
```bash
git add .
git commit -m "Update hotel configuration and contact information"
git push origin main
```

Vercel will automatically deploy.

---

## ✅ **Configuration Checklist**

### **Critical (Must Do)**
- [ ] Update hotel name throughout site
- [ ] Replace phone number
- [ ] Replace email address
- [ ] Update physical address
- [ ] Configure SMTP for emails
- [ ] Update Stripe to production keys

### **Important (Should Do)**
- [ ] Add Google Analytics
- [ ] Configure Google Maps
- [ ] Update social media links
- [ ] Create OG image
- [ ] Update favicons
- [ ] Add Google verification

### **Optional (Nice to Have)**
- [ ] Enhance room descriptions
- [ ] Add hotel history/about page
- [ ] Professional photography
- [ ] Staff bios and photos
- [ ] Local area guide

---

## 🆘 **Need Help?**

### **Email Configuration Issues:**
- Gmail: Enable "Less secure app access" or use App Password
- SendGrid: Verify sender identity
- AWS SES: Move out of sandbox mode

### **Stripe Issues:**
- Ensure production keys are activated
- Complete Stripe account verification
- Test with Stripe test cards first

### **Google Services:**
- Enable APIs in Google Cloud Console
- Set up billing (required for Maps)
- Verify domain ownership

---

## 📞 **Support Resources**

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Stripe Docs:** https://stripe.com/docs
- **SendGrid Docs:** https://docs.sendgrid.com
- **Google Cloud:** https://cloud.google.com/docs

---

**✅ Your SmartHotel application is ready for customization!**

Start with the critical items and deploy changes incrementally to ensure everything works correctly.

