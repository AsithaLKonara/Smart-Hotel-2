# 04_Workflow_Architecture: End-to-End Business Orchestration & State Machine Bible

**Document Type:** Master Workflow Architecture Blueprint (The Workflow Bible)  
**Status:** Approved Specification (Phase 1)  
**Scope:** Exhaustive step-by-step, API-by-API, event-by-event orchestration mechanics for critical enterprise processes  

---

## Workflow 1: End-to-End Guest Booking to Historical Archival

This workflow defines the lifecycle of a guest stay, ensuring exact synchronization between UI interfaces, edge middleware guardrails, relational PostgreSQL data changes, real-time Pusher WebSockets, and external Stripe payment gateways.

```
[Guest Search UI] ──(1. Quote & Cache Check)──> [Redis/Database Engine] ──(2. Lock & Reserve)──> [PostgreSQL Booking: PENDING]
       │                                                                                                    │
       ▲                                                                                                    ▼
[Pusher Realtime Sync] <──(6. Outbox WebSocket Event)── [Outbox Publisher] <──(5. DB Commit: CONFIRMED)── [Stripe Webhook Paid]
       │
       ▼
[Front Desk Check-in] ──(7. Assign Vacant_Ready Room)──> [Room Status: OCCUPIED] ──(8. POS / Folio Charges)──> [JournalEntry Ledgers]
       │
       ▼
[Night Audit Rollover] ──(9. Post Daily Room Tax)──> [Zero-Balance Settlement] ──(10. Checkout & Complete)──> [Archival Storage]
```

### Step-by-Step Execution Matrix

#### Step 1: Availability Search & Dynamic Rate Quoting
- **Actor:** Guest or Travel Agent.
- **UI Trigger:** Public Reservation Search Form (`/app/book` or `/app/portals/b2b`).
- **API Invocation:** `POST /api/pricing/quote` with payload `{ roomTypeId, checkInDate, checkOutDate, promoCode }`.
- **Database Reads:** Query `RoomType` (check `isActive`), count unbooked `Room` units for date range, query `SeasonalRate` and `YieldRule` tables for applicable pricing multipliers.
- **Redis Interconnection:** Read ephemeral rates from Redis cache key `rates:quote:{roomTypeId}:{startDate}:{endDate}`. If missing, calculate via `lib/yield-optimization.ts` and cache with TTL 900 seconds.
- **Response:** Return explicit nightly itemized pricing breakdown with calculated taxes and deposit requirements.

#### Step 2: Temporary Inventory Reservation & Lock Capture
- **Actor:** Guest (selecting "Proceed to Booking").
- **API Invocation:** `POST /api/bookings/reserve`.
- **Concurrency Control:** Acquire atomic Redis lock: `SET lock:room_type_hold:{roomTypeId}:{date} "HOLD" NX EX 600` (10-minute expiry). If Redis returns zero (lock conflict), abort immediately with HTTP 409: "Room category just sold out for selected dates."
- **Database Writes:** Create unconfirmed `Booking` entity: `status: 'PENDING'`, generate secure `bookingReference` (e.g., `SMH-77291`), attach initial `BookingGuest` profile data.
- **Outbox Event:** Insert record into `Outbox`: `{ eventType: 'BOOKING_HOLD_CREATED', payload: { bookingId, expiresAt } }`.

#### Step 3: Payment Intent & Credit Card Authorization
- **Actor:** System Gateway Orchestrator -> Stripe API.
- **API Invocation:** Server-side execution calling `stripe.paymentIntents.create({ amount: depositAmount, currency: 'usd', metadata: { bookingId } })`.
- **Database Writes:** Update `Booking` record with `stripePaymentIntentId`.
- **Response:** Send client secret to front-end checkout UI viewport to render PCI-DSS compliant payment card input fields.

