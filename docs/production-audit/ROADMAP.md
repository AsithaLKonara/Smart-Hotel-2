# Remediation Roadmap

## Sprint 1: Security & Core Stability
Focus: Fixing unauthenticated endpoints, race conditions, and catastrophic boot/financial failures.
- INT-001: Booking.com Unauthenticated Webhooks
- BOOK-001: Lock Bypassing Race Condition
- DB-001 & CFG-001: Database Configuration Mismatch
- PMS-002: Double-Entry Ledger Bypass
- DB-009: Nullable Multi-Tenant Fields
- API-009: Complaints IDOR Vulnerability
- API-010: Cross-Property Housekeeping IDOR

## Sprint 2: Data Integrity & Integration Resilience
Focus: Fixing partial transaction failures, orphaned records, and webhook desynchronization.
- PAY-002: Orphaned Payment Intents
- DB-005: Missing Transactions for Outbox/Events
- INT-004: Pusher Synchronous Crashing in Webhooks
- DB-010: Floating Point Currency Precision Loss
- PMS-004: Broken No-Show Processing

## Sprint 3: Cleanup & Refinement
Focus: Error formatting, safe soft deletes, graceful degradation.
- API-006: Varying HTTP Status Codes for AuthZ
- INT-006: SMTP Silent Dropping of Critical Notifications
- DB-007: Unsafe Soft Deletes vs Unique Constraints
