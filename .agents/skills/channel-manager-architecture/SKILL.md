---
name: channel-manager-architecture
description: Architectural invariants and best practices for building enterprise OTA/Channel Manager integrations.
---

# Enterprise Channel Manager Architecture

When designing or implementing Channel Manager integrations (Booking.com, Airbnb, Expedia, Agoda), ALWAYS adhere to the following architectural constraints:

## 1. The Channel Manager Core
- **Never build provider-specific logic directly into the PMS.** Create a normalized `ChannelManagerCore` and build provider-specific Adapters (e.g., `BookingComAdapter`, `AirbnbAdapter`).
- **Never leak external IDs.** Use canonical mappings (e.g., `ChannelRoomMapping`, `ChannelRateMapping`). The PMS should only ever know about internal Room IDs and Rate IDs.

## 2. Inventory is King
- **Single Source of Truth:** The PMS Master Inventory is the only source of truth. Sellable Inventory = Physical - Confirmed - Maintenance - Blocked.
- **Push, Don't Maintain:** Do not let the channel maintain its own inventory state independent of the PMS. Upon any inventory change in the PMS, immediately push the new availability (e.g., +365 days) to all mapped channels via a sync queue.

## 3. Idempotent Reservation Ingestion
- **Never assume a reservation payload is unique.** OTAs will retry sending reservations until acknowledged.
- **Workflow:** 
  1. Receive Reservation.
  2. Find by `externalReservationId`. If processed, SKIP to Acknowledge.
  3. Create/Update internal Booking.
  4. Update internal inventory.
  5. Acknowledge the OTA.

## 4. Asynchronous Queue Architecture
- **Never do heavy sync work in the HTTP route.**
- Use Redis/BullMQ (or similar) to queue `AVAILABILITY_UPDATE`, `RATE_UPDATE`, and `RESERVATION_SYNC` jobs.
- Implement robust retries and dead-letter queues. Never let a 500 error from Booking.com break the internal PMS workflow.

## 5. Security & Authentication
- **No static API Keys.** Use OAuth2 or short-lived JWT machine-to-machine tokens (e.g., Booking.com's modern auth).
- Encrypt client secrets and access tokens in the database. Never expose them to the browser.
