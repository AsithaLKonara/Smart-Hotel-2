import Link from 'next/link'
import { Button } from '@/components/ui/button'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to SmartHotel</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Your gateway to luxury accommodation
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link href="/booking">Book Now</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/rooms">View Rooms</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}