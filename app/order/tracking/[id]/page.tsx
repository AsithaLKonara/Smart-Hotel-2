import { OrderTracking } from '@/components/ordering/order-tracking'

interface OrderTrackingPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function OrderTrackingPage({ params }: OrderTrackingPageProps) {
  const { id } = await params
  const handleOrderComplete = () => {
    // Order delivered successfully
    console.log('Order delivered!')
  }

  const handleNewOrder = () => {
    // Redirect to order page
    window.location.href = '/order'
  }

  return (
    <OrderTracking 
      orderId={id}
      onOrderComplete={handleOrderComplete}
      onNewOrder={handleNewOrder}
    />
  )
}

