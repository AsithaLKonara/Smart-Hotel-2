# 08_Fixing_Roadmap: Master Phased Engineering & Execution Plan

**Document Type:** Master Implementation, Refactoring & Production Roadmap (The Roadmap Bible)  
**Status:** Approved Specification (Phase 1)  
**Strategy:** Zero technical debt tolerance; rigorous adherence to design blueprints before deployment  

---

## 1. Execution Methodology & Discipline Mandates

This master roadmap establishes a strict, phased execution order to transform the SmartHotel software repository from its current dual-stack state (a functional core accompanied by simulated presentation dashboards and dead schemas) into a fully verified, enterprise-grade hospitality operating system.
- **Strict Phase Gate Lock:** Engineering development CANNOT commence on subsequent phases until the exit verification test suite of the preceding phase completes with 100% successful execution.
- **Zero Simulation Tolerance:** Any code containing artificial delay timers (`setTimeout` intended to simulate processing), static frontend mock arrays (`useState([...])` substituting for database queries), or empty catch blocks MUST be thoroughly excised and replaced with verified backend integration.

---

## 2. Phased Engineering Execution Schedule

```
[Phase 1: Enterprise System Design Audit] (COMPLETE - Bibles Established)
       │
       ▼
[Phase 2: Gap Analysis & Technical Debt Triage]
       │
       ▼
[Phase 3: Database & Ledger Schema Activation (Dead Schema Eradication)]
       │
       ▼
[Phase 4: Core Front & Back-Office Feature Remediation]
       │
       ▼
[Phase 5: Eradicating UI Simulation & Enabling Live Telemetry / OLAP]
       │
       ▼
[Phase 6: E2E Integration, Load Verification & Production Audit]
```

---

### Phase 2: Gap Analysis & Technical Debt Triage
**Objective:** Formally map every divergence between our established Phase 1 Blueprint Bibles and the active TypeScript source code, creating an indexed engineering execution checklist.
- **Key Engineering Tasks:**
  1. Audit all 57 route handlers in `app/api/*` against `05_API_Architecture.md`; catalog endpoints lacking typed Zod validation schemas or structured JSON error responses.
  2. Map all client component pages in `app/admin/*`; flag files importing mock initializer variables (e.g., `INITIAL_ROOMS`, `INITIAL_LOGS`) or utilizing dummy state arrays.
  3. Validate database foreign key indexing and CASCADE removal rules in `prisma/schema.prisma` against `02_Database_Architecture.md`.
- **Exit Gate Criteria:** Delivery of a detailed gap reconciliation list ready for targeted code changes.

---

### Phase 3: Database & Ledger Schema Activation (Dead Schema Eradication)
**Objective:** Implement live operational CRUD service connectors and relational DB constraints for all 10 currently abandoned "Dead Schema" tables uncovered during initial discovery.
- **Key Engineering Tasks:**
  1. **Procurement Activation:** Integrate `GoodsReceipt` and `VendorInvoice` models into `/api/admin/procurement/orders` and receiving terminal workflows.
  2. **Inventory Multi-Location Activation:** Activate `InventoryStock` to track physical counts per storeroom location (Kitchen vs. Rooftop Bar); refactor item mutations to stop writing aggregate numbers directly onto `InventoryItem`.
  3. **Accounting Governance Activation:** Connect `TransactionCode` and `FinancialAdjustment` to all reservation billing checkout and POS dining cash register settlements in `lib/accounting.ts`. Ensure every folio charge binds to an explicit USALI billing code ID.
  4. **HR Line-Item Activation:** Expand payroll execution in `/api/admin/hr/payroll` to automatically construct relational `PayrollLineItem` records detailing tax withholdings, health insurance deductions, and net wages per payslip.
  5. **Schema Consolidation:** Create a Prisma migration plan to drop redundant tables (`CompanyProfile`, `Testimonial`, `ResortService`) or fully bind them to live UI data inputs to ensure zero schema bloat in production.
- **Exit Gate Criteria:** Execution of Prisma test scripts proving successful automated data insertion and relational querying across all 70+ models with zero orphaned entities remaining.

---

### Phase 4: Core Front & Back-Office Feature Remediation
**Objective:** Refactor operational domain engines to adhere strictly to our business workflows and state transition guardrails.
- **Key Engineering Tasks:**
  1. **Booking Check-in Guardrail:** Refactor `/api/bookings/[id]/checkin` to enforce strict room cleanliness checks (`Room.status == 'VACANT_READY'` or `'VACANT_CLEAN'`); reject attempts to assign `'DIRTY'` or `'OUT_OF_ORDER'` keys with HTTP 409.
  2. **POS Recipe Depletion Linkage:** Hook POS meal settlement (`/api/restaurant/orders/settle`) into the asynchronous `Outbox` pipeline, automatically firing background worker routines that decrement physical ingredients from `InventoryStock`.
  3. **Three-Way Matching AP Engine:** Implement the Three-Way Matching invoice verification algorithm in `/api/admin/procurement/invoices/verify-match`, blocking accounts payable disbursements unless packing receipt counts match supplier invoices within a strict $5.00 tolerance.
- **Exit Gate Criteria:** All transactional integration tests pass; zero financial movements occur without paired double-entry ledger vouchers.

---

### Phase 5: Eradicating UI Simulation & Enabling Live Telemetry / OLAP
**Objective:** Completely remove visual UI presentation simulations from executive dashboards, replacing them with live SQL database aggregations and real SRE telemetry streams.
- **Key Engineering Tasks:**
  1. **Executive Intelligence Conversion:** Rewrite `app/admin/executive-intelligence/page.tsx`; excise static region arrays and bind TanStack Query rehydrators directly to `/api/admin/executive/analytics-cube`, calculating authentic RevPAR and occupancy metrics from live reservations.
  2. **Global Command Center Realtime SRE Binding:** Rewrite `app/admin/global-command-center/page.tsx`; replace simulated sequential `setTimeout` failover text with real system metrics querying active queue depths in `Outbox` and `WebhookDLQ` (`/api/admin/sre/health`).
  3. **Room Rack Automated Cron Scheduler:** Remove artificial `setTimeout` SLA timers in `app/admin/room-rack/page.tsx`; replace with genuine serverless scheduled cron endpoints (`/api/admin/cmms/schedules/evaluate`) that evaluate asset service schedules and inject real work orders into database dispatch queues.
- **Exit Gate Criteria:** Automated regex inspection across `app/admin/*` confirms zero instances of simulated timers or hardcoded mock presentation data arrays.

---

### Phase 6: E2E Integration, Load Verification & Production Audit
**Objective:** Validate system performance, concurrency protections, and zero-trust RBAC authorization across the unified application stack prior to live commercial deployment.
- **Key Engineering Tasks:**
  1. **Concurrency Load Testing:** Execute simulated concurrent double-booking assault tests against `/api/bookings/reserve` to prove Redis ephemeral locking (`lock:room_type_hold:*`) reliably prevents overlapping room category sales under flash traffic surges.
  2. **RBAC Penetration Audit:** Run automated authentication regression scripts attempting horizontal privilege escalation (e.g., a Receptionist attempting to authorize a $10,000 Purchase Order or an Auditor attempting to post a POS order); verify 100% denial enforcement at edge routing boundaries.
  3. **Final System Health Check:** Execute master diagnostics via `/scripts/verify-monitoring-sre.ts` and compile final verification logs certifying absolute readiness for live enterprise operations.
- **Exit Gate Criteria:** System fully verified end-to-end; master architectural sign-off achieved.
