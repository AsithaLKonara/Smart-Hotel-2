export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-amber-50">
      <div className="text-center">
        {/* Spinner */}
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-amber-200 dark:border-amber-900 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-amber-600 dark:border-amber-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
        
        {/* Loading Text */}
        <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
          Loading...
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Please wait while we prepare your experience
        </p>
      </div>
    </div>
  )
}

