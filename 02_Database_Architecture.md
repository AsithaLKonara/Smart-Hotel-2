# 02_Database_Architecture: Enterprise Schema & Relational Specifications

**Document Type:** Master Database Architectural Blueprint (The Database Bible)  
**Status:** Approved Specification (Phase 1)  
**Target Engine:** PostgreSQL 15+ via Prisma ORM  

---

## 1. Relational Design Mandates

The database schema of SmartHotel represents an enterprise-grade hospitality operating system consisting of over 70 interconnected tables. To guarantee absolute relational integrity, auditability, and query efficiency, every database model adheres to strict design regulations:
- **Surrogate Keys & UUIDs:** All operational entities utilize secure string UUIDs or CUIDs as primary keys (`id String @id @default(cuid())`) to prevent sequential resource guessing and enable distributed ID generation.
- **Universal Audit Timestamping:** Every single table must maintain `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt`.
- **Soft Deletion Protocol:** Core business records (Bookings, Orders, Employees, Assets, Rooms, Inventory Items) implement `deletedAt DateTime?`. Direct physical row deletion (`DELETE FROM`) is universally barred across operational APIs; queries must apply default filter scopes (`where: { deletedAt: null }`).
- **Foreign Key Enforcement:** Referential actions must be explicitly budgeted. Parent-child composition hierarchies (e.g., `Order` -> `OrderItem`, `PurchaseOrder` -> `PurchaseOrderItem`, `Booking` -> `BookingGuest`) apply `onDelete: Cascade`. Reference linkages to accounting ledgers, audit logs, or personnel apply `onDelete: Restrict` or `onDelete: SetNull` to prevent cascading historical data erasure.

---

## 2. Master Domain Model Specifications (Table-by-Table Bible)

---

### Domain 1: Identity, RBAC & Core Security Governance

#### `User`
- **Purpose:** Central authenticating actor identity for internal staff, hotel guests, and external partners.
- **Owner Module:** Identity & NextAuth Engine.
- **Relationships:** One-to-Many with `Account`, `Session`, `Booking`, `Order`, `AuditLog`, `LeaveRequest`, `Shift`, `Attendance`; One-to-One with `GuestProfile` and `Employee`.
- **Indexes:** `@index([email])`, `@index([role])`, `@index([deletedAt])`.
- **Constraints:** Unique on `email`.
- **Soft Delete:** Yes (`deletedAt DateTime?`).
- **Used APIs:** `/api/auth/*`, `/api/admin/users/*`, `/api/staff/*`.
- **Used Pages:** All NextAuth session viewports, Admin Staff Directories, Profile Dashboards.
- **Background Jobs:** GDPR inactivity pruning scheduled worker.
- **Unused/Dead Fields Remediation:** Activate `lastLoginAt` and failed login attempt counters for security throttling.
- **Migration & Performance Risk:** Low migration risk. Highly accessed; requires Redis caching for session token lookup.

#### `Role`, `Permission`, `RolePermission`
- **Purpose:** Implements granular, table-driven RBAC authorization. Replaces hardcoded string enum permissions with dynamic organizational role mappings.
- **Owner Module:** Security Governance & RBAC Admin.
- **Relationships:** `Role` has many `RolePermission` and `User`. `Permission` has many `RolePermission`.
- **Indexes:** `@index([name])` on Role; `@index([roleId, permissionId])` on RolePermission.
- **Constraints:** Unique compound key `[roleId, permissionId]`.
- **Soft Delete:** No (System configuration tables; changes audited via AuditLog).
- **Used APIs:** `/api/staff/roles`, `/api/staff/seed`.
- **Used Pages:** `/admin/governance/roles`, `/admin/hr/permissions`.
- **Background Jobs:** None.
- **Unused/Dead Fields Remediation:** Enforce `levelWeight Int` on Role to support strict hierarchical access checks in edge middleware.
- **Migration & Performance Risk:** Very low risk. Must be fully cached in Redis (`rbac:role:{id}`) to prevent DB hits on every edge request.

#### `AuditLog`
- **Purpose:** Immutable forensic logging engine capturing every administrative action, data modification, and login event.
- **Owner Module:** Security SRE & Compliance.
- **Relationships:** Belongs to `User` (actor).
- **Indexes:** `@index([userId])`, `@index([action])`, `@index([entityId, entityType])`, `@index([createdAt])`.
- **Constraints:** None (Append-only ledger).
- **Soft Delete:** Absolutely FORBIDDEN. Records cannot be updated or deleted.
- **Used APIs:** All POST/PUT/DELETE API endpoints inject via Service Layer; `/api/admin/audit-logs`.
- **Used Pages:** `/admin/audit-logs`, `/admin/observability`.
- **Background Jobs:** Automatic quarterly partition archival to cold blob storage.
- **Unused/Dead Fields Remediation:** Ensure `ipAddress` and `userAgent` strings are systematically populated from request HTTP headers.
- **Migration & Performance Risk:** High volume table. Requires PostgreSQL partitioning by month on `createdAt`.

