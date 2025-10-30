# 🗺️ Google Services Setup Guide

## Google Maps Integration ✅ COMPLETE

### What's Implemented
- ✅ Google Maps embedded on contact page
- ✅ Responsive iframe with proper loading
- ✅ Ready for custom location coordinates

### How to Update with Your Hotel Location

1. Go to [Google Maps](https://www.google.com/maps)
2. Search for your hotel address
3. Click "Share" → "Embed a map"
4. Copy the iframe HTML
5. Replace the `src` URL in `app/contact/page.tsx` (line ~167)

**Current placeholder coordinates:** Melbourne, Australia
**Update to:** Your actual hotel location

---

## Google Analytics Integration ✅ COMPLETE

### What's Implemented
- ✅ Google Analytics script in layout
- ✅ Automatic page view tracking
- ✅ Environment variable configuration
- ✅ Conditional loading (only if GA_ID is set)

### Setup Steps

1. **Create Google Analytics Account**
   - Go to https://analytics.google.com
   - Create a new property
   - Get your Measurement ID (format: G-XXXXXXXXXX)

2. **Add to Environment Variables**
   
   Add to `.env.local`:
   ```bash
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
   ```

3. **Deploy**
   
   For Vercel:
   ```bash
   vercel env add NEXT_PUBLIC_GA_ID
   # Enter your GA ID when prompted
   ```

4. **Verify Installation**
   - Visit your site
   - Open browser DevTools → Network tab
   - Look for requests to `google-analytics.com`
   - Check Google Analytics Real-Time reports

### Enhanced Tracking (Optional)

Create `lib/analytics.ts` for custom events:

```typescript
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value
    })
  }
}

// Usage examples:
// trackEvent('booking_completed', 'bookings', 'Room 101', 299)
// trackEvent('menu_item_added', 'restaurant', 'Caesar Salad')
// trackEvent('search', 'rooms', 'deluxe suite')
```

### Track Custom Events

Update booking confirmation:
```typescript
// In app/booking/confirmation/page.tsx
import { trackEvent } from '@/lib/analytics'

trackEvent('booking_completed', 'conversions', bookingId, totalAmount)
```

---

## Google Search Console (Recommended)

### Setup

1. Go to https://search.google.com/search-console
2. Add your website property
3. Verify ownership using HTML tag method

### Verification Tag

The verification meta tag is already configured in `app/layout.tsx`:

```typescript
verification: {
  google: "your-google-verification-code",
}
```

**Update with your actual verification code** after creating Search Console property.

---

## Google Tag Manager (Advanced - Optional)

For more advanced tracking, you can use GTM instead of direct GA:

### Setup GTM

1. Create account at https://tagmanager.google.com
2. Create container for your website
3. Get Container ID (GTM-XXXXXX)

### Implementation

Add to `app/layout.tsx` in `<head>`:

```typescript
{/* Google Tag Manager */}
<script
  dangerouslySetInnerHTML={{
    __html: `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${process.env.NEXT_PUBLIC_GTM_ID}');
    `,
  }}
/>
```

Add after `<body>`:

```typescript
{/* Google Tag Manager (noscript) */}
<noscript>
  <iframe
    src={`https://www.googletagmanager.com/ns.html?id=${process.env.NEXT_PUBLIC_GTM_ID}`}
    height="0"
    width="0"
    style={{ display: 'none', visibility: 'hidden' }}
  />
</noscript>
```

---

## Google Business Profile

### Setup

1. Go to https://business.google.com
2. Create/claim your business listing
3. Verify your business
4. Add:
   - Business hours
   - Photos
   - Services
   - Booking link (to your website)

### Benefits
- Appear in Google Maps search
- Show up in local search results
- Collect and display reviews
- Post updates and offers

---

## Environment Variables Summary

Add these to your `.env.local`:

```bash
# Google Services
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX                    # Google Analytics
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX                    # Google Tag Manager (optional)
GOOGLE_MAPS_API_KEY=AIzaSy...                     # For advanced Maps features (optional)
NEXT_PUBLIC_GOOGLE_VERIFICATION=abc123...         # Search Console verification
```

---

## Verification Checklist

- [ ] Google Maps showing on contact page
- [ ] Google Analytics tracking ID configured
- [ ] Analytics showing real-time data
- [ ] Search Console verified
- [ ] Maps location updated to actual hotel
- [ ] Custom event tracking implemented
- [ ] Privacy policy mentions Google services
- [ ] Cookie consent for analytics

---

## GDPR Compliance

Since you're using Google services:

1. **Update Privacy Policy** ✅ (Already mentions analytics)
2. **Cookie Consent** - Consider adding a cookie banner
3. **IP Anonymization** - Enabled by default in GA4
4. **Data Retention** - Configure in Google Analytics settings

---

**Status:** 
- ✅ Google Maps: Integrated
- ✅ Google Analytics: Configured (needs GA ID)
- ✅ Search Console: Ready for verification code
- ✅ Code implementation: Complete

**Next Steps:**
1. Create Google Analytics property
2. Add GA_ID to environment variables
3. Update Maps embed with your location
4. Add Search Console verification code









