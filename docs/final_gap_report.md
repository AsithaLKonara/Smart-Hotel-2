# SmartHotel OS - Enterprise Code Audit Final Gap Report

## 1. System Scale Overview
- **Database Models**: 100
- **API Endpoints**: 186
- **UI Pages**: 116
- **UI Components**: 117

## 2. API <-> UI Gap Analysis
*Critical issues regarding disconnected functionality.*

- **Used Endpoints**: 132
- **Potentially Unused/Disconnected Endpoints**: 75

### Top 10 Disconnected Endpoints (Orphans):
- [x] `/api/webhooks/stripe` (Fixed: False Positive, invoked by external webhook)
- [x] `/api/webhooks/retry` (Fixed: False Positive, invoked by CRON scheduler)
- [x] `/api/webhooks/ota` (Fixed: False Positive, invoked by external OTA channels)
- [x] `/api/test-simple` (Fixed: Deleted dead test code)
- [x] `/api/test-minimal` (Fixed: Deleted dead test code)
- [x] `/api/test-db-comprehensive` (Fixed: Deleted dead test code)
- [x] `/api/test-db` (Fixed: Deleted dead test code)
- [x] `/api/security/delivery-pass` (Fixed: Built UI tab in Guest Super App)
- [x] `/api/rooms/check-availability` (Fixed: Built availability checker in Receptionist UI)
- [x] `/api/revenue/yield-engine` (Fixed: False Positive, invoked by CRON scheduler)
### Remaining 65 Disconnected Endpoints (Orphans):
- [x] `/api/accounting/commissions/settle` (Fixed: False Positive, invoked by CRON scheduler)
- [x] `/api/accounting/shift-reconciliation` (Fixed: Built Close Shift UI in Receptionist page)
- [x] `/api/accounting/owner-split/[folioId]` (Fixed: False Positive, invoked by Night Audit)
- [x] `/api/payments/pre-auth` (Fixed: Built Pre-Auth Card UI in Room Action Desk)
- [x] `/api/payments/terminal` (Fixed: Built Physical Terminal trigger UI in Room Action Desk)
- [x] `/api/payments` (Fixed: Built Payments Ledger Dashboard)
- [x] `/api/payments/[id]` (Fixed: Built Payments Ledger Dashboard)
- [x] `/api/housekeeping/inspection` (Fixed: Integrated Supervisor Inspection in Housekeeping Board)
- [x] `/api/folios/[folioId]/currency-convert` (Fixed: Built Folio Tools in Payments Ledger)
- [x] `/api/folios/[folioId]/split-percentage` (Fixed: Built Folio Tools in Payments Ledger)
- [x] `/api/bookings/group-rooming-list` (Fixed: Added CSV Import button to Bookings page)
- [x] `/api/bookings/[id]/folios` (Fixed: Added View Folios button to Room Action Desk)
- [x] `/api/invoices/[id]/receipt` (Fixed: Added Download Receipt PDF generator to Room Action Desk)
- [x] `/api/auth/_log` (Fixed: False Positive, internal NextAuth diagnostic endpoint)
- [x] `/api/auth/session` (Fixed: False Positive, internal NextAuth session check)
- [x] `/api/reservations/cross-sell` (Fixed: False Positive, Guest App cross-sell integration)
- [x] `/api/health/ready` (Fixed: False Positive, K8s Readiness Probe)
- [x] `/api/health/live` (Fixed: False Positive, K8s Liveness Probe)
- [x] `/api/admin/housekeeping/rooms` (Fixed: Added Live Room Status tab to Housekeeping Board)
- [x] `/api/admin/bookings/[id]/checkout` (Fixed: Wired into Room Action Desk Check Out process)
- [x] `/api/admin/pos/products` (Fixed: Added 'Add Custom Item' UI to POS Terminal)
- [x] `/api/admin/pos/outlets` (Fixed: Wired POS Terminal initialization to use this admin endpoint)
- [x] `/api/admin/pos/orders` (Fixed: Upgraded POS checkout flow to use advanced admin order processor)
- [x] `/api/admin/audit` (Fixed: Migrated Forensic Audit Console to scalable admin endpoint)
- [x] `/api/admin/users` (Fixed: Migrated Staff Directory to secure admin users endpoint)
- [x] `/api/admin/hr/attendance/[id]` (Fixed: Added Emergency Clock-Out UI to Shift Roster to handle locked payroll validations)
- [x] `/api/admin/events/blocks` (Fixed: Added Blocks tab in Events Dashboard to read/create group blocks)
- [x] `/api/admin/events/blocks/[id]` (Fixed: Added delete block functionality in Events Dashboard)
- [x] `/api/admin/events/spaces` (Fixed: Added Spaces tab in Events Dashboard to read/create event spaces)
- [x] `/api/admin/events/spaces/[id]` (Fixed: Added delete space functionality in Events Dashboard)
- [x] `/api/debug-env` (Fixed: False Positive, System diagnostic endpoint used for k8s/Vercel verification)
- [x] `/api/loyalty/redeem` (Fixed: Added Redeem Points action to CRM Guest Profile to credit Folios)
- [x] `/api/compliance/gdpr/forget-me` (Fixed: Added GDPR Forget Me action to CRM Guest Profile)
- [x] `/api/feedback` (Fixed: Built Global Feedback Dashboard in CRM to list guest reviews)
- [x] `/api/feedback/[id]` (Fixed: Added delete review action to Global Feedback Dashboard)
- [x] `/api/iot/minibar-post` (Fixed: False Positive, IoT hardware webhook requiring secure API key)
- [x] `/api/frontdesk/vip-alerts` (Fixed: False Positive, Vercel cron job endpoint for daily VIP detection)
- [x] `/api/integrations/rate-parity` (Fixed: False Positive, Vercel cron job endpoint for rate scraping)
- [x] `/api/integrations/booking-com/webhook` (Fixed: False Positive, External OTA XML listener endpoint)
- [x] `/api/integrations/booking-com/sync` (Fixed: Wired up Global Sync button in OTA Manager Dashboard)
- [x] `/api/integrations/ocr` (Fixed: Added Scan ID / Passport (OCR) button to Walk-In Booking modal)
- [x] `/api/integrations/door-locks` (Fixed: Added Encode Keycard button to Room Action Desk for active bookings)
- [x] `/api/integrations/rate-shopper` (Fixed: False Positive, Yield Management/Rate Shopper external webhook)
- [x] `/api/integrations/channel-manager` (Fixed: False Positive, HTNG/OTA XML webhook receiver for Siteminder/Cloudbeds)
- [x] `/api/integrations/pos/charge` (Fixed: False Positive, physical POS terminal hardware webhook)
- [x] `/api/integrations/exchange-rates` (Fixed: False Positive, Vercel cron job with Bearer token auth for currency sync)
- [x] `/api/integrations/fiscal-printer` (Fixed: Added Fiscal Sign Invoice button in Accounting → Folio Tools)
- [x] `/api/inventory/[id]/adjust` (Fixed: Added Adjust Stock action button to each inventory row)
- [x] `/api/guest/qr-compendium` (Fixed: Added QR Compendium button in Room Action Desk → Guest Info tab)
- [x] `/api/guest/digital-key` (Fixed: Added Issue Digital Key button in Room Action Desk → Guest Info tab)
- [x] `/api/order-items` (Fixed: Wired GET into POS "View Order Items" panel — load by Order ID)
- [x] `/api/order-items/[id]` (Fixed: Wired DELETE into POS Order Items panel — remove line item from existing order)
- [x] `/api/events/book` (Fixed: Added "Book Attendance" button on each Event card in Events Dashboard)
- [x] `/api/pricing/quote` (Fixed: Added "Get Price Quote" button in Events Dashboard header)
- [x] `/api/communications/email` (Fixed: Added Email dispatch buttons in Room Action Desk → Guest Info tab)
- [x] `/api/cron/archive-db` (Fixed: False Positive, Vercel Cron with Bearer auth for 2yr soft-delete archiving)
- [x] `/api/cron/generate-preventive-maintenance` (Fixed: False Positive, Vercel Cron for quarterly AC maintenance tasks)
- [x] `/api/cron/night-audit/roll-forward` (Fixed: Added "Force Roll-Forward" button in Night Audit page for manual override)
- [x] `/api/cron/keepalive` (Fixed: False Positive, Vercel Cron every 15min to prevent DB sleep on free tier)
- [x] `/api/debug` (Fixed: Added "System Health" button in Night Audit page — shows DB/env status inline)

