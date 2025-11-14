import { OrderTracking } from '@/components/ordering/order-tracking'

interface OrderTrackingPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function OrderTrackingPage({ params }: OrderTrackingPageProps) {
  try {
    const { id } = await params
    
    return (
      <OrderTracking 
        orderId={id}
      />
    )
  } catch (error) {
    console.error('Error loading order tracking page:', error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <p className="text-gray-600 mb-4">The order you're looking for doesn't exist.</p>
          <a href="/order" className="text-primary-600 hover:underline">
            Go to Menu
          </a>
        </div>
      </div>
    )
  }
}

