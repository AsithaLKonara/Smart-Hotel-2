# 🧪 SmartHotel Testing Guide

## **Overview**

SmartHotel uses a comprehensive testing strategy with multiple layers of testing to ensure reliability, security, and performance. This guide covers how to run tests, write new tests, and integrate with Cursor IDE + AI.

## **Testing Stack**

- **Unit Tests**: Jest + React Testing Library + TypeScript
- **Integration Tests**: Jest + MongoDB Memory Server + Supertest
- **E2E Tests**: Playwright with accessibility testing
- **Performance Tests**: k6 load testing
- **Security Tests**: Snyk + CodeQL + Dependency scanning
- **Visual Regression**: Playwright snapshots

## **Quick Start**

### **Run All Tests**
```bash
npm run test:all        # Unit + Integration + E2E
npm run test:unit       # Unit tests only
npm run test:integration # Integration tests only
npm run test:e2e        # E2E tests only
npm run test:load       # Performance tests
npm run test:security   # Security tests
```

### **Development Workflow**
```bash
npm run test:watch      # Watch mode for unit tests
npm run test:e2e:ui     # Playwright UI mode
npm run test:coverage   # Coverage report
```

## **Test Structure**

```
tests/
├── unit/              # Unit tests (Jest)
├── integration/       # API integration tests
├── e2e/              # End-to-end tests (Playwright)
├── k6/               # Performance tests
├── fixtures/         # Test data and seed scripts
└── config/           # Test configuration
```

## **Writing Tests with Cursor AI**

### **1. Generate Unit Tests**
Open any component or utility file in Cursor and ask:
```
"Generate Jest unit tests for this component covering all props and user interactions"
```

### **2. Generate E2E Tests**
For user flows, ask Cursor:
```
"Create a Playwright test for the booking flow including form validation and payment simulation"
```

### **3. Fix Failing Tests**
When tests fail, select the error and ask:
```
"Fix this failing test - suggest a code patch and explain the change"
```

## **Test Categories**

### **Unit Tests** (Fast, < 5s)
- Component rendering and props
- Utility functions
- Validation schemas (Zod)
- Business logic

**Example:**
```typescript
// tests/unit/booking-validation.test.ts
import { z } from 'zod'

describe('Booking Validation', () => {
  it('should accept valid booking data', () => {
    const validBooking = {
      userId: 'user-123',
      roomId: 'room-456',
      checkIn: '2025-10-01',
      checkOut: '2025-10-03',
    }
    expect(() => bookingSchema.parse(validBooking)).not.toThrow()
  })
})
```

### **Integration Tests** (Medium, < 30s)
- API routes with database
- Authentication flows
- External service mocking
- Database operations

**Example:**
```typescript
// tests/integration/bookings.api.test.ts
describe('Bookings API', () => {
  it('should create a new booking', async () => {
    const bookingData = { /* test data */ }
    const response = await request(app)
      .post('/api/bookings')
      .send(bookingData)
      .expect(201)
    
    expect(response.body).toHaveProperty('id')
  })
})
```

### **E2E Tests** (Slow, < 2min)
- Complete user journeys
- Cross-browser testing
- Accessibility validation
- Payment flows

**Example:**
```typescript
// tests/e2e/booking-flow.spec.ts
test('guest can search and book a room', async ({ page }) => {
  await page.goto('/rooms')
  await page.fill('input[name="checkIn"]', '2025-10-01')
  await page.click('button:has-text("Book Now")')
  
  // Accessibility check
  const accessibilityScan = await new AxeBuilder({ page }).analyze()
  expect(accessibilityScan.violations).toEqual([])
})
```

## **CI/CD Integration**

### **GitHub Actions Workflow**
- **Unit Tests**: Run on every PR
- **Integration Tests**: Run on every PR with MongoDB service
- **E2E Tests**: Run on main branch and PRs
- **Security Tests**: Daily scans with Snyk
- **Performance Tests**: Weekly load tests

### **Coverage Requirements**
- **Unit Tests**: 70% minimum coverage
- **Integration Tests**: Critical paths covered
- **E2E Tests**: All user journeys covered

## **Test Data Management**

### **Fixtures**
```typescript
// tests/fixtures/seed.ts
export const testUsers = {
  admin: {
    id: 'test-admin-1',
    email: 'admin@smarthotel.test',
    role: 'SUPER_ADMIN',
  }
}
```

### **Database Isolation**
- Each test suite uses MongoDB Memory Server
- Automatic cleanup after tests
- Deterministic test data

## **Performance Testing**

### **k6 Load Tests**
```bash
npm run test:load
```

**Thresholds:**
- Response time: 95th percentile < 2s
- Error rate: < 10%
- Success rate: > 90%

## **Security Testing**

### **Automated Scans**
```bash
npm run test:security  # Snyk vulnerability scan
npm run security:audit # npm audit
```

### **Code Quality**
- ESLint + TypeScript checks
- CodeQL static analysis
- Secret scanning

## **Accessibility Testing**

### **Automated a11y Checks**
Every E2E test includes accessibility validation:
```typescript
const accessibilityScan = await new AxeBuilder({ page }).analyze()
expect(accessibilityScan.violations).toEqual([])
```

## **Debugging Tests**

### **Playwright Debug Mode**
```bash
npm run test:e2e:ui    # Interactive UI
npx playwright test --debug  # Debug mode
```

### **Jest Debug**
```bash
npm run test:watch     # Watch mode
npm test -- --verbose  # Verbose output
```

### **Test Reports**
- **Coverage**: HTML report in `coverage/`
- **Playwright**: HTML report in `playwright-report/`
- **k6**: JSON results in `k6-results.json`

## **Best Practices**

### **Test Naming**
- Use descriptive test names
- Follow: "should [expected behavior] when [condition]"
- Group related tests with `describe`

### **Test Isolation**
- Each test should be independent
- Use `beforeEach`/`afterEach` for setup/cleanup
- Mock external dependencies

### **Data Attributes**
Use `data-testid` for stable selectors:
```tsx
<button data-testid="book-room-button">Book Now</button>
```

### **Cursor AI Prompts**

**Generate Component Tests:**
```
"Generate Jest unit tests for the BookingForm component covering validation, submit handling, and error states"
```

**Fix Failing Tests:**
```
"This test is failing with 'Element not found'. Suggest fixes for the selector and add proper wait conditions"
```

**Create E2E Scenarios:**
```
"Create a Playwright test for the complete booking flow from room search to payment confirmation"
```

## **Troubleshooting**

### **Common Issues**

**Tests hanging:**
- Check for unclosed database connections
- Ensure proper cleanup in `afterEach`

**Flaky E2E tests:**
- Add proper wait conditions
- Use `data-testid` selectors
- Mock external services

**Coverage too low:**
- Add tests for edge cases
- Test error conditions
- Cover utility functions

### **Environment Setup**
```bash
# Install all dependencies
npm install

# Install Playwright browsers
npx playwright install

# Set up test database
npm run db:push
```

## **Monitoring & Reporting**

### **Test Metrics**
- Coverage trends
- Test execution time
- Flaky test detection
- Security vulnerability count

### **CI Integration**
- GitHub Actions with parallel jobs
- Test result summaries
- Artifact uploads for debugging

---

**Need help?** Use Cursor AI to generate tests, fix failures, or explain test patterns!
