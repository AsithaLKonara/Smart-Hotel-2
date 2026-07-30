# SmartHotel OS Final Enterprise E2E Certification Plan

This document serves as the master QA and SRE runbook for the SmartHotel Enterprise ERP platform.

## Testing Stack
- Playwright
- TypeScript
- PostgreSQL Test Database
- Prisma Test Environment
- MSW (Mock External APIs)
- Docker Compose
- GitHub Actions CI
- Sentry Test Monitoring

## Test Architecture
```text
tests/e2e
├── auth/          # Login, Sessions, Password
├── rbac/          # SuperAdmin, Manager, Receptionist, Staff
├── booking/       # Reservation, Availability, Checkout
├── pos/           # Ordering, Kitchen, Payments
├── inventory/     # Stock, Procurement
├── finance/       # Folio, Accounting
├── hr/            # Attendance, Payroll
├── ota/           # Webhook, Sync
├── analytics/     # OLAP
├── sre/           # Monitoring
├── security/      # CSRF, Injection
└── performance/   # Load
```

## PHASE 0: Test Environment Certification
Every test suite must execute in total isolation against a seeded test database (`smarthotel_test_db`).
**Flow:** Database reset → Seed realistic hotel data → Execute workflow → Validate database state → Cleanup

**Seed Target:** 100 Rooms, 20 Employees, 50 Products, Vendors, Tax Rules, Payment Methods, OTA Channels, Users.

## PHASE 1: Authentication E2E
**Login Flow:** Validate session creation, role permissions loading, and dashboard redirects.
**Invalid Login:** Verify rejections for wrong passwords, unknown emails, locked accounts, and expired sessions.
**Session Security:** Enforce Cookie flags (HttpOnly, Secure, SameSite, Expiration).

## PHASE 2: Complete RBAC Certification
Matrix testing across all 5 roles: `SUPER_ADMIN`, `MANAGER`, `RECEPTIONIST`, `STAFF`, `GUEST`.
**Validation:** API protections, UI visibility, mutation privileges, and deliberate privilege escalation attacks (403 Forbidden expectations).

## PHASE 3: Reservation Lifecycle E2E
**Guest Booking:** Search → Select → Details → Confirm → Reservation → Folio → Confirmation.
**Concurrency:** Duplicate booking protection (two users booking same room/dates must result in exactly one failure).
**Modifications:** Verify pricing recalculations upon date/guest changes.
**Cancellation:** Validate availability restoration, folio updates, and refunds.

## PHASE 4: Check-In / Check-Out Certification
**Check-In:** Reception approval flips room from AVAILABLE to OCCUPIED.
**Check-Out:** Calculate charges → Apply payments → Close folio → Room marked DIRTY → Housekeeping task generated.

## PHASE 5: POS Complete Money Flow
**Restaurant:** Create Order → Kitchen Receive → Prepare → Complete → Payment → Receipt → Inventory Deduction → Accounting Entry.
**Failures:** Payment failures must trigger Order rollback, Inventory rollback, and bypass accounting entries.

## PHASE 6: Procurement Workflow
Vendor → Purchase Order → Approve → Receive Goods → Inventory Update → Vendor Invoice → Payment → Accounting.
**Partial Receiving:** Ordered 100 → Received 60 → Expected 40 Pending.

## PHASE 7: Payroll System
Employee → Attendance → Shift → Payroll Run → Salary Calculation → Approval → Payment.
**Modifiers:** Overtime, deductions, bonuses, taxes, missing attendance handling.

## PHASE 8: Accounting / Folio Testing
**Charge:** POS injection into Folio.
**Adjustment:** Manager authorized adjustments.
**Write Off:** Restricted to Admin roles.
**Refund:** Payment gateway reversals.

## PHASE 9: Inventory Integrity
**Sources:** POS, Procurement, Manual Adjustment, Waste, Transfer.
**Rule:** No negative inventory permitted. Race conditions handled safely via PostgreSQL row-locks.

## PHASE 10: Yield Pricing Engine
**Dynamic Hooks:** Price increase on 90% Occupancy, Weekends, Holidays, High Demand.
**Discount Hooks:** Promotions on low occupancy.

## PHASE 11: OTA Integration Testing
**Webhook:** Payload → Signature Verified → Reservation Created → Inventory Updated → Notification.
**Attacks:** Invalid HMAC signatures rejected. Replay attacks ignored idempotently.

## PHASE 12: Background Jobs
**Cron:** Night audit at 11:59 PM generates daily reports.
**SLA:** Overdue room cleaning generates automated alerts.

## PHASE 13: Analytics / OLAP Validation
Deterministic revenue assertions (Room: 100K + Restaurant: 50K = Dashboard: 150K).
**Metrics:** Revenue, Occupancy, ADR, RevPAR, Expenses, Payroll.

## PHASE 14: Security E2E
Automated payload attacks ensuring no execution for XSS (`<script>`), CSRF, SQL Injection, or IDOR (e.g., swapping `/booking/123` to `/124`).

## PHASE 15: UI/UX Production Tests
**Responsive:** Desktop (1920x1080, 1440x900), Tablet (768x1024), Mobile (390x844).
**Checks:** No overflow, broken tables, console errors, hydration errors. Verification of dark mode, loading/empty/error states.

## PHASE 16: Performance Testing
Playwright + Lighthouse load simulation.
**Targets:** Dashboard LCP < 2.5s, API P95 < 500ms, DB Queries < 1s.
**Load:** Small (50 concurrent), Medium (250 concurrent), Enterprise (1000 concurrent).

---

### FINAL RELEASE GATE
Production deployment only allowed if:
- ✅ 100% E2E workflows passing
- ✅ 90%+ critical code coverage
- ✅ Zero High security issues
- ✅ Zero failed migrations
- ✅ Zero TypeScript errors
- ✅ Zero ESLint errors
- ✅ Zero mocked business logic
- ✅ Database backup/restore tested
- ✅ Monitoring/Error tracking active
- ✅ CI/CD green
