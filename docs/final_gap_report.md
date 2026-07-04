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
- `/api/webhooks/stripe`
- `/api/webhooks/retry`
- `/api/webhooks/ota`
- `/api/test-simple`
- `/api/test-minimal`
- `/api/test-db-comprehensive`
- `/api/test-db`
- `/api/security/delivery-pass`
- `/api/rooms/check-availability`
- `/api/revenue/yield-engine`
*(and 65 more...)*

## 3. Business Logic & Transaction Gaps
*Critical issues regarding financial data integrity and RBAC.*

- **Critical Mutation Endpoints Analyzed**: 19

### Missing Database Transactions:
*The following endpoints likely perform multiple mutations but lack `$transaction` wrappers, risking partial updates:*
- app/api/restaurant/bookings/route.ts
- [x] app/api/payments/route.ts (Fixed: Added $transaction)
- [x] app/api/payments/terminal/route.ts (Fixed: Added $transaction)
- [x] app/api/payments/pre-auth/route.ts (Fixed: Added $transaction)
- [x] app/api/payments/[id]/route.ts (Fixed: Added $transaction)
- [x] app/api/night-audit/run/route.ts (Fixed: Added $transaction)
- [x] app/api/folios/routing/route.ts (Fixed: Added $transaction)
- [x] app/api/folios/post-charge/route.ts (Fixed: Added $transaction)
- app/api/bookings/[id]/folios/route.ts
- app/api/admin/accounting/night-audit/route.ts
- app/api/admin/accounting/folios/route.ts

### Missing Role-Based Access Control (RBAC):
*The following critical endpoints do not explicitly check user roles or permissions:*
- app/api/payments/route.ts
- app/api/payments/terminal/route.ts
- app/api/payments/pre-auth/route.ts
- app/api/payments/[id]/route.ts
- app/api/night-audit/run/route.ts
- app/api/folios/routing/route.ts
- app/api/folios/post-charge/route.ts
- app/api/folios/[folioId]/split-percentage/route.ts
- app/api/folios/[folioId]/currency-convert/route.ts
- app/api/cron/night-audit/roll-forward/route.ts
- app/api/bookings/route.ts
- app/api/bookings/group-rooming-list/route.ts
- app/api/bookings/active/route.ts
- app/api/bookings/[id]/folios/route.ts

## 4. Event Architecture & Async Processing
*Issues regarding background processing, real-time updates, and webhooks.*

### Missing Event Emissions (Webhooks / Pusher / Outbox):
- app/api/restaurant/bookings/route.ts
- app/api/payments/route.ts
- app/api/payments/terminal/route.ts
- app/api/payments/pre-auth/route.ts
- app/api/payments/[id]/route.ts
- app/api/night-audit/run/route.ts
- app/api/folios/routing/route.ts
- app/api/folios/post-charge/route.ts
- app/api/folios/[folioId]/split-percentage/route.ts
- app/api/bookings/group-rooming-list/route.ts
- app/api/bookings/[id]/route.ts
- app/api/bookings/[id]/folios/route.ts
- app/api/admin/bookings/[id]/checkout/route.ts
- app/api/admin/accounting/night-audit/route.ts
- app/api/admin/accounting/folios/route.ts

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
- app/onboarding/page.tsx:69 - key="completed"
- app/mobile/guest-super-app/page.tsx:190 - key="key"
- app/mobile/guest-super-app/page.tsx:266 - key="dining"
- app/mobile/guest-super-app/page.tsx:309 - key="valet"
- app/api/qr-codes/generate/route.ts:20 - Hardcoded URL: const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
- app/api/qr-codes/generate/route.ts:80 - Hardcoded URL: const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
- app/api/auth/forgot-password/route.ts:45 - Hardcoded URL: const resetUrl = `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`
- components/ui/sparkline-chart.tsx:24 - dataKey="value"
- components/ui/optimized-image.tsx:171 - key="error"
- components/ui/optimized-image.tsx:177 - key="loading"

## 6. Executive Summary & Recommendations

1. **Data Integrity**: Implement Prisma transactions across all payment and folio endpoints immediately to prevent financial discrepancies.
2. **Security**: Audit the 14 critical endpoints missing explicit RBAC checks.
3. **Dead Code**: Remove or connect the 75 orphan API endpoints.
4. **Readiness**: Address the 24 hardcoded values (URLs/secrets) before deploying to production.
5. **Event-Driven Architecture**: The system lacks robust outbox/dead-letter queue patterns for critical async tasks like night audits and webhook processing.
