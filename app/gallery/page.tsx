"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Filter, X, Maximize2, MapPin, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimatePresence, motion } from 'framer-motion'

export default function GalleryPage() {
  const [selectedProperty, setSelectedProperty] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedImage, setSelectedImage] = useState<any>(null)
  const [images, setImages] = useState<any[]>(defaultFallbackImages)
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'rooms', name: 'Suites' },
    { id: 'lobby', name: 'Lobby' },
    { id: 'dining', name: 'Dining' },
    { id: 'wellness', name: 'Wellness' },
    { id: 'events', name: 'Events' },
    { id: 'exterior', name: 'Exterior' }
  ]

  useEffect(() => {
    fetchGalleryData()
  }, [])

  const fetchGalleryData = async () => {
    try {
      setLoading(true)
      const [galRes, propRes] = await Promise.all([
        fetch('/api/cms/gallery'),
        fetch('/api/cms/properties')
      ])

      if (propRes.ok) {
        const propData = await propRes.json()
        if (propData.properties && propData.properties.length > 0) {
          setProperties(propData.properties)
        }
      }

      if (galRes.ok) {
        const galData = await galRes.json()
        if (galData.items && galData.items.length > 0) {
          // Normalize items
          const normalized = galData.items.map((item: any) => ({
            id: item.id,
            title: item.title,
            description: item.caption || item.title,
            category: item.category.toLowerCase(),
            url: item.imageUrl,
            propertyId: item.propertyId,
            property: item.property,
          }))
          setImages(normalized)
        }
      }
    } catch (err) {
      console.warn('Using default gallery assets:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredImages = images.filter((img) => {
    const matchesProperty = selectedProperty === 'all' || img.propertyId === selectedProperty
    const matchesCategory = selectedCategory === 'all' || img.category.toLowerCase().includes(selectedCategory.toLowerCase())
    return matchesProperty && matchesCategory
  })

  return (
    <div className="bg-transparent text-white min-h-screen">
      {/* Contextual Hero */}
      <section className="relative min-h-[500px] flex items-center justify-center overflow-hidden border-b border-white/5">
        <Image 
          src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1920" 
          alt="Luxury Gallery" 
          fill 
          className="object-cover absolute inset-0 -z-20 scale-105 transform opacity-60" 
          priority 
        />
        {/* Blend layers into the solid #0a0a0a body */}
        <div className="absolute inset-0 bg-black/60 -z-10" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0a0a0a] to-transparent -z-10" />
        
        <div className="relative z-10 container mx-auto px-4 flex flex-col items-center text-center pt-32 pb-16">
          <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-center space-x-3 text-primary uppercase tracking-[0.4em] text-xs font-bold">
              <div className="w-12 h-px bg-primary" />
              <span>Visual Journey</span>
              <div className="w-12 h-px bg-primary" />
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-white leading-tight">
              The <span className="text-primary italic">Gallery</span>
            </h1>
            <p className="text-white/50 font-light text-lg max-w-xl mx-auto">
              A curated visual narrative of architectural splendor and luxury hospitality.
            </p>
          </div>
        </div>
      </section>

      {/* Property & Category Filters */}
      <section className="sticky top-20 z-40 bg-black/70 backdrop-blur-xl border-b border-white/5 py-6">
        <div className="container mx-auto px-4 space-y-4">
          {/* Property Selector */}
          {properties.length > 0 && (
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase tracking-widest text-primary font-bold mr-2 hidden sm:inline">
                Destination:
              </span>
              <button
                onClick={() => setSelectedProperty('all')}
                className={`px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] font-bold transition-all border rounded-lg ${
                  selectedProperty === 'all'
                    ? 'bg-primary/20 text-primary border-primary/40 shadow-luxury'
                    : 'border-white/10 text-white/40 hover:text-primary hover:border-primary/30'
                }`}
              >
                All Destinations
              </button>
              {properties.map((prop) => (
                <button
                  key={prop.id}
                  onClick={() => setSelectedProperty(prop.id)}
                  className={`px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] font-bold transition-all border rounded-lg flex items-center gap-1.5 ${
                    selectedProperty === prop.id
                      ? 'bg-primary/20 text-primary border-primary/40 shadow-luxury'
                      : 'border-white/10 text-white/40 hover:text-primary hover:border-primary/30'
                  }`}
                >
                  <MapPin className="w-3 h-3 text-primary" />
                  <span>{prop.city}</span>
                </button>
              ))}
            </div>
          )}

          {/* Category Filter Pills */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-2 text-[10px] uppercase tracking-[0.2em] font-bold transition-all border rounded-lg ${
                  selectedCategory === category.id 
                    ? 'bg-primary/20 text-primary border-primary/40 shadow-luxury' 
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
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-white/50">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
              <p className="text-xs uppercase tracking-widest">Loading visual archive...</p>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 max-w-lg mx-auto p-8 space-y-4">
              <p className="text-white/60 text-lg font-serif">No images found for this filter.</p>
              <Button
                onClick={() => {
                  setSelectedProperty('all')
                  setSelectedCategory('all')
                }}
                className="bg-primary text-black font-bold text-xs uppercase tracking-wider rounded-xl"
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              <AnimatePresence mode="popLayout">
                {filteredImages.map((image) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                    key={image.id}
                    className="group relative aspect-square overflow-hidden bg-black/40 rounded-2xl border border-white/10 hover:border-primary/40 transition-all duration-500 cursor-pointer shadow-luxury"
                    onClick={() => setSelectedImage(image)}
                  >
                    <Image
                      src={image.url}
                      alt={image.title}
                      fill
                      className="object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-center items-center text-center p-8 backdrop-blur-sm">
                      <div className="space-y-3 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        <div className="w-10 h-10 bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center mx-auto text-primary mb-2 shadow-luxury">
                          <Maximize2 className="w-4 h-4" />
                        </div>
                        <p className="text-primary text-[10px] uppercase tracking-[0.3em] font-bold">{image.category}</p>
                        <h3 className="text-white text-2xl font-serif font-bold">{image.title}</h3>
                        {image.description && (
                          <p className="text-white/60 text-xs font-light italic max-w-xs">{image.description}</p>
                        )}
                        {image.property && (
                          <span className="inline-block text-[10px] uppercase tracking-wider text-primary font-bold bg-black/60 px-2.5 py-1 rounded-md border border-primary/20">
                            {image.property.city}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#0a0a0a]/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-16"
            onClick={() => setSelectedImage(null)}
          >
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors z-[110] bg-white/10 hover:bg-white/20 p-2.5 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div 
              className="relative w-full max-w-5xl max-h-[85vh] flex flex-col md:flex-row gap-8 items-center bg-[#121118] border border-white/10 rounded-3xl overflow-hidden p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-video md:aspect-[4/3] flex-1 w-full rounded-2xl overflow-hidden bg-black">
                <Image 
                  src={selectedImage.url} 
                  alt={selectedImage.title} 
                  fill 
                  className="object-cover" 
                />
              </div>

              <div className="space-y-6 md:w-80 shrink-0">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-widest text-primary font-bold bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded">
                      {selectedImage.category}
                    </span>
                    {selectedImage.property && (
                      <span className="text-[10px] text-white/50 uppercase tracking-wider">
                        {selectedImage.property.city}
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-white leading-tight">
                    {selectedImage.title}
                  </h3>
                </div>

                <p className="text-sm text-white/60 font-light leading-relaxed">
                  {selectedImage.description || 'An exclusive capture embodying refined architectural elegance.'}
                </p>

                <Button 
                  onClick={() => setSelectedImage(null)}
                  className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs uppercase tracking-wider font-bold"
                >
                  Close Archive
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const defaultFallbackImages = [
  {
    id: 'f1',
    title: 'The Royal Suite',
    description: 'Panoramic views of the city skyline from our premier suite.',
    category: 'rooms',
    url: 'https://images.unsplash.com/photo-1590490359683-658d3d23f972?auto=format&fit=crop&q=80&w=1200',
  },
  {
    id: 'f2',
    title: 'Grand Palace Lobby',
    description: 'The sweeping marble architecture of our main lobby.',
    category: 'lobby',
    url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1200',
  },
  {
    id: 'f3',
    title: 'The Gilded Plate',
    description: 'Intimate fine dining in a Michelin-starred setting.',
    category: 'dining',
    url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=1200',
  },
  {
    id: 'f4',
    title: 'Celestial Rooftop Pool',
    description: 'Infinity edges that blend with the horizon.',
    category: 'wellness',
    url: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&q=80&w=1200',
  },
  {
    id: 'f5',
    title: 'Midnight Ballroom',
    description: 'Setting the stage for unforgettable gala events.',
    category: 'events',
    url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=1200',
  },
  {
    id: 'f6',
    title: 'Serenity Spa Pavilion',
    description: 'An oasis of calm designed for total rejuvenation.',
    category: 'wellness',
    url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=1200',
  }
]