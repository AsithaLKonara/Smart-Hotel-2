const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, '../docs/production-audit');

const categories = [
  'database',
  'api',
  'booking',
  'payments',
  'pms',
  'integrations',
  'configuration',
  'scripts'
];

const incidents = [
  // Database
  {
    id: 'DB-001',
    category: 'database',
    title: 'PostgreSQL / MongoDB Configuration Mismatch',
    severity: 'P0 - Critical',
    description: 'The Prisma datasource is configured for PostgreSQL while the deployment documentation and env.example instruct operators to configure MongoDB. This causes the application to fail during startup or connect to an invalid database.',
    rootCause: 'Legacy MongoDB documentation was never updated after migration to PostgreSQL.',
    affectedComponents: 'prisma/schema.prisma\nenv.example\ndocs/archive/ALL_REQUIRED_ENV_VARIABLES.md',
    productionImpact: '- Production boot failure\n- Migration failures\n- Prisma initialization errors',
    howToReproduce: '1. Compare datasource provider.\n2. Verify DATABASE_URL.\n3. Run `npx prisma validate`\n4. Run `npx prisma migrate status`',
    fixGuide: 'Step 1: Update env.example\nStep 2: Update documentation\nStep 3: Remove MongoDB references\nStep 4: Run migration validation',
    validation: '- prisma validate passes\n- DATABASE_URL uses PostgreSQL\n- Documentation updated\n- Fresh install succeeds',
    regressionTests: '- Environment audit\n- Fresh deployment\n- Production startup',
    priority: 'Sprint 1',
    status: 'Open'
  },
  {
    id: 'DB-002',
    category: 'database',
    title: 'Dual Connection Pooling (Prisma + raw pg)',
    severity: 'P1 - High',
    description: 'The application uses both Prisma ORM and a raw `pg` pool (`DatabaseClient.runInTransaction`). Managing two separate connection pools increases the risk of connection starvation, deadlocks, and maximum connection exhaustion.',
    rootCause: 'Custom serialization transactions required raw SQL handling not initially supported or preferred via Prisma.',
    affectedComponents: 'lib/db/database-client.ts\nprisma/schema.prisma',
    productionImpact: '- Connection starvation\n- Deadlocks\n- Exhaustion of PostgreSQL max_connections',
    howToReproduce: 'Review `DatabaseClient.runInTransaction` usage alongside standard Prisma queries.',
    fixGuide: 'Step 1: Refactor raw `pg` queries to use Prisma `$executeRaw` or interactive transactions where possible.\nStep 2: Configure PgBouncer / Direct URL properly if dual pools are maintained.',
    validation: '- Verify single connection pool manager is used.\n- Monitor active connections during load test.',
    regressionTests: '- Load test API endpoints that hit both databases.',
    priority: 'Sprint 2',
    status: 'Open'
  },
  {
    id: 'DB-003',
    category: 'database',
    title: 'Missing OTA Idempotency Constraints',
    severity: 'P0 - Critical',
    description: '`Booking.otaReference` lacks a `@@unique` constraint. Concurrent webhook deliveries from external channels can bypass application-level checks and create duplicate bookings.',
    rootCause: 'Schema does not enforce compound uniqueness for third-party identifiers.',
    affectedComponents: 'prisma/schema.prisma (Booking model)\nlib/ota/webhook-handler.ts',
    productionImpact: '- Duplicate bookings created in database\n- Double-charging or double-reserving rooms',
    howToReproduce: 'Send two identical OTA webhooks simultaneously. Observe both creating a booking.',
    fixGuide: 'Step 1: Add `@@unique([otaReference])` or compound unique constraint to schema.\nStep 2: Run Prisma migration.\nStep 3: Update webhook handler to catch `PrismaClientKnownRequestError` (P2002) and treat as idempotent success.',
    validation: '- Attempt duplicate insertion manually and verify Prisma throws P2002.',
    regressionTests: '- OTA Webhook concurrency test',
    priority: 'Sprint 1',
    status: 'Open'
  },
  {
    id: 'DB-004',
    category: 'database',
    title: 'Missing Overlapping Assignments Constraints',
    severity: 'P1 - High',
    description: 'No database-level exclusion constraints exist to prevent overlapping `RoomAssignment` records. The application relies entirely on application-level `findFirst` checks.',
    rootCause: 'PostgreSQL exclusion constraints (GIST) are not natively supported by Prisma schema definition without raw SQL migrations.',
    affectedComponents: 'prisma/schema.prisma\nlib/services/StayService.ts',
    productionImpact: '- Two guests assigned to the same physical room on overlapping dates.',
    howToReproduce: 'Simulate concurrent room assignments bypassing the lock engine.',
    fixGuide: 'Step 1: Create a raw SQL migration to add a GIST exclusion constraint on RoomAssignment dates.\nStep 2: Update error handling to catch the specific constraint violation.',
    validation: '- Insert overlapping dates via raw SQL; expect constraint violation.',
    regressionTests: '- Room assignment integration tests.',
    priority: 'Sprint 2',
    status: 'Open'
  },
  {
    id: 'DB-005',
    category: 'database',
    title: 'Missing Transactions for Outbox/Events',
    severity: 'P1 - High',
    description: 'Background event dispatching (Outbox) is not always wrapped in the same transaction as the state mutation, risking dual-write failures (state updated, event dropped).',
    rootCause: 'Event publishing is decoupled from the main Prisma transaction closure in certain webhook handlers.',
    affectedComponents: 'app/api/webhooks/stripe/route.ts\nlib/reconciliation-worker.ts',
    productionImpact: '- System state changes but downstream integrations (PMS/Emails) are never notified.',
    howToReproduce: 'Simulate a crash immediately after `prisma.booking.update` but before `RealtimeEvents.emitBookingUpdated`.',
    fixGuide: 'Step 1: Implement the Transactional Outbox pattern by writing events to a `SyncLog` or `Outbox` table within the same Prisma transaction.\nStep 2: Create a worker to poll and publish these events.',
    validation: '- Verify events are written to the Outbox table in the same commit.',
    regressionTests: '- Booking lifecycle tests with simulated network failures.',
    priority: 'Sprint 2',
    status: 'Open'
  },
  {
    id: 'DB-006',
    category: 'database',
    title: 'Distributed Locking Bypassing DB Constraints',
    severity: 'P0 - Critical',
    description: '`InventoryLockEngine.acquireHold` executes outside the Prisma transaction. If the Node process crashes after acquiring Redis lock but before DB transaction, the lock is orphaned. Fallback DB locks also fail under high concurrency.',
    rootCause: 'Race condition between Redis lock acquisition and Database transaction commit.',
    affectedComponents: 'lib/inventory-lock.ts\napp/api/bookings/route.ts',
    productionImpact: '- Double bookings via OTA webhooks bypassing locks.\n- Artificial inventory depletion (orphaned locks).',
    howToReproduce: 'Execute `booking-concurrency-test.ts`.',
    fixGuide: 'Step 1: Move to PostgreSQL pessimistic locking (`SELECT ... FOR UPDATE`) or fix Redis lock fallback logic.\nStep 2: Ensure OTA webhooks utilize the lock engine.',
    validation: '- Concurrency test returns 0 double bookings.',
    regressionTests: '- `booking-concurrency-test.ts`',
    priority: 'Sprint 1',
    status: 'Open'
  },
  {
    id: 'DB-007',
    category: 'database',
    title: 'Unsafe Soft Deletes vs Unique Constraints',
    severity: 'P2 - Medium',
    description: '`deletedAt` is not factored into unique constraints. Soft-deleting a user/booking prevents that email or code from ever being used again.',
    rootCause: 'Prisma unique constraints apply globally across all rows, ignoring `deletedAt != null`.',
    affectedComponents: 'prisma/schema.prisma',
    productionImpact: '- Users cannot re-register after account deletion.\n- Confirmation codes cannot be reused.',
    howToReproduce: 'Soft delete a user. Try to register a new user with the same email.',
    fixGuide: 'Step 1: Modify unique constraints to compound with `deletedAt`, or use Partial Indexes in raw SQL.',
    validation: '- Successfully register a user with a soft-deleted email.',
    regressionTests: '- User registration flows.',
    priority: 'Sprint 3',
    status: 'Open'
  },
  {
    id: 'DB-008',
    category: 'database',
    title: 'Missing Cascade Deletion Rules',
    severity: 'P2 - Medium',
    description: 'Relational models lack `onDelete: Cascade`. Deleting a parent record leaves orphaned child records.',
    rootCause: 'Prisma schema defaults to Restrict/No Action.',
    affectedComponents: 'prisma/schema.prisma',
    productionImpact: '- Referential integrity bugs on frontend when fetching orphaned records.',
    howToReproduce: 'Delete a Booking. Check if Payments associated with it still exist.',
    fixGuide: 'Step 1: Add `onDelete: Cascade` to appropriate relations (e.g., Stay -> Booking).',
    validation: '- Verify child records are deleted when parent is deleted.',
    regressionTests: '- Database integrity tests.',
    priority: 'Sprint 3',
    status: 'Open'
  },
  {
    id: 'DB-009',
    category: 'database',
    title: 'Nullable Multi-Tenant Fields (propertyId)',
    severity: 'P0 - Critical',
    description: '`propertyId` is optional on critical models. Missing `propertyId` causes tenant data bleed.',
    rootCause: 'Schema evolved to support multi-tenancy without enforcing it retroactively.',
    affectedComponents: 'prisma/schema.prisma',
    productionImpact: '- Guests at Hotel A seeing bookings for Hotel B.',
    howToReproduce: 'Create a room without a propertyId. Query rooms by propertyId.',
    fixGuide: 'Step 1: Backfill missing `propertyId` values.\nStep 2: Make `propertyId` required in schema.',
    validation: '- Prisma schema validation passes with required field.',
    regressionTests: '- Multi-tenant data isolation tests.',
    priority: 'Sprint 1',
    status: 'Open'
  },
  {
    id: 'DB-010',
    category: 'database',
    title: 'Floating Point Currency Precision Loss',
    severity: 'P1 - High',
    description: 'Currency values are stored as `Float`, leading to IEEE 754 precision rounding errors (e.g., 0.1 + 0.2 = 0.30000000000000004).',
    rootCause: 'Prisma schema uses `Float` instead of `Decimal` or `Int` (cents).',
    affectedComponents: 'prisma/schema.prisma (FolioLineItem, Payment, Booking)',
    productionImpact: '- Financial reconciliation failures during Night Audits.',
    howToReproduce: 'Post charges that result in floating point errors and check folio totals.',
    fixGuide: 'Step 1: Migrate currency fields to `Decimal` in Prisma schema.\nStep 2: Update frontend to handle Decimal string conversions.',
    validation: '- Verify exact arithmetic on folio totals.',
    regressionTests: '- Night Audit calculations.',
    priority: 'Sprint 2',
    status: 'Open'
  },

  // API Contracts
  {
    id: 'API-001',
    category: 'api',
    title: 'Bookings Array Response Mismatch',
    severity: 'P1 - High',
    description: 'Frontend expects `Booking[]` but API returns `{ bookings: Booking[] }`. Frontend crashes calling array methods on the object.',
    rootCause: 'API refactored to wrap responses without updating frontend clients.',
    affectedComponents: 'lib/booking-api.ts\napp/api/bookings/route.ts',
    productionImpact: '- Complete failure to load user bookings page.',
    howToReproduce: 'Navigate to user bookings dashboard.',
    fixGuide: 'Step 1: Update `lib/booking-api.ts` to extract `.bookings` from the response JSON.',
    validation: '- User dashboard renders successfully.',
    regressionTests: '- Frontend E2E tests for booking dashboard.',
    priority: 'Sprint 1',
    status: 'Open'
  },
  {
    id: 'API-002',
    category: 'api',
    title: 'Flattened Room Models Mismatch',
    severity: 'P2 - Medium',
    description: '`GET /api/rooms/[id]` flattens `roomType` data, but frontend expects standard Prisma `Room` model with nested relations.',
    rootCause: 'Legacy compatibility in API response format.',
    affectedComponents: 'app/api/rooms/[id]/route.ts\nlib/booking-api.ts',
    productionImpact: '- Missing room details on frontend (undefined properties).',
    howToReproduce: 'Load single room details page.',
    fixGuide: 'Step 1: Update API to return nested relations matching Prisma schema, or update frontend types.',
    validation: '- Room details page renders correctly with all specs.',
    regressionTests: '- Room details E2E tests.',
    priority: 'Sprint 2',
    status: 'Open'
  },
  {
    id: 'API-003',
    category: 'api',
    title: 'Missing Complaints Schema Validation',
    severity: 'P1 - High',
    description: '`POST /api/complaints` lacks Zod schema validation, making it vulnerable to injection and invalid data types.',
    rootCause: 'Endpoint deployed quickly without robust input validation.',
    affectedComponents: 'app/api/complaints/route.ts',
    productionImpact: '- Database corruption via invalid enum states.\n- Potential NoSQL/SQL injection or large payload DoS.',
    howToReproduce: 'Send POST request with invalid status string.',
    fixGuide: 'Step 1: Implement Zod schema parsing for the request body.',
    validation: '- API rejects invalid payloads with 400 Bad Request.',
    regressionTests: '- Complaints API integration tests.',
    priority: 'Sprint 1',
    status: 'Open'
  },
  {
    id: 'API-004',
    category: 'api',
    title: 'Bookings Payload Disconnect (Zod Strip)',
    severity: 'P1 - High',
    description: 'Frontend sends nested `guestInfo`, but backend Zod expects flat keys (`guestName`). Zod silently strips the nested payload, creating bookings without guest details.',
    rootCause: 'Mismatched schema contracts between client and server.',
    affectedComponents: 'app/api/bookings/route.ts\napp/booking/page.tsx',
    productionImpact: '- Anonymous bookings created in the system without contact info.',
    howToReproduce: 'Submit booking from UI. Check DB to see guestName is null.',
    fixGuide: 'Step 1: Align frontend payload structure with backend Zod schema.',
    validation: '- Bookings are created with accurate guest details.',
    regressionTests: '- Checkout flow E2E tests.',
    priority: 'Sprint 1',
    status: 'Open'
  },
  {
    id: 'API-005',
    category: 'api',
    title: 'Schema Relation Crash (DELETE room)',
    severity: 'P2 - Medium',
    description: '`DELETE /api/rooms/[id]` checks for `roomId` on `Booking`, which doesn\'t exist (uses `roomAssignments`). Throws Prisma panic 500 instead of 400.',
    rootCause: 'Outdated Prisma query in the delete handler after schema evolution.',
    affectedComponents: 'app/api/rooms/[id]/route.ts',
    productionImpact: '- Unhandled 500 errors on admin delete operations.',
    howToReproduce: 'Attempt to delete a room that has active assignments.',
    fixGuide: 'Step 1: Update Prisma query to check `roomAssignments: { some: { roomId: id } }`.',
    validation: '- Returns correct 400 error message if room is in use.',
    regressionTests: '- Admin room management tests.',
    priority: 'Sprint 2',
    status: 'Open'
  },
  {
    id: 'API-006',
    category: 'api',
    title: 'Varying HTTP Status Codes for AuthZ',
    severity: 'P3 - Low',
    description: 'Role authorization failures inconsistently return 401 in PUT and 403 in PATCH for the same condition.',
    rootCause: 'Inconsistent developer practices across route handlers.',
    affectedComponents: 'app/api/rooms/[id]/route.ts',
    productionImpact: '- Confusing frontend error handling.',
    howToReproduce: 'Access PUT and PATCH routes without admin privileges.',
    fixGuide: 'Step 1: Standardize on 403 Forbidden for insufficient permissions.',
    validation: '- Both routes return 403.',
    regressionTests: '- RBAC integration tests.',
    priority: 'Sprint 3',
    status: 'Open'
  },
  {
    id: 'API-007',
    category: 'api',
    title: 'Inconsistent Zod Error Formatting',
    severity: 'P3 - Low',
    description: 'Validation failures return raw arrays (`error.errors`) in some routes and formatted objects (`error.format()`) in others.',
    rootCause: 'Lack of global error handling middleware.',
    affectedComponents: 'app/api/rooms/[id]/route.ts\napp/api/admin/housekeeping/rooms/route.ts',
    productionImpact: '- Frontend requires multiple error parsing logic trees.',
    howToReproduce: 'Trigger validation errors on both endpoints.',
    fixGuide: 'Step 1: Create a unified error response utility function.',
    validation: '- Consistent error shapes across API.',
    regressionTests: '- API error response tests.',
    priority: 'Sprint 3',
    status: 'Open'
  },
  {
    id: 'API-008',
    category: 'api',
    title: 'Public Room Details Missing Authentication',
    severity: 'P2 - Medium',
    description: '`GET /api/rooms/[id]` omits `getServerSession()`. Exposes internal operational statuses (DIRTY, MAINTENANCE) to the public.',
    rootCause: 'Endpoint intended for public catalog but leaks admin data.',
    affectedComponents: 'app/api/rooms/[id]/route.ts',
    productionImpact: '- Competitors or malicious actors can scrape operational health.',
    howToReproduce: 'Fetch endpoint without auth token.',
    fixGuide: 'Step 1: Strip operational fields (status, housekeeping notes) if session is unauthenticated.',
    validation: '- Unauthenticated request only returns public marketing data.',
    regressionTests: '- Endpoint visibility tests.',
    priority: 'Sprint 2',
    status: 'Open'
  },
  {
    id: 'API-009',
    category: 'api',
    title: 'Complaints IDOR Vulnerability',
    severity: 'P0 - Critical',
    description: 'Users can pass `?userId=TARGET-ID` to read other users\' complaints due to flawed query logic.',
    rootCause: 'Insufficient authorization checks on query parameters.',
    affectedComponents: 'app/api/complaints/route.ts',
    productionImpact: '- Severe data privacy breach (IDOR).',
    howToReproduce: 'Log in as Guest A, pass `?userId=GuestB` to the GET endpoint.',
    fixGuide: 'Step 1: Enforce `if (!isAdmin) { where.userId = session.user.id }` regardless of query params.',
    validation: '- Guest A receives 403 or only their own complaints when requesting Guest B.',
    regressionTests: '- Security/RBAC audit tests.',
    priority: 'Sprint 1',
    status: 'Open'
  },
  {
    id: 'API-010',
    category: 'api',
    title: 'Cross-Property Housekeeping IDOR',
    severity: 'P0 - Critical',
    description: 'Managers can update room statuses at properties they do not manage.',
    rootCause: 'Route verifies role but not property scope.',
    affectedComponents: 'app/api/admin/housekeeping/rooms/route.ts',
    productionImpact: '- Sabotage or accidental modification of other tenants\' data.',
    howToReproduce: 'Manager of Property A sends PUT request for Room ID of Property B.',
    fixGuide: 'Step 1: Validate that `room.propertyId === session.user.propertyId` before updating.',
    validation: '- Returns 403 if modifying cross-property.',
    regressionTests: '- Multi-tenant security tests.',
    priority: 'Sprint 1',
    status: 'Open'
  },
  {
    id: 'API-011',
    category: 'api',
    title: 'Orphaned Complaint Bindings',
    severity: 'P1 - High',
    description: 'API accepts `bookingId` to link complaint to stay, but fails to check if booking belongs to the user.',
    rootCause: 'Missing ownership validation on relation linking.',
    affectedComponents: 'app/api/complaints/route.ts',
    productionImpact: '- Malicious actors attaching severe complaints to other guests\' folios.',
    howToReproduce: 'Guest A posts complaint passing Guest B\'s `bookingId`.',
    fixGuide: 'Step 1: Verify `booking.primaryGuestId === session.user.id` before linking.',
    validation: '- Attempt to link to unowned booking returns 403.',
    regressionTests: '- Complaint creation tests.',
    priority: 'Sprint 2',
    status: 'Open'
  },

  // Booking
  {
    id: 'BOOK-001',
    category: 'booking',
    title: 'Lock Bypassing Race Condition (Double Bookings)',
    severity: 'P0 - Critical',
    description: 'Distributed lock system falls back to DB lock if Redis lock is held. However, it falls back before DB lock is established, allowing simultaneous execution.',
    rootCause: 'Flawed fallback logic in `InventoryLockEngine.acquireHold`.',
    affectedComponents: 'lib/inventory-lock.ts\napp/api/bookings/route.ts',
    productionImpact: '- Double bookings.',
    howToReproduce: 'Run `booking-concurrency-test.ts`.',
    fixGuide: 'Step 1: Fix fallback logic to poll Redis, or rely purely on PostgreSQL `SELECT ... FOR UPDATE`.',
    validation: '- Concurrency test passes.',
    regressionTests: '- Concurrency audit scripts.',
    priority: 'Sprint 1',
    status: 'Open'
  },
  {
    id: 'BOOK-002',
    category: 'booking',
    title: 'Idempotency Key Poisoning (Soft-lock)',
    severity: 'P1 - High',
    description: 'If a post-transaction step fails, idempotency key is deleted and 400 returned, but booking is committed. Retrying creates a DOUBLE_BOOKING error.',
    rootCause: 'Clearing idempotency key on partial failure instead of returning success with warnings.',
    affectedComponents: 'app/api/bookings/route.ts\napp/booking/page.tsx',
    productionImpact: '- Guests think booking failed, retry, get locked out, while reservation exists.',
    howToReproduce: 'Force `logAction` to fail. Observe 400 response. Retry booking.',
    fixGuide: 'Step 1: Do not clear idempotency key if DB transaction committed. Return 200 with partial failure flags.',
    validation: '- Booking succeeds on UI despite audit log failure.',
    regressionTests: '- Booking lifecycle tests with mocked partial failures.',
    priority: 'Sprint 1',
    status: 'Open'
  },
  {
    id: 'BOOK-003',
    category: 'booking',
    title: 'Orphaned Stripe Payments Creation',
    severity: 'P1 - High',
    description: 'Stripe PaymentIntent is created before Prisma `Payment` record. If DB insert fails, intent is orphaned in Stripe.',
    rootCause: 'Lack of distributed transaction between Stripe API and Prisma.',
    affectedComponents: 'app/api/bookings/route.ts\nlib/integrations/stripe-gateway.ts',
    productionImpact: '- Held funds in Stripe with no record in PMS. Massive reconciliation headaches.',
    howToReproduce: 'Mock Prisma to fail after Stripe creation. Observe intent in Stripe dashboard.',
    fixGuide: 'Step 1: Save `PaymentIntent` ID to a pending `Order` table *before* calling Stripe, or use Webhooks for async creation confirmation.',
    validation: '- No intents are created if DB fails first.',
    regressionTests: '- Payment initialization tests.',
    priority: 'Sprint 2',
    status: 'Open'
  },
  {
    id: 'BOOK-004',
    category: 'booking',
    title: 'Desynchronized Distributed State (Redis/DB Rollback)',
    severity: 'P0 - Critical',
    description: 'Redis lock is cleared inside Prisma transaction. If SQL `COMMIT` fails, DB rolls back but Redis does not.',
    rootCause: 'Executing non-transactional external side-effects inside a DB transaction closure.',
    affectedComponents: 'lib/inventory-lock.ts\napp/api/bookings/route.ts',
    productionImpact: '- Room inventory permanent desynchronization.',
    howToReproduce: 'Force Prisma commit failure. Observe Redis state.',
    fixGuide: 'Step 1: Execute Redis commands only *after* the Prisma transaction successfully resolves.',
    validation: '- Redis state matches DB after simulated rollback.',
    regressionTests: '- Lock lifecycle tests.',
    priority: 'Sprint 1',
    status: 'Open'
  },
  {
    id: 'BOOK-005',
    category: 'booking',
    title: 'Silent Notification Loss (SMTP)',
    severity: 'P2 - Medium',
    description: 'Emails and audit logs swallow errors and lack retry mechanisms. SMTP drops result in lost confirmations.',
    rootCause: 'No Outbox pattern or message queue.',
    affectedComponents: 'app/api/bookings/route.ts\nlib/email.ts',
    productionImpact: '- Guests do not receive confirmation emails. Staff unaware.',
    howToReproduce: 'Kill network connection to SMTP during booking.',
    fixGuide: 'Step 1: Implement BullMQ or DB-backed Outbox for async email processing.',
    validation: '- Emails are queued and retry on failure.',
    regressionTests: '- Email delivery tests.',
    priority: 'Sprint 3',
    status: 'Open'
  },

  // Payments
  {
    id: 'PAY-001',
    category: 'payments',
    title: 'Hard Crash on Refund Webhooks (Missing roomId)',
    severity: 'P0 - Critical',
    description: 'Webhook attempts to free room via `payment.booking.roomId`, which doesn\'t exist. Causes 500 panic.',
    rootCause: 'Outdated schema reference in Stripe webhook handler.',
    affectedComponents: 'app/api/webhooks/stripe/route.ts',
    productionImpact: '- Refunds fail to update DB. Stripe retries endlessly.',
    howToReproduce: 'Trigger a refund webhook via Stripe CLI.',
    fixGuide: 'Step 1: Update Prisma query to traverse `roomAssignments`.',
    validation: '- Webhook returns 200 and frees room.',
    regressionTests: '- Stripe webhook integration tests.',
    priority: 'Sprint 1',
    status: 'Open'
  },
  {
    id: 'PAY-002',
    category: 'payments',
    title: 'Orphaned Payment Intents (Partial Failure)',
    severity: 'P1 - High',
    description: 'Same as BOOK-003, localized to the payment logic.',
    rootCause: 'No distributed transaction.',
    affectedComponents: 'lib/integrations/stripe-gateway.ts',
    productionImpact: '- Unreconciled Stripe charges.',
    howToReproduce: 'N/A (Refer to BOOK-003)',
    fixGuide: 'Refer to BOOK-003.',
    validation: 'N/A',
    regressionTests: 'N/A',
    priority: 'Sprint 2',
    status: 'Open'
  },
  {
    id: 'PAY-003',
    category: 'payments',
    title: 'Out-of-Order Webhook Overwrites',
    severity: 'P1 - High',
    description: 'Stripe webhooks are processed without checking current DB state. A `payment_failed` arriving after `succeeded` will erroneously fail the booking.',
    rootCause: 'Lack of state machine constraints on webhook updates.',
    affectedComponents: 'app/api/webhooks/stripe/route.ts',
    productionImpact: '- Successful bookings marked as failed.',
    howToReproduce: 'Send `payment_failed` event after `succeeded` event.',
    fixGuide: 'Step 1: Ensure state transitions are strictly directional (e.g., cannot transition from `completed` to `failed`).',
    validation: '- Late `payment_failed` is ignored if status is already `completed`.',
    regressionTests: '- Webhook ordering tests.',
    priority: 'Sprint 1',
    status: 'Open'
  },
  {
    id: 'PAY-004',
    category: 'payments',
    title: 'Non-Idempotent Captures and Refunds',
    severity: 'P1 - High',
    description: 'Manual captures/refunds call Stripe without `idempotencyKey`. If DB fails, retries will attempt double-capture.',
    rootCause: 'Missing standard Stripe idempotency practices.',
    affectedComponents: 'lib/integrations/stripe-gateway.ts',
    productionImpact: '- Unrecoverable state desynchronization.',
    howToReproduce: 'Crash DB immediately after successful Stripe capture.',
    fixGuide: 'Step 1: Generate and pass `idempotencyKey` to Stripe SDK calls.',
    validation: '- Retries use same idempotency key and succeed gracefully.',
    regressionTests: '- Stripe capture/refund mocked tests.',
    priority: 'Sprint 2',
    status: 'Open'
  },
  {
    id: 'PAY-005',
    category: 'payments',
    title: 'Webhook Deduplication Bypass (Redis Fail-Open)',
    severity: 'P1 - High',
    description: 'If Redis is down, Stripe webhook intentionally bypasses deduplication, allowing duplicate event processing.',
    rootCause: 'Misguided "fail open" logic for distributed locking.',
    affectedComponents: 'app/api/webhooks/stripe/route.ts',
    productionImpact: '- Transaction deadlocks or duplicate refund processing.',
    howToReproduce: 'Disable Redis, fire duplicate webhooks.',
    fixGuide: 'Step 1: Fail closed (503) if deduplication engine is unavailable, forcing Stripe to retry later.',
    validation: '- Returns 503 if Redis is unreachable.',
    regressionTests: '- Webhook resilience tests.',
    priority: 'Sprint 2',
    status: 'Open'
  },

  // PMS Lifecycle
  {
    id: 'PMS-001',
    category: 'pms',
    title: 'Room Assignment vs. Stay Desynchronization',
    severity: 'P0 - Critical',
    description: 'Check-in creates `Stay` for new room but ignores old `RoomAssignment`. Checkout uses `RoomAssignment`, marking wrong rooms DIRTY and keeping physical rooms permanently OCCUPIED.',
    rootCause: 'Split-brain logic between Check-in and Checkout processes.',
    affectedComponents: 'lib/services/StayService.ts\napp/api/admin/bookings/[id]/checkout/route.ts',
    productionImpact: '- Inventory permanently locked. Housekeeping cleaning wrong rooms.',
    howToReproduce: 'Move guest to new room at check-in. Process checkout.',
    fixGuide: 'Step 1: Ensure Check-in process deletes/updates `RoomAssignment` to match the `Stay`.',
    validation: '- Correct room is marked DIRTY upon checkout.',
    regressionTests: '- E2E PMS lifecycle tests with room moves.',
    priority: 'Sprint 1',
    status: 'Open'
  },
  {
    id: 'PMS-002',
    category: 'pms',
    title: 'Double-Entry Ledger Bypass (Night Audit)',
    severity: 'P0 - Critical',
    description: 'Night Audit cron bypasses `FinancialEngine` and inserts raw `FolioLineItem` with hardcoded 10% tax, breaking general ledger sync and calculating wrong taxes.',
    rootCause: 'Cron job implemented independently from core financial logic.',
    affectedComponents: 'app/api/cron/night-audit/roll-forward/route.ts',
    productionImpact: '- General Ledger discrepancies. Immediate financial audit failures.',
    howToReproduce: 'Run night audit. Compare taxes on automated charges vs manual charges.',
    fixGuide: 'Step 1: Refactor Night Audit to execute `FinancialEngine.postCharge`.',
    validation: '- Night Audit charges generate correct GL entries and 25% tax.',
    regressionTests: '- Night audit simulation tests.',
    priority: 'Sprint 1',
    status: 'Open'
  },
  {
    id: 'PMS-003',
    category: 'pms',
    title: 'Financial Engine In-Memory State Loss',
    severity: 'P0 - Critical',
    description: '`FinancialEngine` stores active folios in an in-memory Map. Restarts wipe the Map, causing subsequent charge postings to crash.',
    rootCause: 'Stateful architecture in a stateless (serverless) deployment model.',
    affectedComponents: 'lib/financial-engine.ts',
    productionImpact: '- Inability to post POS charges or checkout guests after process restart.',
    howToReproduce: 'Check in guest. Restart Node server. Attempt to post charge.',
    fixGuide: 'Step 1: Remove in-memory Map. Lazy-load `Folio` state from PostgreSQL via Prisma when posting charges.',
    validation: '- Charges succeed even after server restarts.',
    regressionTests: '- Financial engine state recovery tests.',
    priority: 'Sprint 1',
    status: 'Open'
  },
  {
    id: 'PMS-004',
    category: 'pms',
    title: 'Broken No-Show Processing',
    severity: 'P2 - Medium',
    description: 'Night audit attempts to find `EXPECTED` Stays, but Stays are only created at Check-in (`CHECKED_IN`). Query always returns 0.',
    rootCause: 'Misunderstanding of the `Stay` model lifecycle.',
    affectedComponents: 'app/api/cron/night-audit/roll-forward/route.ts',
    productionImpact: '- No-shows are never processed, tying up room inventory.',
    howToReproduce: 'Run night audit with a booking that should be a no-show.',
    fixGuide: 'Step 1: Query `Booking` model for `status === "CONFIRMED"` and `checkIn < NOW()`.',
    validation: '- No-show bookings are correctly cancelled.',
    regressionTests: '- Night audit no-show tests.',
    priority: 'Sprint 2',
    status: 'Open'
  },
  {
    id: 'PMS-005',
    category: 'pms',
    title: 'Audit Log Attribution Forgery',
    severity: 'P1 - High',
    description: 'Night Audit selects a random checked-in guest to attribute the financial close action (`runByUserId`), destroying chain of custody.',
    rootCause: 'Hacky implementation to bypass required non-null constraints on log tables.',
    affectedComponents: 'app/api/cron/night-audit/roll-forward/route.ts',
    productionImpact: '- Compliance failure. Financial logs attributed to guests.',
    howToReproduce: 'Run night audit. Check `NightAuditLog` table.',
    fixGuide: 'Step 1: Create a dedicated `SYSTEM` user ID and use it for all cron executions.',
    validation: '- Audit logs correctly attribute `SYSTEM`.',
    regressionTests: '- Audit log integrity tests.',
    priority: 'Sprint 2',
    status: 'Open'
  },

  // Integrations
  {
    id: 'INT-001',
    category: 'integrations',
    title: 'Booking.com Unauthenticated Webhooks',
    severity: 'P0 - Critical',
    description: 'OTA Webhook accepts XML payloads with no authentication, signature verification, or IP allowlisting.',
    rootCause: 'Endpoint deployed without security middleware.',
    affectedComponents: 'app/api/integrations/booking-com/webhook/route.ts',
    productionImpact: '- Anyone can modify, create, or cancel guest reservations.',
    howToReproduce: 'Run `api-contract-check.ts`.',
    fixGuide: 'Step 1: Implement IP allowlisting (Booking.com subnets) and/or API Key validation.',
    validation: '- Reject unauthenticated requests with 401/403.',
    regressionTests: '- API Contract audit script.',
    priority: 'Sprint 1',
    status: 'Open'
  },
  {
    id: 'INT-002',
    category: 'integrations',
    title: 'Booking.com Concurrency Overbooking',
    severity: 'P0 - Critical',
    description: 'OTA handler bypasses `InventoryLockEngine` entirely, allowing concurrent webhooks to double-book rooms.',
    rootCause: 'Missing integration between webhook handler and core inventory engine.',
    affectedComponents: 'lib/ota/webhook-handler.ts',
    productionImpact: '- Overbooked hotel.',
    howToReproduce: 'Run `booking-concurrency-test.ts`.',
    fixGuide: 'Step 1: Integrate `InventoryLockEngine` into `processOtaReservation`.',
    validation: '- Concurrency test blocks duplicate reservations.',
    regressionTests: '- `booking-concurrency-test.ts`',
    priority: 'Sprint 1',
    status: 'Open'
  },
  {
    id: 'INT-003',
    category: 'integrations',
    title: 'Booking.com Missing Lifecycle Orchestration',
    severity: 'P1 - High',
    description: 'OTA booking creates a reservation but fails to create `Folio` or `RoomAssignment`. Guests cannot be checked out or billed.',
    rootCause: 'Incomplete implementation of the reservation pipeline in the OTA handler.',
    affectedComponents: 'lib/ota/webhook-handler.ts',
    productionImpact: '- Broken PMS lifecycle for OTA guests.',
    howToReproduce: 'Ingest OTA booking. Observe missing Folio in DB.',
    fixGuide: 'Step 1: Ensure OTA handler calls core Booking creation services that establish Folios/Assignments.',
    validation: '- OTA bookings have Folios and RoomAssignments.',
    regressionTests: '- Database integrity audit script.',
    priority: 'Sprint 2',
    status: 'Open'
  },
  {
    id: 'INT-004',
    category: 'integrations',
    title: 'Pusher Synchronous Crashing in Webhooks',
    severity: 'P1 - High',
    description: 'Pusher events emitted synchronously after DB transactions without try/catch. Pusher failure crashes Stripe webhook.',
    rootCause: 'Missing error boundaries on non-critical side effects.',
    affectedComponents: 'app/api/webhooks/stripe/route.ts',
    productionImpact: '- Infinite Stripe retries and repeated DB transactions.',
    howToReproduce: 'Disconnect Pusher credentials, fire Stripe webhook.',
    fixGuide: 'Step 1: Wrap `RealtimeEvents.emitBookingUpdated` in try/catch.',
    validation: '- Webhook returns 200 even if Pusher fails.',
    regressionTests: '- Webhook resilience tests.',
    priority: 'Sprint 2',
    status: 'Open'
  },
  {
    id: 'INT-005',
    category: 'integrations',
    title: 'Pusher Missing Environment Fail-safes',
    severity: 'P2 - Medium',
    description: 'Pusher client connects with empty strings if env vars missing, causing unhandled exceptions later.',
    rootCause: 'Unsafe instantiation of third-party SDK.',
    affectedComponents: 'lib/realtime.ts',
    productionImpact: '- Server crashes or silent failures on startup.',
    howToReproduce: 'Remove Pusher ENV vars, start app.',
    fixGuide: 'Step 1: Use a proxy or early-exit if Pusher is unconfigured.',
    validation: '- App boots safely without Pusher keys.',
    regressionTests: '- Environment check audit script.',
    priority: 'Sprint 3',
    status: 'Open'
  },
  {
    id: 'INT-006',
    category: 'integrations',
    title: 'SMTP Silent Dropping of Critical Notifications',
    severity: 'P2 - Medium',
    description: 'Nodemailer errors are swallowed. No outbox pattern means emails are lost permanently if SMTP is down.',
    rootCause: 'Synchronous email sending designed to not block API responses.',
    affectedComponents: 'lib/email.ts',
    productionImpact: '- Guests do not receive confirmations.',
    howToReproduce: 'Block outbound port 587, create booking.',
    fixGuide: 'Step 1: Implement queue (BullMQ/Outbox).',
    validation: '- Failed emails remain in queue.',
    regressionTests: '- Email delivery system tests.',
    priority: 'Sprint 3',
    status: 'Open'
  },
  {
    id: 'INT-007',
    category: 'integrations',
    title: 'Groq API Key Fallback Vulnerability',
    severity: 'P1 - High',
    description: 'Groq SDK initializes with "BUILD_PLACEHOLDER" if key is missing, causing 401s at runtime instead of failing at boot.',
    rootCause: 'Developer hack to pass CI build without secrets.',
    affectedComponents: 'lib/chatbot/groq.ts',
    productionImpact: '- Broken chatbot in production.',
    howToReproduce: 'Remove GROQ_API_KEY, use chatbot.',
    fixGuide: 'Step 1: Throw error at runtime if key is "BUILD_PLACEHOLDER".',
    validation: '- Chatbot gracefully returns disabled message if unconfigured.',
    regressionTests: '- Integration health check script.',
    priority: 'Sprint 2',
    status: 'Open'
  },
  {
    id: 'INT-008',
    category: 'integrations',
    title: 'Groq Stream Exception Swallowing',
    severity: 'P2 - Medium',
    description: 'If `saveMessage` to DB fails after streaming response to client, the error is swallowed and chat history is permanently lost.',
    rootCause: 'Error handling inside the ReadableStream does not propagate.',
    affectedComponents: 'app/api/chat/messages/route.ts',
    productionImpact: '- Lost chat histories.',
    howToReproduce: 'Block DB write during stream end.',
    fixGuide: 'Step 1: Write to an asynchronous queue for history saving.',
    validation: '- Stream completes and history eventually persists.',
    regressionTests: '- Chatbot persistence tests.',
    priority: 'Sprint 3',
    status: 'Open'
  },
  {
    id: 'INT-009',
    category: 'integrations',
    title: 'Cloudinary Ghost Integration',
    severity: 'P3 - Low',
    description: 'Cloudinary documented but not present in `next.config.js` or CSP. Loading images will cause severe CSP violations.',
    rootCause: 'Incomplete integration deployment.',
    affectedComponents: 'next.config.js\ndocs/archive/ALL_REQUIRED_ENV_VARIABLES.md',
    productionImpact: '- Broken images on frontend.',
    howToReproduce: 'Render Cloudinary image on UI.',
    fixGuide: 'Step 1: Add Cloudinary to CSP and `remotePatterns` in next.config.js.',
    validation: '- Images load without console errors.',
    regressionTests: '- UI asset tests.',
    priority: 'Sprint 3',
    status: 'Open'
  },
  {
    id: 'INT-010',
    category: 'integrations',
    title: 'Redis Bypass on Disconnect',
    severity: 'P1 - High',
    description: 'Same as PAY-005. Stripe webhook deduplication fails open if Redis is down.',
    rootCause: 'Misguided fail-open logic.',
    affectedComponents: 'app/api/webhooks/stripe/route.ts',
    productionImpact: '- Transaction deadlocks.',
    howToReproduce: 'See PAY-005.',
    fixGuide: 'See PAY-005.',
    validation: 'See PAY-005.',
    regressionTests: 'See PAY-005.',
    priority: 'Sprint 2',
    status: 'Open'
  },

  // Configuration
  {
    id: 'CFG-001',
    category: 'configuration',
    title: 'PostgreSQL / MongoDB Fatal Mismatch',
    severity: 'P0 - Critical',
    description: 'Cross-reference to DB-001. Documentation demands MongoDB but Prisma uses PostgreSQL.',
    rootCause: 'Stale documentation.',
    affectedComponents: 'env.example',
    productionImpact: '- Deployment failure.',
    howToReproduce: 'See DB-001.',
    fixGuide: 'See DB-001.',
    validation: 'See DB-001.',
    regressionTests: 'See DB-001.',
    priority: 'Sprint 1',
    status: 'Open'
  },
  {
    id: 'CFG-002',
    category: 'configuration',
    title: 'Missing Undocumented Critical Variables',
    severity: 'P1 - High',
    description: 'UPSTASH_REDIS_REST_URL, CRON_SECRET, GROQ_API_KEY, BOOKING_COM_API_KEY are actively used but missing from docs/env.example.',
    rootCause: 'Poor documentation maintenance.',
    affectedComponents: 'env.example\ndocs/archive/ALL_REQUIRED_ENV_VARIABLES.md',
    productionImpact: '- Silent failures or immediate crashes in production.',
    howToReproduce: 'Run `environment-check.ts`.',
    fixGuide: 'Step 1: Update documentation and env templates to include all keys.',
    validation: '- Environment audit script passes cleanly.',
    regressionTests: '- Environment audit script.',
    priority: 'Sprint 1',
    status: 'Open'
  },
  {
    id: 'CFG-003',
    category: 'configuration',
    title: 'Optional Variables Incorrectly Required',
    severity: 'P2 - Medium',
    description: 'Pusher keys are marked optional but code requires them for stability (INT-005).',
    rootCause: 'Mismatch between feature flags and module initialization.',
    affectedComponents: 'env.example\nlib/realtime.ts',
    productionImpact: '- Startup failures.',
    howToReproduce: 'Run without Pusher keys.',
    fixGuide: 'Step 1: Implement feature toggles for Pusher.',
    validation: '- System boots gracefully without keys.',
    regressionTests: '- Boot sequence tests.',
    priority: 'Sprint 3',
    status: 'Open'
  },
  {
    id: 'CFG-004',
    category: 'configuration',
    title: 'Unsafe System Defaults (Cron, Groq)',
    severity: 'P0 - Critical',
    description: 'Night audit uses "dev-secret-key". Groq uses "BUILD_PLACEHOLDER".',
    rootCause: 'Hardcoded fallbacks intended for local dev leaked to prod logic.',
    affectedComponents: 'app/api/cron/night-audit/roll-forward/route.ts\nlib/chatbot/groq.ts',
    productionImpact: '- Unauthorized access to Night Audit. Broken AI integrations.',
    howToReproduce: 'Run `environment-check.ts`.',
    fixGuide: 'Step 1: Remove fallbacks. Require variables to be present or fail fast.',
    validation: '- API rejects unauthenticated cron requests if env is missing.',
    regressionTests: '- Environment audit script.',
    priority: 'Sprint 1',
    status: 'Open'
  },
  {
    id: 'CFG-005',
    category: 'configuration',
    title: 'Differing Development vs. Production Behavior',
    severity: 'P3 - Low',
    description: 'Auth cookies use `__Secure-` only in prod. `instrumentation.ts` behaves differently on Vercel Edge.',
    rootCause: 'Standard Vercel deployment patterns.',
    affectedComponents: 'lib/auth.ts\ninstrumentation.ts',
    productionImpact: '- Local testing may miss edge-specific bugs.',
    howToReproduce: 'Compare NextAuth cookies locally vs prod.',
    fixGuide: 'Step 1: Document these behaviors clearly for new engineers.',
    validation: '- Documentation merged.',
    regressionTests: 'N/A',
    priority: 'Sprint 4',
    status: 'Open'
  }
];

