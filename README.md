# SmartHotel OS — Enterprise Hospitality Platform

**SmartHotel OS** is a high-performance, enterprise-grade Hotel Management System (HMS) built with Next.js 14. It features a distributed booking engine, real-time operational dashboards, and a robust security model designed for modern hospitality operations.

---

## 🏛 Platform Overview
SmartHotel OS transforms fragmented hotel operations into a unified, real-time digital ecosystem.

- **Unified Front Desk**: Centralized booking, room assignments, and guest management.
- **Real-time KDS**: Kitchen Display System for seamless room service orchestration.
- **Operational Intelligence**: Automated staff dispatching and inventory protections.
- **Guest Super App**: Self-service check-in, dining, and concierge services.

---

## 🛠 Technology Stack
- **Framework**: Next.js 14 (App Router, Server Components)
- **Database**: MongoDB + Prisma ORM
- **State/Cache**: TanStack Query (v5) + Upstash Redis
- **Real-time**: Pusher (Distributed Event Bus)
- **Security**: NextAuth.js + Role-Based Access Control (RBAC)
- **Payments**: Stripe (Checkout & Webhooks)

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

## 👥 Roles & Access
| Role | Access Level | Primary Focus |
| :--- | :--- | :--- |
| **Super Admin** | Full | Platform config & Audit |
| **Receptionist** | Operational | Bookings & Check-in |
| **Kitchen** | Task-based | F&B Production |
| **Staff (HK/MT)** | Task-based | Cleaning & Repairs |
| **Guest** | Self-Service | Orders & Folio |

---

## 🔐 Enterprise Reliability
- **Atomic Concurrency**: Zero double-bookings via distributed locking.
- **Idempotent APIs**: Guaranteed consistency across network retries.
- **Global Resilience**: Real-time sync backed by low-latency edge caching.
- **Audit Integrity**: Complete traceability for every operational mutation.

---
Modernizing hospitality, one room at a time. Built with ❤️ by the **SmartHotel OS Team**.
