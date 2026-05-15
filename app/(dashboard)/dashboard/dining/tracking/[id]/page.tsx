import { OrderTracking } from '@/components/ordering/order-tracking'
import { GuestPageShell } from '@/components/dashboard/guest/guest-page-shell'
import { redirect } from 'next/navigation'

interface OrderTrackingPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function OrderTrackingPage({ params }: OrderTrackingPageProps) {
  try {
    const { id } = await params
    
    return (
      <GuestPageShell
        title="Order Journey"
        subtitle="Track your room service request from the kitchen to your door in real-time."
      >
        <OrderTracking 
          orderId={id}
        />
      </GuestPageShell>
    )
  } catch (error) {
    console.error('Error loading order tracking page:', error)
    redirect('/dashboard/dining')
  }
}
