# SmartHotel Test & Coverage Audit (2025-11-09)

## Snapshot Overview
- **Unit tests (`tests/unit/`)**: 7 files covering validation, email templates, pricing, and rate limiting.
- **Integration tests (`tests/integration/`)**: 5 files focused on API surfaces (admin, bookings, rooms, health, restaurant).
- **E2E Playwright specs (`tests/e2e/`)**: 4 Chromium-based journeys (accessibility smoke, booking flow, guest booking, authenticated dashboard).
- **Load tests**: `tests/k6/booking-load-test.js` exists but is not wired into CI.

## Coverage Metrics (latest `coverage/coverage-final.json`)
| Metric | Covered | Total | Percentage |
|--------|---------|-------|------------|
| Statements | 219 | 6,463 | **3.39 %** |
| Lines | 219 | 6,463 | **3.39 %** |
| Branches | 90 | 3,091 | **2.91 %** |
| Functions | 26 | 1,450 | **1.79 %** |

> **Observation:** Current Jest/Istanbul coverage is minimal. E2E runs are not included in coverage aggregation, leaving major gaps in role-based workflows.

## Role Coverage Gaps
| Role | Automated Coverage | Notable Missing Scenarios |
|------|--------------------|---------------------------|
| Guest | Partial (booking-flow, guest-booking) | My-bookings history, restaurant orders, profile edits, notifications |
| Admin / Manager | Limited (user-journey dashboard smoke) | CRUD for rooms, tasks, staff, analytics filters, reporting exports |
| Kitchen / Staff | None | Order updates, inventory adjustments, task management |
| Support | None | Contact form triage, notification acknowledgement |

## Quality Dimensions Status
- **Accessibility**: Single `accessibility.spec.ts` smoke covers a handful of pages; missing axe scans for admin/staff consoles.
- **Console/Network hygiene**: Playwright specs do **not** fail on console errors or 4xx/5xx responses.
- **Performance**: No automated Lighthouse/Bundler regression checks.
- **Security**: Unit coverage for rate limiting exists; no automated XSS/CSRF probes.
- **Cross-browser**: Firefox-only smoke pass (manual run); WebKit blocked on macOS 12 frozen build; no mobile viewport coverage.
- **Data integrity**: Integration tests mock Prisma; no end-to-end verification of pagination, null data handling, or background jobs.

## Immediate Recommendations
1. Introduce role-based Playwright fixtures for admin, staff, and guest personas to unblock CRUD and notification tests.
2. Expand Jest coverage by adding unit tests for new modules (`lib/settings`, `lib/push-notifications`, analytics helpers).
3. Add console/network guards in Playwright `test.beforeEach`/`afterEach` to surface hidden regressions.
4. Wire `npm run test:coverage` to combine Jest + Playwright coverage and track progress in CI dashboards.
5. Create targeted accessibility suites for admin dashboard, booking management, and restaurant consoles.