---

### Domain 2: Front Office, PMS & Room Asset Management

#### `RoomType`
- **Purpose:** Master structural classification of physical accommodation spaces (Deluxe, Suite, Penthouse), establishing base occupancy, rates, and amenities.
- **Owner Module:** Front Office PMS & Booking Engine.
- **Relationships:** One-to-Many with `Room`, `Booking`, `SeasonalRate`, `YieldRule`, `RoomMapping`.
- **Indexes:** `@index([code])`, `@index([isActive])`.
- **Constraints:** Unique on `code` (e.g., `DLX_K`, `STE_Q`). `basePrice >= 0`, `capacity >= 1`.
- **Soft Delete:** Yes (`deletedAt DateTime?`).
- **Used APIs:** `/api/room-types/*`, `/api/pricing/quote`.
- **Used Pages:** `/admin/rooms/types`, Public Guest Booking Engine.
- **Background Jobs:** Referenced in daily OTA inventory broadcast routines.
- **Unused/Dead Fields Remediation:** Complete integration of `overbookingLimitPercent` to govern yield thresholds.
- **Migration Risk & Performance Risk:** Low volume, high read frequency. Highly cacheable.

#### `Room` & `RoomImage`
- **Purpose:** Tracks individual physical keys/units within the property and associated high-resolution architectural photo galleries.
- **Owner Module:** Front Office & Housekeeping.
- **Relationships:** Belongs to `RoomType`; One-to-Many with `RoomStatusHistory`, `Booking` (assigned room), `MaintenanceWorkOrder`, `OutOfOrderRecord`, and `RoomImage`.
- **Indexes:** `@index([roomTypeId])`, `@index([status])`, `@index([floor])`, `@index([number])`.
- **Constraints:** Unique on `number` (e.g., "101", "405"). Valid status enum (`VACANT_CLEAN`, `VACANT_DIRTY`, `OCCUPIED`, `OUT_OF_ORDER`).
- **Soft Delete:** Yes (`deletedAt DateTime?`).
- **Used APIs:** `/api/rooms/*`, `/api/housekeeping/*`, `/api/admin/rooms/*`.
- **Used Pages:** `/admin/room-rack`, `/admin/housekeeping/dashboard`.
- **Background Jobs:** Midnight automated status rollover from occupied to checkout pending.
- **Unused/Dead Fields Remediation:** Activate the **Dead Schema model `RoomImage`** by binding it to public booking room preview sliders and housekeeping inspection photo proofing.
- **Migration Risk & Performance Risk:** Medium read volume, frequently updated by housekeeping kiosks and front desk.

#### `RoomStatusHistory`
- **Purpose:** Temporal tracking audit trail of all housekeeping and physical condition state transitions for analytical cycle-time reporting.
- **Owner Module:** Housekeeping & SRE Telemetry.
- **Relationships:** Belongs to `Room` and `User` (housekeeper/inspector).
- **Indexes:** `@index([roomId])`, `@index([createdAt])`, `@index([status])`.
- **Constraints:** None (Append-only operational event log).
- **Soft Delete:** Forbidden (Audit integrity).
- **Used APIs:** `/api/housekeeping/inspection`, `/api/admin/housekeeping/rooms`.
- **Used Pages:** `/admin/housekeeping/reports`, UI room timeline modals.
- **Background Jobs:** Daily aggregation job calculation for maid cleaning velocity metrics.
- **Unused/Dead Fields Remediation:** Ensure `durationMinutes` is auto-calculated on transition to `VACANT_CLEAN`.
- **Migration Risk & Performance Risk:** Moderate growth table; clean up historical events older than 1 year via cron.

