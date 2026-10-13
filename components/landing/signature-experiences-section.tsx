"use client"

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Clock, ArrowRight, Star, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface ExperienceItem {
  id: string
  title: string
  subtitle?: string | null
  description: string
  imageUrl: string
  icon?: string | null
  category: string
  duration?: string | null
  price?: number | null
  property?: {
    name: string
    city: string
  } | null
}

interface SignatureExperiencesSectionProps {
  experiences: ExperienceItem[]
}

export function SignatureExperiencesSection({ experiences }: SignatureExperiencesSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')

  if (!experiences || experiences.length === 0) {
    return null
  }

  const categories = ['ALL', ...Array.from(new Set(experiences.map((e) => e.category.toUpperCase())))]

  const filtered = selectedCategory === 'ALL'
    ? experiences
    : experiences.filter((e) => e.category.toUpperCase() === selectedCategory)

  return (
    <section className="py-24 lg:py-32 bg-black/10 backdrop-blur-sm border-y border-white/5 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-primary uppercase tracking-[0.3em] text-xs font-bold">
              <div className="w-8 h-px bg-primary" />
              <span>Stay Beyond Ordinary</span>
              <div className="w-8 h-px bg-primary" />
            </div>
            <h2 className="text-4xl md:text-6xl font-serif font-bold text-white leading-tight">
              Signature <span className="text-primary italic">Experiences</span>
            </h2>
            <p className="text-white/60 text-sm max-w-xl font-light">
              Immerse yourself in bespoke culinary tastings, restorative wellness journeys, and coastal expeditions curated exclusively for our guests.
            </p>
          </div>

          {/* Category Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${
                  selectedCategory === cat
                    ? 'bg-primary/20 text-primary border-primary/40 shadow-luxury'
                    : 'bg-white/5 text-white/50 border-white/5 hover:text-white hover:border-white/20'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Experience Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((exp, idx) => (
              <motion.div
                key={exp.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="group relative bg-[#121118] border border-white/10 hover:border-primary/40 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between transition-all duration-500 hover:-translate-y-1 hover:shadow-luxury"
              >
                <div>
                  <div className="relative aspect-[4/3] overflow-hidden bg-black/40">
                    <Image
                      src={exp.imageUrl}
                      alt={exp.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121118] via-transparent to-black/30" />
                    
                    {/* Floating Icon and Category */}
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <span className="w-9 h-9 rounded-xl bg-black/70 border border-primary/30 flex items-center justify-center text-lg shadow-luxury backdrop-blur-md">
                        {exp.icon || '✨'}
                      </span>
                      <span className="bg-black/70 text-primary text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border border-primary/20 backdrop-blur-md">
                        {exp.category}
                      </span>
                    </div>

                    {exp.price && (
                      <div className="absolute top-4 right-4 bg-black/80 border border-primary/30 px-3 py-1 rounded-xl text-primary font-serif italic text-sm backdrop-blur-md">
                        ${exp.price}
                      </div>
                    )}
                  </div>

                  <div className="p-6 space-y-3">
                    {exp.subtitle && (
                      <span className="text-[10px] uppercase tracking-widest text-primary font-bold block">
                        {exp.subtitle}
                      </span>
                    )}

                    <h3 className="text-xl font-serif font-bold text-white group-hover:text-primary transition-colors leading-snug">
                      {exp.title}
                    </h3>

                    <p className="text-xs text-white/60 font-light line-clamp-3 leading-relaxed">
                      {exp.description}
                    </p>

                    {exp.duration && (
                      <div className="flex items-center gap-2 text-xs text-white/50 pt-2">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span>{exp.duration}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <Link href={`/booking?experience=${encodeURIComponent(exp.title)}`}>
                    <Button
                      variant="outline"
                      className="w-full border-white/10 hover:border-primary/40 group-hover:bg-primary/20 group-hover:text-primary text-white h-11 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                    >
                      <span>Inquire & Reserve</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
