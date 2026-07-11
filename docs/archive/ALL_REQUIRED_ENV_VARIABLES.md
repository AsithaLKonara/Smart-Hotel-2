# 🔑 All Environment Variables – SmartHotel

Complete, validated reference for every environment variable the SmartHotel stack recognises.

> ✅ Verified: `npm run validate:env` (July 2026). Required variables confirmed present in `.env.local`.

---

## ✅ Required For Application Startup

These values are mandatory. The validator script, CI pipelines, and local smoke tests will fail immediately if any are missing or malformed.

```env
# Database (PostgreSQL ONLY — NOT MongoDB)
DATABASE_URL=postgresql://username:password@localhost:5432/smarthotel
DIRECT_URL=postgresql://username:password@localhost:5432/smarthotel

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-a-32-char-secret

# Security (required for cron authentication)
CRON_SECRET=generate-a-strong-random-secret

# Stripe
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key

# Email
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
```

- **DATABASE_URL** – PostgreSQL connection string (Supabase, Neon, or on-prem). Accepted prefixes: `postgresql://` or `postgres://`. **⚠️ MongoDB is NOT supported.**
- **DIRECT_URL** – Direct (non-pooled) PostgreSQL URL for Prisma migrations.
- **NEXTAUTH_URL** – Base URL used by NextAuth for callbacks. Use production domain (`https://app.example.com`) in live environments.
- **NEXTAUTH_SECRET** – 32+ character cryptographic secret (generate with `openssl rand -base64 32`).
- **CRON_SECRET** – Secures all `/api/cron/*` routes via Bearer token authentication. **Must be set in production.** Without this, Night Audit and Keepalive cron routes return `500 Server Misconfiguration` (fail-closed by design — CFG-004).
- **STRIPE_SECRET_KEY / STRIPE_PUBLISHABLE_KEY** – Stripe credentials for payment processing.
- **SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS** – SMTP credentials for password reset and transactional mail (outbox-based delivery).

---

## 🔶 Required For Production Features

### Redis (Upstash)

```env
UPSTASH_REDIS_REST_URL=https://your-upstash-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-token
```

Used for:
- **Distributed booking locks** (prevents double-bookings under concurrency)
- **Stripe webhook deduplication** (fail-closed if unavailable — PAY-005/INT-010)
- **Chat history async queue** (INT-008)
- **Outbox drain trigger** (INT-006/BOOK-005)

### AI / Groq Chatbot

```env
GROQ_API_KEY=gsk_your-groq-api-key-here
```

Required for the AI-powered concierge chatbot. **No fallback.** Without this key, the chat endpoint returns a graceful static response (CFG-004 compliance). Do **not** use `BUILD_PLACEHOLDER` in production.

### OTA Integration (Booking.com)

```env
BOOKING_COM_API_KEY=your-booking-com-api-key
BOOKING_COM_PARTNER_ID=your-booking-com-partner-id
BOOKING_COM_WEBHOOK_SECRET=your-booking-com-webhook-secret
```

- **BOOKING_COM_WEBHOOK_SECRET** – Validates inbound OTA push notifications. Requests without a valid Bearer token are rejected `401` (INT-001).

### Stripe Webhooks

```env
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Email Branding

```env
SMTP_FROM_EMAIL=noreply@smarthotel.com
SMTP_FROM_NAME=SmartHotel
ADMIN_EMAIL=admin@smarthotel.com
CONTACT_EMAIL=concierge@smarthotel.com
```

---

## 🟢 Optional Feature Toggles

### Real-time (Pusher)

```env
PUSHER_APP_ID=your-pusher-app-id
NEXT_PUBLIC_PUSHER_KEY=your-pusher-key
PUSHER_SECRET=your-pusher-secret
NEXT_PUBLIC_PUSHER_CLUSTER=mt1
```

**These are optional.** When absent, `lib/realtime.ts` falls back to a no-op trigger, and `lib/pusher-client.ts` returns `null` to prevent frontend crashes (CFG-003). Real-time dashboard events will be silently skipped.

### Public URLs & Notifications

```env
NEXT_PUBLIC_APP_URL=https://smarthotel.example.com
```

### Google Services

```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_MAPS_API_KEY=AIzaSyYour_Google_Maps_API_Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyYour_Google_Maps_API_Key
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### Cloudinary Media

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

### Push Notifications

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_vapid_key
VAPID_PRIVATE_KEY=your_private_vapid_key
```

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
SENTRY_DSN=your-sentry-dsn-here
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn-here
SNYK_TOKEN=your_snyk_token
NODE_ENV=production
```