#### `Booking` & `BookingGuest`
- **Purpose:** Core reservation identity governing guest stays, pricing quotes, check-in/out timestamps, and financial folio settlement.
- **Owner Module:** Reservation & PMS Core.
- **Relationships:** Belongs to `User` (guest/agent), `RoomType`, `Room`; One-to-Many with `BookingGuest`, `Order` (room service folios), `JournalEntry`, and `FinancialAdjustment`.
- **Indexes:** `@index([checkInDate, checkOutDate])`, `@index([status])`, `@index([bookingReference])`, `@index([roomTypeId])`.
- **Constraints:** Unique on `bookingReference` (e.g., `SMH-88219`). `checkOutDate > checkInDate`.
- **Soft Delete:** Yes (`deletedAt DateTime?`), paired with cancellation enum status.
- **Used APIs:** `/api/bookings/*`, `/api/admin/bookings/*`, `/api/webhooks/stripe`.
- **Used Pages:** Front Desk Check-in Console, Guest Portal, Room Rack.
- **Background Jobs:** No-Show automated archival runner (fires daily at 02:00 AM).
- **Unused/Dead Fields Remediation:** Activate **Dead Schema model `BookingGuest`** to mandate collection of additional occupant names and ID document passport hashes during online registration and kiosk check-in.
- **Migration Risk & Performance Risk:** Critical production hotspot. Requires index optimization on date ranges for real-time availability querying.

---

### Domain 3: POS, Dining & Food Service Engine

#### `POSProduct` & `FoodMenu`
- **Purpose:** Categorized master dictionary of sellable dining items, beverage listings, restaurant specials, and room service catalog products.
- **Owner Module:** POS Dining Engine.
- **Relationships:** One-to-Many with `OrderItem` and recipe ingredient mappings.
- **Indexes:** `@index([category])`, `@index([isAvailable])`, `@index([sku])`.
- **Constraints:** Unique on `sku`. `price >= 0`.
- **Soft Delete:** Yes (`deletedAt DateTime?`).
- **Used APIs:** `/api/pos/products/*`, `/api/restaurant/menu/*`.
- **Used Pages:** POS Waiter Ordering Terminal, Room Service Mobile Menu.
- **Background Jobs:** Daily stock availability re-evaluator.
- **Unused/Dead Fields Remediation:** Ensure nutritional tags and allergens in `FoodMenu` seamlessly cross-reference against CRM `GuestPreference` profile flags during order entry.
- **Migration & Performance Risk:** High read volume; cached at POS terminals via localized application memory.

#### `Order` & `OrderItem`
- **Purpose:** Transactional execution record of dining purchases, bar tabs, banquet catering bills, and room service ticket routing.
- **Owner Module:** POS & Food Beverage Operations.
- **Relationships:** Belongs to `User` (server), `Booking` (optional room folio charge); One-to-Many with `OrderItem`.
- **Indexes:** `@index([status])`, `@index([bookingId])`, `@index([createdAt])`.
- **Constraints:** Total price must exactly equal sum of `OrderItem.unitPrice * OrderItem.quantity` plus applicable taxes.
- **Soft Delete:** Yes (`deletedAt DateTime?`), though cancelled orders require void reasoning logs.
- **Used APIs:** `/api/restaurant/orders/*`, `/api/pos/orders/*`.
- **Used Pages:** Kitchen Display System (KDS), Cashier Terminal, Room Folio Billing View.
- **Background Jobs:** Async trigger emitting events to `Outbox` for inventory recipe deduction.
- **Unused/Dead Fields Remediation:** Mandate inclusion of `tableNumber` and `serverEmployeeId` across all dine-in order records.
- **Migration & Performance Risk:** Real-time throughput critical; relies on Pusher websocket alerts upon INSERT.

---

### Domain 4: Accounting, General Ledger & Audit Reconciliation

#### `JournalEntry` & `TransactionCode`
- **Purpose:** Core Double-Entry General Ledger. Every cent moving through the hotel (room bookings, tax charges, F&B purchases, wage expenditures, vendor invoices) resolves into a balanced debit/credit posting against formal Uniform System of Accounts (USALI) codes.
- **Owner Module:** Corporate Accounting & Finance.
- **Relationships:** Belongs to `Booking`, `Order`, or `PurchaseOrder` as source vouchers; refers to `TransactionCode`.
- **Indexes:** `@index([transactionCodeId])`, `@index([postingDate])`, `@index([bookingId])`.
- **Constraints:** Strict balance assertion across accounting batches: `SUM(debit) == SUM(credit)`.
- **Soft Delete:** Absolutely FORBIDDEN (Immutable fiscal ledger).
- **Used APIs:** Internal invocations via `lib/accounting.ts`; `/api/admin/accounting/night-audit`.
- **Used Pages:** `/admin/accounting/journal`, Balance Sheet and P&L Reports.
- **Background Jobs:** Nightly rollover and trial balance verification routines.
- **Unused/Dead Fields Remediation:** Activate **Dead Schema model `TransactionCode`** immediately. Refactor all folio checkout and POS settlement functions to stop writing generic strings and strictly link to valid `TransactionCode.id` entities (e.g., Code `100-RM-REV` for Room Revenue, `200-FB-REV` for Restaurant Sales, `250-TX-VAT` for State Sales Tax).
- **Migration & Performance Risk:** Highest database volume growth. Require sequential partition archiving at fiscal year ends.

