# BOOK-001 - Lock Bypassing Race Condition (Double Bookings)

## Severity

P0 - Critical

---

## Category

BOOKING

---

## Description

Distributed lock system falls back to DB lock if Redis lock is held. However, it falls back before DB lock is established, allowing simultaneous execution.

---

## Affected Files

- lib/inventory-lock.ts
app/api/bookings/route.ts

---

## Root Cause

Flawed fallback logic in `InventoryLockEngine.acquireHold`.

---

## Production Impact

- Double bookings.

---

## How to Reproduce

Run `booking-concurrency-test.ts`.

---

## Fix Guide

Step 1: Fix fallback logic to poll Redis, or rely purely on PostgreSQL `SELECT ... FOR UPDATE`.

---

## Acceptance Criteria

- Concurrency test passes.

---

## Regression Tests

- Concurrency audit scripts.

---

## Priority

Sprint 1
