import Image from 'next/image'
import Link from 'next/link'
import { 
  Waves, 
  Dumbbell, 
  Utensils, 
  Heart, 
  Wifi, 
  Car, 
  Coffee, 
  Briefcase,
  UserCheck,
  Star,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

const facilities = [
  {
    id: 'fitness',
    name: 'Elite Fitness Studio',
    subtitle: 'Strength & Vitality',
    description: 'A state-of-the-art sanctuary featuring the latest Technogym equipment, private training suites, and panoramic city views to inspire your workout.',
    icon: Dumbbell,
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1200',
    features: ['24/7 Biometric Access', 'Elite Personal Trainers', 'Private Yoga Studio', 'Post-workout Recovery Bar'],
  },
  {
    id: 'pool',
    name: 'Celestial Infinity Pool',
    subtitle: 'Above the Clouds',
    description: 'Our heated rooftop infinity pool offers a seamless blend of water and sky, surrounded by private cabanas and world-class service.',
    icon: Waves,
    image: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&q=80&w=1200',
    features: ['Temperature Controlled', 'Private Luxury Cabanas', 'Poolside Cocktail Lounge', 'Twilight Swim Events'],
  },
  {
    id: 'spa',
    name: 'Serenity Wellness Spa',
    subtitle: 'The Art of Relaxation',
    description: 'An oasis of calm offering bespoke treatments that combine ancient wisdom with modern science to restore your natural balance.',
    icon: Heart,
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=1200',
    features: ['Hydrotherapy Circuits', 'Organic Aromatherapy', 'Zen Meditation Garden', 'Signature Gold Facials'],
  },
  {
    id: 'business',
    name: 'Executive Boardrooms',
    subtitle: 'Success by Design',
    description: 'Sophisticated spaces designed for high-level decision making, featuring the latest integrated technology and bespoke catering.',
    icon: Briefcase,
    image: 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&q=80&w=1200',
    features: ['8K Video Conferencing', 'Secure Private Networks', 'Dedicated Event Concierge', 'Gourmet Business Dining'],
  },
]

export default function FacilitiesPage() {
  return (
    <div className="bg-transparent text-white">
      {/* Hero Section — Blur Glass */}
      <section className="relative h-[60vh] min-h-[500px] overflow-hidden">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/70" />
        
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
          <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-center space-x-3 text-primary uppercase tracking-[0.4em] text-xs font-bold">
              <div className="w-12 h-px bg-primary" />
              <span>World Class Amenities</span>
              <div className="w-12 h-px bg-primary" />
            </div>
            <h1 className="text-6xl md:text-8xl font-serif font-bold text-white leading-tight">
              Unrivaled <span className="text-primary italic">Facilities</span>
            </h1>
            <p className="text-xl text-white/60 font-light max-w-2xl mx-auto leading-relaxed">
              Every detail of our facilities is designed to exceed the expectations of the world's most discerning travelers.
            </p>
          </div>
        </div>
      </section>

      {/* Facilities Grid */}
      <section className="py-24 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="space-y-32">
            {facilities.map((facility, index) => {
              const Icon = facility.icon
              return (
                <div key={facility.id} className={`grid grid-cols-1 lg:grid-cols-2 gap-20 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                  <div className={`relative ${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                    <div className="relative aspect-[4/3] overflow-hidden shadow-2xl">
                      <Image 
                        src={facility.image} 
                        alt={facility.name} 
                        fill 
                        className="object-cover hover:scale-110 transition-transform duration-1000" 
                      />
                    </div>
                    <div className="absolute -bottom-10 -right-10 w-48 h-48 border-[15px] border-luxury/10 -z-10" />
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-luxury/10 flex items-center justify-center text-luxury">
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="text-luxury uppercase tracking-widest text-xs font-bold">{facility.subtitle}</span>
                      </div>
                      <h2 className="text-4xl lg:text-5xl font-serif font-bold text-white">{facility.name}</h2>
                    </div>

                    <p className="text-lg text-white/60 leading-relaxed font-light">
                      {facility.description}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {facility.features.map((feature, i) => (
                        <div key={i} className="flex items-center space-x-3">
                          <Star className="w-3 h-3 fill-primary text-primary" />
                          <span className="text-sm font-medium text-white/80">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Button variant="outline" className="border-white/20 text-white rounded-xl px-10 h-14 uppercase tracking-widest text-xs font-bold hover:bg-white/10 transition-all group">
                      <span>Explore {facility.name}</span>
                      <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Quick Services */}
      <section className="py-24 bg-black/25 backdrop-blur-sm border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: Wifi, title: 'Ultra-Fast WiFi', desc: 'Complimentary fiber-optic connection throughout the property.' },
              { icon: Car, title: 'Valet Service', desc: 'Secure executive valet parking with electric vehicle charging.' },
              { icon: UserCheck, title: 'Butler Service', desc: 'Bespoke 24/7 butler service for all suites and penthouses.' },
            ].map((service, i) => (
              <div key={i} className="text-center space-y-4">
                <div className="w-20 h-20 bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center mx-auto text-primary rounded-2xl">
                  <service.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-serif font-bold text-white">{service.title}</h3>
                <p className="text-white/50 text-sm font-light leading-relaxed px-8">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="relative py-24 bg-midnight overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Image src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1920" alt="Background" fill className="object-cover" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center space-y-10">
          <h2 className="text-4xl lg:text-6xl font-serif font-bold text-white leading-tight">
            Elevate Your <span className="text-luxury italic">Expectations</span>
          </h2>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link href="/booking">
              <Button className="bg-gold-gradient hover:opacity-90 text-white px-12 h-16 rounded-none text-xs uppercase tracking-[0.2em] font-bold border-none shadow-luxury w-full sm:w-auto">
                Begin Reservation
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="border-white text-white rounded-none px-12 h-16 uppercase tracking-[0.2em] text-xs font-bold hover:bg-white hover:text-midnight transition-all w-full sm:w-auto">
                Contact Concierge
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

