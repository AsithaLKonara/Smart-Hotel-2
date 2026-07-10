# Production Risk Register: SmartHotel

This document outlines the highest production failure risks based on the system's architecture, categorized by severity.

## P0: Critical Risks (Data Integrity, Security, & Financial Loss)

### 1. Multi-Tenant Data Isolation (Tenant Bleed)
- **Component:** Prisma Models, API Routes (e.g., `/api/bookings`, `/api/analytics`).
- **Risk:** If the system supports multiple properties or hotels, missing `hotelId` / `tenantId` filters in Prisma queries can result in tenant data bleed. Users could inadvertently view or modify bookings and folios belonging to a different hotel.
- **Impact:** Critical security breach, compliance failure (GDPR/PCI), loss of trust.

### 2. Concurrent Double Bookings (Race Conditions)
- **Component:** OTA Webhooks (`processOtaReservation`), `createOptimisticHandler`, Database Transactions.
- **Risk:** High-concurrency bookings via OTA webhooks (e.g., Booking.com) and direct channels for the same physical room. If distributed locking (e.g., Redis mutex) or strict DB-level serialization isn't enforced, two transactions could commit simultaneously, resulting in a double-booked room.
- **Impact:** Operational chaos, customer relocation costs, reputation damage.

### 3. Payment State Desynchronization
- **Component:** `StripeGateway` (`authorizeHold`, `capturePayment`), Stripe Webhooks.
- **Risk:** If a checkout session completes but the corresponding Stripe webhook is delayed, dropped, or fails processing due to a lack of idempotency, the booking may remain unconfirmed while the customer's funds are held. Conversely, capturing a payment without an atomic booking commit leads to unfulfilled charges.
- **Impact:** Financial loss, chargebacks, customer frustration.

---

## P1: High Risks (System Stability & Core Workflows)

### 4. Night Audit Roll-Forward Timeouts
- **Component:** `/api/cron/night-audit/roll-forward`.
- **Risk:** Night audits are traditionally heavy, long-running processes that calculate daily revenues, post room charges, and roll dates forward. Running this as an HTTP API route risks hitting serverless execution timeouts (e.g., Vercel's 10-60s limit) or Prisma transaction timeouts, leaving the hotel's financial state partially committed.
- **Impact:** Corrupted daily financial reports, inaccurate folios, requires manual DBA intervention to fix.

### 5. Outbox & Reconciliation Worker Stalls
- **Component:** `ReconciliationWorker`, `Outbox` table.
- **Risk:** If the background worker fails to drain the outbox or crashes on a poisoned message (e.g., an unparseable payload), subsequent domain events (OTA inventory syncs, emails) will queue up indefinitely. Polling queries could also degrade database performance.
- **Impact:** Stale OTA inventory (leading to P0 double bookings), delayed guest communications.

### 6. Authentication Replay and JWT Invalidation
- **Component:** `lib/auth.ts` (NextAuth), `IdleTimer`.
- **Risk:** The `IdleTimer` enforces client-side session expiration. If JWTs do not have a robust backend invalidation mechanism (e.g., a Redis blacklist or very short TTLs), an intercepted token can still be replayed against the API even after the user is forced out on the frontend.
- **Impact:** Unauthorized access to admin or guest data.

---

## P2: Medium Risks (Degradation & Edge Cases)

### 7. Real-Time Memory Leaks
- **Component:** `WebSocketGateway` (offline queue replay).
- **Risk:** If the server retains queues for disconnected clients indefinitely, a surge in mobile clients losing connection (common in hotel environments) could cause memory bloat and eventually crash the Node/Server process (OOM).
- **Impact:** Degraded real-time sync performance, intermittent server restarts.

### 8. External API Rate Limiting Drops
- **Component:** `TwilioService`, `StripeGateway`.
- **Risk:** Bulk actions (e.g., sending promotional SMS or emergency alerts to all guests) could hit Twilio rate limits. Without a resilient retry mechanism utilizing exponential backoff (if decoupled from the Outbox), messages will be permanently lost.
- **Impact:** Guests miss critical notifications.

### 9. Caching Drift for Inventory
- **Component:** Optimistic updates / Any Redis caching layers.
- **Risk:** If physical room availability is aggressively cached for frontend speed, network partitions or failed invalidation calls might cause the cache to drift from the source-of-truth database. 
- **Impact:** Guests attempt to book rooms that appear available but fail at checkout, causing UX friction.