#### Step 4: External Webhook Confirmation & State Transition
- **Actor:** Stripe Webhook Transmission -> Edge Gateway -> Database.
- **API Invocation:** `POST /api/webhooks/stripe` receiving `payment_intent.succeeded` event.
- **Security Check:** Validate cryptographic Stripe HMAC signature via Edge headers.
- **Database Writes (Atomic Transaction via `prisma.$transaction`):**
  1. Update `Booking` status from `'PENDING'` to `'CONFIRMED'`.
  2. Create initial credit `JournalEntry` posting down payment received against USALI Account `200-ADV-DEPOSITS`.
  3. Create `Outbox` event record: `{ eventType: 'BOOKING_CONFIRMED', payload: { bookingId, reference, guestEmail } }`.

#### Step 5: Asynchronous Event Dispersal & Notification Broadcast
- **Actor:** Automated Background Daemon (`lib/messaging/outbox-publisher.ts`).
- **Trigger:** Continuous background worker polling `Outbox` table where `status == 'PENDING'`.
- **Actions Execution:**
  1. **Real-time PMS Push:** Emit WebSocket notification to Pusher channel `private-pms-rack` with event `booking:new`. All active reception desk browsers update availability racks instantly without reloading.
  2. **Email Notification Relay:** Transmit confirmation email formatting receipt details via SendGrid to `guestEmail`.
  3. **Housekeeping Alert:** Notify housekeeping schedule queue of impending room configuration need (e.g., "Add crib amenity requested").
  4. **State Cleanup:** Update Outbox row status to `'PROCESSED'`, release temporary Redis hold lock `lock:room_type_hold:*`.

#### Step 6: Front Desk Check-in & Physical Room Assignment
- **Actor:** Receptionist (RBAC Level >= 30) or Self-Service Kiosk.
- **UI Trigger:** Front Office Check-in Screen (`/app/admin/bookings/[id]`).
- **API Invocation:** `POST /api/bookings/[id]/checkin` with payload `{ assignedRoomId, identityDocumentHash, creditCardPreauthAmount }`.
- **Validation Rules:** Query `Room` by ID. Verify `Room.status == 'VACANT_READY'` OR `'VACANT_CLEAN'`. If room status is `'DIRTY'` or `'OUT_OF_ORDER'`, abort transaction with error: "Cannot check guest into uncleaned or out-of-order room."
- **Database Writes (Atomic Transaction):**
  1. Update `Booking`: set `status = 'CHECKED_IN'`, bind `roomId = assignedRoomId`, record `actualCheckIn = now()`.
  2. Update `Room`: transition physical key `status = 'OCCUPIED'`.
  3. Write `RoomStatusHistory` tracking log: `{ roomId, status: 'OCCUPIED', reason: 'Guest Check-in' }`.
  4. Post initial night room charge and VAT tax debit into `JournalEntry` folio ledger using active **Dead Schema Table `TransactionCode`** ID for Room Revenue (`100-RM-REV`).
- **Pusher Broadcast:** Emit `room:occupied` event to housekeeping and CMMS live monitoring dashboards.

#### Step 7: In-Stay POS Dining & Ancillary Folio Charging
- **Actor:** Restaurant Server / Bar Cashier -> Kiosk -> Server Domain.
- **API Invocation:** `POST /api/restaurant/orders/settle` with payment type `'ROOM_CHARGE'`.
- **Validation Rules:** Query `/api/bookings/verify-charge`: confirm room is currently `OCCUPIED` and guest surname matches signature prompt.
- **Database Writes:**
  1. Create completed `Order` and `OrderItem` rows linked to POS dining menu items.
  2. Append accounting debit onto guest stay folio by inserting `JournalEntry`: `{ bookingId, transactionCodeId: '200-FB-REV', debit: orderTotal, credit: 0, description: 'Restaurant Dining Charge - Table 14' }`.
  3. Emit Outbox event `POS_INVENTORY_DEPLETE` instructing back-office inventory worker to decrement stock counts from physical basement storage room location.