#### `FinancialAdjustment`
- **Purpose:** Formal audit authorization record for any manual price reduction, folio dispute write-off, promotional override, or administrative refund.
- **Owner Module:** Accounting & Reception management.
- **Relationships:** Belongs to `Booking` or `Order` (target folio), and `User` (authorizing manager).
- **Indexes:** `@index([bookingId])`, `@index([authorizerUserId])`, `@index([createdAt])`.
- **Constraints:** `amount != 0`, mandatory string `reasoning`.
- **Soft Delete:** Absolutely FORBIDDEN.
- **Used APIs:** `/api/admin/accounting/adjustments` (To be developed in Phase 7).
- **Used Pages:** Managerial Folio Review Console, Front Desk Managerial Overrides.
- **Background Jobs:** Daily variance alert compilation emailed to Financial Controller.
- **Unused/Dead Fields Remediation:** Activate **Dead Schema model `FinancialAdjustment`**. Current folio workflows allowing untracked discount string input must be completely decommissioned; every discount must generate a corresponding `FinancialAdjustment` entity.
- **Migration & Performance Risk:** Low volume, maximum governance critical.

---

### Domain 5: Procurement, Vendor Three-Way Matching & Inventory Stock

#### `Vendor` & `PurchaseOrder` & `PurchaseOrderItem`
- **Purpose:** Supplies purchasing engine managing supplier profiles, wholesale contracts, order submissions, and expected pricing for hotel F&B and operational supplies.
- **Owner Module:** Procurement & Back Office.
- **Relationships:** `Vendor` has many `PurchaseOrder`; `PurchaseOrder` has many `PurchaseOrderItem` and `GoodsReceipt`.
- **Indexes:** `@index([vendorId])`, `@index([status])`, `@index([orderDate])`.
- **Constraints:** Valid status enums (`DRAFT`, `SUBMITTED`, `RECEIVED`, `MATCHED`, `PAID`).
- **Soft Delete:** Yes (`deletedAt DateTime?`).
- **Used APIs:** `/api/admin/procurement/orders/*`, `/api/admin/procurement/vendors/*`.
- **Used Pages:** Procurement Dashboard, Vendor Portal, Executive Approval Queue.
- **Background Jobs:** Automatic overdue shipment flagger.
- **Unused/Dead Fields Remediation:** Bind approval limits to user RBAC weights (e.g., PO > $5,000 mandates `SUPER_ADMIN` approval signature).
- **Migration & Performance Risk:** Low database risk; moderate read complexity during inventory reconciliation.

#### `GoodsReceipt` & `VendorInvoice`
- **Purpose:** Completes the **Three-Way Matching Accounting Control (PO <-> Receipt <-> Invoice)**. Guarantees the hotel never pays for goods that were not physically verified by storeroom receiving staff.
- **Owner Module:** Procurement, Receiving & Accounts Payable.
- **Relationships:** Belongs to `PurchaseOrder` and `Vendor`; linked to `JournalEntry` upon invoice payment approval.
- **Indexes:** `@index([purchaseOrderId])`, `@index([invoiceNumber])`, `@index([status])`.
- **Constraints:** Unique invoice numbers per vendor (`[vendorId, invoiceNumber]`).
- **Soft Delete:** Forbidden once status transitions to `MATCHED` or `APPROVED`.
- **Used APIs:** `/api/admin/procurement/receipts`, `/api/admin/procurement/invoices` (Phase 7 implementation).
- **Used Pages:** Loading Dock Receiving App, Accounts Payable Dashboard.
- **Background Jobs:** Discrepancy reporting job comparing invoiced amounts against received quantities.
- **Unused/Dead Fields Remediation:** Activate **Dead Schema models `GoodsReceipt` and `VendorInvoice`** immediately. Current procurement ends arbitrarily at PO creation; Phase 7 must implement the UI receiving dock forms and invoice ledger posting in `lib/accounting.ts`.
- **Migration & Performance Risk:** Standard transactional volume.

