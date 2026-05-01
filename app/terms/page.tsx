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
    return 'January 1, 2025'
  }
}

export default function TermsPage() {
  const lastUpdated = getFormattedDate()

  return (
    <div className="bg-white text-midnight min-h-screen">
      {/* Header */}
      <section className="relative pt-32 pb-20 bg-midnight overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-luxury via-transparent to-transparent" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-8 text-luxury uppercase tracking-[0.3em] text-[10px] font-bold hover:opacity-70 transition-opacity">
            <ArrowLeft className="w-4 h-4" />
            Return Home
          </Link>
          <div className="space-y-4 max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-white leading-tight">
              Terms of <span className="text-luxury italic">Excellence</span>
            </h1>
            <p className="text-white/50 font-light max-w-2xl leading-relaxed">
              Our commitment to providing an unparalleled experience is governed by these standards of service and mutual respect.
            </p>
            <p className="text-[10px] uppercase tracking-widest text-luxury font-bold pt-4">Revised: {lastUpdated}</p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-16">
            {[
              { 
                num: '01', 
                title: 'The Covenant', 
                content: 'By engaging with the SmartHotel digital platform or securing a reservation, you enter into a covenant of mutual respect and adherence to these refined standards.' 
              },
              { 
                num: '02', 
                title: 'Reservations', 
                content: 'All bookings are a promise of sanctuary. We require accurate guest particulars to ensure your experience is bespoke. Confirmation is subject to availability and our unyielding standards of verification.' 
              },
              { 
                num: '03', 
                title: 'Cancellation', 
                content: 'We understand that plans evolve. However, our commitment to excellence requires prior notice for cancellations. Specific terms are detailed in your bespoke booking confirmation.' 
              },
              { 
                num: '04', 
                title: 'Guest Conduct', 
                content: 'We curate a sanctuary for all. We expect our guests to maintain the atmosphere of tranquility and respect that defines the SmartHotel experience.' 
              }
            ].map((item) => (
              <div key={item.num} className="grid grid-cols-1 md:grid-cols-12 gap-12">
                 <div className="md:col-span-1 border-t-2 border-luxury pt-4">
                    <span className="text-2xl font-serif italic text-luxury">{item.num}</span>
                 </div>
                 <div className="md:col-span-11 space-y-6">
                    <h2 className="text-3xl font-serif font-bold text-midnight">{item.title}</h2>
                    <p className="text-gray-500 font-light leading-relaxed">{item.content}</p>
                 </div>
              </div>
            ))}

            <div className="pt-12 border-t border-gray-100">
               <div className="bg-gray-50 p-12 space-y-6">
                  <h3 className="text-xl font-serif font-bold text-midnight">Legal Assistance</h3>
                  <p className="text-gray-500 text-sm font-light">For formal inquiries regarding our standards and protocols, please contact our legal concierge.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-[11px] uppercase tracking-widest font-bold text-midnight">
                    <div>
                      <p className="text-luxury mb-1">Electronic Mail</p>
                      <p>legal@smarthotel.com</p>
                    </div>
                    <div>
                      <p className="text-luxury mb-1">Direct Assistance</p>
                      <p>+1 (800) LUX-LEGAL</p>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
