# 💳 Stripe Payment Configuration Guide

## Overview
This guide will help you configure Stripe for processing payments in SmartHotel.

---

## Step 1: Create Stripe Account

1. Go to https://stripe.com and sign up
2. Complete account verification
3. Navigate to **Developers** → **API keys**

---

## Step 2: Get API Keys

### Test Mode Keys (Development)
```bash
STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_SECRET_KEY=sk_test_51...
```

### Live Mode Keys (Production)
```bash
STRIPE_PUBLISHABLE_KEY=pk_live_51...
STRIPE_SECRET_KEY=sk_live_51...
```

---

## Step 3: Update Environment Variables

Add to your `.env` file:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_your-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# App URL (for webhooks)
NEXTAUTH_URL=http://localhost:3000  # or your production URL
```

---

## Step 4: Install Stripe Libraries

Already installed in package.json:
```json
{
  "@stripe/stripe-js": "^2.4.0",
  "stripe": "^14.10.0"
}
```

---

## Step 5: Create Payment Intent API

The webhook endpoint already exists at `app/api/webhooks/stripe/route.ts`.

Create `app/api/create-payment-intent/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
})

export async function POST(request: NextRequest) {
  try {
    const { amount, bookingId, currency = 'usd' } = await request.json()

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        bookingId
      },
      automatic_payment_methods: {
        enabled: true
      }
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret
    })
  } catch (error) {
    console.error('Stripe error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}
```

---

## Step 6: Frontend Payment Integration

Create `components/booking/stripe-payment.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function CheckoutForm({ amount, bookingId }: { amount: number; bookingId: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) return

    setLoading(true)
    setError(null)

    try {
      const { error: submitError } = await elements.submit()
      if (submitError) {
        setError(submitError.message || 'Payment failed')
        setLoading(false)
        return
      }

      // Create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, bookingId })
      })

      const { clientSecret } = await response.json()

      // Confirm payment
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/booking/confirmation?bookingId=${bookingId}`
        }
      })

      if (confirmError) {
        setError(confirmError.message || 'Payment failed')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium 
                   hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </button>
    </form>
  )
}

export default function StripePayment({ amount, bookingId }: { amount: number; bookingId: string }) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm amount={amount} bookingId={bookingId} />
    </Elements>
  )
}
```

---

## Step 7: Setup Webhooks

### Local Development (Using Stripe CLI)

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
4. Copy the webhook secret: `whsec_...`

### Production Webhooks

1. Go to **Stripe Dashboard** → **Developers** → **Webhooks**
2. Click "Add endpoint"
3. URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy the webhook signing secret

---

## Step 8: Handle Webhook Events

The webhook handler is already created at `app/api/webhooks/stripe/route.ts`. Update it:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
})

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      
      // Update booking payment status
      await prisma.booking.update({
        where: { id: paymentIntent.metadata.bookingId },
        data: {
          paymentStatus: 'PAID',
          paymentIntentId: paymentIntent.id
        }
      })
      
      console.log('Payment succeeded:', paymentIntent.id)
      break

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object as Stripe.PaymentIntent
      
      await prisma.booking.update({
        where: { id: failedPayment.metadata.bookingId },
        data: { paymentStatus: 'FAILED' }
      })
      
      console.log('Payment failed:', failedPayment.id)
      break

    case 'charge.refunded':
      const refund = event.data.object as Stripe.Charge
      
      await prisma.booking.update({
        where: { paymentIntentId: refund.payment_intent as string },
        data: {
          paymentStatus: 'REFUNDED',
          refundAmount: refund.amount_refunded / 100
        }
      })
      
      console.log('Charge refunded:', refund.id)
      break

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
```

---

## Step 9: Test Stripe Integration

### Test Card Numbers

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0025 0000 3155
```

Use any future date for expiry and any 3-digit CVC.

---

## Step 10: Integrate into Booking Flow

Update `app/booking/page.tsx` to include payment:

```typescript
import StripePayment from '@/components/booking/stripe-payment'

// In your booking form after details are filled
<StripePayment 
  amount={totalAmount} 
  bookingId={newBooking.id} 
/>
```

---

## Payment Flow

```
1. Guest fills booking form
2. Booking created with status PENDING and paymentStatus PENDING
3. Guest enters payment details
4. Payment processed via Stripe
5. Webhook updates booking to CONFIRMED and paymentStatus PAID
6. Confirmation email sent
7. Guest redirected to confirmation page
```

---

## Security Best Practices

1. **Never expose secret keys** - Only use publishable key in frontend
2. **Validate webhooks** - Always verify webhook signatures
3. **Use HTTPS** - Required for production
4. **Store minimal data** - Never store full card numbers
5. **Handle errors gracefully** - Provide clear error messages
6. **Log securely** - Don't log sensitive payment data
7. **PCI Compliance** - Stripe handles this when using Elements

---

## Refund Implementation

Create `app/api/bookings/[id]/refund/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: params.id }
    })

    if (!booking?.paymentIntentId) {
      return NextResponse.json({ error: 'No payment found' }, { status: 400 })
    }

    // Create refund
    const refund = await stripe.refunds.create({
      payment_intent: booking.paymentIntentId
    })

    // Update booking
    await prisma.booking.update({
      where: { id: params.id },
      data: {
        status: 'CANCELLED',
        paymentStatus: 'REFUNDED',
        refundAmount: refund.amount / 100
      }
    })

    return NextResponse.json({ success: true, refund })
  } catch (error) {
    console.error('Refund error:', error)
    return NextResponse.json({ error: 'Refund failed' }, { status: 500 })
  }
}
```

---

## Production Checklist

- [ ] Switch to live API keys
- [ ] Setup production webhook endpoint
- [ ] Test with real card (use small amount)
- [ ] Implement refund handling
- [ ] Add payment failure notifications
- [ ] Setup Stripe Radar (fraud detection)
- [ ] Configure email receipts
- [ ] Test 3D Secure flow
- [ ] Implement partial payments (if needed)
- [ ] Add payment retry logic

---

## Monitoring & Analytics

Stripe Dashboard provides:
- Payment volume and success rates
- Failed payment analysis
- Customer insights
- Revenue reports
- Dispute management
- Fraud detection

---

**Status:** Configuration guide complete. Update `.env` file with your Stripe keys and test the integration!









