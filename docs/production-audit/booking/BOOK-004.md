# BOOK-004 - Desynchronized Distributed State (Redis/DB Rollback)

## Severity

P0 - Critical

---

## Category

BOOKING

---

## Description

Redis lock is cleared inside Prisma transaction. If SQL `COMMIT` fails, DB rolls back but Redis does not.

---

## Affected Files

- lib/inventory-lock.ts
app/api/bookings/route.ts

---

## Root Cause

Executing non-transactional external side-effects inside a DB transaction closure.

---

## Production Impact

- Room inventory permanent desynchronization.

---

## How to Reproduce

Force Prisma commit failure. Observe Redis state.

---

## Fix Guide

Step 1: Execute Redis commands only *after* the Prisma transaction successfully resolves.

---

## Acceptance Criteria

- Redis state matches DB after simulated rollback.

---

## Regression Tests

- Lock lifecycle tests.

---

## Priority

Sprint 1
