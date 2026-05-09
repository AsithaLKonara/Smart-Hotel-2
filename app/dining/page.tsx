import Image from 'next/image'
import Link from 'next/link'
import { 
  Utensils, 
  Wine, 
  Coffee, 
  Star,
  ChevronRight,
  Clock,
  MapPin,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

const venues = [
  {
    id: 'signature',
    name: 'The Gilded Plate',
    subtitle: 'Signature Fine Dining',
    description: 'An award-winning gastronomic destination where classical techniques meet avant-garde presentation. Our Michelin-starred chefs curate a seasonal menu that celebrates the world\'s finest ingredients.',
    hours: '18:00 - 23:00',
    location: '42nd Floor',
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=1200',
    tags: ['Michelin Star', 'Fine Dining', 'Wine Pairing'],
  },
  {
    id: 'lounge',
    name: 'Celestial Lounge',
    subtitle: 'Rooftop Mixology',
    description: 'Sip on handcrafted cocktails while suspended above the city lights. The Celestial Lounge offers an intimate atmosphere with panoramic views and live jazz.',
    hours: '17:00 - 02:00',
    location: 'Rooftop',
    image: 'https://images.unsplash.com/photo-1574096079513-d8259312b785?auto=format&fit=crop&q=80&w=1200',
    tags: ['Cocktails', 'Live Music', 'City Views'],
  },
  {
    id: 'brasserie',
    name: 'Le Jardin Brasserie',
    subtitle: 'All-Day Artisan Dining',
    description: 'A vibrant, light-filled space offering a sophisticated take on classic brasserie fare. From organic breakfast spreads to leisurely afternoon teas.',
    hours: '06:30 - 22:00',
    location: 'Lobby Level',
    image: 'https://images.unsplash.com/photo-1550966841-396ad886756b?auto=format&fit=crop&q=80&w=1200',
    tags: ['Breakfast', 'Afternoon Tea', 'Casual Elegant'],
  },
]

export default function DiningPage() {
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
              <span>Epicurean Journeys</span>
              <div className="w-12 h-px bg-primary" />
            </div>
            <h1 className="text-6xl md:text-8xl font-serif font-bold text-white leading-tight">
              Culinary <span className="text-primary italic">Excellence</span>
            </h1>
            <p className="text-xl text-white/60 font-light max-w-2xl mx-auto leading-relaxed">
              Discover a world of flavors across our award-winning restaurants and lounges, where every meal is a masterpiece.
            </p>
          </div>
        </div>
      </section>

      {/* Venues List */}
      <section className="py-24 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="space-y-32">
            {venues.map((venue, index) => (
              <div key={venue.id} className={`grid grid-cols-1 lg:grid-cols-2 gap-20 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                <div className={`relative ${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                  <div className="relative aspect-[4/3] overflow-hidden shadow-2xl">
                    <Image 
                      src={venue.image} 
                      alt={venue.name} 
                      fill 
                      className="object-cover hover:scale-110 transition-transform duration-1000" 
                    />
                  </div>
                  <div className="absolute -bottom-10 -right-10 w-48 h-48 border-[15px] border-luxury/10 -z-10" />
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 text-luxury uppercase tracking-widest text-xs font-bold">
                      <span>{venue.subtitle}</span>
                    </div>
                    <h2 className="text-4xl lg:text-5xl font-serif font-bold text-midnight">{venue.name}</h2>
                  </div>

                  <p className="text-lg text-white/60 leading-relaxed font-light">
                    {venue.description}
                  </p>

                  <div className="flex flex-wrap gap-3">
                    {venue.tags.map((tag, i) => (
                      <span key={i} className="px-4 py-1 border border-luxury/20 text-luxury text-[10px] uppercase tracking-widest font-bold">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-8 py-6 border-y border-white/10">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Hours</p>
                        <p className="text-sm font-medium text-white">{venue.hours}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Location</p>
                        <p className="text-sm font-medium text-white">{venue.location}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <Button className="bg-gold-gradient text-white rounded-xl px-10 h-14 uppercase tracking-widest text-xs font-bold border-none shadow-luxury">
                      Book a Table
                    </Button>
                    <Button variant="outline" className="border-white/20 text-white rounded-xl px-10 h-14 uppercase tracking-widest text-xs font-bold hover:bg-white/10 transition-all">
                      View Menu
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Signature Elements */}
      <section className="py-24 bg-black/30 backdrop-blur-md border-t border-white/5 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: Wine, title: 'Rare Vintages', desc: 'Our sommelier-curated cellar features over 1,500 rare and exclusive labels.' },
              { icon: Utensils, title: 'Private Dining', desc: 'Intimate bespoke spaces for celebrations and high-level corporate hosting.' },
              { icon: Coffee, title: 'Artisan Roastery', desc: 'Small-batch roasted coffee beans and hand-picked ceremonial teas.' },
            ].map((item, i) => (
              <div key={i} className="text-center space-y-4">
                <div className="w-20 h-20 bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-luxury">
                  <item.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-serif font-bold">{item.title}</h3>
                <p className="text-white/40 text-sm font-light leading-relaxed px-8">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Room Service CTA */}
      <section className="py-24 lg:py-32 bg-black/25 backdrop-blur-sm border-t border-white/5">
        <div className="container mx-auto px-4 text-center space-y-10">
          <div className="space-y-4">
            <h4 className="text-primary uppercase tracking-[0.3em] text-xs font-bold">In-Room Dining</h4>
            <h2 className="text-4xl lg:text-6xl font-serif font-bold text-white">Gourmet at Your <span className="text-primary italic">Doorstep</span></h2>
          </div>
          <p className="text-lg text-white/50 max-w-2xl mx-auto font-light leading-relaxed">
            Experience the same culinary excellence from the comfort of your suite, available 24 hours a day.
          </p>
          <Link href="/order">
            <Button className="bg-gold-gradient hover:opacity-90 text-white px-12 h-16 rounded-none text-xs uppercase tracking-[0.2em] font-bold border-none shadow-luxury">
              Order In-Room Dining
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