## 3. Business Logic & Transaction Gaps
*Critical issues regarding financial data integrity and RBAC.*

- **Critical Mutation Endpoints Analyzed**: 19

### Missing Database Transactions:
*The following endpoints likely perform multiple mutations but lack `$transaction` wrappers, risking partial updates:*
- [x] app/api/restaurant/bookings/route.ts (Fixed: Added $transaction)
- [x] app/api/payments/route.ts (Fixed: Added $transaction)
- [x] app/api/payments/terminal/route.ts (Fixed: Added $transaction)
- [x] app/api/payments/pre-auth/route.ts (Fixed: Added $transaction)
- [x] app/api/payments/[id]/route.ts (Fixed: Added $transaction)
- [x] app/api/night-audit/run/route.ts (Fixed: Added $transaction)
- [x] app/api/folios/routing/route.ts (Fixed: Added $transaction)
- [x] app/api/folios/post-charge/route.ts (Fixed: Added $transaction)
- [x] app/api/bookings/[id]/folios/route.ts (Fixed: Added $transaction)
- [x] app/api/admin/accounting/night-audit/route.ts (Fixed: Added $transaction)
- [x] app/api/admin/accounting/folios/route.ts (Fixed: Added $transaction)

### Missing Role-Based Access Control (RBAC):
*The following critical endpoints do not explicitly check user roles or permissions:*
- [x] app/api/payments/route.ts (Fixed: False Positive, already uses getRequestSession)
- [x] app/api/payments/terminal/route.ts (Fixed: Added RBAC)
- [x] app/api/payments/pre-auth/route.ts (Fixed: Added RBAC)
- [x] app/api/payments/[id]/route.ts (Fixed: False Positive, already uses getRequestSession with role validation)
- [x] app/api/night-audit/run/route.ts (Fixed: Added RBAC)
- [x] app/api/folios/routing/route.ts (Fixed: Added RBAC)
- [x] app/api/folios/post-charge/route.ts (Fixed: Added RBAC)
- [x] app/api/folios/[folioId]/split-percentage/route.ts (Fixed: Added RBAC)
- [x] app/api/folios/[folioId]/currency-convert/route.ts (Fixed: Added RBAC)
- [x] app/api/cron/night-audit/roll-forward/route.ts (Fixed: False Positive, uses token auth)
- [x] app/api/bookings/route.ts (Fixed: False Positive, intentional public OTA endpoint)
- [x] app/api/bookings/group-rooming-list/route.ts (Fixed: Added RBAC)
- [x] app/api/bookings/active/route.ts (Fixed: Added RBAC)
- [x] app/api/bookings/[id]/folios/route.ts (Fixed: Added RBAC)

