# 03_Feature_Architecture: Comprehensive Enterprise Domain Bible

**Document Type:** Master Feature & Domain Architecture Blueprint  
**Status:** Approved Specification (Phase 1)  
**Scope:** Complete functional specifications for all 15 operational business modules  

---

## Module 1: Front Office & PMS Booking Engine

### Purpose & Business Value
The core revenue drive of the hotel operating system. Directs the full reservation lifecycle from public multi-channel booking searches through down payment capture, physical front-desk check-in, dynamic room assignment, staying operations, night audit fiscal rollover, folio checkout settlement, and permanent historical archiving.

### Actors & Permissions
- **Guest / Travel Agent:** Search availability, quote prices, construct reservations, view personal folios, execute online check-in.
- **Reception / Front Desk (Level 30+):** Execute walk-in bookings, check guests in/out, reassign physical rooms, print registration cards, issue manual folio discounts up to $50.00.
- **Manager (Level 80+):** Approve manual folio adjustments up to $500.00, override sold-out inventory blocks, authorize immediate cancellation fee waivers.
- **Super Admin (Level 100):** Full override capabilities, force historical reservation archival or modification.

### Database Models & Relationships
- **Core Entities:** `Booking`, `BookingGuest`, `RoomType`, `Room`, `JournalEntry`, `FinancialAdjustment`, `Outbox`.
- **Relations:** A `Booking` belongs to one `RoomType` and optionally one assigned physical `Room`. It composes one or more `BookingGuest` occupants and accumulates financial debits/credits via linked `JournalEntry` records.

### Business Rules & Validation Rules
1. **State Machine Immutability:** A reservation MUST progress linearly through authorized state transitions: `PENDING -> RESERVED -> CONFIRMED -> CHECKED_IN -> CHECKED_OUT -> ARCHIVED`. Divergent transitions (e.g., jumping from `PENDING` directly to `CHECKED_OUT` or reverting `CHECKED_OUT` to `CHECKED_IN`) are strictly barred by API controller guardrails.
2. **Room Condition Check-in Barrier:** A guest CANNOT be checked into an assigned `Room` unless `Room.status == 'VACANT_READY'` or `'VACANT_CLEAN'`. Attempts to check in to a `'DIRTY'` or `'OUT_OF_ORDER'` unit must reject with HTTP 409 Conflict.
3. **Zero-Balance Checkout Mandate:** A booking CANNOT transition to `CHECKED_OUT` until total financial credits equal total financial debits on the guest folio (`SUM(debit) - SUM(credit) == 0`). Unsettled balances force immediate credit card charge via Stripe or transfer to an authorized B2B `CorporateAccount` invoicing ledger.

### Workflow & Architecture Highlights
- **Distributed Concurrency Lock:** To prevent double-bookings during concurrent flash sales, availability search endpoints (`/api/pricing/quote` and `/api/bookings/create`) acquire a Redis ephemeral lock: `SETNX lock:room_type:{id}:2026-10-12 10`. If unavailable, execution aborts immediately with a "Room inventory currently held by another booking session" warning.

---

## Module 2: Point of Sale (POS), Restaurant Dining & Recipe Depletion Engine

### Purpose & Business Value
Manages all food and beverage operations across the property, including fine-dining restaurants, poolside bar kiosks, banquet catering, and in-room table service. Directly binds dining revenue capture to live inventory storeroom deduction and room folio cross-charges.

### Actors & Permissions
- **Waiter / Server (Level 20+):** Open table tabs, fire orders to kitchen KDS displays, split checks, present guest bills.
- **Cashier / Bartender (Level 25+):** Settle dining orders via Stripe CC terminal, physical cash, or direct room folio charge billing.
- **Chef / Kitchen (Level 20+):** Interact with Kitchen Display System (KDS) to transition order statuses (`RECEIVED -> PREPARING -> READY -> SERVED`), flag menu items as out-of-stock.
- **F&B Manager (Level 80+):** Create and modify `FoodMenu` prices, configure POS terminal layouts, authorize complementary meals or voided line items.

### Database Models & Relationships
- **Core Entities:** `POSProduct`, `FoodMenu`, `Order`, `OrderItem`, `InventoryItem`, `InventoryStock`, `InventoryMovement`.
- **Relations:** An `Order` contains multiple `OrderItem` rows referencing `POSProduct` IDs. When settled, if linked to a hotel guest, it attaches an accounting debit onto the parent `Booking` folio.

### Business Rules & Validation Rules
1. **Room Charge Verification:** If payment option is selected as `ROOM_CHARGE`, the POS engine must query `/api/bookings/verify-charge` to validate that the provided room number contains an active booking in `CHECKED_IN` status AND that the guest's remaining pre-authorized credit limit exceeds the order total.
2. **Automated Recipe Stock Deduction (BOM Depletion):** Every sold `POSProduct` maps to a Bill of Materials (BOM) ingredient list. Upon checkout completion, an asynchronous `Outbox` event (`POS_ORDER_CLOSED`) fires a service worker to decrement quantities across designated storeroom `InventoryStock` locations and generate immutable `InventoryMovement` audit logs.
3. **Audit Void Justification:** Once an order item is transmitted to the kitchen printer/KDS, removing it from the tab requires managerial override PIN validation and logs a permanent void record to `AuditLog`.

