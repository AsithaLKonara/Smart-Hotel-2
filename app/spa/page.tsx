import Image from 'next/image'
import Link from 'next/link'
import { 
  Heart, 
  Sparkles, 
  Waves, 
  Wind,
  Star,
  ChevronRight,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

export const dynamic = 'force-dynamic'

const treatments = [
  {
    id: 'massage',
    name: 'Celestial Body Ritual',
    subtitle: 'Holistic Massage',
    description: 'A bespoke full-body treatment utilizing warmed gold-infused oils and long, rhythmic strokes to dissolve tension and restore energy flow.',
    duration: '90 Minutes',
    price: '$280',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=1200',
  },
  {
    id: 'facial',
    name: '24K Gold Radiant Facial',
    subtitle: 'Anti-Aging Therapy',
    description: 'The ultimate luxury skin treatment using real 24-karat gold leaves to boost collagen, reduce fine lines, and leave your skin with a luminous glow.',
    duration: '60 Minutes',
    price: '$320',
    image: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&q=80&w=1200',
  },
  {
    id: 'hydro',
    name: 'Mineral Vitality Circuit',
    subtitle: 'Hydrotherapy',
    description: 'A transformative journey through our thermal suites, including Himalayan salt saunas, aromatic steam rooms, and ice plunge pools.',
    duration: '120 Minutes',
    price: '$150',
    image: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&q=80&w=1200',
  },
]

export default function SpaPage() {
  return (
    <div className="bg-transparent text-white">
      {/* Contextual Hero */}
      <section className="relative min-h-[500px] flex items-center justify-center overflow-hidden border-b border-white/5">
        <Image 
          src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=1920" 
          alt="Spa & Wellness" 
          fill 
          className="object-cover absolute inset-0 -z-20 scale-105 transform" 
          priority 
        />
        {/* Blend layers into the solid #0a0a0a body */}
        <div className="absolute inset-0 bg-black/60 -z-10" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0a0a0a] to-transparent -z-10" />
        
        <div className="relative z-10 container mx-auto px-4 flex flex-col items-center text-center pt-32 pb-16">
          <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-center space-x-3 text-luxury uppercase tracking-[0.4em] text-xs font-bold">
              <div className="w-12 h-px bg-luxury" />
              <span>Sanctuary of Peace</span>
              <div className="w-12 h-px bg-luxury" />
            </div>
            <h1 className="text-6xl md:text-8xl font-serif font-bold text-white leading-tight">
              Pure <span className="text-luxury italic">Serenity</span>
            </h1>
            <p className="text-xl text-white/70 font-light max-w-2xl mx-auto leading-relaxed">
              Step into a world where time stands still, and let our expert therapists guide you on a journey of total rejuvenation.
            </p>
          </div>
        </div>
      </section>

      {/* Intro Section */}
      <section className="py-24 lg:py-32 bg-transparent">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="relative">
              <div className="relative aspect-square overflow-hidden shadow-2xl">
                <Image 
                  src="https://images.unsplash.com/photo-1540555700478-4be289fbecee?auto=format&fit=crop&q=80&w=1200" 
                  alt="Spa Interior" 
                  fill 
                  className="object-cover" 
                />
              </div>
              <div className="absolute -top-10 -left-10 w-48 h-48 border-[15px] border-luxury/10 -z-10" />
            </div>
            
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <h4 className="text-luxury uppercase tracking-[0.3em] text-xs font-bold">The Serenity Method</h4>
                <h2 className="text-5xl lg:text-6xl font-serif font-bold text-white">Holistic <span className="text-luxury italic">Healing</span></h2>
              </div>
              <p className="text-lg text-white/60 leading-relaxed font-light">
                Our philosophy centers on the harmony of mind, body, and spirit. We use only the world's most exclusive organic products and cutting-edge wellness technology to ensure profound results.
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                {[
                  'Award-winning Therapists',
                  'Exclusive Gold-infused Oils',
                  'Private VIP Spa Suites',
                  'Thermal Wellness Circuit',
                ].map((item, i) => (
                  <li key={i} className="flex items-center space-x-3 text-white/80 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-luxury" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="border-white/20 text-white rounded-none px-10 h-14 uppercase tracking-widest text-xs font-bold hover:bg-white/10 transition-all">
                Download Spa Menu
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Treatments List */}
      <section className="py-24 lg:py-32 bg-[#0a0a0a]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20 space-y-4">
            <h4 className="text-luxury uppercase tracking-[0.3em] text-xs font-bold">Signature Rituals</h4>
            <h2 className="text-5xl lg:text-6xl font-serif font-bold text-white">Bespoke <span className="text-luxury italic">Treatments</span></h2>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-10"
          >
            {treatments.map((treatment) => (
              <div key={treatment.id} className="group bg-white/5 border border-white/10 overflow-hidden shadow-luxury hover:-translate-y-2 transition-all duration-500 rounded-2xl">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image src={treatment.image} alt={treatment.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md px-3 py-1 text-luxury font-serif italic border border-luxury/20 rounded-lg">
                    {treatment.price}
                  </div>
                </div>
                <div className="p-8 space-y-4">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-luxury font-bold">{treatment.subtitle}</p>
                    <h3 className="text-2xl font-serif font-bold text-white">{treatment.name}</h3>
                  </div>
                  <p className="text-white/50 text-sm font-light leading-relaxed line-clamp-3">
                    {treatment.description}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="flex items-center space-x-2 text-white/40">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase tracking-widest">{treatment.duration}</span>
                    </div>
                    <Link href="/contact" className="text-luxury uppercase tracking-widest text-[10px] font-bold flex items-center group-hover:translate-x-1 transition-transform">
                      <span>Book Now</span>
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Amenities Icons */}
      <section className="py-24 bg-transparent text-white border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { icon: Sparkles, title: 'Gold Therapy', desc: 'Luxury anti-aging rituals' },
              { icon: Waves, title: 'Hydro Pools', desc: 'Mineral-rich thermal circuits' },
              { icon: Wind, title: 'Zen Garden', desc: 'Open-air meditation space' },
              { icon: Heart, title: 'Wellness Concierge', desc: 'Personalized health planning' },
            ].map((item, i) => (
              <div key={i} className="text-center space-y-4">
                <div className="w-16 h-16 bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-luxury">
                  <item.icon className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-serif font-bold">{item.title}</h3>
                <p className="text-white/40 text-xs font-light tracking-wide">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="relative py-24 bg-[#0a0a0a] overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <Image src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1920" alt="Background" fill className="object-cover" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center space-y-10">
          <h2 className="text-4xl lg:text-6xl font-serif font-bold text-white leading-tight">
            Begin Your <span className="text-luxury italic">Transformation</span>
          </h2>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link href="/contact">
              <Button className="bg-gold-gradient hover:opacity-90 text-white px-12 h-16 rounded-none text-xs uppercase tracking-[0.2em] font-bold border-none shadow-luxury w-full sm:w-auto">
                Book Treatment
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="border-white text-white rounded-none px-12 h-16 uppercase tracking-[0.2em] text-xs font-bold hover:bg-white hover:text-midnight transition-all w-full sm:w-auto">
                Inquire for Membership
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
