# SmartHotel OS — Deployment & Production Operations

## 1. Environment Strategy
SmartHotel OS is optimized for **Vercel** but can be deployed to any Node.js environment. It requires the following external services:

- **Database**: MongoDB Atlas (Replica Set required for Prisma transactions).
- **Caching**: Upstash Redis.
- **Real-time**: Pusher Channels.
- **Payments**: Stripe.
- **Media**: Cloudinary.
- **Email**: Mailtrap / SendGrid.

---

## 2. Production Setup

### 1. Database Initialization
1. Provision a MongoDB Cluster.
2. Run Prisma push to sync the schema:
   ```bash
   npx prisma db push
   ```
3. Apply production indexes:
   ```bash
   npm run db:apply-indexes:production
   ```

### 2. Environment Variables
Configure all mandatory keys in your deployment platform (see `README.md` for the list). Ensure `NEXTAUTH_URL` matches your production domain.

---

## 3. Deployment Workflow

### CI/CD (GitHub Actions)
1. **Lint & Build**: Verifies the project compiles and follows standards.
2. **Test**: Runs the full suite of unit and integration tests.
3. **Deploy**: Triggers a production deployment to Vercel upon successful completion.

### Production Smoke Test
After every deployment, the `npm run test:smoke` script should be executed to verify core API availability and DB connectivity.

---

## 4. Scaling & Reliability

### Edge Readiness
- API routes are compatible with **Next.js Edge Runtime** where possible (e.g., Auth, Rate Limiting).
- `Upstash Redis` provides global low-latency session and lock management.

### Observability
- **Sentry**: Integrated for real-time error tracking and performance bottlenecks.
- **Audit Logs**: Administrative actions are persisted in the `AuditLog` collection for forensic analysis.

---

## 5. Maintenance Tasks
- **Backups**: Daily automated exports of the MongoDB collection.
- **Cache Purge**: Periodic clearing of non-critical Redis keys.
- **Dependency Audit**: Monthly `npm audit` and Snyk scans to maintain security hygiene.
