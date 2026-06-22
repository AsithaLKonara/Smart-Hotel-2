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
          <h4 className="text-primary uppercase tracking-[0.3em] text-xs font-bold">Common Inquiries</h4>
          <h2 className="text-4xl font-serif font-bold text-white">Frequently Asked <span className="text-primary italic">Questions</span></h2>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-white/10">
              <button 
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between py-6 text-left group"
              >
                <span className="text-lg font-serif font-bold text-white group-hover:text-primary transition-colors">{faq.question}</span>
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
                    <p className="pb-6 text-white/50 font-light leading-relaxed">{faq.answer}</p>
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
    <div className="bg-transparent text-white min-h-screen pt-24">
      {/* Hero Section — Blur Glass */}
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/70" />
        
        <div className="relative z-20 container mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
          <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-center space-x-3 text-primary uppercase tracking-[0.4em] text-xs font-bold">
              <div className="w-12 h-px bg-primary" />
              <span>Contact Concierge</span>
              <div className="w-12 h-px bg-primary" />
            </div>
            <h1 className="text-6xl md:text-8xl font-serif font-bold text-white leading-tight">
              Bespoke <span className="text-primary italic">Assistance</span>
            </h1>
            <p className="text-white/50 font-light text-lg max-w-xl mx-auto">Our dedicated team is available around the clock to craft your perfect experience.</p>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
            {/* Contact Form */}
            <div className="lg:col-span-7 space-y-12">
              <div className="space-y-4">
                <h2 className="text-4xl font-serif font-bold text-white">Send a <span className="text-primary italic">Message</span></h2>
                <p className="text-white/50 font-light max-w-lg">Our dedicated team is ready to assist you with any inquiries or special requests you may have.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label htmlFor="contactName" className="text-[10px] uppercase tracking-widest font-bold text-white/40">Full Name</label>
                    <input 
                      id="contactName"
                      type="text" 
                      className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 px-6 py-4 focus:ring-1 focus:ring-primary transition-all text-sm rounded-xl"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="contactEmail" className="text-[10px] uppercase tracking-widest font-bold text-white/40">Email Address</label>
                    <input 
                      id="contactEmail"
                      type="email" 
                      className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 px-6 py-4 focus:ring-1 focus:ring-primary transition-all text-sm rounded-xl"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="contactSubject" className="text-[10px] uppercase tracking-widest font-bold text-white/40">Subject</label>
                  <input 
                    id="contactSubject"
                    type="text" 
                    className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 px-6 py-4 focus:ring-1 focus:ring-primary transition-all text-sm rounded-xl"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="contactMessage" className="text-[10px] uppercase tracking-widest font-bold text-white/40">Message</label>
                  <textarea 
                    id="contactMessage"
                    rows={6}
                    className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 px-6 py-4 focus:ring-1 focus:ring-primary transition-all text-sm rounded-xl resize-none"
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
                  <div key={i} className="flex items-start gap-6 p-6 bg-white/5 backdrop-blur-md border border-white/10 hover:border-primary/30 transition-all duration-500 group rounded-2xl">
                    <div className="w-12 h-12 bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors flex-shrink-0 rounded-xl">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">{item.title}</h3>
                      <p className="text-white font-serif font-bold">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative aspect-video shadow-2xl overflow-hidden rounded-2xl border border-white/10">
                <GoogleMapFallback 
                  lat={contactInfo?.coordinates?.lat || 40.7589}
                  lng={contactInfo?.coordinates?.lng || -73.9851}
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