// Ensure directories exist
const dirs = [...new Set(categories.map(c => path.join(BASE_DIR, c)))];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Generate Markdown for Incident
function generateIncidentMarkdown(incident) {
  return `# ${incident.id} - ${incident.title}

## Severity

${incident.severity}

---

## Category

${incident.category.toUpperCase()}

---

## Description

${incident.description}

---

## Affected Files

${incident.affectedComponents.split('\\n').map(f => '- ' + f).join('\n')}

---

## Root Cause

${incident.rootCause}

---

## Production Impact

${incident.productionImpact}

---

## How to Reproduce

${incident.howToReproduce}

---

## Fix Guide

${incident.fixGuide}

---

## Acceptance Criteria

${incident.validation}

---

## Regression Tests

${incident.regressionTests}

---

## Priority

${incident.priority}
`;
}

// Write incidents
incidents.forEach(inc => {
  const filePath = path.join(BASE_DIR, inc.category, `${inc.id}.md`);
  fs.writeFileSync(filePath, generateIncidentMarkdown(inc));
});

// Generate README.md
fs.writeFileSync(path.join(BASE_DIR, 'README.md'), `# Production Remediation Guide

This guide contains the structured output of the SmartHotel production audit. It is designed to serve as a mini engineering handbook for systematically resolving architectural flaws, security vulnerabilities, and configuration mismatches.

## Folder Structure
- \`database/\`: Schema, transaction, and concurrency flaws.
- \`api/\`: Contract mismatches and IDOR vulnerabilities.
- \`booking/\`: Booking lifecycle race conditions.
- \`payments/\`: Stripe webhook failures.
- \`pms/\`: Check-in, checkout, and night audit consistency issues.
- \`integrations/\`: Third-party integration resilience flaws.
- \`configuration/\`: Environment variable and deployment risks.
- \`scripts/\`: Automated audit scripts used to detect these issues.
- \`archive/\`: Old raw chat logs and unstructured audit documents.

Use the \`FIX_TRACKER.md\` to coordinate remediation efforts.
`);

