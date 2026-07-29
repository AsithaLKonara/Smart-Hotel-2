# 05_API_Architecture: Master API & Server Action Contract Bible

**Document Type:** Master API Architecture Specification (The API Bible)  
**Status:** Approved Specification (Phase 1)  
**Protocol & Format:** REST over HTTPS & Next.js 14 Server Actions with JSON / Zod validation payloads  

---

## 1. Universal API Design Contracts & Engineering Mandates

To enforce predictable behavior across all client endpoints and asynchronous background integrations, every programmatic interface must implement standardized architectural contracts:
- **Strict Payload Validation (Zod):** Every endpoint must parse request parameters, headers, and body structures through typed Zod verification schemas before executing DB queries. Unsupported attributes must be discarded (`.strict()` evaluation) to neutralize parameter injection attacks.
- **Unified JSON Error Responses:** All API route failures return explicit HTTP status codes alongside a structured error object:
  ```json
  {
    "error": "ERR_ROOM_UNAVAILABLE",
    "message": "Assigned room unit is currently out of order or uncleaned.",
    "statusCode": 409,
    "timestamp": "2026-07-30T00:15:00Z",
    "traceId": "req_01HPX7E4Y9B21VAK"
  }
  ```
- **Idempotency Header Requirement:** State-modifying transactional endpoints (e.g., checkout payments, inventory receipts, payroll commits) MUST evaluate an `Idempotency-Key` HTTP header cached in Redis for 24 hours (`idempotency:{key}`). Repeat submissions return the originally cached transaction receipt without executing duplicate database commits.

---

## 2. Core Operational Endpoints & Server Actions Matrix

---

### Endpoint 1: Reservation Check-In & Folio Initialization
- **Path & Method:** `POST /api/bookings/[id]/checkin`
- **Purpose:** Executes physical front-office check-in, assigns vacant room key, updates physical unit state to occupied, and posts initial room rate folio debit leds in General Ledger.
- **Caller:** Reception Check-In UI Viewport or Automated Mobile Self-Check-in Kiosk.
- **Authentication:** Bearer JWT token derived from NextAuth session cookies.
- **Authorization (RBAC):** Requires role Level Weight `>= 30` (RECEPTION, MANAGER, SUPER_ADMIN) OR matching authenticated Guest profile during authorized kiosk check-in time windows.
- **Validation Schema (Zod):**
  ```typescript
  z.object({
    assignedRoomId: z.string().cuid(),
    identityDocumentHash: z.string().min(16),
    creditCardPreauthAmount: z.number().positive(),
    guestPreferencesOverride: z.record(z.any()).optional()
  }).strict()
  ```
- **Business Logic & State Execution:**
  1. Fetch `Booking` and verify current state equals `'CONFIRMED'`. Reject if `'PENDING'`, `'CANCELLED'`, or already `'CHECKED_IN'`.
  2. Fetch `Room` by `assignedRoomId`. Evaluate status constraints: must equal `'VACANT_READY'` or `'VACANT_CLEAN'`.
  3. Authorize credit card pre-authorization hold via Stripe terminal interface.
- **Database Writes & Reads (Prisma Interactive Transaction):**
  - Read: `Booking`, `Room`, `RoomType`.
  - Write: Update `Booking` set `status = 'CHECKED_IN'`, `roomId = assignedRoomId`, `actualCheckIn = now()`. Update `Room` set `status = 'OCCUPIED'`. Insert `RoomStatusHistory` record. Write initial `JournalEntry` referencing **Dead Schema table `TransactionCode`** ID (`100-RM-REV`).
- **Redis & Pusher Interaction:**
  - Invalidate Redis availability cache: `DEL rates:quote:*`.
  - Emit real-time WebSocket payload to Pusher channel `private-pms-rack`, event `room:status:change`, payload `{ roomId, status: 'OCCUPIED', bookingId }`.
- **Audit Trail & Logging:** Append log to `AuditLog`: `{ action: 'GUEST_CHECK_IN', entityId: booking.id, entityType: 'BOOKING', metadata: { roomId: assignedRoomId } }`.
- **Rate Limit:** 30 requests per minute per IP address.
- **Error Codes:** `400 Bad Request` (Invalid ID), `401 Unauthorized` (Unauthenticated), `403 Forbidden` (Insufficient Role), `409 Conflict` (Room Dirty or Out of Order), `500 Internal Error` (Database Transaction Failure).

---

### Endpoint 2: POS Restaurant Dining Settlement & Folio Billing
- **Path & Method:** `POST /api/restaurant/orders/settle`
- **Purpose:** Closes an active restaurant dining tab, applies selected payment method (Credit Card, Cash, or Room Charge Folio transfer), and triggers background multi-location inventory stock deduction.
- **Caller:** POS Touchscreen Cashier Kiosk or Table Waiter Mobile iPad.
- **Authentication:** Staff PIN code or active NextAuth JWT session.
- **Authorization (RBAC):** Role Level Weight `>= 25` (CASHIER, WAITER, BARTENDER, MANAGER).
- **Validation Schema (Zod):**
  ```typescript
  z.object({
    orderId: z.string().cuid(),
    settlementMethod: z.enum(['CREDIT_CARD', 'CASH', 'ROOM_CHARGE']),
    roomChargeTarget: z.object({
      roomNumber: z.string(),
      guestLastName: z.string(),
      signatureBitmapHash: z.string()
    }).optional(),
    gratuityAmount: z.number().min(0).default(0)
  }).strict()
  ```