#### `InventoryItem`, `InventoryStock`, & `InventoryMovement`
- **Purpose:** Real-time physical materials tracking across multiple storerooms (Main F&B Basement, Housekeeping Central, Spa Pantry, Rooftop Bar).
- **Owner Module:** Inventory Control & POS Recipe Engine.
- **Relationships:** `InventoryItem` has many `InventoryStock` (by location) and `InventoryMovement` (audit ledger of additions/subtractions/transfers).
- **Indexes:** `@index([sku])`, `@index([itemId, locationId])`, `@index([createdAt])`.
- **Constraints:** `InventoryStock.quantity >= 0`. Unique constraint on `[inventoryItemId, locationName]`.
- **Soft Delete:** Yes on Item and Stock; forbidden on `InventoryMovement` (audit ledger).
- **Used APIs:** `/api/inventory/*`, `/api/admin/inventory/*`.
- **Used Pages:** Stock Auditing App, Kitchen Kiosk, Beverage Control Panel.
- **Background Jobs:** Reorder threshold breach evaluation (fires alerts when `quantity <= minThreshold`).
- **Unused/Dead Fields Remediation:** Activate **Dead Schema model `InventoryStock`**. Current implementations directly mutate aggregate numbers on `InventoryItem`; Phase 7 must refactor stock tracking to adjust explicit `InventoryStock` location buckets and update `lastCountedAt` during periodic storeroom physical audits.
- **Migration & Performance Risk:** High write velocity during restaurant peak service hours via background Outbox queue processing.

---

### Domain 6: CMMS, Facilities Maintenance & IoT Inspections

#### `Asset` & `MaintenanceSchedule`
- **Purpose:** Lifecycle tracking for structural mechanical property equipment (HVAC units, Commercial Boilers, Elevator Banks, POS Hardware) and structured recurring maintenance compliance plans.
- **Owner Module:** Facilities Maintenance & Engineering.
- **Relationships:** `Asset` has many `MaintenanceSchedule`, `MaintenanceWorkOrder`, and `InspectionLog`.
- **Indexes:** `@index([category])`, `@index([status])`, `@index([location])`.
- **Constraints:** Unique on `assetTag` (e.g., `HVAC-FL2-04`).
- **Soft Delete:** Yes (`deletedAt DateTime?`).
- **Used APIs:** `/api/admin/cmms/assets/*`, `/api/admin/cmms/schedules/*`.
- **Used Pages:** Chief Engineer Console, Asset Scan Barcode View.
- **Background Jobs:** Nightly Cron sweep executing `MaintenanceSchedule` criteria to automatically generate new `MaintenanceWorkOrder` tasks.
- **Unused/Dead Fields Remediation:** Bind warranty expiration dates to automated email warnings sent to procurement.
- **Migration & Performance Risk:** Low volume, highly stable relational structure.

#### `MaintenanceWorkOrder`, `InspectionLog`, & `OutOfOrderRecord`
- **Purpose:** Operational engineering ticketing for preventative maintenance, emergency breakdowns, quality assurance checks, and mandatory physical room removal from reservation inventory.
- **Owner Module:** CMMS & Housekeeping Coordination.
- **Relationships:** Belongs to `Asset`, `Room`, and `User` (assigned engineer); `OutOfOrderRecord` blocks `Room` availability.
- **Indexes:** `@index([roomId])`, `@index([assignedToUserId])`, `@index([status])`, `@index([startDate, endDate])` on OutOfOrderRecord.
- **Constraints:** `OutOfOrderRecord.endDate > startDate`. Room status must transition to `OUT_OF_ORDER` during active blocks.
- **Soft Delete:** Yes on tickets; No on `InspectionLog` (quality safety audit trail).
- **Used APIs:** `/api/admin/maintenance/tickets/*`, `/api/admin/cmms/inspections/*`.
- **Used Pages:** Engineering Mobile Dashboard, Room Rack Out-of-Order modal.
- **Background Jobs:** Real-time SLA breach timer evaluating ticket age against maximum allowed resolution minutes.
- **Unused/Dead Fields Remediation:** Re-engineer the mock `setTimeout` simulation in `/app/admin/room-rack` into real backend state changes triggered by genuine work order updates and scheduled maintenance executions.
- **Migration & Performance Risk:** Medium read/write throughput; directly queried during reservation availability checks to exclude out-of-order keys.

---

### Domain 7: Human Resources, Workforce Scheduling & Payroll

