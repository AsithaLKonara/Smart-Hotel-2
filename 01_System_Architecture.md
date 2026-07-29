# 01_System_Architecture: Enterprise Hospitality & ERP OS

**Document Type:** Master System Architectural Blueprint  
**Status:** Approved Specification (Phase 1)  
**Target Environment:** Next.js 14 App Router, TypeScript, Prisma ORM, PostgreSQL, NextAuth.js, Redis, Pusher, Stripe, Cloudinary  

---

## 1. Executive Architecture Vision

The **SmartHotel OS** is designed as a mission-critical, real-time, multi-tenant Enterprise Resource Planning (ERP) and Property Management System (PMS) tailored for high-scale hospitality chains and luxury resorts. Unlike standard booking websites, this system merges five traditional standalone software stacks into an atomic, coherent engine:

1. **Property Management System (PMS):** Room rack management, rate pricing engines, reservation state machines, housekeeping dispatch, and front-office checkout folios.
2. **Point of Sale (POS) & Food & Beverage Engine:** Restaurant table management, menu item inventory mapping, direct kitchen printer/display routing, and folio/room-charge settlement.
3. **Computerized Maintenance Management System (CMMS) & Facilities:** Asset registry, preventive maintenance scheduling, IoT quality inspections, and real-time out-of-order room blocks.
4. **Back-Office ERP (Procurement, HR, Inventory & Accounting):** Multi-location storeroom stock control, Three-Way Matching vendor purchasing (PO -> Goods Receipt -> Invoice), human resources shift/attendance payroll processing, and an automated double-entry General Ledger (GL).
5. **Corporate CRM & Yield Intelligence:** Multi-tier loyalty loyalty clubs, corporate B2B credit accounts, travel agent commission portals, event banqueting space coordination, and automated dynamic room yield algorithms.

---

## 2. Multi-Tier System Topology

The platform architecture implements a **Serverless-Edge Hybrid Monolithic Infrastructure**, leveraging Next.js 14 serverless compute powered by an immutable relational backing store and real-time async communication layers.

```
       [ Client Edge: Browser / POS Touchscreen / Mobile Staff Kiosk ]
                                     │
                    (TLS 1.3 / HTTP/2 / WebSockets WSS)
                                     ▼
                  [ Next.js 14 Edge Middleware Layer ]
         ├── JWT Session Verification & Role Weight Assertions
         ├── CSRF Origin & Sec-Fetch-Site Guardrails
         └── WebSocket SSRF Denial on Admin Namespaces
                                     │
           ┌─────────────────────────┴────────────────────────┐
           ▼                                                  ▼
[ Next.js Server React UI ]                     [ App Router /api/* & Server Actions ]
   ├── Client Viewports & State                   ├── Controller Validation (Zod Schema)
   ├── TanStack Query Rehydration                  ├── Business Service Layer (Domain Engine)
   └── Real-time Pusher Event Subs                └── Transactional Outbox Committer
                                                              │
               ┌──────────────────────────┬───────────────────┴───┬─────────────────────────┐
               ▼                          ▼                       ▼                         ▼
    [ Relational PostgreSQL ]     [ Redis In-Memory ]    [ Pusher Real-time ]    [ Stripe / External APIs ]
     ├── Core POS & PMS Data      ├── Distributed Locks  ├── Live Room Racks     ├── PCI-DSS Payments & Webhooks
     ├── Double-Entry Ledger      ├── Short-Lived Caches ├── Kitchen Order Alert ├── OTA Webhook DLQ Ingest
     └── Immutable Audit Trails   └── Token Blacklists   └── Maid Task Broadcast └── SendGrid Mail Relay
```

---

## 3. Core Architectural Patterns & Principles