---

## 📋 Quick Reference Table

| Category | Required | Variables |
|----------|----------|-----------|
| **Core DB** | ✅ Yes | `DATABASE_URL`, `DIRECT_URL` |
| **Auth** | ✅ Yes | `NEXTAUTH_URL`, `NEXTAUTH_SECRET` |
| **Security/Cron** | ✅ Yes | `CRON_SECRET` |
| **Payments** | ✅ Yes | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` |
| **Email** | ✅ Yes | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME`, `ADMIN_EMAIL` |
| **Redis** | 🔶 Prod | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| **AI/Groq** | 🔶 Prod | `GROQ_API_KEY` |
| **OTA** | 🔶 Prod | `BOOKING_COM_API_KEY`, `BOOKING_COM_PARTNER_ID`, `BOOKING_COM_WEBHOOK_SECRET` |
| **Real-time** | 🟢 Optional | `PUSHER_APP_ID`, `NEXT_PUBLIC_PUSHER_KEY`, `PUSHER_SECRET`, `NEXT_PUBLIC_PUSHER_CLUSTER` |
| **Google** | 🟢 Optional | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GA_ID` |
| **Media** | 🟢 Optional | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| **Push** | 🟢 Optional | `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` |

---

## ⚠️ Environment Differences (Dev vs Production) — CFG-005

The following behaviors differ between local development and Vercel production. New engineers must be aware of these before debugging.

### 1. NextAuth Cookie Prefixes

| Cookie | Development Name | Production Name |
|--------|-----------------|-----------------|
| Session Token | `next-auth.session-token` | `__Secure-next-auth.session-token` |
| Callback URL | `next-auth.callback-url` | `__Secure-next-auth.callback-url` |
| CSRF Token | `next-auth.csrf-token` | `__Host-next-auth.csrf-token` |

The `__Secure-` and `__Host-` prefixes are applied only when `NODE_ENV === 'production'` in `lib/auth.ts`. These prefixes enforce HTTPS-only cookies and cannot be read in local HTTP environments. This means:
- **Session bugs that occur only in production** may be caused by cookie prefix mismatch if testing over HTTP locally.
- Always use `https://localhost` or an HTTPS tunnel (e.g., `ngrok`) to replicate production cookie behavior locally.

### 2. `instrumentation.ts` — Vercel Edge vs Node.js

`instrumentation.ts` uses `process.env.NEXT_RUNTIME === 'nodejs'` to conditionally run server-only initialization code (WebSocket SSRF firewall, environment validation). On Vercel:
- **Node.js runtime** — `register()` executes normally on cold starts.
- **Edge runtime** — `register()` is invoked but the `if` guard prevents Node.js-specific code (e.g., `http.Server.prototype` patching) from running. This is intentional and expected.

This means the WebSocket SSRF firewall **does not run** on Edge-deployed routes. Ensure critical API routes that process WebSocket upgrades are not deployed to the Edge runtime.

### 3. Supabase Connection Pooler Sleeps

The Supabase free-tier Postgres connection pooler (`pooler.supabase.com:6543`) sleeps after inactivity. This causes intermittent `Can't reach database server` errors on cold starts. The `/api/cron/keepalive` route is designed to prevent this by periodically pinging the database.

---

## ✅ Minimum Demo Configuration

For local demos or automated test suites:

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `CRON_SECRET`
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

---

## 📖 Credential Sources

| Service | Link | Notes |
|---------|------|-------|
| PostgreSQL (Supabase) | https://supabase.com | Connection string for `DATABASE_URL`. |
| Stripe | https://stripe.com | Test/live API keys and webhook secret. |
| Upstash Redis | https://upstash.com | `UPSTASH_REDIS_REST_URL` and token. |
| Groq | https://console.groq.com | `GROQ_API_KEY` for LLM inference. |
| Mailtrap (or SMTP) | https://mailtrap.io | SMTP credentials for outbound email. |
| Google Cloud Console | https://console.cloud.google.com | OAuth, Maps, Analytics IDs. |
| Cloudinary | https://cloudinary.com | Optional media upload credentials. |
| Pusher | https://pusher.com | Optional real-time channels. |
| Web Push VAPID | https://github.com/web-push-libs/web-push | Use `npx web-push generate-vapid-keys`. |

---

**Last updated:** July 2026  
**Maintainer:** Platform Engineering – SmartHotel