#### `Employee`, `Shift`, & `Attendance`
- **Purpose:** Personnel management tracking staffing contracts, departmental scheduling rosters, and exact biometric/digital clock-in and clock-out timestamps.
- **Owner Module:** Human Resources & Operations Management.
- **Relationships:** `Employee` links to authenticating `User`; has many `Shift`, `Attendance`, `LeaveRequest`, and `PayrollRecord`.
- **Indexes:** `@index([employeeId, shiftDate])`, `@index([department])`.
- **Constraints:** Unique worker employee number. `Attendance.clockOut > clockIn`.
- **Soft Delete:** Yes (`deletedAt DateTime?`).
- **Used APIs:** `/api/admin/hr/shifts/*`, `/api/admin/hr/attendance/*`, `/api/admin/hr/employees/*`.
- **Used Pages:** HR Management Portal, Employee Self-Service Roster, Staff Clock-in Kiosk.
- **Background Jobs:** Midnight shift reconciliation detecting missing clock-outs and flagging supervisor alert queues.
- **Unused/Dead Fields Remediation:** Bind attendance compliance scores directly to supervisory KPI viewports.
- **Migration & Performance Risk:** Medium read volume during shift rotation hours.

#### `PayrollRun`, `PayrollRecord`, & `PayrollLineItem`
- **Purpose:** Complete wage calculation engine converting approved attendance hours and salaries into validated pay slips with itemized tax withholdings and deductions.
- **Owner Module:** HR Payroll & Accounting Integration.
- **Relationships:** `PayrollRun` has many `PayrollRecord`; `PayrollRecord` belongs to `Employee` and has many `PayrollLineItem`.
- **Indexes:** `@index([payrollRunId])`, `@index([employeeId])`, `@index([payPeriodStart, payPeriodEnd])`.
- **Constraints:** `netPay == grossPay - SUM(deductions)`.
- **Soft Delete:** Forbidden once `PayrollRun.status == 'LOCKED'`.
- **Used APIs:** `/api/admin/hr/payroll/*`.
- **Used Pages:** Payroll Controller Console, Employee Payslip Printable View.
- **Background Jobs:** Monthly wage General Ledger posting routine.
- **Unused/Dead Fields Remediation:** Activate **Dead Schema model `PayrollLineItem`**. Current payroll execution stubs out a flat summary; Phase 7 must build out the computational logic to insert individual `PayrollLineItem` rows for Income Tax withholdings, Health Insurance deductions, Overtime multipliers, and Pension contributions.
- **Migration & Performance Risk:** Periodic high-volume computation during bi-weekly or monthly payroll processing runs.

---

### Domain 8: CRM, B2B Corporate, Loyalty & Resort Portals

#### `GuestProfile`, `GuestPreference`, & `LoyaltyPoint`
- **Purpose:** Deep personalization and guest retention mechanics, storing stay preferences, allergies, VIP tier statuses, and accumulated rewards balances.
- **Owner Module:** CRM & Guest Experience Engine.
- **Relationships:** Belongs to `User` or standalone email profile; One-to-One with `GuestPreference`; One-to-Many with `LoyaltyPoint` transactions and historical bookings.
- **Indexes:** `@index([email])`, `@index([loyaltyTier])`, `@index([phoneNumber])`.
- **Constraints:** Unique on `email` and `loyaltyMembershipNumber`. `LoyaltyPoint.balance >= 0`.
- **Soft Delete:** Yes (`deletedAt DateTime?`), governed by GDPR Right to be Forgotten erasure protocols.
- **Used APIs:** `/api/crm/guests/*`, `/api/loyalty/transactions/*`, `/api/compliance/gdpr/forget-me`.
- **Used Pages:** Front Desk VIP Arrivals Alert, Guest Super App Dashboard, CRM Admin Portal.
- **Background Jobs:** Annual loyalty points expiration evaluator and tier promotion status calculator.
- **Unused/Dead Fields Remediation:** Expand `GuestPreference` usage across dining reservation viewports to automatically flag allergic warnings on kitchen printed slips.
- **Migration & Performance Risk:** High read dependency during check-in workflows.

