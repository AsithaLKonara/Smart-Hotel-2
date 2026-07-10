# High-Level Architecture Map: SmartHotel

## Frontend Modules
- **Core Framework:** Next.js App Router (`app/` directory).
- **Admin Dashboard:** Routes under `app/admin/` (Settings, Integrations).
- **Authentication UI:** `app/auth/signin`, `app/auth/signup`, utilizing components like `PermissionGate` and `IdleTimer`.
- **UI Components:** Specialized interactive components (`GlobalCinematicBackground`, `HeroVideoBackground`) and SEO schema wrappers (`HotelSchema`).

## API Routes
- **Core Business Logic:** `/api/amenities`, `/api/analytics`, `/api/attractions`, `/api/automation`, `/api/bookings`, `/api/complaints`.
- **Integrations & Webhooks:** `/api/integrations/booking-com/webhook`, `/api/webhooks/stripe`, `/api/channels/webhook`.
- **Auth & Logging:** `/api/auth/session`, `/api/auth/register`, `/api/auth/_log`.

## Database Models (Prisma ORM)
- **Core Hospitality Entities:** `Room`, `Stay`, `Booking`, `Event`, `Payment`, `Folio`, `Task`.
- **Access Control & Staff:** `User`, `Role`, `Permission`, `Employee`, `Shift`, `Attendance`.
- **Operations & Management:** `Amenity`, `Inventory`, `Gallery`, `Setting`, `Vendor`.
- **Customer Relations:** `Complaint`, `Testimonial`, `FAQ`, `Conversation`.
- **System Events:** `Knowledge`, `Notification`, `Outbox`.

## External Integrations
- **Stripe:** Payment Gateway (`StripeGateway`) handling secure webhooks, checkout sessions, fund authorizations, captures, and refunds.
- **Twilio:** SMS Communications (`TwilioService`) for sending text messages and tracking SMS logs/bounces.
- **OTA (Online Travel Agencies):** Booking.com webhooks and general OTA webhook processors mapping external reservations to internal rooms.

## Authentication System
- **Engine:** Built on NextAuth.js (`lib/auth.ts`) using JWTs and secure session strategies.
- **Access Control (RBAC):** Database-backed roles and permissions linked to frontend guard rails (`PermissionGate`, `ProtectedRoute`).
- **Security Enhancements:** Custom idle timeout components (`IdleTimer`) and secure session factories.

## Background Jobs & Scheduled Tasks (Cron)
- **Cron Endpoints:** `/api/cron/keepalive`, `/api/cron/archive-db`, `/api/cron/generate-preventive-maintenance`, `/api/cron/night-audit/roll-forward`.
- **Reconciliation Worker:** Processes failed syncs, checks for inventory drift, and drains the transactional outbox (`ReconciliationWorker`).

## Event Systems
- **Messaging:** Internal message broker (`MessageBroker.publish`) and enterprise event bus (`EnterpriseEventBus.dispatchEventDirect`).
- **Real-Time Comm:** WebSockets via `WebSocketGateway` (featuring offline queue replay) and `PubSubEngine` for live state updates.

## Payment Flows
- **Operations:** Managed through `StripeGateway` handling the full financial lifecycle.
- **Workflows:** Hold authorizations (`authorizeHold`), finalizing transactions (`capturePayment`), issuing refunds (`refundPayment`), and session instantiation (`createCheckoutSession`).

## Critical Business Workflows
- **OTA Reconciliation Engine:** Ensures physical room availability matches external platforms and mitigates double bookings (`OTAReconciliationEngine`).
- **Night Audit:** Scheduled roll-forward processing evaluating financial and booking states at the end of a business day.
- **Optimistic Booking Handling:** Rapid UX response using `createOptimisticHandler` paired with background transactional commit workflows in `/api/bookings`.
