# Fix Tracker

| ID | Priority | Status | Owner | Title |
|---|---|---|---|---|
| [DB-001](database/DB-001.md) | Sprint 1 | Resolved | Antigravity | PostgreSQL / MongoDB Configuration Mismatch |
| [DB-002](database/DB-002.md) | Sprint 2 | Resolved | Antigravity | Dual Connection Pooling (Prisma + raw pg) |
| [DB-003](database/DB-003.md) | Sprint 1 | Open | Unassigned | Missing OTA Idempotency Constraints |
| [DB-004](database/DB-004.md) | Sprint 2 | Open | Unassigned | Missing Overlapping Assignments Constraints |
| [DB-005](database/DB-005.md) | Sprint 2 | Open | Unassigned | Missing Transactions for Outbox/Events |
| [DB-006](database/DB-006.md) | Sprint 1 | Open | Unassigned | Distributed Locking Bypassing DB Constraints |
| [DB-007](database/DB-007.md) | Sprint 3 | Open | Unassigned | Unsafe Soft Deletes vs Unique Constraints |
| [DB-008](database/DB-008.md) | Sprint 3 | Open | Unassigned | Missing Cascade Deletion Rules |
| [DB-009](database/DB-009.md) | Sprint 1 | Open | Unassigned | Nullable Multi-Tenant Fields (propertyId) |
| [DB-010](database/DB-010.md) | Sprint 2 | Open | Unassigned | Floating Point Currency Precision Loss |
| [API-001](api/API-001.md) | Sprint 1 | Open | Unassigned | Bookings Array Response Mismatch |
| [API-002](api/API-002.md) | Sprint 2 | Open | Unassigned | Flattened Room Models Mismatch |
| [API-003](api/API-003.md) | Sprint 1 | Open | Unassigned | Missing Complaints Schema Validation |
| [API-004](api/API-004.md) | Sprint 1 | Open | Unassigned | Bookings Payload Disconnect (Zod Strip) |
| [API-005](api/API-005.md) | Sprint 2 | Open | Unassigned | Schema Relation Crash (DELETE room) |
| [API-006](api/API-006.md) | Sprint 3 | Open | Unassigned | Varying HTTP Status Codes for AuthZ |
| [API-007](api/API-007.md) | Sprint 3 | Open | Unassigned | Inconsistent Zod Error Formatting |
| [API-008](api/API-008.md) | Sprint 2 | Open | Unassigned | Public Room Details Missing Authentication |
| [API-009](api/API-009.md) | Sprint 1 | Open | Unassigned | Complaints IDOR Vulnerability |
| [API-010](api/API-010.md) | Sprint 1 | Open | Unassigned | Cross-Property Housekeeping IDOR |
| [API-011](api/API-011.md) | Sprint 2 | Open | Unassigned | Orphaned Complaint Bindings |
| [BOOK-001](booking/BOOK-001.md) | Sprint 1 | Open | Unassigned | Lock Bypassing Race Condition (Double Bookings) |
| [BOOK-002](booking/BOOK-002.md) | Sprint 1 | Open | Unassigned | Idempotency Key Poisoning (Soft-lock) |
| [BOOK-003](booking/BOOK-003.md) | Sprint 2 | Open | Unassigned | Orphaned Stripe Payments Creation |
| [BOOK-004](booking/BOOK-004.md) | Sprint 1 | Open | Unassigned | Desynchronized Distributed State (Redis/DB Rollback) |
| [BOOK-005](booking/BOOK-005.md) | Sprint 3 | Open | Unassigned | Silent Notification Loss (SMTP) |
| [PAY-001](payments/PAY-001.md) | Sprint 1 | Open | Unassigned | Hard Crash on Refund Webhooks (Missing roomId) |
| [PAY-002](payments/PAY-002.md) | Sprint 2 | Open | Unassigned | Orphaned Payment Intents (Partial Failure) |
| [PAY-003](payments/PAY-003.md) | Sprint 1 | Open | Unassigned | Out-of-Order Webhook Overwrites |
| [PAY-004](payments/PAY-004.md) | Sprint 2 | Open | Unassigned | Non-Idempotent Captures and Refunds |
| [PAY-005](payments/PAY-005.md) | Sprint 2 | Open | Unassigned | Webhook Deduplication Bypass (Redis Fail-Open) |
| [PMS-001](pms/PMS-001.md) | Sprint 1 | Open | Unassigned | Room Assignment vs. Stay Desynchronization |
| [PMS-002](pms/PMS-002.md) | Sprint 1 | Open | Unassigned | Double-Entry Ledger Bypass (Night Audit) |
| [PMS-003](pms/PMS-003.md) | Sprint 1 | Open | Unassigned | Financial Engine In-Memory State Loss |
| [PMS-004](pms/PMS-004.md) | Sprint 2 | Open | Unassigned | Broken No-Show Processing |
| [PMS-005](pms/PMS-005.md) | Sprint 2 | Open | Unassigned | Audit Log Attribution Forgery |
| [INT-001](integrations/INT-001.md) | Sprint 1 | Open | Unassigned | Booking.com Unauthenticated Webhooks |
| [INT-002](integrations/INT-002.md) | Sprint 1 | Open | Unassigned | Booking.com Concurrency Overbooking |
| [INT-003](integrations/INT-003.md) | Sprint 2 | Open | Unassigned | Booking.com Missing Lifecycle Orchestration |
| [INT-004](integrations/INT-004.md) | Sprint 2 | Open | Unassigned | Pusher Synchronous Crashing in Webhooks |
| [INT-005](integrations/INT-005.md) | Sprint 3 | Open | Unassigned | Pusher Missing Environment Fail-safes |
| [INT-006](integrations/INT-006.md) | Sprint 3 | Open | Unassigned | SMTP Silent Dropping of Critical Notifications |
| [INT-007](integrations/INT-007.md) | Sprint 2 | Open | Unassigned | Groq API Key Fallback Vulnerability |
| [INT-008](integrations/INT-008.md) | Sprint 3 | Open | Unassigned | Groq Stream Exception Swallowing |
| [INT-009](integrations/INT-009.md) | Sprint 3 | Open | Unassigned | Cloudinary Ghost Integration |
| [INT-010](integrations/INT-010.md) | Sprint 2 | Open | Unassigned | Redis Bypass on Disconnect |
| [CFG-001](configuration/CFG-001.md) | Sprint 1 | Open | Unassigned | PostgreSQL / MongoDB Fatal Mismatch |
| [CFG-002](configuration/CFG-002.md) | Sprint 1 | Open | Unassigned | Missing Undocumented Critical Variables |
| [CFG-003](configuration/CFG-003.md) | Sprint 3 | Open | Unassigned | Optional Variables Incorrectly Required |
| [CFG-004](configuration/CFG-004.md) | Sprint 1 | Open | Unassigned | Unsafe System Defaults (Cron, Groq) |
| [CFG-005](configuration/CFG-005.md) | Sprint 4 | Open | Unassigned | Differing Development vs. Production Behavior |