#### `CorporateAccount`, `TravelAgent`, & `GroupBlock`
- **Purpose:** B2B commercial wholesale reservation engines governing company discounted rate agreements, travel agent IATA commission trackers, and room allotments for conferences.
- **Owner Module:** B2B Corporate Sales & Banqueting.
- **Relationships:** `CorporateAccount` and `TravelAgent` link to many `Booking`; `GroupBlock` links to `RoomType` and many attendee reservations.
- **Indexes:** `@index([companyName])`, `@index([iataNumber])`, `@index([groupCode])`.
- **Constraints:** Unique IATA number; `GroupBlock.allocatedRooms >= BookedRooms`.
- **Soft Delete:** Yes (`deletedAt DateTime?`).
- **Used APIs:** `/api/portals/b2b/book`, `/api/admin/crm/corporate`, `/api/admin/events/blocks/*`.
- **Used Pages:** Corporate Booking Portal, Travel Agency Self-Service Book Engine, Sales Management Group Block Grid.
- **Background Jobs:** Unreserved group block room release runner (automatically dissolves held room blocks 14 days prior to check-in).
- **Unused/Dead Fields Remediation:** Completely drop or merge the **Dead Schema model `CompanyProfile`** into `CorporateAccount` to eliminate architectural database redundancy and schema bloat.
- **Migration & Performance Risk:** Low write, moderate read velocity during corporate group booking cycles.

#### `ResortFacility`, `ResortBooking`, & `ResortService`
- **Purpose:** Multi-amenity resort booking management handling tennis court reservations, spa treatment appointments, cabana rentals, and add-on luxury service packages.
- **Owner Module:** Resort Amenities Operations & Guest App.
- **Relationships:** `ResortFacility` has many `ResortBooking`; `ResortBooking` links to `Booking` (guest stay) and includes selected `ResortService` line items.
- **Indexes:** `@index([facilityId, startTime, endTime])`, `@index([bookingId])`.
- **Constraints:** Zero time-overlap reservation constraint on identical single-capacity facility assets.
- **Soft Delete:** Yes (`deletedAt DateTime?`).
- **Used APIs:** `/api/admin/resort/*`, Public Resort amenity scheduler endpoints.
- **Used Pages:** Concierge Amenity Booking Grid, Guest Touchscreen Kiosk Amenity Page.
- **Background Jobs:** Automated billing charge injection from completed amenity appointments directly to guest primary room folios.
- **Unused/Dead Fields Remediation:** Activate **Dead Schema model `ResortService`** immediately. Current resort implementation allows booking empty room slots; Phase 7 must populate sellable add-on services (e.g., "Deep Tissue Massage - $120", "Private Cabana Champagne Package - $250") within `ResortService` and link them to customer folio charges.
- **Migration & Performance Risk:** Medium read complexity; requires time-slot interval overlap SQL queries.

---

### Domain 9: Dynamic Yield, Channel Manager & Banqueting Events

#### `YieldRule` & `SeasonalRate`
- **Purpose:** Algorithmic revenue maximization engine defining date-based rate fluctuations, occupancy-triggered price multipliers, and length-of-stay promotional discounts.
- **Owner Module:** Revenue Management & Yield Engine.
- **Relationships:** Belongs to `RoomType`.
- **Indexes:** `@index([roomTypeId, startDate, endDate])`, `@index([isActive])`.
- **Constraints:** `multiplier > 0`, non-overlapping dates for identical rule priority levels.
- **Soft Delete:** Yes (`deletedAt DateTime?`).
- **Used APIs:** `/api/admin/yield-rules/*`, `/api/pricing/seasonal-rates/*`.
- **Used Pages:** Revenue Yield Optimizer Console, Pricing Calendar Viewport.
- **Background Jobs:** Hourly availability recalculator evaluating hotel occupancy percentages against yield rule criteria to dynamically modulate room rate quotes.
- **Unused/Dead Fields Remediation:** Replace the static UI simulation bars in `/app/admin/yield` and `/app/admin/pricing` with live GraphQL or REST queries binding directly to `YieldRule` real-time multiplier simulation outputs.
- **Migration & Performance Risk:** High query volume during public booking search; requires caching in Redis (`rates:room_type:{id}:{date}`).

#### `ChannelConfig`, `RoomMapping`, & `SyncLog`
- **Purpose:** Third-party OTA (Online Travel Agency - Booking.com, Expedia, Airbnb) inventory and rate distribution infrastructure.
- **Owner Module:** Channel Manager & Integrations.
- **Relationships:** `ChannelConfig` has many `RoomMapping`; all synchronization transfers record to `SyncLog`.
- **Indexes:** `@index([channelName])`, `@index([externalRoomId])`, `@index([status])` on SyncLog.
- **Constraints:** Unique mapping pair `[channelId, internalRoomTypeId]`.
- **Soft Delete:** Yes on mappings; Forbidden on `SyncLog` (telemetry trace ledger).
- **Used APIs:** `/api/channels/config/*`, `/api/channels/webhook/*`, `/api/admin/ota/*`.
- **Used Pages:** Channel Manager Dashboard, OTA Synchronization History Grid.
- **Background Jobs:** Outbound rate broadcast cron job (transmits price changes every 15 minutes to OTA APIs).
- **Unused/Dead Fields Remediation:** Refactor `/api/channels/seed` and `/api/channels/webhook` to strip out mock simulated JSON strings and execute genuine two-way XML/JSON payload serialization against active database `RoomMapping` records.
- **Migration & Performance Risk:** High burst writing to `SyncLog`; set auto-pruning to retain log records for 30 days maximum.

