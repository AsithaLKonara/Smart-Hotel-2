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
    return 'January 1, 2025'
  }
}

export default function PrivacyPage() {
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
              Privacy <span className="text-luxury italic">Commitment</span>
            </h1>
            <p className="text-white/50 font-light max-w-2xl leading-relaxed">
              At SmartHotel, we value your trust above all. This policy outlines our unwavering commitment to protecting your personal sanctuary of data.
            </p>
            <p className="text-[10px] uppercase tracking-widest text-luxury font-bold pt-4">Effective: {lastUpdated}</p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-16">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
               <div className="md:col-span-1 border-t-2 border-luxury pt-4">
                  <span className="text-2xl font-serif italic text-luxury">01</span>
               </div>
               <div className="md:col-span-11 space-y-6">
                  <h2 className="text-3xl font-serif font-bold text-midnight flex items-center gap-4">
                    Data Stewardship
                  </h2>
                  <p className="text-gray-500 font-light leading-relaxed">
                    We collect only what is essential to curate your perfect stay. This includes:
                  </p>
                  <ul className="space-y-4 text-gray-500 font-light list-none border-l border-gray-100 pl-8">
                    <li className="relative before:absolute before:-left-8 before:top-3 before:w-4 before:h-px before:bg-luxury italic">Personal identifiers for bespoke service.</li>
                    <li className="relative before:absolute before:-left-8 before:top-3 before:w-4 before:h-px before:bg-luxury italic">Secure payment details via encrypted gateways.</li>
                    <li className="relative before:absolute before:-left-8 before:top-3 before:w-4 before:h-px before:bg-luxury italic">Preferences to anticipate your every need.</li>
                  </ul>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
               <div className="md:col-span-1 border-t-2 border-luxury pt-4">
                  <span className="text-2xl font-serif italic text-luxury">02</span>
               </div>
               <div className="md:col-span-11 space-y-6">
                  <h2 className="text-3xl font-serif font-bold text-midnight">Information Use</h2>
                  <p className="text-gray-500 font-light leading-relaxed">
                    Your information is used solely to enhance your experience, manage reservations, and communicate with the elegance you expect from SmartHotel. We do not sell your data; we protect it.
                  </p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
               <div className="md:col-span-1 border-t-2 border-luxury pt-4">
                  <span className="text-2xl font-serif italic text-luxury">03</span>
               </div>
               <div className="md:col-span-11 space-y-6">
                  <h2 className="text-3xl font-serif font-bold text-midnight">Digital Security</h2>
                  <p className="text-gray-500 font-light leading-relaxed">
                    We employ bank-grade encryption and unyielding security protocols. Our digital architecture is as secure as our physical vaults, ensuring your peace of mind throughout your journey.
                  </p>
               </div>
            </div>

            <div className="pt-12 border-t border-gray-100">
               <div className="bg-gray-50 p-12 space-y-6">
                  <h3 className="text-xl font-serif font-bold text-midnight">Concierge for Privacy</h3>
                  <p className="text-gray-500 text-sm font-light">Should you have inquiries regarding your data, our privacy officers are at your service.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-[11px] uppercase tracking-widest font-bold text-midnight">
                    <div>
                      <p className="text-luxury mb-1">Electronic Mail</p>
                      <p>privacy@smarthotel.com</p>
                    </div>
                    <div>
                      <p className="text-luxury mb-1">Direct Assistance</p>
                      <p>+1 (800) LUX-DATA</p>
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
