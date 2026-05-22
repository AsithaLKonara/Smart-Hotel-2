# SmartHotel OS — Enterprise Hospitality Platform

**SmartHotel OS** is a high-performance, enterprise-grade Hotel Management System (HMS) built with Next.js 14. It transforms fragmented operations into a unified, real-time digital ecosystem.

---

## 🌟 Current Project Status
**Status: Production Ready**
The project has successfully integrated a comprehensive suite of modules spanning administrative, operational, executive, and guest-facing functions.

---

## 🚀 Integrated Features & Hotel Benefits

### 1. Centralized Administrative & Global Command Center
- **Global Command Center**: A unified birds-eye view of entire hotel operations.
- **Executive Intelligence & Analytics**: Real-time reporting, predictive insights, and automated dashboards for executive decision-making.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions securing data across Reception, Kitchen, Housekeeping, and Management.
- **Governance & Audit Logs**: Complete traceability for every operational mutation, ensuring compliance and security.

### 2. Intelligent Booking & Revenue Management
- **Unified Booking Engine**: Centralized room assignments, calendar management, and guest handling.
- **Interactive Room Rack**: Visual timeline for fast, drag-and-drop booking modifications.
- **OTA Integration**: Seamless synchronization with Online Travel Agencies to prevent double-bookings.
- **Dynamic Pricing & App Marketplace**: Extendable platform integrating dynamic pricing rules and third-party tools.

### 3. F&B and Kitchen Operations (KDS)
- **Real-time Kitchen Display System (KDS)**: Seamless orchestration from order placement to room delivery.
- **Digital Menus & Order Management**: Automated billing routed directly to the guest's room folio.

### 4. Operational Excellence (Housekeeping & SRE)
- **Automated Housekeeping & Tasks**: Smart dispatching and real-time status updates for room cleaning and repairs.
- **Incident & Chaos Management**: Track operational incidents and monitor system health (SRE/Observability tools integrated).
- **Staff Collaboration**: Internal communication timelines and task tracking.

### 5. The Guest Super App Experience
- **Self-Service Onboarding & Mobile App**: Digital check-in, dynamic QR codes, and personalized onboarding.
- **Digital Concierge**: Direct access to Spa, Facilities, and Attractions bookings.
- **Secure Payments**: Frictionless checkout using Stripe integration.

---

## 🛠 Technology Stack
- **Framework**: Next.js 14 (App Router, Server Components)
- **Database**: MongoDB + Prisma ORM
- **State/Cache**: TanStack Query (v5) + Upstash Redis
- **Real-time**: Pusher (Distributed Event Bus)
- **Security**: NextAuth.js + RBAC
- **Payments**: Stripe (Checkout & Webhooks)
- **AI/LLM**: Groq SDK integrated for intelligence features.
- **Testing**: Playwright for E2E, Jest for Unit/Integration, Lighthouse for performance.

---

## 📖 Documentation
Detailed technical documentation for every subsystem:

1. [**Architecture**](ARCHITECTURE.md) — System design, Distributed Locking, and Real-time infrastructure.
2. [**Security & RBAC**](RBAC.md) — Permission matrix, Middleware enforcement, and Roles.
3. [**Booking Engine**](BOOKING_ENGINE.md) — Lifecycle, Concurrency protections, and OTA Sync.
4. [**Dining & Kitchen**](DINING_SYSTEM.md) — Order flows, KDS, and Room billing.
5. [**Testing & QA**](TESTING.md) — Verification strategy, E2E flows, and Load testing.
6. [**Deployment & Ops**](DEPLOYMENT.md) — Setup instructions, CI/CD, and Production notes.

---

## 🚀 Quick Start

### 1. Installation
```bash
git clone https://github.com/AsithaLKonara/Smart-Hotel-2.git
npm install
```

### 2. Database Setup
```bash
npx prisma generate
npx prisma db push
npm run db:seed # Seed with luxury demo data
```

### 3. Environment Configuration
Copy `.env.example` to `.env.local` and configure your credentials:
- `DATABASE_URL` (MongoDB)
- `NEXTAUTH_SECRET`
- `PUSHER_APP_ID`, `NEXT_PUBLIC_PUSHER_KEY`, `PUSHER_SECRET`
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- `STRIPE_SECRET_KEY`

### 4. Development
```bash
npm run dev
```

---

## 🔐 Enterprise Reliability
- **Atomic Concurrency**: Zero double-bookings via distributed locking.
- **Idempotent APIs**: Guaranteed consistency across network retries.
- **Global Resilience**: Real-time sync backed by low-latency edge caching.
- **Audit Integrity**: Complete traceability for every operational mutation.

---
Modernizing hospitality, one room at a time. Built with ❤️ by the **SmartHotel OS Team**.