#### Step 8: Night Audit Fiscal Day Cutoff Rollover
- **Actor:** Automated Midnight Cron Job or Finance Controller Manual Execution.
- **API Invocation:** `POST /api/admin/accounting/night-audit/execute`.
- **Validation Rules:** Verify all daily POS dining restaurant shifts have closed out their terminal registers and no open table orders remain in `'PREPARING'` state.
- **Database Writes (Batch Transaction):**
  1. Loop across all currently `'CHECKED_IN'` bookings; automatically generate nightly `JournalEntry` folio debits for room rate charges and municipal tourism VAT taxes for the concluded operational calendar day.
  2. Advance system operational business date in `Setting` table (`key: 'CURRENT_BUSINESS_DATE'`).
  3. Lock all financial postings dated prior to cutoff timestamp to enforce absolute accounting audit immutability.

#### Step 9: Zero-Balance Folio Checkout & Departure Settlement
- **Actor:** Reception Desk Staff or Mobile Super App Guest Check-out.
- **UI Trigger:** Folio Settlement & Departure Modal (`/app/admin/bookings/[id]/checkout`).
- **API Invocation:** `POST /api/bookings/[id]/checkout` with payload `{ settlementMethod: 'CREDIT_CARD', paymentIntentId }`.
- **Validation Rules:** Aggregate all `JournalEntry` items linked to `bookingId`. Calculate net outstanding folio balance: `balance = SUM(debit) - SUM(credit)`. If `balance > 0`, settlement cannot proceed without capturing final Stripe payment intent or billing an authorized B2B `CorporateAccount` line of credit.
- **Database Writes (Atomic Transaction):**
  1. Post balancing payment receipt to folio: `JournalEntry`: `{ bookingId, transactionCodeId: '300-CC-PAY', debit: 0, credit: balance }`. Verify final folio balance resolves exactly to `0.00`.
  2. Update `Booking`: transition `status = 'CHECKED_OUT'`, record `actualCheckOut = now()`.
  3. Update `Room`: automatically revert physical unit to housekeeping cleaning queue: `status = 'VACANT_DIRTY'`.
  4. Append tracking row to `RoomStatusHistory`: `{ roomId, status: 'VACANT_DIRTY', reason: 'Guest Departed' }`.
- **Pusher Broadcast:** Alert maid operational carts via real-time WebSocket channel `housekeeping-queue`: Room ready for cleaning departure turnover.
- **Outbox Event:** Emit `GUEST_CHECKOUT_COMPLETED` triggering background worker to append stay spend points to CRM `LoyaltyPoint` table and generate permanent immutable invoice PDF document stored in secure blob storage.

#### Step 10: Permanent Historical Archival & GDPR Data Pruning
- **Actor:** Automated System Housekeeping SRE Daemon (`lib/compliance/privacy-toolkit.ts`).
- **Trigger:** Monthly execution runner evaluating stays completed over 3 years ago (or immediate execution upon guest GDPR "Right to be Forgotten" petition to `/api/compliance/gdpr/forget-me`).
- **Database Writes:**
  1. Transition older `Booking.status` to `'ARCHIVED'`.
  2. If GDPR deletion invoked, obfuscate sensitive PII within `BookingGuest` and `GuestProfile` (replace legal name, email, phone with irreversible cryptographic hashes while preserving anonymized transactional accounting ledgers to maintain general ledger tax law auditing compliance).

---

## Workflow 2: Procurement to Accounts Payable (Three-Way Match Verification)

This workflow defines how internal purchasing must operate to eliminate financial fraud, ensuring zero hotel funds are disbursed without physical receipt of ordered materials.

```
[Buyer: Create Draft PO] ──(1. Submit PO)──> [Status: SUBMITTED] ──(2. Managerial Approval > $2.5k)──> [Sent to Vendor]
       │
       ▼
[Loading Dock: Delivery] ──(3. Physical Audit & Scan)──> [Create GoodsReceipt] ──(4. Update Stock & GL)──> [InventoryStock Incremented]
       │
       ▼
[Accounts Payable: Bill] ──(5. Input VendorInvoice)──> [Three-Way Match Verification] ──(6. Post GL Expense)──> [Bank Payment Dispersed]
```