---

## Module 3: CMMS Facilities Maintenance & Preventive Inspection Engineering

### Purpose & Business Value
Protects physical infrastructure investments and guest satisfaction by orchestrating reactive maintenance trouble tickets, recurring mechanical preventive schedules (HVAC filter replacements, boiler safety inspections), IoT engineering diagnostics, and immediate out-of-order room inventory blocking.

### Actors & Permissions
- **All Staff / Maid / Reception (Level 20+):** Submit reactive trouble work orders (e.g., "Room 304 air conditioning dripping water").
- **Maintenance Technician (Level 30+):** Accept assigned work orders, document replacement parts consumed from engineering inventory, log completion timestamps, execute mobile QR-code asset inspections.
- **Chief Engineer (Level 80+):** Construct recurring `MaintenanceSchedule` criteria, authorize structural capital expenditures, mandate physical `OutOfOrderRecord` blocks removing rooms from public booking distribution.

### Database Models & Relationships
- **Core Entities:** `Asset`, `MaintenanceSchedule`, `MaintenanceWorkOrder`, `InspectionLog`, `OutOfOrderRecord`, `Room`.
- **Relations:** A `MaintenanceWorkOrder` links to a target `Asset` and/or structural `Room`. If severe, it forks an `OutOfOrderRecord` locking the assigned room.

### Business Rules & Validation Rules
1. **Automated Inventory Blocking:** Whenever a `MaintenanceWorkOrder` is flagged with severity `CRITICAL_UNSELLABLE` or an explicit `OutOfOrderRecord` is created, the system must atomically transition the target `Room.status` to `OUT_OF_ORDER`, instantly evicting the room from active OTA availability channels and internal front-desk assignment pools.
2. **SRE Cron Automation Engine:** Replace frontend mock timers in `/app/admin/room-rack` with a genuine nightly serverless Cron execution calling `/api/admin/cmms/schedules/evaluate`. This engine parses `MaintenanceSchedule` intervals (e.g., every 90 days) and automatically injects new pending `MaintenanceWorkOrder` tickets into the technical dispatch queue.
3. **Closed Loop Verification:** A maintenance ticket attached to a guest room cannot be finally closed until a Housekeeping supervisor signs off on physical cleanliness via an integrated inspection checkpoint.

---

## Module 4: Procurement, Three-Way Matching & Multi-Location Inventory

### Purpose & Business Value
Guarantees absolute fiscal transparency and supply continuity across food beverage kitchens, housekeeping supply closets, and administrative operations. Implements strict enterprise purchasing governance: Three-Way Matching accounting controls ensuring zero invoices are paid without documented physical goods receipt in specific storerooms.

### Actors & Permissions
- **Storeroom Clerk / Receiver (Level 20+):** Check in deliveries at loading dock, submit physical `GoodsReceipt` audit quantities against vendor packing slips, conduct physical shelf stock counts.
- **Purchasing Buyer (Level 40+):** Generate supplier `PurchaseOrder` drafts, negotiate pricing, issue approved purchase authorizations to vendors up to $2,500.00.
- **Accounts Payable / Finance (Level 60+):** Input received supplier `VendorInvoice` billing documents, initiate automated Three-Way Match validation, authorize bank disbursement transfers via general ledger.
- **General Manager / Super Admin (Level 80+):** Authorize Purchase Orders exceeding $2,500.00.

### Database Models & Relationships
- **Core Entities:** `Vendor`, `PurchaseOrder`, `PurchaseOrderItem`, `GoodsReceipt`, `VendorInvoice`, `InventoryItem`, `InventoryStock`, `InventoryMovement`.
- **Relations:** `PurchaseOrder` pairs with one or many physical `GoodsReceipt` events and supplier `VendorInvoice` filings. Upon completion, stock counts update inside location-specific `InventoryStock` tables.

### Business Rules & Validation Rules
1. **The Three-Way Matching Mandate:** System API endpoints forbid the creation of an Accounts Payable bank payment ledger entry unless an automated comparison proves: `PurchaseOrder.ItemPrice == VendorInvoice.ItemPrice` AND `GoodsReceipt.ReceivedQuantity >= VendorInvoice.BilledQuantity`. Any variance exceeding a strict $5.00 tolerance margin forces the invoice into a frozen `DISCREPANCY_REVIEW` queue.
2. **Location-Specific Stock Segregation:** Activate the **Dead Schema model `InventoryStock`**. Stock items must be tracked across distinct physical locations (e.g., Basement Main Kitchen vs. Rooftop VIP Bar). Direct aggregate adjustments to `InventoryItem` without a designated storeroom location ID are programmatic failures and blocked by validation schemas.
3. **Audit Movement Tracking:** Every modification to inventory quantities—whether from procurement receipt, POS recipe consumption, inter-departmental transfer, or spoilage write-off—must append an immutable record to `InventoryMovement` documenting prior quantity, new quantity, actor user ID, and justification notes.

