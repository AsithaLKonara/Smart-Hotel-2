import Image from 'next/image'
import Link from 'next/link'
import { 
  Wifi, 
  Car, 
  UserCheck, 
  Sparkles,
} from 'lucide-react'
import { Metadata } from 'next'
import { CmsService } from '@/lib/services/cms-service'
import { FacilitiesCatalog } from '@/components/facilities/facilities-catalog'

export const metadata: Metadata = {
  title: 'World-Class Luxury Facilities | SmartHotel OS',
  description: 'Explore the Celestial Rooftop Infinity Pool, Elite Fitness Studio, Serenity Wellness Spa, and Executive Boardrooms across our luxury destinations.',
}

export const dynamic = 'force-dynamic'

export default async function FacilitiesPage() {
  await CmsService.ensureDefaultCmsContent()

  const [facilities, properties] = await Promise.all([
    CmsService.getFacilities({ status: 'ACTIVE' }),
    CmsService.getProperties({ activeOnly: true })
  ])

  return (
    <div className="bg-transparent text-white min-h-screen">
      {/* Contextual Hero */}
      <section className="relative min-h-[500px] flex items-center justify-center overflow-hidden border-b border-white/5">
        <Image 
          src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1920" 
          alt="Luxury Facilities" 
          fill 
          className="object-cover absolute inset-0 -z-20 scale-105 transform" 
          priority 
        />
        {/* Blend layers into the solid #0a0a0a body */}
        <div className="absolute inset-0 bg-black/60 -z-10" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0a0a0a] to-transparent -z-10" />
        
        <div className="relative z-10 container mx-auto px-4 flex flex-col items-center text-center pt-32 pb-16">
          <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-center space-x-3 text-primary uppercase tracking-[0.4em] text-xs font-bold">
              <div className="w-12 h-px bg-primary" />
              <span>World Class Amenities</span>
              <div className="w-12 h-px bg-primary" />
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-white leading-tight">
              Unrivaled <span className="text-primary italic">Facilities</span>
            </h1>
            <p className="text-lg md:text-xl text-white/60 font-light max-w-2xl mx-auto leading-relaxed">
              Every detail of our facilities is designed to exceed the expectations of the world's most discerning travelers.
            </p>
          </div>
        </div>
      </section>

      {/* Dynamic Multi-Property Facilities Catalog */}
      <FacilitiesCatalog 
        initialFacilities={facilities as any} 
        properties={properties.map((p: any) => ({ id: p.id, name: p.name, city: p.city, code: p.code }))} 
      />

      {/* Quick Services & Signature Hospitality */}
      <section className="py-24 bg-black/25 backdrop-blur-sm border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: Wifi, title: 'Ultra-Fast Fiber WiFi', desc: 'Complimentary gigabit fiber-optic connectivity throughout all suites, private cabanas, and boardrooms.' },
              { icon: Car, title: 'White-Glove Valet', desc: 'Secure executive valet parking with dedicated high-speed EV charging and chauffeured airport transfers.' },
              { icon: UserCheck, title: 'Royal Butler Service', desc: 'Bespoke 24/7 personal butler assistance, private dining curation, and unpack/pack service.' },
            ].map((service, i) => (
              <div key={i} className="text-center space-y-4 bg-white/5 border border-white/5 p-8 rounded-3xl backdrop-blur-md">
                <div className="w-16 h-16 bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary rounded-2xl shadow-luxury">
                  <service.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-serif font-bold text-white">{service.title}</h3>
                <p className="text-white/50 text-sm font-light leading-relaxed">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
