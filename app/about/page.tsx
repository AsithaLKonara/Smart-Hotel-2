import Image from 'next/image'
import { Calendar, Users, Award, Heart, Shield, Leaf, ChevronRight, Star } from 'lucide-react'
import { getHotelAboutContent, getHotelContactInfo } from '@/lib/settings'

export const dynamic = 'force-dynamic'

export default async function AboutPage() {
  const [{ story, founded, milestones, staff }, contact] = await Promise.all([
    getHotelAboutContent(),
    getHotelContactInfo(),
  ])

  return (
    <div className="bg-white text-midnight min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[500px] overflow-hidden bg-midnight">
        <div className="absolute inset-0">
          <Image 
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1920" 
            alt={`${contact.name} Exterior`} 
            fill 
            className="object-cover opacity-40 scale-105" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-midnight/20 via-midnight/60 to-midnight" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
          <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-center space-x-3 text-luxury uppercase tracking-[0.4em] text-xs font-bold">
              <div className="w-12 h-px bg-luxury" />
              <span>A Legacy of Excellence</span>
              <div className="w-12 h-px bg-luxury" />
            </div>
            <h1 className="text-6xl md:text-8xl font-serif font-bold text-white leading-tight">
              Our <span className="text-luxury italic">Heritage</span>
            </h1>
          </div>
        </div>
      </section>

      {/* Legacy Section */}
      <section className="py-24 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h4 className="text-luxury uppercase tracking-[0.3em] text-xs font-bold">Established in {founded}</h4>
                <h2 className="text-5xl lg:text-6xl font-serif font-bold text-midnight leading-tight">
                  The <span className="text-luxury italic">{contact.name.split(' ')[0]}</span> Tradition
                </h2>
              </div>
              <p className="text-xl text-gray-600 leading-relaxed font-light italic">
                "{story}"
              </p>
              <p className="text-lg text-gray-500 leading-relaxed font-light">
                For over three decades, we have defined the pinnacle of hospitality. Our journey began with a simple vision: to create a sanctuary where luxury is not just a service, but a standard of living.
              </p>
              <div className="flex items-center gap-8 py-8 border-t border-gray-100">
                <div>
                  <p className="text-3xl font-serif font-bold text-midnight">30+</p>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Years of Excellence</p>
                </div>
                <div className="w-px h-12 bg-gray-100" />
                <div>
                  <p className="text-3xl font-serif font-bold text-midnight">500+</p>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">World-Class Awards</p>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="relative aspect-square overflow-hidden shadow-2xl">
                <Image 
                  src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1200" 
                  alt="Hotel Lobby" 
                  fill 
                  className="object-cover" 
                />
              </div>
              <div className="absolute -bottom-10 -right-10 w-48 h-48 border-[15px] border-luxury/10 -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20 space-y-4">
            <h4 className="text-luxury uppercase tracking-[0.3em] text-xs font-bold">Our Philosophy</h4>
            <h2 className="text-4xl lg:text-5xl font-serif font-bold text-midnight">Guided by <span className="text-luxury italic">Values</span></h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: Heart, title: 'Bespoke Excellence', desc: 'We anticipate every need and celebrate every detail of the guest experience.' },
              { icon: Shield, title: 'Unyielding Integrity', desc: 'Trust is our foundation, built through transparency and unwavering standards.' },
              { icon: Leaf, title: 'Sustainable Luxury', desc: 'We honor our environment by integrating eco-conscious practices into every stay.' },
            ].map((value, i) => (
              <div key={i} className="bg-white p-10 text-center space-y-6 shadow-xl hover:-translate-y-2 transition-all duration-500">
                <div className="w-16 h-16 bg-luxury/5 flex items-center justify-center mx-auto text-luxury">
                  <value.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-midnight">{value.title}</h3>
                <p className="text-gray-500 font-light leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Milestones / Timeline */}
      <section className="py-24 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <h4 className="text-luxury uppercase tracking-[0.3em] text-xs font-bold">Our Journey</h4>
              <h2 className="text-4xl lg:text-5xl font-serif font-bold text-midnight">Notable <span className="text-luxury italic">Milestones</span></h2>
            </div>
            
            <div className="space-y-12 relative before:absolute before:left-[18px] before:top-2 before:bottom-2 before:w-px before:bg-gray-100">
              {milestones.map((milestone, index) => {
                const [year, description] = milestone.split(' - ')
                return (
                  <div key={index} className="relative pl-16 group">
                    <div className="absolute left-0 top-1 w-9 h-9 bg-white border border-luxury/20 flex items-center justify-center group-hover:bg-luxury group-hover:border-luxury transition-colors">
                      <Star className="w-4 h-4 text-luxury group-hover:text-white" />
                    </div>
                    <div className="space-y-2">
                      <span className="text-luxury font-serif italic text-2xl">{year}</span>
                      <p className="text-lg text-gray-600 font-light leading-relaxed">{description || milestone}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 lg:py-32 bg-midnight text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="space-y-4">
              <h4 className="text-luxury uppercase tracking-[0.3em] text-xs font-bold">The Artisans</h4>
              <h2 className="text-4xl lg:text-6xl font-serif font-bold leading-tight">Our <span className="text-luxury italic">Curators</span></h2>
            </div>
            <p className="max-w-md text-white/50 font-light leading-relaxed">
              Meet the visionary team behind the world-class service and unparalleled experiences at {contact.name}.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {staff.map((member, i) => (
              <div key={member.id} className="group space-y-6">
                <div className="relative aspect-[3/4] overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700">
                  <Image 
                    src={`https://images.unsplash.com/photo-${['1507003211169-0a1dd7228f2d', '1494790108377-be9c29b29330', '1500648767791-00dcc994a43e'][i % 3]}?auto=format&fit=crop&q=80&w=800`}
                    alt={member.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-midnight via-transparent to-transparent opacity-60" />
                </div>
                <div className="space-y-1">
                  <p className="text-luxury text-[10px] uppercase tracking-[0.2em] font-bold">{member.position}</p>
                  <h3 className="text-2xl font-serif font-bold tracking-wide">{member.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}