"use client"

import { useEffect, useState } from 'react'
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface ContactInfo {
  name: string
  email: string
  phone: string
  address: string
  checkIn: string
  checkOut: string
  coordinates: {
    lat: number
    lng: number
  }
}

const defaultFormState = {
    name: '',
    email: '',
    subject: '',
  message: '',
}

export default function ContactPage() {
  const [formData, setFormData] = useState(defaultFormState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null)
  const [loadingContact, setLoadingContact] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadContactInfo() {
      try {
        const response = await fetch('/api/settings/contact')
        if (!response.ok) {
          throw new Error('Unable to load contact information')
        }
        const data = await response.json()
        if (isMounted) {
          setContactInfo(data)
        }
      } catch (error) {
        console.error(error)
      } finally {
        if (isMounted) {
          setLoadingContact(false)
        }
      }
    }

    loadContactInfo()

    return () => {
      isMounted = false
    }
  }, [])

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitStatus('idle')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw new Error(errorBody?.error || 'Failed to send message')
      }

      setSubmitStatus('success')
      setFormData(defaultFormState)
    } catch (error) {
      console.error(error)
      setSubmitStatus('error')
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const mapLat = contactInfo?.coordinates.lat ?? 40.7589
  const mapLng = contactInfo?.coordinates.lng ?? -73.9851

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="pt-20 pb-12 bg-gradient-to-r from-amber-600 to-orange-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Get in touch with us for reservations, inquiries, or any assistance you need. 
            We're here to help make your stay perfect.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium mb-2">Full Name</label>
                  <input
                    id="contact-name"
                    type="text"
                    value={formData.name}
                    onChange={(event) => handleInputChange('name', event.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium mb-2">Email</label>
                  <input
                    id="contact-email"
                    type="email"
                    value={formData.email}
                    onChange={(event) => handleInputChange('email', event.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="contact-subject" className="block text-sm font-medium mb-2">Subject</label>
                <input
                  id="contact-subject"
                  type="text"
                  value={formData.subject}
                  onChange={(event) => handleInputChange('subject', event.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="contact-message" className="block text-sm font-medium mb-2">Message</label>
                <textarea
                  id="contact-message"
                  value={formData.message}
                  onChange={(event) => handleInputChange('message', event.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  rows={5}
                  required
                />
              </div>
              
              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full bg-amber-700 hover:bg-amber-800 text-white"
                  disabled={isSubmitting}
                >
                <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>

                {submitStatus === 'success' && (
                  <p className="text-sm text-green-600 text-center">
                    Thank you! Your message has been sent successfully. We'll be in touch shortly.
                  </p>
                )}
                {submitStatus === 'error' && submitError && (
                  <p className="text-sm text-red-600 text-center">
                    {submitError}
                  </p>
                )}
              </div>
            </form>
          </Card>

          <div className="space-y-8">
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Address</h3>
                    <p className="text-gray-600">
                      {loadingContact ? 'Loading address…' : contactInfo?.address}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Phone</h3>
                    <p className="text-gray-600">
                      {loadingContact ? 'Loading phone…' : contactInfo?.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Email</h3>
                    <p className="text-gray-600">
                      {loadingContact ? 'Loading email…' : contactInfo?.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Guest Services</h3>
                    <p className="text-gray-600">
                      Check-in: {contactInfo?.checkIn ?? '15:00'}<br />
                      Check-out: {contactInfo?.checkOut ?? '11:00'}<br />
                      Front Desk: 24/7
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-0 overflow-hidden">
              <div className="relative pb-[56.25%]">
                <iframe
                  src={`https://www.google.com/maps?q=${mapLat},${mapLng}&z=15&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0 w-full h-full"
                  title="SmartHotel Location"
                />
              </div>
            </Card>
          </div>
        </div>

        <section className="mt-16">
          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold mb-2">What are your check-in and check-out times?</h3>
                <p className="text-gray-600">
                  Check-in is available from {contactInfo?.checkIn ?? '15:00'}, and check-out is until {contactInfo?.checkOut ?? '11:00'}.
                  Early check-in and late check-out can be arranged based on availability.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Do you offer airport transportation?</h3>
                <p className="text-gray-600">
                  Yes, we provide airport shuttle service. Please contact us at least 24 hours in advance to arrange transportation.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Can I request special room arrangements?</h3>
                <p className="text-gray-600">
                  Absolutely! Let us know your preferences when booking, and our staff will ensure your room is prepared according to your needs.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Do you accommodate dietary requirements?</h3>
                <p className="text-gray-600">
                  Yes, our culinary team can accommodate dietary restrictions. Please inform us in advance so we can make arrangements.
                </p>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  )
} 