- **Business Logic & State Execution:**
  1. If `settlementMethod == 'ROOM_CHARGE'`, execute internal invocation to `/api/bookings/verify-charge`. Verify room is occupied and guest surname matches billing records. Check guest credit limit.
  2. Sum itemized line costs from `OrderItem`, apply statutory dining taxes, append gratuity, and verify total against payment authorization.
- **Database Writes & Reads (Prisma Interactive Transaction):**
  - Read: `Order`, `OrderItem`, `POSProduct`, `Booking` (if room charge).
  - Write: Update `Order` set `status = 'CLOSED'`, `closedAt = now()`. If room charge, append debit `JournalEntry` to guest stay folio via `TransactionCode` (`200-FB-REV`). Create event record in `Outbox` with payload `{ eventType: 'POS_ORDER_CLOSED', orderId }` to instruct inventory workers to decrement kitchen ingredient stock.
- **Redis & Pusher Interaction:**
  - Emit real-time WebSocket payload to Pusher channel `kds-kitchen-display`, event `order:closed`, instruction to clear printer ticket from kitchen monitor.
- **Audit Trail & Logging:** Write to `AuditLog` capturing staff Server identity, total billed amount, and settlement classification.
- **Rate Limit:** 60 requests per minute per terminal identity.

---

### Endpoint 3: Procurement Three-Way Matching Invoice Auditor
- **Path & Method:** `POST /api/admin/procurement/invoices/verify-match`
- **Purpose:** Implements internal accounting governance (Three-Way Matching). Composes received physical stock quantities against purchase order contracts and vendor invoice requests before permitting accounts payable bank disbursements.
- **Caller:** Accounts Payable Controller Dashboard UI (`/app/admin/procurement/invoices`).
- **Authentication:** NextAuth JWT Session Cookie.
- **Authorization (RBAC):** Role Level Weight `>= 60` (FINANCE, CONTROLLER, SUPER_ADMIN).
- **Validation Schema (Zod):**
  ```typescript
  z.object({
    vendorId: z.string().cuid(),
    purchaseOrderId: z.string().cuid(),
    invoiceNumber: z.string().min(3),
    billedTotalAmount: z.number().positive(),
    taxAmount: z.number().min(0),
    lineItems: z.array(z.object({
      itemId: z.string().cuid(),
      billedQuantity: z.number().positive(),
      unitPrice: z.number().positive()
    }))
  }).strict()
  ```
- **Business Logic & State Execution (Activating Dead Schema Table `VendorInvoice`):**
  1. Fetch approved `PurchaseOrder` and all associated physical `GoodsReceipt` audit slips.
  2. Verify math: compare sum of `GoodsReceipt.receivedQuantity` for each SKU against `lineItems.billedQuantity`. Compare `lineItems.unitPrice` against negotiated `PurchaseOrder.unitPrice`.
  3. Evaluate discrepancy delta against hardcoded tolerance parameter ($5.00 limit).
  4. If match succeeds, change status to `'MATCHED'`; otherwise freeze document in `'DISCREPANCY_REVIEW'` queue and block ledger generation.
- **Database Writes & Reads (Prisma Interactive Transaction):**
  - Read: `PurchaseOrder`, `GoodsReceipt`, `Vendor`.
  - Write: Create row in activated **Dead Schema table `VendorInvoice`**. If `'MATCHED'`, call `lib/accounting.ts` to insert paired double-entry `JournalEntry` clearing temporary GR/IR accounts and recognizing AP liability.
- **Redis & Pusher Interaction:**
  - Send realtime alert to `private-admin-procurement` channel informing Chief Buyer of matched or disputed invoice status.
- **Audit Trail & Logging:** Append immutable forensic row to `AuditLog` recording invoice match calculation metrics and authorizing finance controller identity.

---

### Endpoint 4: Executive OLAP BI Aggregation Cube
- **Path & Method:** `GET /api/admin/executive/analytics-cube?rangeDays=30&propertyCode=ALL`
- **Purpose:** Replaces mock presentation arrays in `/app/admin/executive-intelligence/page.tsx` with high-performance real-time SQL calculations determining Occupancy Rate %, RevPAR, ADR, and F&B gross revenue margins.
- **Caller:** Executive Intelligence Dashboard Viewport (TanStack Query client rehydrator).
- **Authentication:** NextAuth JWT Session Cookie.
- **Authorization (RBAC):** Role Level Weight `>= 80` (MANAGER, OWNER, SUPER_ADMIN, AUDITOR).
- **Validation Schema (Zod - Query Params):**
  ```typescript
  z.object({
    rangeDays: z.coerce.number().int().min(1).max(365).default(30),
    propertyCode: z.string().default('ALL')
  }).strict()
  ```
- **Business Logic & State Execution:**
  1. Execute read-only aggregation SQL expressions via Prisma over `Booking`, `Room`, and `JournalEntry` ledgers for the specified calendar window.
  2. Compute **ADR (Average Daily Rate):** `Total Room Revenue / Total Rooms Sold`.
  3. Compute **Occupancy Rate:** `(Total Rooms Sold / (Total Physical Rooms * Range Days)) * 100`.
  4. Compute **RevPAR:** `ADR * (Occupancy Rate / 100)`.
  5. Assemble structured JSON response representing regional metrics and active anomaly radar logs flagged by SRE background daemons.
- **Database Reads (Read-Only Replica / Non-Blocking Scope):**
  - Read: `Booking`, `Room`, `JournalEntry`, `TransactionCode`, `Outbox` (for error radar).
- **Redis Caching:**
  - Try reading calculated cube JSON from Redis key `analytics:olap:cube:{rangeDays}:{propertyCode}` with TTL 300 seconds (5 minutes). If missed, execute database aggregations and store result in cache before returning.
- **Rate Limit:** 20 requests per minute per executive user session.
