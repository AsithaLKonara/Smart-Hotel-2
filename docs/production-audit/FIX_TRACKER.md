# Fix Tracker

| ID | Priority | Status | Owner | Title |
|---|---|---|---|---|
| [DB-001](database/DB-001.md) | Sprint 1 | Resolved | Antigravity | PostgreSQL / MongoDB Configuration Mismatch |
| [DB-002](database/DB-002.md) | Sprint 2 | Resolved | Antigravity | Dual Connection Pooling (Prisma + raw pg) |
| [DB-003](database/DB-003.md) | Sprint 1 | Resolved | Antigravity | Missing OTA Idempotency Constraints |
| [DB-004](database/DB-004.md) | Sprint 2 | Resolved | Antigravity | Missing Overlapping Assignments Constraints |
| [DB-005](database/DB-005.md) | Sprint 2 | Resolved | Antigravity | Missing Transactions for Outbox/Events |
| [DB-006](database/DB-006.md) | Sprint 1 | Resolved | Antigravity | Distributed Locking Bypassing DB Constraints |
| [DB-007](database/DB-007.md) | Sprint 3 | Resolved | Antigravity | Unsafe Soft Deletes vs Unique Constraints |
| [DB-008](database/DB-008.md) | Sprint 3 | Resolved | Antigravity | Missing Cascade Deletion Rules |
| [DB-009](database/DB-009.md) | Sprint 1 | Resolved | Antigravity | Nullable Multi-Tenant Fields (propertyId) |
| [DB-010](database/DB-010.md) | Sprint 2 | Resolved | Antigravity | Floating Point Currency Precision Loss | Migrated to Prisma Decimal |
| [API-001](api/API-001.md) | Sprint 1 | Resolved | Antigravity | Bookings Array Response Mismatch | Fixed booking-api.ts to handle object payload |
| [API-002](api/API-002.md) | Sprint 2 | Resolved | Antigravity | Flattened Room Models Mismatch | Refactored room endpoints to return nested relations, updated booking-api and UI |
| [API-003](api/API-003.md) | Sprint 1 | Resolved | Antigravity | Missing Complaints Schema Validation | Added Zod schema validation to POST/PATCH |
| [API-004](api/API-004.md) | Sprint 1 | Resolved | Antigravity | Bookings Payload Disconnect (Zod Strip) | Payload flattened in booking-api.ts before POST |
| [API-005](api/API-005.md) | Sprint 2 | Resolved | Antigravity | Schema Relation Crash (DELETE room) | Updated Prisma query to use roomAssignments |
| [API-006](api/API-006.md) | Sprint 3 | Resolved | Antigravity | Varying HTTP Status Codes for AuthZ | Standardized 401 and 403 checks in PUT and DELETE |
| [API-007](api/API-007.md) | Sprint 3 | Resolved | Antigravity | Inconsistent Zod Error Formatting | Created unified handleZodError in api-utils.ts |
| [API-008](api/API-008.md) | Sprint 2 | Resolved | Antigravity | Public Room Details Missing Authentication | Stripped operational status field from public GET room requests |
| [API-009](api/API-009.md) | Sprint 1 | Resolved | Antigravity | Complaints IDOR Vulnerability | Enforced non-admin user restriction on GET requests |
| [API-010](api/API-010.md) | Sprint 1 | Resolved | Antigravity | Cross-Property Housekeeping IDOR | Validated room.propertyId against effective session propertyId |
| [API-011](api/API-011.md) | Sprint 2 | Resolved | Antigravity | Orphaned Complaint Bindings | Verified booking.primaryGuestId matches session user before linking |
| [BOOK-001](booking/BOOK-001.md) | Sprint 1 | Resolved | Antigravity | Lock Bypassing Race Condition (Double Bookings) | Forced Redis lock timeout to abort execution instead of falling back to local memory mutex |
| [BOOK-002](booking/BOOK-002.md) | Sprint 1 | Resolved | Antigravity | Idempotency Key Poisoning (Soft-lock) | Wrapped post-transaction hooks in try-catch to prevent idempotency keys being wiped on non-critical errors |
| [BOOK-003](booking/BOOK-003.md) | Sprint 2 | Resolved | Antigravity | Orphaned Stripe Payments Creation | Implemented Saga pattern: Pre-inserted pending Payment record before invoking Stripe API, using payment ID as idempotency key |
| [BOOK-004](booking/BOOK-004.md) | Sprint 1 | Resolved | Antigravity | Desynchronized Distributed State (Redis/DB Rollback) | Fixed via architectural shift: Replaced legacy Redis distributed lock with PostgreSQL Pessimistic Row-Level Locking (SELECT FOR UPDATE) |
| [BOOK-005](booking/BOOK-005.md) | Sprint 3 | Resolved | Antigravity | Silent Notification Loss (SMTP) | Implemented DB-backed Outbox pattern. Enqueue emails synchronously and process asynchronously via ReconciliationWorker. Modified email.ts to throw errors for reliable retries. |
| [PAY-001](payments/PAY-001.md) | Sprint 1 | Resolved | Antigravity | Hard Crash on Refund Webhooks (Missing roomId) | Fixed by traversing roomAssignments[] and using updateMany instead of the deprecated roomId scalar. |
| [PAY-002](payments/PAY-002.md) | Sprint 2 | Resolved | Antigravity | Orphaned Payment Intents (Partial Failure) | Implemented Saga pattern: Pre-inserted pending Payment record via upsert before invoking Stripe API. |
| [PAY-003](payments/PAY-003.md) | Sprint 1 | Resolved | Antigravity | Out-of-Order Webhook Overwrites | Implemented State Machine pre-checks in webhook handlers to gracefully ignore invalid state transitions (e.g. failing a completed payment). |
| [PAY-004](payments/PAY-004.md) | Sprint 2 | Resolved | Antigravity | Non-Idempotent Captures and Refunds | Added deterministic idempotencyKey to Stripe Gateway captures and refunds. |
| [PAY-005](payments/PAY-005.md) | Sprint 2 | Resolved | Antigravity | Webhook Deduplication Bypass (Redis Fail-Open) | Updated Stripe webhook route to fail closed (HTTP 503) during Redis unavailability. |
| [PMS-001](pms/PMS-001.md) | Sprint 1 | Resolved | Antigravity | Room Assignment vs. Stay Desynchronization | Synchronized RoomAssignment with physical Room check-in via StayService. |
| [PMS-002](pms/PMS-002.md) | Sprint 1 | Resolved | Antigravity | Double-Entry Ledger Bypass (Night Audit) | Refactored Night Audit to use FinancialEngine.postCharge for double-entry compliance and correct taxation. |
| [PMS-003](pms/PMS-003.md) | Sprint 1 | Resolved | Antigravity | Financial Engine In-Memory State Loss | Refactored FinancialEngine to use async database hydration and transaction boundaries instead of an in-memory Map. |
| [PMS-004](pms/PMS-004.md) | Sprint 2 | Resolved | Antigravity | Broken No-Show Processing | Updated Night Audit to accurately query the Booking model for EXPECTED arrivals instead of the Stay model. |
| [PMS-005](pms/PMS-005.md) | Sprint 2 | Resolved | Antigravity | Audit Log Attribution Forgery | Implemented dynamic upsert of a dedicated SYSTEM user identity for cron operations to ensure accurate Night Audit Log attribution and compliance. |
| [INT-001](integrations/INT-001.md) | Sprint 1 | Resolved | Antigravity | Booking.com Unauthenticated Webhooks | Enforced strict `BOOKING_COM_WEBHOOK_SECRET` Bearer token authentication to prevent forged XML OTA payloads. |
| [INT-002](integrations/INT-002.md) | Sprint 1 | Resolved | Antigravity | Booking.com Concurrency Overbooking | Injected distributed Redis lock (acquireLock) into webhook processor to perfectly serialize OTA requests and prevent race condition double-bookings. |
| [INT-003](integrations/INT-003.md) | Sprint 2 | Resolved | Antigravity | Booking.com Missing Lifecycle Orchestration | Injected dual-write logic (Folio, StayEvent) into OTA webhook. |
| [INT-004](integrations/INT-004.md) | Sprint 2 | Resolved | Antigravity | Pusher Synchronous Crashing in Webhooks | Replaced synchronous Pusher emit with transactional Prisma outbox queue. |
| [INT-005](integrations/INT-005.md) | Sprint 3 | Resolved | Antigravity | Pusher Missing Environment Fail-safes | Added configuration guard checks to Pusher initialization. |
| [INT-006](integrations/INT-006.md) | Sprint 3 | Resolved | Antigravity | SMTP Silent Dropping of Critical Notifications | Updated all email pipelines to leverage Prisma Outbox pattern for queue-based retries. |
| [INT-007](integrations/INT-007.md) | Sprint 2 | Resolved | Antigravity | Groq API Key Fallback Vulnerability | Implemented BUILD_PLACEHOLDER runtime check with graceful degradation. |
| [INT-008](integrations/INT-008.md) | Sprint 3 | Resolved | Antigravity | Groq Stream Exception Swallowing | Decoupled history save from ReadableStream using Redis `rpush` async queue. |
| [INT-009](integrations/INT-009.md) | Sprint 3 | Resolved | Antigravity | Cloudinary Ghost Integration | Configured Next.js remotePatterns and Content-Security-Policy for Cloudinary. |
| [INT-010](integrations/INT-010.md) | Sprint 2 | Resolved | Antigravity | Redis Bypass on Disconnect | Applied fail-closed deduplication (Duplicate of PAY-005). |
| [CFG-001](configuration/CFG-001.md) | Sprint 1 | Resolved | Antigravity | PostgreSQL / MongoDB Fatal Mismatch | Updated `env.example` and `ALL_REQUIRED_ENV_VARIABLES.md` to remove MongoDB references and document PostgreSQL-only requirement. |
| [CFG-002](configuration/CFG-002.md) | Sprint 1 | Resolved | Antigravity | Missing Undocumented Critical Variables | Added `UPSTASH_REDIS_REST_URL/TOKEN`, `CRON_SECRET`, `GROQ_API_KEY`, `BOOKING_COM_*` to `env.example` and docs. |
| [CFG-003](configuration/CFG-003.md) | Sprint 3 | Resolved | Antigravity | Optional Variables Incorrectly Required | `getPusherClient()` now returns `null` when keys absent. Null guards propagated to all 4 hook/page call-sites. System boots gracefully without Pusher. |
| [CFG-004](configuration/CFG-004.md) | Sprint 1 | Resolved | Antigravity | Unsafe System Defaults (Cron, Groq) | Removed `dev-secret-key` fallback (night-audit fails closed 500). Removed `BUILD_PLACEHOLDER` from `groq.ts`; null guards added to `intent.ts`, `knowledge.ts`, `chat/messages/route.ts`. |
| [CFG-005](configuration/CFG-005.md) | Sprint 4 | Resolved | Antigravity | Differing Development vs. Production Behavior | Documented NextAuth `__Secure-` cookie prefix behavior and Vercel Edge instrumentation differences in `ALL_REQUIRED_ENV_VARIABLES.md`. |




