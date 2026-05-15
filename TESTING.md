# SmartHotel OS — Testing & Verification Strategy

## 1. Testing Philosophy
SmartHotel OS adheres to the **Testing Trophy** model, emphasizing integration and E2E tests to verify critical business flows (Bookings, Payments, Operations) while using unit tests for complex logic (Pricing, RBAC).

---

## 2. Test Tiers

### A. Unit Tests (Jest)
- **Location**: `tests/unit/*.test.ts`
- **Scope**: Isolated logic, helpers, and state machines.
- **Key Targets**: `price-calculation.ts`, `rbac-helpers.ts`, `inventory-lock.ts`.
- **Command**: `npm run test:unit`

### B. Integration Tests (Jest + MongoDB Memory Server)
- **Location**: `tests/integration/*.test.ts`
- **Scope**: API endpoints and service-layer interactions.
- **Mocking**: Database is mocked using an in-memory MongoDB instance. Realtime (Pusher) and Payments (Stripe) are mocked.
- **Command**: `npm run test:integration`

### C. E2E Tests (Playwright)
- **Location**: `tests/e2e/*.spec.ts`
- **Scope**: Critical user journeys across all roles.
- **Environment**: Runs against a local dev server or production-like staging environment.
- **Command**: `npm run test:e2e`

---

## 3. Specialized Testing

### Concurrency Testing
- **Script**: `scripts/load-test.ts`
- **Objective**: Simulates multiple simultaneous bookings for the same room to verify lock integrity.
- **Verification**: Ensure zero double-bookings occur and exactly one actor wins the lock.

### Real-time Synchronization Testing
- **E2E Test**: `tests/e2e/realtime/sync.spec.ts`
- **Objective**: Verify that a status change in the Kitchen dashboard instantly reflects in the Guest UI.

### Security & RBAC Audit
- **Script**: `scripts/security-audit.js`
- **Objective**: Attempts to access every administrative endpoint with a `GUEST` session to verify default-deny middleware.

---

## 4. Test Infrastructure
- **Fixtures**: Standardized test data in `tests/fixtures/seed.ts`.
- **Helpers**: Reusable auth and room helpers in `tests/helpers/`.
- **CI**: Integrated via GitHub Actions (`.github/workflows/test.yml`).

---

## 5. Execution Guidelines
- **Local**: Run `npm run test:qa:full` before pushing to verify the complete suite.
- **Environment**: Ensure `.env.test` is configured with appropriate mock keys.
