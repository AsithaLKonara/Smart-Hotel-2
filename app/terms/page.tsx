import { FileText, AlertCircle, CheckCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <FileText className="w-16 h-16 text-amber-600 mx-auto mb-4" />
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-xl text-gray-600">Last Updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
          
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
              <CheckCircle className="w-6 h-6 mr-2" />
              Acceptance of Terms
            </h2>
            <p className="text-gray-700 mb-3">
              By accessing and using Grand Palace Hotel's website and services, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Reservations and Bookings</h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-amber-600 rounded-full mr-3 mt-2" />
                <span>Reservations are subject to availability and confirmation</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-amber-600 rounded-full mr-3 mt-2" />
                <span>Prices are quoted in US dollars and may be subject to change</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-amber-600 rounded-full mr-3 mt-2" />
                <span>Check-in time is 3:00 PM and check-out time is 11:00 AM</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-amber-600 rounded-full mr-3 mt-2" />
                <span>Valid government-issued photo ID is required at check-in</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Payment and Cancellation</h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-amber-600 rounded-full mr-3 mt-2" />
                <span>Payment is required at the time of booking</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-amber-600 rounded-full mr-3 mt-2" />
                <span>Cancellation policies vary by rate type and dates</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-amber-600 rounded-full mr-3 mt-2" />
                <span>No-shows may be charged according to hotel policy</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-amber-600 rounded-full mr-3 mt-2" />
                <span>Refunds are processed according to our cancellation policy</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
              <AlertCircle className="w-6 h-6 mr-2" />
              Guest Responsibilities
            </h2>
            <p className="text-gray-700 mb-3">
              Guests are responsible for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Providing accurate information during booking</li>
              <li>Respecting hotel property and other guests</li>
              <li>Complying with hotel policies and local laws</li>
              <li>Adhering to check-in and check-out times</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Limitation of Liability</h2>
            <p className="text-gray-700 mb-3">
              Grand Palace Hotel shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of our services or website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to Terms</h2>
            <p className="text-gray-700 mb-3">
              We reserve the right to modify these Terms of Service at any time. Your continued use of our services constitutes acceptance of any changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 mb-3">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700"><strong>Email:</strong> legal@grandpalacehotel.com</p>
              <p className="text-gray-700"><strong>Phone:</strong> +1 (212) 555-0123</p>
              <p className="text-gray-700"><strong>Address:</strong> 1235 Park Avenue, New York, NY 10029</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}