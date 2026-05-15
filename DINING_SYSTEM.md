# SmartHotel OS — Dining & Kitchen Workflow Specification

## 1. System Overview
The Dining System provides a seamless interface for guests to order food/services and for the kitchen to manage production queues in real-time.

---

## 2. Order Lifecycle
Orders progress through the following statuses:

- `PENDING`: Order received, awaiting kitchen acknowledgement.
- `PREPARING`: Kitchen has started work; guest notified via real-time update.
- `READY`: Food is ready for delivery.
- `DELIVERED`: Order handed over to the guest; bill finalized.
- `CANCELLED`: Order voided (only allowed before `PREPARING` starts).

---

## 3. Real-time Kitchen Display System (KDS)
The Kitchen Dashboard (`/kitchen`) acts as the KDS:
- **Instant Notification**: `KITCHEN_ORDER_NEW` event (Pusher) adds orders to the top of the queue without refresh.
- **Visual Cues**: Color-coded urgency based on elapsed time since `PENDING`.
- **Status Sync**: Updating an order status emits a `KITCHEN_ORDER_UPDATE` event, refreshing the Guest and Reception dashboards.

---

## 4. Financial Integration (Room Charging)
- **Authorization**: Only guests with an active `CHECKED_IN` booking can charge orders to their room.
- **Verification**: The system verifies the `roomNumber` and `guestId` against the active `Booking` record before allowing the order.
- **Billing**: Finalized orders are automatically added to the guest's folio, appearing in the final "Bill Summary" at checkout.

---

## 5. Security & Validation
1. **QR Authentication**: QR codes in rooms contain encrypted payloads that identify the room and guest context.
2. **Access Control**: Only the `KITCHEN`, `MANAGER`, and `RECEPTIONIST` roles can modify order statuses.
3. **Price Integrity**: Menu prices are snapshotted at the time of order creation to prevent discrepancies during menu updates.
