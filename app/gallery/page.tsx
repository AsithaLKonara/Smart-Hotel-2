"use client"

import { useState } from 'react'
import Image from 'next/image'
import { Filter, X, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimatePresence, motion } from 'framer-motion'

export default function GalleryPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedImage, setSelectedImage] = useState<any>(null)

  const filteredImages = selectedCategory === 'all' 
    ? galleryImages 
    : galleryImages.filter(img => img.category === selectedCategory)

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'rooms', name: 'Suites' },
    { id: 'lobby', name: 'Lobby' },
    { id: 'dining', name: 'Dining' },
    { id: 'wellness', name: 'Wellness' },
    { id: 'events', name: 'Events' }
  ]

  return (
    <div className="bg-transparent text-white min-h-screen pt-24">
      {/* Hero Section — Blur Glass */}
      <section className="relative h-[40vh] min-h-[300px] overflow-hidden">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/70" />
        
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
          <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-center space-x-3 text-primary uppercase tracking-[0.4em] text-xs font-bold">
              <div className="w-12 h-px bg-primary" />
              <span>Visual Journey</span>
              <div className="w-12 h-px bg-primary" />
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-white leading-tight">
              The <span className="text-primary italic">Gallery</span>
            </h1>
            <p className="text-white/50 font-light text-lg max-w-xl mx-auto">A curated visual narrative of unparalleled luxury and timeless elegance.</p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-20 z-40 bg-black/50 backdrop-blur-xl border-b border-white/5 py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-8 py-2 text-[10px] uppercase tracking-[0.2em] font-bold transition-all border rounded-lg ${
                  selectedCategory === category.id 
                  ? 'bg-primary/20 text-primary border-primary/30' 
                  : 'border-white/10 text-white/40 hover:text-primary hover:border-primary/30'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            <AnimatePresence mode='popLayout'>
              {filteredImages.map((image) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5 }}
                  key={image.id}
                  className="group relative aspect-square overflow-hidden bg-gray-100 cursor-pointer"
                  onClick={() => setSelectedImage(image)}
                >
                  <Image
                    src={image.url}
                    alt={image.title}
                    fill
                    className="object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-midnight/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-center items-center text-center p-8">
                    <div className="space-y-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <div className="w-10 h-10 bg-luxury/20 flex items-center justify-center mx-auto text-luxury mb-4">
                        <Maximize2 className="w-5 h-5" />
                      </div>
                      <p className="text-luxury text-[10px] uppercase tracking-[0.3em] font-bold">{image.category}</p>
                      <h3 className="text-white text-2xl font-serif font-bold">{image.title}</h3>
                      <p className="text-white/60 text-sm font-light italic">{image.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-midnight flex items-center justify-center p-4 md:p-20"
          >
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute top-10 right-10 text-white/50 hover:text-white transition-colors z-[110]"
            >
              <X className="w-10 h-10" />
            </button>
            
            <div className="relative w-full h-full flex flex-col md:flex-row gap-12 items-center">
              <div className="relative flex-1 w-full h-full">
                <Image
                  src={selectedImage.url}
                  alt={selectedImage.title}
                  fill
                  className="object-contain"
                />
              </div>
              <div className="w-full md:w-96 text-left space-y-6">
                <p className="text-luxury text-xs uppercase tracking-[0.4em] font-bold">{selectedImage.category}</p>
                <h2 className="text-4xl md:text-6xl font-serif font-bold text-white leading-tight">{selectedImage.title}</h2>
                <p className="text-white/60 text-lg font-light leading-relaxed">{selectedImage.description}</p>
                <div className="w-20 h-px bg-luxury" />
                <Button 
                  onClick={() => setSelectedImage(null)}
                  variant="outline" 
                  className="border-white/20 text-white rounded-none px-10 h-14 uppercase tracking-widest text-[10px] font-bold hover:bg-white hover:text-midnight transition-all"
                >
                  Close Gallery
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const galleryImages = [
  {
    id: 1,
    title: "The Royal Suite",
    description: "Panoramic views of the city skyline from our premier suite.",
    category: "rooms",
    url: "https://images.unsplash.com/photo-1590490359683-658d3d23f972?auto=format&fit=crop&q=80&w=1200",
  },
  {
    id: 2,
    title: "Grand Entrance",
    description: "The sweeping architecture of our main lobby.",
    category: "lobby",
    url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1200",
  },
  {
    id: 3,
    title: "The Gilded Plate",
    description: "Intimate fine dining in a Michelin-starred setting.",
    category: "dining",
    url: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=1200",
  },
  {
    id: 4,
    title: "Celestial Pool",
    description: "Infinity edges that blend with the horizon.",
    category: "wellness",
    url: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&q=80&w=1200",
  },
  {
    id: 5,
    title: "Midnight Ballroom",
    description: "Setting the stage for unforgettable gala events.",
    category: "events",
    url: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=1200",
  },
  {
    id: 6,
    title: "Serenity Spa",
    description: "An oasis of calm designed for total rejuvenation.",
    category: "wellness",
    url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=1200",
  },
  {
    id: 7,
    title: "Executive Penthouse",
    description: "Modern luxury with bespoke artisanal finishes.",
    category: "rooms",
    url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=1200",
  },
  {
    id: 8,
    url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1200",
    title: "Morning Sun Lobby",
    description: "Natural light illuminating our grand marble staircase.",
    category: "lobby"
  },
  {
    id: 9,
    url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200",
    title: "Chef's Table",
    description: "An exclusive culinary experience for the discerning palate.",
    category: "dining"
  }
]
 