---

## Module 5: HR Workforce Scheduling, Attendance & Line-Item Payroll

### Purpose & Business Value
Organizes employee contracts, daily shift roster allocations, digital timeclock compliance, leave absence scheduling, and enterprise payroll execution. Converts raw clock-in hours into automated pay slip calculations incorporating tax withholdings, overtime rules, and accounting expense posting.

### Actors & Permissions
- **Staff Employee (Level 20+):** Clock in/out at terminal, view scheduled shifts, submit PTO/leave requests, download personal payslip PDF reports.
- **Department Supervisor (Level 40+):** Authorize departmental weekly shift schedules, approve employee leave absences, manually override missed punch-in timestamps with documented cause.
- **HR Director / Payroll Controller (Level 80+):** Initiate bi-weekly or monthly `PayrollRun` calculation cycles, audit tax wage deductions, lock payroll periods, commit salary expenses to corporate General Ledger.

### Database Models & Relationships
- **Core Entities:** `Employee`, `Shift`, `Attendance`, `LeaveRequest`, `PayrollRun`, `PayrollRecord`, `PayrollLineItem`.
- **Relations:** A `PayrollRun` composes multiple `PayrollRecord` payslips per active employee; each record bundles specific `PayrollLineItem` entries for gross earnings, overtime deductions, and taxes.

### Business Rules & Validation Rules
1. **Line-Item Tax & Deduction Activation:** Activating the **Dead Schema model `PayrollLineItem`** is mandatory during Phase 7 fixing. The payroll engine must calculate and explicitly record discrete line items for every payslip: `GROSS_WAGES`, `FEDERAL_INCOME_TAX_WITHHOLDING`, `SOCIAL_SECURITY_DEDUCTION`, `HEALTH_INSURANCE_PREMIUM`, and `NET_PAY_DISPOSITION`.
2. **Attendance Shift Interlock:** Timeclock API ingestion (`/api/admin/hr/attendance/punch`) verifies that an employee cannot punch in more than 30 minutes prior to a scheduled `Shift.startTime`. Unscheduled punch attempts emit supervisory override notification alerts.
3. **General Ledger Wage Expense Linkage:** Upon transitioning a `PayrollRun.status` to `'CLOSED'`, an automated transactional outbox worker aggregates all payslip financial totals and posts a double-entry `JournalEntry` debiting Payroll Expense accounts and crediting Wage Payable bank liabilities.

---

## Module 6: Executive OLAP Intelligence & Real-time SRE Telemetry

### Purpose & Business Value
Provides hotel owners, corporate executives, and system reliability operators with deep analytical visibility into real-time business metrics (Occupancy %, RevPAR, ADR, F&B margin revenue) and infrastructure health (database query latency, outbox processing velocity, webhook DLQ incident queues, active WebSocket connections).

### Actors & Permissions
- **Manager / Owner (Level 80+):** Access financial business intelligence views, multi-property revPAR comparative charts, and yield performance matrices.
- **SRE Admin / Super Admin (Level 100):** Inspect technical tracing dashboards, execute outbox queue flushing, re-process dead-letter webhook deliveries, audit system exception streams.

### Database Models & Relationships
- **Core Entities:** `Outbox`, `WebhookDLQ`, `AuditLog`, `Booking`, `Room`, `Order`, `JournalEntry`.
- **Relations:** OLAP analytical models operate read-only aggregation queries across transactional business ledgers and system reliability queues.

### Business Rules & Validation Rules
1. **Absolute Eradicating of Presentation Simulations:** All static mock TypeScript arrays (`useState([...])`) and artificial delay timers (`setTimeout`) discovered in `/app/admin/executive-intelligence/page.tsx`, `/app/admin/global-command-center/page.tsx`, and `/app/admin/analytics/bi/page.tsx` must be completely obliterated.
2. **Live Analytical Aggregations:** Executive BI viewports must connect to genuine analytical Server Actions (`/api/admin/executive/analytics-cube`). This endpoint executes real-time SQL aggregation expressions against live PostgreSQL `Booking` and `JournalEntry` records, computing authentic Occupancy percentages (`(Occupied Rooms / Total Active Rooms) * 100`) and RevPAR (`Total Room Revenue / Total Available Room Nights`).
3. **Active SRE Queue Diagnostics:** The Global Command Center must query `/api/admin/sre/health` to dynamically render count gauges representing real unresolved records inside `Outbox` (`where: { status: 'PENDING' }`) and `WebhookDLQ` (`where: { status: 'FAILED' }`). Clicking remediation buttons must trigger actual serverless workers that retry pending relational database writes.
