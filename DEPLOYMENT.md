# SmartHotel OS — Deployment & Production Operations

## 1. Environment Strategy
SmartHotel OS is optimized for **Vercel** and **Supabase PostgreSQL**. It requires the following external services:

- **Database**: PostgreSQL (Supabase with connection pooling via PgBouncer).
- **Caching**: Upstash Redis (session and rate limit storage).
- **Real-time**: Pusher Channels.
- **Payments**: Stripe.
- **Media**: Cloudinary.
- **Email**: Mailtrap / SendGrid SMTP.

---

## 2. Production Setup

### 1. Database Initialization & Schema Synchronization
Prisma ORM is configured with a dual-connection datasource block to support transactional PgBouncer connection pooling and direct DDL migrations:
1. Apply production database migrations (run against the direct URL):
   ```bash
   npx prisma migrate deploy
   ```
2. Verify table structures and indexes are correctly applied on Supabase:
   ```bash
   node scripts/check-db-url.js
   ```

### 2. Environment Variables & URL Interpolation
1. **DATABASE_URL**: Must target Supabase PgBouncer (Port `6543`) with `pgbouncer=true` and `connection_limit=1` to optimize serverless function scaling.
2. **DIRECT_URL**: Must target the direct PostgreSQL port `5432` for schema migrations.
3. **URL-Encoding**: If database passwords contain special shell characters (such as `$`), they MUST be URL-encoded (e.g. `%24`) to prevent Next.js `dotenv-expand` truncation.
4. **Stripe Keys**: Verify strict Zod contracts (Publishable key starting with `pk_`, Secret key starting with `sk_`).

---

## 3. Deployment Workflow

### CI/CD & Build Validation
1. **Lint & Build**: Verifies TypeScript compliance, relational schema typing, and Webpack builds.
2. **Test Suite**: Run End-to-End visual verification using Playwright targeting the production domain.
3. **Deploy**: Trigger a production deployment via Vercel CLI (`vercel --prod`).

### Production Smoke Test
After every deployment, check the live rooms and communications endpoints:
```bash
curl -s "https://smart-hotel-2.vercel.app/api/rooms"
```

---

## 4. Scaling & Reliability

### PgBouncer Pool Optimization
- Connection limit is constrained to `connection_limit=1` per lambda invocation to prevent pool exhaustion during AWS scale-up.
- Sentry and custom SRE observability endpoints log transactional and database query latency.

### Observability & Security
- **Supabase Auditing**: Database audit logs are active on Supabase.
- **Real-time Alerts**: Relational checks are integrated into Pusher.

---

## 5. Maintenance Tasks
- **Backups**: Enabled automated daily backups and Point-in-Time Recovery (PITR) with a 7–14 day WAL retention window in Supabase settings.
- **Cache Purge**: Periodic clearing of non-critical Redis keys.
- **Dependency Audit**: Monthly `npm audit` and Snyk scans to maintain security hygiene.
