# BOOK-002 - Idempotency Key Poisoning (Soft-lock)

## Severity

P1 - High

---

## Category

BOOKING

---

## Description

If a post-transaction step fails, idempotency key is deleted and 400 returned, but booking is committed. Retrying creates a DOUBLE_BOOKING error.

---

## Affected Files

- app/api/bookings/route.ts
app/booking/page.tsx

---

## Root Cause

Clearing idempotency key on partial failure instead of returning success with warnings.

---

## Production Impact

- Guests think booking failed, retry, get locked out, while reservation exists.

---

## How to Reproduce

Force `logAction` to fail. Observe 400 response. Retry booking.

---

## Fix Guide

Step 1: Do not clear idempotency key if DB transaction committed. Return 200 with partial failure flags.

---

## Acceptance Criteria

- Booking succeeds on UI despite audit log failure.

---

## Regression Tests

- Booking lifecycle tests with mocked partial failures.

---

## Priority

Sprint 1