### Step-by-Step Execution Matrix

#### Step 1 & 2: Purchase Order Creation & Executive Approval Routing
- **Actor:** Procurement Buyer (Level 40+) -> General Manager (Level 80+).
- **API Invocation:** `POST /api/admin/procurement/orders` submitting itemized supplier supply list and negotiated purchase quotes.
- **Business Rule:** If total order value `<= $2,500.00`, status sets immediately to `'APPROVED'` and an electronic purchase order transmission email fires to `Vendor.email`. If value `> $2,500.00`, status locks at `'PENDING_APPROVAL'` and pushes high-priority dashboard authorization requests to General Manager and Super Admin viewports.

#### Step 3 & 4: Loading Dock Goods Receipt & Multi-Location Stock Allocation
- **Actor:** Storeroom Receiving Clerk (Level 20+) at hotel physical delivery bays.
- **UI Trigger:** Mobile Receiving Terminal (`/app/admin/procurement/receipts/new`).
- **API Invocation:** `POST /api/admin/procurement/receipts` with payload `{ purchaseOrderId, deliveryLocationId, receivedItems: [{ itemId, quantityReceived, condition }] }`.
- **Validation Rules:** Target `PurchaseOrder` must be in `'APPROVED'` or `'PARTIALLY_RECEIVED'` status. Received quantity cannot exceed ordered amount by >10% without managerial override PIN authorization.
- **Database Writes (Atomic Transaction utilizing activated Dead Schema):**
  1. Insert record into activated **Dead Schema model `GoodsReceipt`** documenting date, receiver user ID, packing slip carrier identifier, and exact physical items delivered.
  2. Update `PurchaseOrder` status to `'RECEIVED'` (if fully supplied) or `'PARTIALLY_RECEIVED'`.
  3. Query activated **Dead Schema model `InventoryStock`** matching `[itemId, deliveryLocationId]`. Execute atomic increment: `quantity: { increment: quantityReceived }`, update `lastCountedAt = now()`.
  4. Write audit entry to `InventoryMovement`: `{ itemId, locationId, change: +quantityReceived, reason: 'PO Goods Receipt' }`.
  5. Post interim debit to General Ledger inventory valuation account: `JournalEntry` debiting `150-INV-ASSET`, crediting `250-GR/IR-CLEARING` (Goods Receipt / Invoice Receipt clearing account).

#### Step 5 & 6: Accounts Payable Invoice Filing & Automatic Three-Way Match Reconsideration
- **Actor:** Finance Accounts Payable Controller (Level 60+).
- **API Invocation:** `POST /api/admin/procurement/invoices/verify` with payload `{ vendorId, purchaseOrderId, invoiceNumber, billedAmount, invoiceTax, dueDays }`.
- **The Three-Way Matching Algorithm (Server Domain Controller):**
  1. **Query PO:** Read total approved cost from original `PurchaseOrder`.
  2. **Query Receipt:** Sum all physically verified delivery item quantities from linked `GoodsReceipt` rows.
  3. **Compare & Audit:** Compare `VendorInvoice.billedAmount` against `(GoodsReceipt.quantity * PurchaseOrder.unitPrice) + invoiceTax`.
  4. **Disposition Determination:**
     - **Success (Match within $5.00 threshold):** Transition `VendorInvoice.status = 'MATCHED'`. Automatically generate closing accounting ledger postings in `lib/accounting.ts`: Debit `250-GR/IR-CLEARING`, Credit `210-ACCOUNTS-PAYABLE-VENDOR`. Release document to payment outbox queue for automated bank electronic transfer on due date.
     - **Failure (Discrepancy detected):** Freeze transaction. Set `VendorInvoice.status = 'DISCREPANCY_REVIEW'`. Block general ledger postings and emit critical alerts to Procurement Manager highlighting pricing overcharge or quantity shortage shortages.
