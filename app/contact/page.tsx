"use client"

import { useEffect, useState } from 'react'
import { MapPin, Phone, Mail, Clock, Send, ChevronDown, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimatePresence, motion } from 'framer-motion'

function GoogleMapFallback({ lat, lng, address }: { lat: number; lng: number; address: string }) {
  const apiKey = typeof window !== 'undefined' 
    ? (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY 
    : process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || apiKey

  if (mapsApiKey && mapsApiKey !== 'AIzaSyYour_Google_Maps_API_Key_Here' && mapsApiKey !== '') {
    return (
      <iframe
        src={`https://www.google.com/maps/embed/v1/place?key=${mapsApiKey}&q=${lat},${lng}&zoom=15`}
        width="100%"
        height="100%"
        style={{ border: 0, filter: 'grayscale(1) invert(0.9) contrast(1.2)' }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="absolute inset-0 w-full h-full"
        title="SmartHotel Location"
      />
    )
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-midnight/5">
      <MapPin className="w-12 h-12 text-luxury mb-4" />
      <h3 className="text-xl font-serif font-bold text-midnight mb-2">Our Sanctuary</h3>
      <p className="text-gray-500 text-sm mb-6 max-w-xs">{address}</p>
      <a
        href={`https://www.google.com/maps?q=${lat},${lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[10px] uppercase tracking-widest font-bold text-luxury hover:underline"
      >
        View on Google Maps
      </a>
    </div>
  )
}

function FAQSection() {
  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>([])
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  useEffect(() => {
    async function loadFAQs() {
      try {
        const response = await fetch('/api/faq')
        const data = await response.json()
        setFaqs(Array.isArray(data) ? data : (data.items || []))
      } catch (error) {
        setFaqs([
          { question: "What is the check-in and check-out time?", answer: "Check-in is from 3:00 PM, and check-out is until 11:00 AM. Early check-in or late check-out can be requested but is subject to availability." },
          { question: "Do you offer airport transportation?", answer: "Yes, we provide luxury chauffeur services for airport transfers. Please contact our concierge to arrange your transport." },
          { question: "Is there a fitness center on-site?", answer: "Our elite fitness studio is open 24/7 for all guests, featuring state-of-the-art equipment and private training sessions." }
        ])
      }
    }
    loadFAQs()
  }, [])

  return (
    <section className="py-24">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h4 className="text-luxury uppercase tracking-[0.3em] text-xs font-bold">Common Inquiries</h4>
          <h2 className="text-4xl font-serif font-bold text-midnight">Frequently Asked <span className="text-luxury italic">Questions</span></h2>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-gray-100">
              <button 
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between py-6 text-left group"
              >
                <span className="text-lg font-serif font-bold text-midnight group-hover:text-luxury transition-colors">{faq.question}</span>
                {openIndex === index ? <Minus className="w-4 h-4 text-luxury" /> : <Plus className="w-4 h-4 text-gray-300" />}
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="pb-6 text-gray-500 font-light leading-relaxed">{faq.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [contactInfo, setContactInfo] = useState<any>(null)

  useEffect(() => {
    async function loadContactInfo() {
      try {
        const response = await fetch('/api/settings/contact')
        const data = await response.json()
        setContactInfo(data)
      } catch (error) {}
    }
    loadContactInfo()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) setSubmitStatus('success')
      else setSubmitStatus('error')
    } catch (error) {
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white text-midnight min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden bg-midnight">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-midnight/20 via-midnight/60 to-midnight z-10" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1920')] bg-cover bg-center opacity-30 grayscale" />
        </div>
        
        <div className="relative z-20 container mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
          <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-center space-x-3 text-luxury uppercase tracking-[0.4em] text-xs font-bold">
              <div className="w-12 h-px bg-luxury" />
              <span>Contact Concierge</span>
              <div className="w-12 h-px bg-luxury" />
            </div>
            <h1 className="text-6xl md:text-8xl font-serif font-bold text-white leading-tight">
              Bespoke <span className="text-luxury italic">Assistance</span>
            </h1>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
            {/* Contact Form */}
            <div className="lg:col-span-7 space-y-12">
              <div className="space-y-4">
                <h2 className="text-4xl font-serif font-bold text-midnight">Send a <span className="text-luxury italic">Message</span></h2>
                <p className="text-gray-500 font-light max-w-lg">Our dedicated team is ready to assist you with any inquiries or special requests you may have.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Full Name</label>
                    <input 
                      type="text" 
                      className="w-full bg-gray-50 border-none px-6 py-4 focus:ring-1 focus:ring-luxury transition-all text-sm rounded-none"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Email Address</label>
                    <input 
                      type="email" 
                      className="w-full bg-gray-50 border-none px-6 py-4 focus:ring-1 focus:ring-luxury transition-all text-sm rounded-none"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Subject</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 border-none px-6 py-4 focus:ring-1 focus:ring-luxury transition-all text-sm rounded-none"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Message</label>
                  <textarea 
                    rows={6}
                    className="w-full bg-gray-50 border-none px-6 py-4 focus:ring-1 focus:ring-luxury transition-all text-sm rounded-none resize-none"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-gold-gradient text-white rounded-none px-12 h-16 uppercase tracking-[0.2em] text-xs font-bold border-none shadow-luxury w-full md:w-auto"
                >
                  {isSubmitting ? 'Sending...' : 'Transmit Message'}
                </Button>

                {submitStatus === 'success' && <p className="text-green-600 text-xs font-bold uppercase tracking-widest">Message sent successfully.</p>}
              </form>
            </div>

            {/* Contact Details */}
            <div className="lg:col-span-5 space-y-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:grid-cols-1">
                {[
                  { icon: MapPin, title: 'Our Address', value: contactInfo?.address || '123 Grand Boulevard, Metropolitan City' },
                  { icon: Phone, title: 'Direct Line', value: contactInfo?.phone || '+1 (555) LUX-URY-1' },
                  { icon: Mail, title: 'Email Inquiries', value: contactInfo?.email || 'concierge@smarthotel.com' },
                  { icon: Clock, title: 'Guest Services', value: `Check-in: ${contactInfo?.checkIn || '15:00'} | Check-out: ${contactInfo?.checkOut || '11:00'}` },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-6 p-8 bg-gray-50 hover:bg-white hover:shadow-2xl transition-all duration-500 group">
                    <div className="w-12 h-12 bg-white flex items-center justify-center text-luxury group-hover:bg-midnight group-hover:text-white transition-colors flex-shrink-0">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400">{item.title}</h3>
                      <p className="text-midnight font-serif font-bold">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative aspect-video shadow-2xl overflow-hidden">
                <GoogleMapFallback 
                  lat={contactInfo?.coordinates.lat || 40.7589}
                  lng={contactInfo?.coordinates.lng || -73.9851}
                  address={contactInfo?.address || '123 Grand Boulevard'}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <FAQSection />
    </div>
  )
}