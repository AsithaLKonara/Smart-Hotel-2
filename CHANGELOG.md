# Changelog

All notable changes to SmartHotel OS are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-06-16 — Production Release Candidate

### Added

#### Platform & Infrastructure
- Next.js 14 App Router full migration with server components and server actions
- OpenTelemetry + Sentry integration via `instrumentation.ts` for distributed tracing
- `lib/prisma.ts`: singleton Prisma client with PgBouncer connection pooling support
- `lib/query-keys.ts`: centralised TanStack Query key factory for consistent cache invalidation
- `lib/rbac/middleware.ts`: extracted role constants and permission matrix into dedicated module
- `lib/services/`: service-layer abstractions (BookingService, PaymentService, OrderService, StayService, FinancialService)
- `lib/contracts/payroll.ts`: typed payroll contract definitions
- `types/css.d.ts`: CSS module type declarations
- `components/ui/use-toast.ts`: Radix Toast utility hook

#### Database & Seeding
- Multi-property tenant isolation — every record scoped by `propertyId`
- Soft-delete flags on User and Booking models for immutable audit integrity
- Optimistic-lock `version` fields on Room for concurrency control
- Compound database indexes optimised for booking conflict queries
- `prisma/seed-comprehensive.ts`: luxury demo data covering all roles, rooms, amenities and F&B
- `prisma/seed-demo-users.ts` + `seed-demo-users-update.ts`: role-specific demo credentials

#### Authentication & Security
- Default-Deny RBAC enforcement at Edge middleware — all `/api/*` and `/admin/*` routes protected
- WebSocket upgrade blocking (`HTTP 400`) as compensating SSRF control (GHSA-c4j6-fc7j-m34r)
- `__Secure-` cookie prefix with `httpOnly`, `secure`, `sameSite=lax` in production
- `__Host-next-auth.csrf-token` CSRF protection on all mutation endpoints
- Upstash Redis rate limiting on auth and public API endpoints
- `lib/rbac-helpers.ts`: `canAccessAdminFeatures()`, `canAccessManagerFeatures()`, `canAccessStaffFeatures()` server-side role guards

#### Booking System
- Pessimistic-optimistic hybrid distributed locking via `lib/inventory-lock.ts`
- Redis-backed lease with automatic DB atomic fallback when Redis is unreachable
- Idempotency key validation on booking PATCH/DELETE mutations
- Two-way Booking.com OTA availability sync adapter (`lib/booking-com.ts`)
- Dynamic pricing yield rules engine (`app/api/admin/yield-rules/`) with simulation endpoint
- `app/booking/layout.tsx`: booking flow shell with Stripe Elements provider

#### Payments
- Centralised Stripe client with Zod key-format validation (`sk_`/`pk_` prefix enforcement)
- Idempotency keys on all Stripe API calls to prevent duplicate charges
- Webhook signature verification (`Stripe-Signature` header) before event processing
- Handles: `payment_intent.succeeded`, `charge.refunded`, `invoice.payment_failed`
- Atomic payment + folio line-item creation via Prisma transactions
- Immutable daily night-audit ledger snapshot endpoint
- Guest folio split-billing support

#### POS & Kitchen
- `components/pos/unified-pos.tsx`: unified POS terminal (room-charge, cash, card, split-payment)
- Real-time KDS (`app/kitchen/dashboard/`) with Pusher `KITCHEN_ORDER_NEW` / `KITCHEN_ORDER_UPDATE` events
- Kitchen-side order entry POS (`app/kitchen/pos/`)
- Kitchen hub index page (`app/kitchen/page.tsx`)
- Outlet and product management API endpoints (`app/api/pos/`)

#### Housekeeping & Maintenance
- Automated cleaning task dispatch when vacant room levels drop below 5%
- Severity-weighted priority scoring: `P = Severity×0.4 + Urgency×0.6`
- CMMS work-order management page (`app/admin/maintenance/`)
- Incident command centre with SLA escalation triggers
- Universal task queue supporting housekeeping, maintenance and service requests

#### HR & Payroll
- Employee directory with tenant-scoped CRUD
- Automated payroll calculation (base + overtime + deductions) with per-period ledger entries
- Attendance log ingestion and summary endpoints
- Payroll run dashboard with bulk approval workflow (`app/admin/hr/payroll/`)
- HR hub index with headcount and roster summary (`app/admin/hr/`)

#### CRM & Portals
- Guest 360° profile with lifetime value, stay history and preference tags
- Corporate account management with negotiated rate tiers and invoice-on-account billing
- Travel agent commission ledger and booking attribution
- Dedicated B2B booking portals (`app/portals/corporate/`, `app/portals/travel-agent/`)
- CRM command centre hub (`app/admin/crm/`)
- Banquet event, space and block booking management
- Unified inbox message broker (SMS/email/WhatsApp) via `lib/messaging/message-broker.ts`
- Distributed trace viewer dashboard (`app/admin/observability/traces/`)

#### Analytics & BI
- Server-side aggregation engine computing ADR, RevPAR, occupancy rate and F&B revenue
- MANAGER+ role-gated BI data endpoint with period comparison and trend deltas
- SUPER_ADMIN executive summary with multi-property federation metrics
- CSV/JSON data export endpoint
- Interactive BI dashboard with filterable charts

