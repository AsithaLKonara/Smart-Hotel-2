import Link from 'next/link'
import { ArrowLeft, FileText, Scale, AlertCircle, CheckCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

function getFormattedDate(): string {
  try {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'January 1, 2025'
  }
}

export default function TermsPage() {
  const lastUpdated = getFormattedDate()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
      <section className="pt-20 pb-12 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="container mx-auto px-4">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 text-white/80 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <Scale className="w-8 h-8" />
            <h1 className="text-4xl md:text-5xl font-serif font-bold">Terms of Service</h1>
          </div>
          <p className="text-xl opacity-90 max-w-3xl">
            Please read these terms carefully before using our services or making a reservation.
          </p>
          <p className="text-sm opacity-75 mt-2">Last updated: {lastUpdated}</p>
        </div>
      </section>

        {/* Content */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 space-y-8">
          <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6" />
              Acceptance of Terms
            </h2>
              <p className="text-gray-600 dark:text-gray-300">
                By accessing and using this website or making a reservation, you accept and agree to be bound by 
                the terms and provision of this agreement. If you do not agree to these terms, please do not use 
                our services.
            </p>
          </section>

          <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6" />
                Reservations and Bookings
              </h2>
              <div className="space-y-4 text-gray-600 dark:text-gray-300">
                <p>
                  <strong>Booking Confirmation:</strong> All reservations are subject to availability and confirmation 
                  by the hotel. A booking confirmation will be sent to the email address provided.
                </p>
                <p>
                  <strong>Payment:</strong> Payment terms vary by booking type. Some reservations require full payment 
                  at the time of booking, while others may require a deposit. All prices are subject to applicable taxes 
                  and fees.
                </p>
                <p>
                  <strong>Modifications:</strong> Changes to reservations are subject to availability and may incur 
                  additional charges. Please contact us as soon as possible if you need to modify your booking.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <AlertCircle className="w-6 h-6" />
                Cancellation Policy
              </h2>
              <div className="space-y-4 text-gray-600 dark:text-gray-300">
                <p>
                  <strong>Cancellation Deadlines:</strong> Cancellation policies vary by rate type and booking channel. 
                  Please review your booking confirmation for specific cancellation terms.
                </p>
                <p>
                  <strong>Refunds:</strong> Refunds, if applicable, will be processed according to the cancellation 
                  policy in effect at the time of booking. Processing times may vary.
                </p>
                <p>
                  <strong>No-Shows:</strong> Guests who fail to arrive without prior cancellation may be charged 
                  according to the hotel's no-show policy.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Guest Responsibilities</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                <li>Provide accurate and complete information when making reservations</li>
                <li>Comply with hotel policies and local laws</li>
                <li>Respect other guests and hotel property</li>
                <li>Report any issues or concerns promptly to hotel staff</li>
                <li>Be responsible for any damage caused to hotel property</li>
            </ul>
          </section>

          <section>
              <h2 className="text-2xl font-bold mb-4">Hotel Services</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We strive to provide the best possible service, but we reserve the right to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                <li>Modify or discontinue services without prior notice</li>
                <li>Refuse service to anyone for any reason at any time</li>
                <li>Remove guests who violate hotel policies or disturb other guests</li>
                <li>Make changes to facilities, amenities, or services as needed</li>
            </ul>
          </section>

          <section>
              <h2 className="text-2xl font-bold mb-4">Limitation of Liability</h2>
              <p className="text-gray-600 dark:text-gray-300">
                To the maximum extent permitted by law, the hotel shall not be liable for any indirect, incidental, 
                special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly 
                or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use 
                of our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Intellectual Property</h2>
              <p className="text-gray-600 dark:text-gray-300">
                All content on this website, including text, graphics, logos, images, and software, is the property 
                of SmartHotel Grand Palace or its content suppliers and is protected by copyright and other intellectual 
                property laws. You may not reproduce, distribute, or create derivative works without our written permission.
              </p>
          </section>

          <section>
              <h2 className="text-2xl font-bold mb-4">Governing Law</h2>
              <p className="text-gray-600 dark:text-gray-300">
                These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which 
                the hotel is located, without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
              <h2 className="text-2xl font-bold mb-4">Changes to Terms</h2>
              <p className="text-gray-600 dark:text-gray-300">
                We reserve the right to modify these terms at any time. Changes will be effective immediately upon 
                posting to this page. Your continued use of our services after changes are posted constitutes acceptance 
                of the modified terms.
            </p>
          </section>

          <section>
              <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
              If you have any questions about these Terms of Service, please contact us:
            </p>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Email:</strong> legal@smarthotel.com<br />
                  <strong>Phone:</strong> +1 (800) 555-HOTEL<br />
                  <strong>Address:</strong> 123 Grand Boulevard, City Center, Metropolitan Area, ST 10001
                </p>
            </div>
          </section>
          </div>
        </div>
      </section>
    </div>
  )
}
