import Link from 'next/link'
import { ArrowLeft, Shield, Lock, Eye, FileText } from 'lucide-react'

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

export default function PrivacyPage() {
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
            <Shield className="w-8 h-8" />
            <h1 className="text-4xl md:text-5xl font-serif font-bold">Privacy Policy</h1>
          </div>
          <p className="text-xl opacity-90 max-w-3xl">
            Your privacy is important to us. This policy explains how we collect, use, and protect your information.
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
                <Lock className="w-6 h-6" />
              Information We Collect
            </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We collect information that you provide directly to us when you:
            </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300 ml-4">
              <li>Make a reservation or booking</li>
              <li>Create an account or profile</li>
                <li>Contact us for customer support</li>
                <li>Subscribe to our newsletter or marketing communications</li>
                <li>Participate in surveys or promotions</li>
            </ul>
              <p className="text-gray-600 dark:text-gray-300 mt-4">
                This information may include your name, email address, phone number, payment information, 
                and other details necessary to provide our services.
              </p>
          </section>

          <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Eye className="w-6 h-6" />
              How We Use Your Information
            </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
              We use the information we collect to:
            </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300 ml-4">
              <li>Process and manage your reservations and bookings</li>
                <li>Communicate with you about your stay and our services</li>
                <li>Send you marketing communications (with your consent)</li>
                <li>Improve our services and customer experience</li>
                <li>Comply with legal obligations and protect our rights</li>
                <li>Prevent fraud and ensure security</li>
            </ul>
          </section>

          <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6" />
                Data Security
            </h2>
              <p className="text-gray-600 dark:text-gray-300">
                We implement appropriate technical and organizational measures to protect your personal information 
                against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission 
                over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6" />
                Your Rights
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                You have the right to:
            </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                <li>Access and receive a copy of your personal information</li>
                <li>Correct inaccurate or incomplete information</li>
                <li>Request deletion of your personal information</li>
                <li>Object to processing of your personal information</li>
                <li>Request restriction of processing</li>
              <li>Data portability</li>
                <li>Withdraw consent at any time</li>
            </ul>
              <p className="text-gray-600 dark:text-gray-300 mt-4">
                To exercise these rights, please contact us using the information provided in the Contact section below.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Cookies and Tracking Technologies</h2>
              <p className="text-gray-600 dark:text-gray-300">
                We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, 
                and assist with our marketing efforts. You can control cookies through your browser settings, 
                but this may affect the functionality of our website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Third-Party Services</h2>
              <p className="text-gray-600 dark:text-gray-300">
                We may share your information with trusted third-party service providers who assist us in operating 
                our website, conducting business, or serving our guests. These parties are contractually obligated 
                to keep your information confidential and use it only for the purposes we specify.
              </p>
          </section>

          <section>
              <h2 className="text-2xl font-bold mb-4">Changes to This Policy</h2>
              <p className="text-gray-600 dark:text-gray-300">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
                the new policy on this page and updating the "Last updated" date. We encourage you to review this 
                policy periodically.
            </p>
          </section>

          <section>
              <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Email:</strong> privacy@smarthotel.com<br />
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
