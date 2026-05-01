# 🔑 All Environment Variables – SmartHotel

Complete, validated reference for every environment variable the SmartHotel stack recognises.

> ✅ Verified: `npm run validate:env` (November 2025). Required variables confirmed present in `.env.local`.

---

## ✅ Required For Application Startup

These nine values are mandatory. The validator script, CI pipelines, and local smoke tests will fail immediately if any are missing or malformed.

```env
DATABASE_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/smarthotel?retryWrites=true&w=majority
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-a-32-char-secret
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
```

- **DATABASE_URL** – MongoDB connection string (Atlas or on-prem). Accepted prefixes: `mongodb://` or `mongodb+srv://`.
- **NEXTAUTH_URL** – Base URL used by NextAuth for callbacks and absolute routes. Use production domain (`https://app.example.com`) in live environments.
- **NEXTAUTH_SECRET** – 32+ character cryptographic secret (generate with `openssl rand -base64 32`).
- **STRIPE_SECRET_KEY / STRIPE_PUBLISHABLE_KEY** – Stripe credentials for payment processing (test keys start with `sk_test_` / `pk_test_`).
- **SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS** – SMTP credentials (Mailtrap, SendGrid, Gmail, etc.) needed for password reset and transactional mail.

---

## 🔶 Recommended For Production Deployments

These provide branded URLs, admin notifications, and third-party integrations. The app supplies defaults, but production should set explicit values.

### Public URLs & Notifications

```env
NEXT_PUBLIC_APP_URL=https://smarthotel.example.com
ADMIN_EMAIL=admin@smarthotel.com
CONTACT_EMAIL=concierge@smarthotel.com
SOCKET_IO_URL=https://smarthotel.example.com
```

- **NEXT_PUBLIC_APP_URL** – Used in layout metadata, email templates, password reset links, Socket.IO fallback, and QR code generation.
- **ADMIN_EMAIL / CONTACT_EMAIL** – Delivery targets for system alerts and `/contact` submissions (fallbacks to `SMTP_FROM_EMAIL` when unset).
- **SOCKET_IO_URL** – Explicit origin for real-time events; defaults to `NEXTAUTH_URL` if omitted.

### Stripe Webhooks

```env
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

Needed for payment lifecycle webhooks (`/api/webhooks/stripe`).

### Google Services

```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_MAPS_API_KEY=AIzaSyYour_Google_Maps_API_Key
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

- **Google OAuth** – Enables “Sign in with Google” (button renders automatically when `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is defined).
- **Google Maps** – Interactive map on `/contact`.
- **Google Analytics** – Injected script from the Next.js layout when provided.

### Email Sender Branding

```env
SMTP_FROM_EMAIL=noreply@smarthotel.com
SMTP_FROM_NAME=SmartHotel
```

Used by `lib/email.ts` for outbound mail defaults.

---

## 🟢 Optional Feature Toggles

Set these as needed to unlock advanced capabilities. Otherwise the code paths use safe fallbacks.

### Push Notifications

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_vapid_key
VAPID_PRIVATE_KEY=your_private_vapid_key
```

Required for browser push notifications in `lib/push-notifications.ts`.

### Cloudinary Media Uploads

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Used by the gallery and admin content editors.

### Security & Observability

```env
RATE_LIMIT_ENABLED=true
MAX_LOGIN_ATTEMPTS=5
LOGIN_TIMEOUT_MINUTES=15
SESSION_TIMEOUT_HOURS=8
ENABLE_CSP=true
ENABLE_HSTS=true
TRUST_PROXY=true
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_TIMEOUT=5000
SNYK_TOKEN=your_snyk_token
NODE_ENV=production
```

Controls rate limiting, session lifetime, health checks, and security headers.

---

## 📋 Quick Reference Table

| Category | Variables |
|----------|-----------|
| **Core** | `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` |
| **Branding & URLs** | `NEXT_PUBLIC_APP_URL`, `ADMIN_EMAIL`, `CONTACT_EMAIL`, `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME`, `SOCKET_IO_URL` |
| **Payments** | `STRIPE_WEBHOOK_SECRET` |
| **Google** | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GA_ID` |
| **Notifications** | `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` |
| **Media** | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| **Security** | `RATE_LIMIT_ENABLED`, `MAX_LOGIN_ATTEMPTS`, `LOGIN_TIMEOUT_MINUTES`, `SESSION_TIMEOUT_HOURS`, `ENABLE_CSP`, `ENABLE_HSTS`, `TRUST_PROXY`, `HEALTH_CHECK_ENABLED`, `HEALTH_CHECK_TIMEOUT`, `SNYK_TOKEN`, `NODE_ENV` |

---

## ✅ Minimum Demo Configuration

For local demos or automated test suites, the following nine entries are sufficient (matching the validator output):

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`

Run `npm run validate:env` after editing `.env.local` to confirm readiness.

---

## 🔍 Validation Workflow

```bash
npm run setup:demo:credentials   # optional helper script
npm run validate:env             # required check
```

The validator reports missing or malformed values and reminds you of example formats. It is invoked locally and in CI to protect deployments.

---

## 📖 Credential Sources

| Service | Link | Notes |
|---------|------|-------|
| MongoDB Atlas | https://www.mongodb.com/cloud/atlas/register | Connection string for `DATABASE_URL`. |
| Stripe | https://stripe.com | Test/live API keys and webhook secret. |
| Mailtrap (or SMTP provider) | https://mailtrap.io | SMTP credentials for outbound email. |
| Google Cloud Console | https://console.cloud.google.com | OAuth, Maps, Analytics IDs. |
| Cloudinary | https://cloudinary.com | Optional media upload credentials. |
| Web Push VAPID | https://github.com/web-push-libs/web-push | Use `npx web-push generate-vapid-keys`. |

---

## 🧪 Latest Status

- `npm run validate:env` – **PASS**
- Playwright smoke (Chromium & Firefox) – **PASS**
- Playwright WebKit – **Blocked on macOS 12 frozen WebKit build** (requires newer macOS for Playwright 1.45+ setting support).

---

**Last updated:** November 2025  
**Maintainer:** Platform Engineering – SmartHotel