### 3.1. Strict Separation of Concerns & Clean Domain Design
To prevent system coupling across 70+ data entities, application implementation must strictly bifurcate into three distinct abstraction boundaries:
- **Presentation & Viewport Layer (`app/*`, `components/*`):** Handles visual DOM rendering, form validation display, and real-time state synchronization via TanStack Query and Pusher. **Rule:** Absolutely zero direct database syntax or raw business calculations may exist in client components.
- **Service & Domain Orchestration Layer (`lib/*`):** Contains pure business domain logic (e.g., `lib/accounting.ts`, `lib/task-dispatch-engine.ts`, `lib/yield-optimization.ts`). Emits logs and pushes async events.
- **Persistence & Transactional Contract Layer (`prisma/*`, API routes):** Handles relational atomicity via Prisma interactive transactions (`prisma.$transaction(...)`), strict schema parsing via Zod, and data mapping.

### 3.2. Event-Driven Messaging & Transactional Outbox Pattern
In an enterprise hospitality setting, distributed side-effects (such as dispatching a housekeeper when a guest checks out, or updating inventory when a POS meal is sold) must never cause transaction bottlenecks or dual-write inconsistencies.
- **Transactional Outbox Engine:** When a primary action occurs (e.g., booking confirmation), the database transaction atomically writes both the entity record (`Booking`) and an event record into the `Outbox` table within a single PostgreSQL commit.
- **Async Outbox Publisher & Worker:** A background SRE daemon continuously polls the `Outbox` table, transmits events to real-time subscribers (`Pusher`) or third-party integrations (Stripe, OTA channel mappings), and updates the event status to `PROCESSED`.
- **Webhook Dead-Letter Queue (DLQ):** External webhook deliveries (OTA partner updates, Stripe bank confirmations) are immediately persisted to `WebhookDLQ` upon receipt before evaluation. This ensures zero data loss during localized API outages or bug triage.

### 3.3. Double-Entry Financial Accounting Architecture
Every fiscal movement within the SmartHotel operating system MUST be backed by immutable, auditable accounting mechanics:
- **Zero Silent Balances:** Rooms, POS checkouts, inventory purchases, and payroll settlements do not simply alter an account total. Every transaction generates a paired `JournalEntry` and `TransactionCode` reference with equal Debit and Credit balances.
- **Immutability Guarantee:** General Ledger entries and folios cannot be updated or deleted once posted. Erroneous postings must be remediated solely through formalized `FinancialAdjustment` records requiring Managerial authorization.
- **Night Audit Cutoff Barrier:** The Night Audit module acts as a temporal locking fence. Once executed, previous operational calendar days are sealed, preventing backwards modifications to room revenue or dining folios.

### 3.4. Multi-Tenant, Multi-Property & Multi-Location Isolation
- While running as an integrated enterprise engine, structural partitioning ensures high security and concurrency. 
- **Inventory Storeroom Isolation:** POS dining rooms and housekeeping carts consume physical stock from explicit inventory locations (`InventoryStock`), preventing aggregate count inaccuracies across different floors or resort facilities.
- **Tenant & B2B Segmentation:** Corporate accounts (`CorporateAccount`) and travel agencies (`TravelAgent`) operate within strictly isolated authentication scopes, ensuring B2B contract pricing and credit limits never leak across corporate identities.

---

## 4. Non-Functional Requirements & Performance SLAs

1. **Transactional Latency & Concurrency:**
   - Standard CRUD operations and API lookups: **P95 < 80ms**.
   - Complex ACID transactions (Booking Check-in with Folio initialization, POS settlement with recipe depletion): **P95 < 250ms**.
2. **Distributed Race Condition Protections:**
   - **Room Double-Booking Guard:** Concurrent booking submissions for the identical room type and calendar dates MUST acquire a distributed Redis lock (`lock:room_type_date:{id}`) and utilize PostgreSQL serializable or optimistic locking via version incrementing.
   - **Inventory Allocation Safety:** Stock quantity adjustments evaluate strict atomic decrement rules (`quantity: { decrement: usage }`) paired with `CHECK (quantity >= 0)` database constraints to eliminate negative stock anomalies.
3. **Availability & Self-Healing Telemetry:**
   - **Uptime Target:** 99.995% for core Front-Office and POS ordering endpoints.
   - **Telemetry Pipeline:** All unhandled exceptions, long-running database queries (>500ms), and outbox backlog spikes are continuously streamed into the SRE Observability namespace (`/api/admin/sre/health`) to trigger automated worker scale-ups or fallback degraded-routing modes.