#### AI Chatbot & Loyalty
- Groq SDK tool-calling with live Prisma-backed functions: `getRoomAvailability`, `getMenuItems`, `submitComplaint`, `getLoyaltyBalance`
- Streaming chat UI with tool-result rendering and typing indicator (SSE)
- Points accrual, redemption and tier calculation (Silver/Gold/Platinum)
- Structured complaint submission with SLA auto-escalation
- In-app notification CRUD API

#### SRE & Monitoring
- Circuit breaker with sliding-window failure rate detection (auto-trips >50% over 60s)
- Liveness + readiness probe with DB connectivity and memory reporting (`/api/health/live`, `/api/health/ready`)
- Controlled fault injection endpoint for chaos drills (SUPER_ADMIN only, prod-disabled)
- `scripts/verify-monitoring-sre.ts`: Winston → Sentry → Slack alert pipeline verification (<15s gate)
- `scripts/verify-backup-restore-sre.ts`: pg_dump → restore → integrity → boot validation
- `scripts/verify-staging-ssl-sre.ts`: cookie security flag audit
- `scripts/chaos-certification.ts`: 20-concurrent-booking lock certification
- Immutable audit event writer with actor/action/resource/timestamp
- GDPR data-subject request helpers (`lib/compliance/privacy-toolkit.ts`)
- OTA channel mapping with rate parity check

#### Test Suites
- Jest unit tests: `price-calculation`, `rbac-helpers`, `inventory-lock`, `yield-optimization` — **91.84% statement coverage**
- Jest integration tests: booking, payment, kitchen order APIs with in-memory DB
- Playwright E2E: sequential critical-path audit, production smoke, accessibility WCAG 2.1 AA
- Security contract tests: default-deny verification on every admin route using GUEST token
- Cross-tenant ownership isolation contract test
- Automated RBAC penetration test runner (`qa/security/security-auditor.ts`)

#### Documentation
- Enterprise-grade 17-section README with architecture diagram, feature catalogue, prerequisites, environment tables, testing guide, production readiness matrix, deployment workflow, monitoring, security, contributing standards
- Updated `ARCHITECTURE.md`, `RBAC.md`, `TESTING.md`, `DEPLOYMENT.md`

### Changed

- `next.config.js`: added WebSocket upgrade listener patch (SSRF mitigation)
- `tsconfig.json`: tightened strict mode compiler options
- `tailwind.config.js`: extended theme tokens for enterprise design system
- All public content APIs migrated from mock arrays to live Prisma data access
- `components/providers.tsx`: TanStack Query + NextAuth + Pusher provider composition
- `app/admin/layout.tsx`: role-aware collapsible sidebar shell
- `hooks/use-realtime-updates.ts` + `use-realtime-notifications.tsx`: Pusher channel hooks

### Fixed

- Double-booking race condition under concurrent requests — eliminated by distributed lock
- MongoDB stub references replaced with PostgreSQL Prisma queries throughout all API routes
- `dotenv-expand` password truncation — documented URL-encoding requirement for special characters
- Prisma query string parameters stripped before `pg_dump`/`psql` shell commands in SRE scripts
- WebSocket SSRF vulnerability mitigated via middleware header blocking + server-level handle patch

### Security

- **GHSA-c4j6-fc7j-m34r (Next.js WebSocket SSRF)**: fully mitigated at middleware layer and server startup — verified with `curl -i -H "Upgrade: websocket"` returning `HTTP 400`
- `__Secure-` cookie prefix enforced in production — prevents cookie theft on non-HTTPS origins
- CSRF token (`__Host-` prefix) on all state-mutating API calls
- Rate limiting on auth endpoints via Upstash Redis (5 attempts / 15-min window)
- Default-Deny RBAC — all 7 roles tested for unauthorized access in `qa/contracts/security/`
- Audit logging on all financial mutations and auth events (immutable, actor-stamped)

### Performance

- Upstash Redis edge caching for frequently-read content (rooms, menu, amenities)
- TanStack Query v5 targeted cache invalidation via real-time Pusher events
- Prisma connection pooling via PgBouncer (`connection_limit=1` per serverless invocation)
- Compound database indexes on booking conflict queries for sub-millisecond lock checks

### Database

- PostgreSQL + Prisma ORM (replaces MongoDB)
- Multi-property `propertyId` tenant isolation on every model
- Soft-delete pattern on User/Booking for audit integrity
- Optimistic-lock `version` field on Room
- All transactions wrapped in `prisma.$transaction` for atomicity
- Daily automated pg_dump backup verified via SRE restore script

### Integrations

- **Stripe**: Checkout, Webhooks, Refunds — production-certified with idempotency
- **Pusher**: real-time channels for kitchen, booking, room status and notifications
- **Upstash Redis**: session cache, rate limiting and distributed inventory locks
- **Booking.com OTA**: two-way availability sync via partner API
- **Groq SDK**: AI concierge tool-calling with live DB queries
- **Sentry**: server-side and client-side error tracking with release tagging
- **Cloudinary**: media storage for room images and hotel gallery
- **Nodemailer SMTP**: transactional email (booking confirmations, password reset)

---

## [0.16.0] — 2026-06-15

- feat: Complete Phase 16 Resort Modules (Spa & Golf) & Final Deployment

## [0.15.0] — 2026-06-14

- feat: Complete Phase 15 App Marketplace & Integrations

## [0.14.0] — 2026-06-13

- feat: Complete Phase 14 Enterprise BI Dashboard

## [0.13.0] — 2026-06-12

- feat: Complete Phase 13 Guest Messaging & AI Concierge

## [0.12.0] — 2026-06-11

- feat: Complete Phase 12 Corporate HQ & Loyalty