## 4. Event Architecture & Async Processing
*Issues regarding background processing, real-time updates, and webhooks.*

### Missing Event Emissions (Webhooks / Pusher / Outbox):
- [x] app/api/restaurant/bookings/route.ts (Fixed: Added realtime triggers)
- [x] app/api/payments/route.ts (Fixed: Added realtime triggers)
- [x] app/api/payments/terminal/route.ts (Fixed: Added realtime triggers)
- [x] app/api/payments/pre-auth/route.ts (Fixed: Added realtime triggers)
- [x] app/api/payments/[id]/route.ts (Fixed: Added realtime triggers)
- [x] app/api/night-audit/run/route.ts (Fixed: Added realtime triggers)
- [x] app/api/folios/routing/route.ts (Fixed: Added realtime triggers)
- [x] app/api/folios/post-charge/route.ts (Fixed: Added realtime triggers)
- [x] app/api/folios/[folioId]/split-percentage/route.ts (Fixed: Added realtime triggers)
- [x] app/api/bookings/group-rooming-list/route.ts (Fixed: Added realtime triggers)
- [x] app/api/bookings/[id]/route.ts (Fixed: Added realtime triggers)
- [x] app/api/bookings/[id]/folios/route.ts (Fixed: Added realtime triggers)
- [x] app/api/admin/bookings/[id]/checkout/route.ts (Fixed: Added realtime triggers)
- [x] app/api/admin/accounting/night-audit/route.ts (Fixed: Added realtime triggers)
- [x] app/api/admin/accounting/folios/route.ts (Fixed: Added realtime triggers)

- **Pusher Triggers Used**: 1
- **Webhook Emitters Used**: 11
- **Outbox Pattern Implementations**: 2
- **Dead Letter Queue Handling**: 3

## 5. Code Quality & Production Readiness
- **TODO Comments**: 0
- **FIXME Comments**: 0
- **Console Logs**: 35
- **Hardcoded Secrets/URLs**: 24

### Top 10 Hardcoded Secrets/URLs:
- [x] app/onboarding/page.tsx:69 - key="completed" (Fixed: False Positive, React key)
- [x] app/mobile/guest-super-app/page.tsx:190 - key="key" (Fixed: False Positive, React key)
- [x] app/mobile/guest-super-app/page.tsx:266 - key="dining" (Fixed: False Positive, React key)
- [x] app/mobile/guest-super-app/page.tsx:309 - key="valet" (Fixed: False Positive, React key)
- [x] app/api/qr-codes/generate/route.ts:20 (Fixed: Replaced localhost with dynamic origin)
- [x] app/api/qr-codes/generate/route.ts:80 (Fixed: Replaced localhost with dynamic origin)
- [x] app/api/auth/forgot-password/route.ts:45 (Fixed: Replaced localhost with dynamic origin)
- [x] components/ui/sparkline-chart.tsx:24 - dataKey="value" (Fixed: False Positive, Recharts prop)
- [x] components/ui/optimized-image.tsx:171 - key="error" (Fixed: False Positive, React key)
- [x] components/ui/optimized-image.tsx:177 - key="loading" (Fixed: False Positive, React key)

## 6. Executive Summary & Recommendations

1. **Data Integrity**: Implement Prisma transactions across all payment and folio endpoints immediately to prevent financial discrepancies.
2. **Security**: Audit the 14 critical endpoints missing explicit RBAC checks.
3. **Dead Code**: Remove or connect the 75 orphan API endpoints.
4. **Readiness**: Address the 24 hardcoded values (URLs/secrets) before deploying to production.
5. **Event-Driven Architecture**: The system lacks robust outbox/dead-letter queue patterns for critical async tasks like night audits and webhook processing.
