import Image from 'next/image'
import { Calendar, Users, Award, Heart, Shield, Leaf, ChevronRight, Star } from 'lucide-react'
import { getHotelAboutContent, getHotelContactInfo } from '@/lib/settings'
import { motion } from 'framer-motion'

import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Our Heritage & Philosophy | SmartHotel OS',
  description: 'Learn about the legacy of excellence, our sustainable luxury philosophy, milestones, and curators behind the world-class hospitality of SmartHotel.',
}

export const dynamic = 'force-dynamic'

export default async function AboutPage() {
  const [{ story, founded, milestones, staff }, contact] = await Promise.all([
    getHotelAboutContent(),
    getHotelContactInfo(),
  ])

  return (
    <div className="bg-transparent text-white min-h-screen">
      {/* Contextual Hero */}
      <section className="relative min-h-[500px] flex items-center justify-center overflow-hidden border-b border-white/5">
        <Image 
          src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1920" 
          alt={`${contact.name} Exterior`} 
          fill 
          className="object-cover absolute inset-0 -z-20 scale-105 transform opacity-60" 
          priority 
        />
        {/* Blend layers into the solid #0a0a0a body */}
        <div className="absolute inset-0 bg-black/60 -z-10" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0a0a0a] to-transparent -z-10" />
        
        <div className="relative z-10 container mx-auto px-4 flex flex-col items-center text-center pt-32 pb-16">
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
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center"
          >
            <div className="space-y-8">
              <div className="space-y-4">
                <h4 className="text-luxury uppercase tracking-[0.3em] text-xs font-bold">Established in {founded}</h4>
                <h2 className="text-5xl lg:text-6xl font-serif font-bold text-white leading-tight">
                  The <span className="text-luxury italic">{contact.name.split(' ')[0]}</span> Tradition
                </h2>
              </div>
              <p className="text-xl text-white/80 leading-relaxed font-light italic">
                "{story}"
              </p>
              <p className="text-lg text-white/60 leading-relaxed font-light">
                For over three decades, we have defined the pinnacle of hospitality. Our journey began with a simple vision: to create a sanctuary where luxury is not just a service, but a standard of living.
              </p>
              <div className="flex items-center gap-8 py-8 border-t border-white/10">
                <div>
                  <p className="text-3xl font-serif font-bold text-white">30+</p>
                  <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Years of Excellence</p>
                </div>
                <div className="w-px h-12 bg-white/10" />
                <div>
                  <p className="text-3xl font-serif font-bold text-white">500+</p>
                  <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold">World-Class Awards</p>
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
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-[#0a0a0a]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20 space-y-4">
            <h4 className="text-luxury uppercase tracking-[0.3em] text-xs font-bold">Our Philosophy</h4>
            <h2 className="text-4xl lg:text-5xl font-serif font-bold text-white">Guided by <span className="text-luxury italic">Values</span></h2>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-12"
          >
            {[
              { icon: Heart, title: 'Bespoke Excellence', desc: 'We anticipate every need and celebrate every detail of the guest experience.' },
              { icon: Shield, title: 'Unyielding Integrity', desc: 'Trust is our foundation, built through transparency and unwavering standards.' },
              { icon: Leaf, title: 'Sustainable Luxury', desc: 'We honor our environment by integrating eco-conscious practices into every stay.' },
            ].map((value, i) => (
              <div key={i} className="bg-white/5 border border-white/10 p-10 text-center space-y-6 shadow-luxury hover:-translate-y-2 transition-all duration-500 rounded-2xl">
                <div className="w-16 h-16 bg-luxury/10 flex items-center justify-center mx-auto text-luxury rounded-full">
                  <value.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-white">{value.title}</h3>
                <p className="text-white/60 font-light leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Milestones / Timeline */}
      <section className="py-24 lg:py-32">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto space-y-16"
          >
            <div className="text-center space-y-4">
              <h4 className="text-luxury uppercase tracking-[0.3em] text-xs font-bold">Our Journey</h4>
              <h2 className="text-4xl lg:text-5xl font-serif font-bold text-white">Notable <span className="text-luxury italic">Milestones</span></h2>
            </div>
            
            <div className="space-y-12 relative before:absolute before:left-[18px] before:top-2 before:bottom-2 before:w-px before:bg-white/10">
              {milestones.map((milestone, index) => {
                const [year, description] = milestone.split(' - ')
                return (
                  <div key={index} className="relative pl-16 group">
                    <div className="absolute left-0 top-1 w-9 h-9 bg-[#0a0a0a] border border-luxury/40 flex items-center justify-center group-hover:bg-luxury transition-colors">
                      <Star className="w-4 h-4 text-luxury group-hover:text-white" />
                    </div>
                    <div className="space-y-2">
                      <span className="text-luxury font-serif italic text-2xl">{year}</span>
                      <p className="text-lg text-white/70 font-light leading-relaxed">{description || milestone}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 lg:py-32 bg-transparent border-t border-white/5 text-white">
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

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-12"
          >
            {staff.map((member, i) => {
              const fullName = member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Team Member'
              return (
                <div key={member.id} className="group space-y-6">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-2xl grayscale group-hover:grayscale-0 transition-all duration-700">
                    <Image 
                      src={`https://images.unsplash.com/photo-${['1507003211169-0a1dd7228f2d', '1494790108377-be9c29b29330', '1500648767791-00dcc994a43e'][i % 3]}?auto=format&fit=crop&q=80&w=800`}
                      alt={fullName}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-80" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-luxury text-[10px] uppercase tracking-[0.2em] font-bold">{member.position}</p>
                    <h3 className="text-2xl font-serif font-bold tracking-wide">{fullName}</h3>
                  </div>
                </div>
              )
            })}
          </motion.div>
        </div>
      </section>
    </div>
  )
}