# BOOK-003 - Orphaned Stripe Payments Creation

## Severity

P1 - High

---

## Category

BOOKING

---

## Description

Stripe PaymentIntent is created before Prisma `Payment` record. If DB insert fails, intent is orphaned in Stripe.

---

## Affected Files

- app/api/bookings/route.ts
lib/integrations/stripe-gateway.ts

---

## Root Cause

Lack of distributed transaction between Stripe API and Prisma.

---

## Production Impact

- Held funds in Stripe with no record in PMS. Massive reconciliation headaches.

---

## How to Reproduce

Mock Prisma to fail after Stripe creation. Observe intent in Stripe dashboard.

---

## Fix Guide

Step 1: Save `PaymentIntent` ID to a pending `Order` table *before* calling Stripe, or use Webhooks for async creation confirmation.

---

## Acceptance Criteria

- No intents are created if DB fails first.

---

## Regression Tests

- Payment initialization tests.

---

## Priority

Sprint 2
