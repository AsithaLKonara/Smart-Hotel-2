import Link from 'next/link'
import { Home, Search, Hotel, Utensils, Image, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-amber-50 px-4">
      <div className="max-w-2xl w-full text-center">
        {/* 404 Number */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-amber-600 dark:text-amber-500 mb-4">
            404
          </h1>
          <div className="w-24 h-1 bg-amber-600 dark:bg-amber-500 mx-auto"></div>
        </div>

        {/* Error Message */}
        <Card className="p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Page Not Found
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            Oops! The page you're looking for seems to have checked out. 
            Let us help you find your way back to luxury.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-amber-600 hover:bg-amber-700">
              <Link href="/">
                <Home className="mr-2 h-5 w-5" />
                Go Home
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/rooms">
                <Hotel className="mr-2 h-5 w-5" />
                Browse Rooms
              </Link>
            </Button>
          </div>
        </Card>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Link
            href="/rooms"
            className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
          >
            <Hotel className="h-6 w-6 mx-auto mb-2 text-amber-600 dark:text-amber-500" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">Rooms</p>
          </Link>
          <Link
            href="/order"
            className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
          >
            <Utensils className="h-6 w-6 mx-auto mb-2 text-amber-600 dark:text-amber-500" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">Restaurant</p>
          </Link>
          <Link
            href="/gallery"
            className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
          >
            <Image className="h-6 w-6 mx-auto mb-2 text-amber-600 dark:text-amber-500" aria-label="Gallery icon" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">Gallery</p>
          </Link>
          <Link
            href="/contact"
            className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
          >
            <Phone className="h-6 w-6 mx-auto mb-2 text-amber-600 dark:text-amber-500" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">Contact</p>
          </Link>
          <Link
            href="/booking"
            className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
          >
            <Search className="h-6 w-6 mx-auto mb-2 text-amber-600 dark:text-amber-500" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">Book Now</p>
          </Link>
          <Link
            href="/about"
            className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
          >
            <Hotel className="h-6 w-6 mx-auto mb-2 text-amber-600 dark:text-amber-500" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">About Us</p>
          </Link>
        </div>

        {/* Help Text */}
        <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
          Need help? <Link href="/contact" className="text-amber-600 dark:text-amber-500 hover:underline">Contact our support team</Link>
        </p>
      </div>
    </div>
  )
}

