"use client"

import { useState } from 'react'
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { PremiumSpinner } from '@/components/ui/premium-spinner'

export function StripeCheckout({ clientSecret, onPaymentSuccess, onPaymentError }: { 
 clientSecret: string
 onPaymentSuccess: () => void
 onPaymentError: (error: string) => void
}) {
 const stripe = useStripe()
 const elements = useElements()
 const [isProcessing, setIsProcessing] = useState(false)

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 if (!stripe || !elements) return

 setIsProcessing(true)
 const { error } = await stripe.confirmPayment({
 elements,
 confirmParams: {
 return_url: `${window.location.origin}/booking/success`,
 },
 redirect: 'if_required' // Do not redirect immediately, handle state locally
 })

 if (error) {
 onPaymentError(error.message || 'Payment failed')
 setIsProcessing(false)
 } else {
 onPaymentSuccess()
 }
 }

 if (!stripe || !elements) {
 return <PremiumSpinner text="Loading payment gateway..." />
 }

 return (
 <form onSubmit={handleSubmit} className="space-y-6">
 <PaymentElement />
 <Button 
 type="submit" 
 disabled={isProcessing || !stripe || !elements} 
 className="w-full bg-primary/10 text-white h-14 rounded-xl tracking-[0.2em] text-xs font-bold border-none shadow-sm hover:opacity-90"
 >
 {isProcessing ? 'Processing Payment...' : 'Complete Reservation'}
 </Button>
 </form>
 )
}