#### `BanquetingEvent` & `EventSpace`
- **Purpose:** Commercial conference and wedding venue management, tracking exhibition hall layouts, catering package pricing, and corporate customer scheduling.
- **Owner Module:** Banqueting & Event Sales.
- **Relationships:** `BanquetingEvent` reserves one or many `EventSpace` units and links to `CorporateAccount`.
- **Indexes:** `@index([eventSpaceId, eventDate])`, `@index([status])`.
- **Constraints:** Zero date-time overlap constraint per individual physical event room space.
- **Soft Delete:** Yes (`deletedAt DateTime?`).
- **Used APIs:** `/api/admin/events/*`, `/api/events/book`.
- **Used Pages:** Banqueting Conference Coordinator, Public Convention Booking Center.
- **Background Jobs:** Deposit payment deadline enforcer (cancels pending tentative bookings lacking confirmed Stripe deposit receipts within 72 hours).
- **Unused/Dead Fields Remediation:** Activate **Dead Schema model `EventBooking`**. Ensure every commercial banquet links directly to structured customer deposit folios and generates automated kitchen catering alerts in the POS system.
- **Migration & Performance Risk:** Low data volume, high transaction value.

---

### Domain 10: SRE Telemetry, System Governance & Webhook DLQ

#### `Outbox` & `WebhookDLQ`
- **Purpose:** Foundational asynchronous reliability engine. Guarantees ACID atomic consistency across distributed components (Outbox pattern) and ensures zero data loss during external network or partner webhook delivery failures (DLQ).
- **Owner Module:** System Reliability Engineering (SRE) & Core Architecture.
- **Relationships:** References target domain entity IDs via polymophic string identifiers.
- **Indexes:** `@index([status])`, `@index([eventType])`, `@index([createdAt])`.
- **Constraints:** Status enums (`PENDING`, `PROCESSING`, `PROCESSED`, `FAILED`, `DEAD`).
- **Soft Delete:** No (Queue records purged after successful processing or manual DLQ replay resolution).
- **Used APIs:** `/api/admin/sre/health`, internal background SRE worker polling routines (`lib/reconciliation-worker.ts`).
- **Used Pages:** SRE Global Command Center, Telemetry DLQ Triage Console.
- **Background Jobs:** Continuous 5-second polling loop processing pending Outbox records and retrying failed Webhook DLQ payloads with exponential backoff algorithms.
- **Unused/Dead Fields Remediation:** Replace the static, fake failover simulation logging in `/app/admin/global-command-center/page.tsx` with live real-time metrics reading pending outbox queue depth and active DLQ incident counts directly from these tables.
- **Migration & Performance Risk:** Extreme write and delete velocity. Requires tuned autovacuum settings in PostgreSQL to prevent table bloat from queue churn.

#### `Setting`, `Integration`, `WebhookEndpoint`, & `WebhookSubscription`
- **Purpose:** Multi-tenant operational control switches, API key Vault management, and automated outbound webhook subscriber infrastructure for enterprise software integrations.
- **Owner Module:** Platform Governance & System Admin.
- **Relationships:** `WebhookEndpoint` has many `WebhookSubscription` and delivery historical trails.
- **Indexes:** `@index([key])` on Setting; `@index([provider])` on Integration.
- **Constraints:** Unique on `Setting.key` (e.g., `HOTEL_NAME`, `CHECK_IN_TIME`, `TAX_RATE_PERCENT`).
- **Soft Delete:** No (Live system configuration key-value pairs).
- **Used APIs:** `/api/settings/*`, `/api/admin/settings/*`.
- **Used Pages:** `/admin/settings/general`, `/admin/settings/integrations`, Webhook Developer Center.
- **Background Jobs:** Cache invalidation broadcast upon setting modification.
- **Unused/Dead Fields Remediation:** Mandate strict AES-256-GCM encryption for all sensitive third-party token strings stored inside `Integration.secretKey` before committing to PostgreSQL.
- **Migration & Performance Risk:** Extremely high read rate; must remain completely buffered within internal application memory and Redis cache (`config:all`).
