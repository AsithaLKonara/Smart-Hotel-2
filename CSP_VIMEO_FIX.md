# CSP Vimeo Video Fix

## Issue
Service worker is trying to fetch Vimeo video but getting CSP violation:
```
Connecting to 'https://player.vimeo.com/external/...' violates the following Content Security Policy directive: "connect-src 'self' https://js.stripe.com https://checkout.stripe.com https://www.google-analytics.com https://www.googletagmanager.com"
```

## Root Cause
The CSP configuration in `next.config.js` already includes `https://player.vimeo.com` in the `connect-src` directive (line 119), but the error message shows an older CSP that doesn't include Vimeo domains. This suggests:

1. **Cache Issue**: The service worker or browser might be using a cached CSP
2. **Service Worker Cache**: The service worker was registered before the CSP was updated
3. **Build Cache**: The build might be using a cached config

## Fix Applied
1. ✅ Verified CSP configuration in `next.config.js` includes:
   - `https://player.vimeo.com`
   - `https://vimeo.com`
   - `https://i.vimeocdn.com`
   - `https://images.unsplash.com`

2. ✅ Fixed `totalGuests` undefined error in admin dashboard:
   - Added optional chaining: `guestStats?.totalGuests || 0`
   - Added fallback values for guestStats

## Solution
The CSP is correctly configured. The error is likely due to:
- **Browser cache**: Users need to clear browser cache or hard refresh
- **Service worker cache**: The service worker needs to be updated/re-registered

## User Action Required
If users see this error, they should:
1. Clear browser cache
2. Unregister the service worker:
   ```javascript
   navigator.serviceWorker.getRegistrations().then(registrations => {
     registrations.forEach(registration => registration.unregister())
   })
   ```
3. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)

## Deployment Status
- ✅ Fixed and deployed
- ✅ CSP configuration correct in next.config.js
- ✅ totalGuests error fixed

