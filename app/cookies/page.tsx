import { Cookie, Settings, Shield, Eye } from 'lucide-react'
import { getHotelContactInfo } from '@/lib/settings'

export const dynamic = 'force-dynamic'

export default async function CookiePolicyPage() {
  const contact = await getHotelContactInfo()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <Cookie className="w-16 h-16 text-amber-600 mx-auto mb-4" />
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Cookie Policy</h1>
          <p className="text-xl text-gray-600">Last Updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
          
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
              <Cookie className="w-6 h-6 mr-2" />
              What Are Cookies?
            </h2>
            <p className="text-gray-700 mb-3">
              Cookies are small text files that are stored on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and enabling certain website functions.
            </p>
            <p className="text-gray-700">
              {contact.name} uses cookies to enhance your browsing experience, analyze website traffic, and provide personalized content and services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="w-6 h-6 mr-2" />
              Types of Cookies We Use
            </h2>
            
            <div className="space-y-6">
              <div className="border-l-4 border-amber-600 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Essential Cookies</h3>
                <p className="text-gray-700 mb-2">
                  These cookies are necessary for the website to function properly. They enable basic functions like page navigation, access to secure areas, and form submissions.
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Examples:</strong> Session management, security tokens, user authentication
                </p>
              </div>

              <div className="border-l-4 border-blue-600 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance Cookies</h3>
                <p className="text-gray-700 mb-2">
                  These cookies collect information about how visitors use our website, such as which pages are visited most often and if users get error messages.
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Examples:</strong> Google Analytics, website performance monitoring
                </p>
              </div>

              <div className="border-l-4 border-green-600 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Functional Cookies</h3>
                <p className="text-gray-700 mb-2">
                  These cookies enable enhanced functionality and personalization, such as remembering your language preference or login status.
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Examples:</strong> Language settings, user preferences, booking history
                </p>
              </div>

              <div className="border-l-4 border-purple-600 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Marketing Cookies</h3>
                <p className="text-gray-700 mb-2">
                  These cookies are used to track visitors across websites to display relevant and engaging advertisements.
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Examples:</strong> Social media integration, advertising networks, remarketing
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
              <Eye className="w-6 h-6 mr-2" />
              How We Use Cookies
            </h2>
            <p className="text-gray-700 mb-3">
              We use cookies for the following purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>To remember your preferences and settings</li>
              <li>To analyze website traffic and user behavior</li>
              <li>To provide personalized content and recommendations</li>
              <li>To improve website functionality and performance</li>
              <li>To enable social media features</li>
              <li>To deliver targeted advertisements</li>
              <li>To ensure website security and prevent fraud</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Third-Party Cookies</h2>
            <p className="text-gray-700 mb-3">
              Some cookies on our website are set by third-party services. These include:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>Google Analytics:</strong> For website traffic analysis</li>
              <li><strong>Social Media Platforms:</strong> For social sharing features</li>
              <li><strong>Payment Processors:</strong> For secure payment processing</li>
              <li><strong>Advertising Networks:</strong> For targeted advertising</li>
              <li><strong>Customer Support:</strong> For live chat functionality</li>
            </ul>
            <p className="text-gray-700 mt-4">
              These third parties have their own privacy policies and cookie practices. We recommend reviewing their policies for more information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Managing Cookies</h2>
            <p className="text-gray-700 mb-3">
              You can control and manage cookies in several ways:
            </p>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Browser Settings</h3>
                <p className="text-gray-700 mb-2">
                  Most web browsers allow you to control cookies through their settings. You can:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>Block all cookies</li>
                  <li>Allow only first-party cookies</li>
                  <li>Delete existing cookies</li>
                  <li>Set preferences for specific websites</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Cookie Consent</h3>
                <p className="text-gray-700 mb-2">
                  When you first visit our website, you'll see a cookie consent banner. You can:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>Accept all cookies</li>
                  <li>Reject non-essential cookies</li>
                  <li>Customize your preferences</li>
                  <li>Change your settings at any time</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Impact of Disabling Cookies</h2>
            <p className="text-gray-700 mb-3">
              If you choose to disable cookies, some features of our website may not function properly:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>You may need to re-enter information on each visit</li>
              <li>Personalized content and recommendations may not be available</li>
              <li>Some interactive features may not work</li>
              <li>Website performance may be affected</li>
              <li>We may not be able to remember your preferences</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="w-6 h-6 mr-2" />
              Data Security
            </h2>
            <p className="text-gray-700 mb-3">
              We take the security of your information seriously. Our cookies are:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Encrypted when transmitted</li>
              <li>Stored securely on our servers</li>
              <li>Regularly reviewed and updated</li>
              <li>Protected by industry-standard security measures</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Updates to This Policy</h2>
            <p className="text-gray-700 mb-3">
              We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons.
            </p>
            <p className="text-gray-700">
              We will notify you of any significant changes by posting the updated policy on our website and updating the "Last Updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 mb-3">
              If you have any questions about our use of cookies or this Cookie Policy, please contact us:
            </p>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700"><strong>Email:</strong> {contact.email}</p>
              <p className="text-gray-700"><strong>Phone:</strong> {contact.phone}</p>
              <p className="text-gray-700"><strong>Address:</strong> {contact.address}</p>
              <p className="text-gray-700 mt-2"><strong>Data Protection Officer:</strong> dpo@grandpalacehotel.com</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}