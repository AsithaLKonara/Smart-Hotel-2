# BOOK-005 - Silent Notification Loss (SMTP)

## Severity

P2 - Medium

---

## Category

BOOKING

---

## Description

Emails and audit logs swallow errors and lack retry mechanisms. SMTP drops result in lost confirmations.

---

## Affected Files

- app/api/bookings/route.ts
lib/email.ts

---

## Root Cause

No Outbox pattern or message queue.

---

## Production Impact

- Guests do not receive confirmation emails. Staff unaware.

---

## How to Reproduce

Kill network connection to SMTP during booking.

---

## Fix Guide

Step 1: Implement BullMQ or DB-backed Outbox for async email processing.

---

## Acceptance Criteria

- Emails are queued and retry on failure.

---

## Regression Tests

- Email delivery tests.

---

## Priority

Sprint 3