// Generate EXECUTIVE_SUMMARY.md
fs.writeFileSync(path.join(BASE_DIR, 'EXECUTIVE_SUMMARY.md'), `# Executive Summary

The production audit revealed significant systemic risks threatening the stability, security, and financial integrity of the SmartHotel application.

## Overall Health
**Status: CRITICAL**
The application is currently unsafe for production deployment due to unauthenticated webhooks, severe race conditions allowing double bookings, and catastrophic flaws in the financial reconciliation engine.

## Critical Risks
1. **Unauthenticated OTA Webhooks:** Booking.com webhooks accept raw XML without signature verification, allowing trivial manipulation of reservations (INT-001).
2. **Double-Booking Race Conditions:** Distributed lock engine bypasses allow concurrent requests to reserve the same physical room (BOOK-001).
3. **Financial Ledger Corruption:** The Night Audit bypasses the core financial engine, generating incorrect taxes and breaking double-entry accounting (PMS-002).
4. **Configuration Mismatches:** Fatal discrepancies between deployed database engines (PostgreSQL) and required configuration strings (MongoDB) will cause boot failures (CFG-001).

## Estimated Remediation Effort
- **Sprint 1 (P0):** 2-3 weeks (Security, Concurrency, Core PMS Fixes)
- **Sprint 2 (P1):** 2 weeks (Integrations, Transactions, Idempotency)
- **Sprint 3+ (P2/P3):** 2 weeks (Cleanup, DevEx, Error Formatting)
`);

// Generate ROADMAP.md
fs.writeFileSync(path.join(BASE_DIR, 'ROADMAP.md'), `# Remediation Roadmap

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
`);

// Generate INCIDENTS.md
const indexContent = incidents.map(i => `- [${i.id}](${i.category}/${i.id}.md): ${i.title} (${i.severity})`).join('\n');
fs.writeFileSync(path.join(BASE_DIR, 'INCIDENTS.md'), `# Master Incident Index\n\n${indexContent}\n`);

// Generate FIX_TRACKER.md
const trackerRows = incidents.map(i => `| [${i.id}](${i.category}/${i.id}.md) | ${i.priority} | ${i.status} | Unassigned | ${i.title} |`).join('\n');
fs.writeFileSync(path.join(BASE_DIR, 'FIX_TRACKER.md'), `# Fix Tracker\n\n| ID | Priority | Status | Owner | Title |\n|---|---|---|---|---|\n${trackerRows}\n`);

console.log('Successfully generated Production Remediation Guide.');
