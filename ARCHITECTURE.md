# SmartHotel OS — Architecture Specification

## 1. System Overview
SmartHotel OS is a distributed, event-driven Hotel Management System (HMS) designed for high-availability hospitality operations. It utilizes a modern "Serverless-First" architecture with Next.js 14, leveraging Edge-compatible services for global performance.

### Core Stack
- **Framework**: Next.js 14 (App Router)
- **Database**: MongoDB (Atlas) via Prisma ORM
- **Real-time**: Pusher (Distributed Pub/Sub)
- **Caching**: Upstash Redis (Global Edge Cache)
- **Security**: NextAuth.js + JWT + Middleware-level RBAC

---

## 2. Distributed Consistency & Locking
To prevent race conditions (e.g., double-bookings), SmartHotel OS employs a **Pessimistic-Optimistic Hybrid Locking Strategy**.

### Inventory Lock Engine
- **Mechanism**: Distributed leases managed via `lib/inventory-lock.ts`.
- **Atomic Operations**: Uses Prisma's atomic updates with versioning and expiration checks.
- **Failover**: Defaults to Redis for sub-millisecond locking, falling back to atomic DB row updates if Redis is unreachable.

```prisma
// Atomic lock check in Prisma
prisma.room.update({
  where: { 
    id: roomId, 
    version: currentVersion,
    OR: [{ lockExpiresAt: { lt: now } }, { lockExpiresAt: null }]
  },
  data: { lockId: actorId, lockExpiresAt: expiry }
})
```

---

## 3. Real-time Event Architecture
The system uses a standardized event bus to synchronize state across multiple staff and guest dashboards.

### Event Topology
1. **Mutation**: A server action or API route executes a transaction.
2. **Persistence**: Data is saved to MongoDB.
3. **Emission**: `RealtimeEvents` (Pusher) triggers an event to specific channels (`admin`, `global`, `room-{id}`).
4. **Synchronization**: `useRealtimeUpdates` hook on the client receives the event and invalidates the TanStack Query cache.

### Standardized Payloads
Events follow a strict schema defined in `lib/realtime.ts`:
- `KITCHEN_ORDER_NEW`
- `KITCHEN_ORDER_UPDATE`
- `BOOKING_CREATED`
- `ROOM_STATUS_CHANGED`
- `TASK_UPDATED`

---

## 4. Operational Intelligence Layer
SmartHotel OS transforms telemetry streams into actionable insights via the **Operational Decision Engine**.

### Priority Scoring
The dispatch engine calculates task priority using a weighted formula:
$$\text{Priority Score (P)} = \text{Severity Weight} \times 0.40 + \text{Urgency Factor} \times 0.60$$

### Automated Workflows
- **Emergency Dispatch**: If vacant room levels drop below 5%, the system triggers high-priority cleaning tasks.
- **SLA Recovery**: If kitchen prep time exceeds the threshold, the system suggests compensatory vouchers at the reception desk.

---

## 5. Persistence & State Management
### Database Strategy
- **Prisma Transactions**: All critical mutations (Booking -> Payment -> Room Status) are wrapped in `prisma.$transaction`.
- **Soft Deletes**: Critical entities (Users, Bookings) use status flags instead of hard deletion to maintain audit integrity.

### Client State
- **TanStack Query (v5)**: Acts as the "Source of Truth" for the UI.
- **Cache Invalidation**: Real-time events trigger targeted invalidations rather than optimistic updates for mission-critical data.

---

## 6. Multi-Property Federation
The platform is designed for multi-tenant scalability:
- **Property Isolation**: Every record is scoped by `propertyId`.
- **Global SRE Control Tower**: Supervisors can manage multiple assets from a single administrative interface.
