import prisma from '@/lib/db'

export interface PropertyCmsUpdateInput {
  name?: string
  description?: string | null
  mainImage?: string | null
  address?: string
  city?: string
  country?: string
  phone?: string | null
  email?: string | null
  latitude?: number | null
  longitude?: number | null
  googleMapsUrl?: string | null
  status?: string
}

export interface GalleryInput {
  title: string
  imageUrl: string
  category: string
  caption?: string | null
  order?: number
  featured?: boolean
  propertyId: string
}

export interface ExperienceInput {
  title: string
  subtitle?: string | null
  description: string
  imageUrl: string
  icon?: string | null
  category?: string
  duration?: string | null
  price?: number | null
  order?: number
  active?: boolean
  propertyId: string
}

export interface FacilityInput {
  name: string
  type: string
  subtitle?: string | null
  description?: string | null
  imageUrl?: string | null
  features?: string | null
  operatingHours?: string
  status?: string
  featured?: boolean
  order?: number
  propertyId: string
}

export class CmsService {
  /**
   * Fetch all properties with CMS metadata, coordinates, and counts
   */
  static async getProperties(options: { activeOnly?: boolean } = {}) {
    const { activeOnly = true } = options
    const where: any = {}
    if (activeOnly) {
      where.status = 'ACTIVE'
    }

    const properties = await prisma.property.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: {
            galleries: true,
            experiences: true,
            resortFacilities: true,
            rooms: true
          }
        }
      }
    })

    return properties
  }

  /**
   * Fetch property by ID with all CMS relations
   */
  static async getPropertyById(id: string) {
    return prisma.property.findUnique({
      where: { id },
      include: {
        galleries: { orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] },
        experiences: { orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] },
        resortFacilities: { orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] }
      }
    })
  }

  /**
   * Update property CMS details including coordinates and photo
   */
  static async updatePropertyCms(id: string, data: PropertyCmsUpdateInput) {
    return prisma.property.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.mainImage !== undefined && { mainImage: data.mainImage }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.country !== undefined && { country: data.country }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.latitude !== undefined && { latitude: data.latitude }),
        ...(data.longitude !== undefined && { longitude: data.longitude }),
        ...(data.googleMapsUrl !== undefined && { googleMapsUrl: data.googleMapsUrl }),
        ...(data.status !== undefined && { status: data.status }),
      }
    })
  }

  // ==========================================
  // GALLERY MANAGEMENT
  // ==========================================

  static async getGalleries(options: {
    propertyId?: string
    category?: string
    featured?: boolean
    limit?: number
  } = {}) {
    const { propertyId, category, featured, limit } = options
    const where: any = {}

    if (propertyId && propertyId !== 'all') {
      where.propertyId = propertyId
    }
    if (category && category !== 'all') {
      where.category = { equals: category, mode: 'insensitive' }
    }
    if (featured !== undefined) {
      where.featured = featured
    }

    return prisma.gallery.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      take: limit,
      include: {
        property: {
          select: { id: true, name: true, city: true, code: true }
        }
      }
    })
  }

  static async createGallery(data: GalleryInput) {
    return prisma.gallery.create({
      data: {
        title: data.title,
        imageUrl: data.imageUrl,
        category: data.category,
        caption: data.caption,
        order: data.order ?? 0,
        featured: data.featured ?? false,
        propertyId: data.propertyId,
      },
      include: {
        property: {
          select: { id: true, name: true, city: true, code: true }
        }
      }
    })
  }

  static async updateGallery(id: string, data: Partial<GalleryInput>) {
    return prisma.gallery.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.caption !== undefined && { caption: data.caption }),
        ...(data.order !== undefined && { order: data.order }),
        ...(data.featured !== undefined && { featured: data.featured }),
        ...(data.propertyId !== undefined && { propertyId: data.propertyId }),
      },
      include: {
        property: {
          select: { id: true, name: true, city: true, code: true }
        }
      }
    })
  }

  static async deleteGallery(id: string) {
    return prisma.gallery.delete({
      where: { id }
    })
  }

  // ==========================================
  // SIGNATURE EXPERIENCES
  // ==========================================

  static async getExperiences(options: {
    propertyId?: string
    category?: string
    activeOnly?: boolean
    limit?: number
  } = {}) {
    const { propertyId, category, activeOnly = true, limit } = options
    const where: any = {}

    if (propertyId && propertyId !== 'all') {
      where.propertyId = propertyId
    }
    if (category && category !== 'all') {
      where.category = { equals: category, mode: 'insensitive' }
    }
    if (activeOnly) {
      where.active = true
    }

    const experiences = await prisma.experience.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      take: limit,
      include: {
        property: {
          select: { id: true, name: true, city: true, code: true }
        }
      }
    })

    return experiences
  }

  static async createExperience(data: ExperienceInput) {
    return prisma.experience.create({
      data: {
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        imageUrl: data.imageUrl,
        icon: data.icon ?? '✨',
        category: data.category ?? 'LUXURY',
        duration: data.duration,
        price: data.price,
        order: data.order ?? 0,
        active: data.active ?? true,
        propertyId: data.propertyId,
      },
      include: {
        property: {
          select: { id: true, name: true, city: true, code: true }
        }
      }
    })
  }

  static async updateExperience(id: string, data: Partial<ExperienceInput>) {
    return prisma.experience.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.subtitle !== undefined && { subtitle: data.subtitle }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.duration !== undefined && { duration: data.duration }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.order !== undefined && { order: data.order }),
        ...(data.active !== undefined && { active: data.active }),
        ...(data.propertyId !== undefined && { propertyId: data.propertyId }),
      },
      include: {
        property: {
          select: { id: true, name: true, city: true, code: true }
        }
      }
    })
  }

  static async deleteExperience(id: string) {
    return prisma.experience.delete({
      where: { id }
    })
  }

  // ==========================================
  // RESORT FACILITIES
  // ==========================================

  static async getFacilities(options: {
    propertyId?: string
    type?: string
    status?: string
    featuredOnly?: boolean
  } = {}) {
    const { propertyId, type, status, featuredOnly } = options
    const where: any = {}

    if (propertyId && propertyId !== 'all') {
      where.propertyId = propertyId
    }
    if (type && type !== 'all') {
      where.type = { equals: type, mode: 'insensitive' }
    }
    if (status) {
      where.status = status
    }
    if (featuredOnly) {
      where.featured = true
    }

    return prisma.resortFacility.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      include: {
        property: {
          select: { id: true, name: true, city: true, code: true }
        }
      }
    })
  }

  static async createFacility(data: FacilityInput) {
    return prisma.resortFacility.create({
      data: {
        name: data.name,
        type: data.type,
        subtitle: data.subtitle,
        description: data.description,
        imageUrl: data.imageUrl,
        features: data.features,
        operatingHours: data.operatingHours ?? '09:00-18:00',
        status: data.status ?? 'ACTIVE',
        featured: data.featured ?? false,
        order: data.order ?? 0,
        propertyId: data.propertyId,
      },
      include: {
        property: {
          select: { id: true, name: true, city: true, code: true }
        }
      }
    })
  }

  static async updateFacility(id: string, data: Partial<FacilityInput>) {
    return prisma.resortFacility.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.subtitle !== undefined && { subtitle: data.subtitle }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.features !== undefined && { features: data.features }),
        ...(data.operatingHours !== undefined && { operatingHours: data.operatingHours }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.featured !== undefined && { featured: data.featured }),
        ...(data.order !== undefined && { order: data.order }),
        ...(data.propertyId !== undefined && { propertyId: data.propertyId }),
      },
      include: {
        property: {
          select: { id: true, name: true, city: true, code: true }
        }
      }
    })
  }

  static async deleteFacility(id: string) {
    return prisma.resortFacility.delete({
      where: { id }
    })
  }

  // ==========================================
  // HYDRATION SEEDING (Ensures zero blank UI)
  // ==========================================

  static async ensureDefaultCmsContent() {
    const properties = await prisma.property.findMany({ where: { status: 'ACTIVE' } })
    if (properties.length === 0) return

    const primaryProperty = properties[0]

    // 1. Seed Property coordinates if missing or default
    for (const prop of properties) {
      let lat = prop.latitude
      let lng = prop.longitude
      const cityLower = prop.city.toLowerCase()
      
      if (!lat || !lng || (lat === 40.7589 && !cityLower.includes('new york'))) {
        if (cityLower.includes('miami')) {
          lat = 25.7617
          lng = -80.1918
        } else if (cityLower.includes('aspen')) {
          lat = 39.1911
          lng = -106.8175
        } else if (cityLower.includes('kandy')) {
          lat = 7.2906
          lng = 80.6337
        } else if (cityLower.includes('colombo')) {
          lat = 6.9271
          lng = 79.8612
        } else if (cityLower.includes('galle')) {
          lat = 6.0535
          lng = 80.2210
        } else {
          lat = 40.7589
          lng = -73.9851
        }

        await prisma.property.update({
          where: { id: prop.id },
          data: {
            latitude: lat,
            longitude: lng,
            googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
            mainImage: prop.mainImage || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1200',
            description: prop.description || `Experience royal sophistication at ${prop.name}, situated in the heart of ${prop.city}.`
          }
        })
      }
    }

    // 2. Seed Experiences if table is empty
    const experienceCount = await prisma.experience.count()
    if (experienceCount === 0) {
      const defaultExperiences = [
        {
          title: 'Michelin Culinary Journey',
          subtitle: 'Chef de Cuisine Table',
          description: 'A 7-course bespoke degustation menu paired with rare vintage cellared wines in an intimate private rotunda.',
          imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=1200',
          icon: '🍷',
          category: 'DINING',
          duration: '3.5 Hours',
          price: 280,
          order: 1,
          propertyId: primaryProperty.id,
        },
        {
          title: 'Royal Ayurvedic Wellness',
          subtitle: 'Holistic Body Ritual',
          description: 'Ancient healing therapies infused with 24k gold herbal oils, steam aromatics, and guided sound-bath meditation.',
          imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=1200',
          icon: '✨',
          category: 'WELLNESS',
          duration: '120 Mins',
          price: 220,
          order: 2,
          propertyId: primaryProperty.id,
        },
        {
          title: 'Twilight Skyline Cabana',
          subtitle: 'Rooftop Observatory',
          description: 'Exclusive private rooftop lounge access with hand-crafted cocktails, artisan oysters, and 360-degree city views.',
          imageUrl: 'https://images.unsplash.com/photo-1574096079513-d8259312b785?auto=format&fit=crop&q=80&w=1200',
          icon: '🌃',
          category: 'LUXURY',
          duration: 'Flexible',
          price: 150,
          order: 3,
          propertyId: primaryProperty.id,
        },
        {
          title: 'Private Yacht Charter',
          subtitle: 'Bespoke Coastal Cruise',
          description: 'Private catamaran charter along the azure waters featuring on-board sommelier service and sunset canapés.',
          imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1200',
          icon: '⚓',
          category: 'ADVENTURE',
          duration: 'Full Day',
          price: 850,
          order: 4,
          propertyId: primaryProperty.id,
        }
      ]

      for (const exp of defaultExperiences) {
        await prisma.experience.create({ data: exp })
      }
    }

    // 3. Seed or Enrich Facilities
    const facilitiesWithImages = await prisma.resortFacility.count({
      where: { imageUrl: { not: null } }
    })

    if (facilitiesWithImages === 0) {
      const defaultFacilities = [
        {
          name: 'Celestial Infinity Pool',
          type: 'POOL',
          subtitle: 'Above the Clouds',
          description: 'Our heated rooftop infinity pool offers a seamless blend of water and sky, surrounded by private cabanas and world-class service.',
          imageUrl: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&q=80&w=1200',
          features: 'Temperature Controlled, Private Luxury Cabanas, Poolside Cocktail Lounge, Twilight Swim Events',
          operatingHours: '06:00 - 22:00',
          featured: true,
          order: 1,
          propertyId: primaryProperty.id,
        },
        {
          name: 'Elite Fitness Studio',
          type: 'FITNESS',
          subtitle: 'Strength & Vitality',
          description: 'A state-of-the-art sanctuary featuring the latest Technogym equipment, private training suites, and panoramic views to inspire your workout.',
          imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1200',
          features: '24/7 Biometric Access, Elite Personal Trainers, Private Yoga Studio, Post-workout Recovery Bar',
          operatingHours: '24/7 Access',
          featured: true,
          order: 2,
          propertyId: primaryProperty.id,
        },
        {
          name: 'Serenity Wellness Spa',
          type: 'SPA',
          subtitle: 'The Art of Relaxation',
          description: 'An oasis of calm offering bespoke treatments that combine ancient wisdom with modern science to restore your natural balance.',
          imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=1200',
          features: 'Hydrotherapy Circuits, Organic Aromatherapy, Zen Meditation Garden, Signature Gold Facials',
          operatingHours: '08:00 - 21:00',
          featured: true,
          order: 3,
          propertyId: primaryProperty.id,
        },
        {
          name: 'Executive Boardrooms',
          type: 'BUSINESS',
          subtitle: 'Success by Design',
          description: 'Sophisticated spaces designed for high-level decision making, featuring the latest integrated technology and bespoke catering.',
          imageUrl: 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&q=80&w=1200',
          features: '8K Video Conferencing, Secure Private Networks, Dedicated Event Concierge, Gourmet Business Dining',
          operatingHours: '07:00 - 23:00',
          featured: true,
          order: 4,
          propertyId: primaryProperty.id,
        }
      ]

      for (const fac of defaultFacilities) {
        await prisma.resortFacility.create({ data: fac })
      }
    }

    // 4. Seed Gallery items if empty
    const galleryCount = await prisma.gallery.count()
    if (galleryCount === 0) {
      const defaultGalleries = [
        {
          title: 'The Royal Suite',
          imageUrl: 'https://images.unsplash.com/photo-1590490359683-658d3d23f972?auto=format&fit=crop&q=80&w=1200',
          category: 'ROOMS',
          caption: 'Panoramic views of the skyline from our premier suite.',
          propertyId: primaryProperty.id,
          featured: true,
          order: 1
        },
        {
          title: 'Grand Palace Lobby',
          imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1200',
          category: 'LOBBY',
          caption: 'Sweeping marble architecture and crystal chandeliers.',
          propertyId: primaryProperty.id,
          featured: true,
          order: 2
        },
        {
          title: 'The Gilded Plate',
          imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=1200',
          category: 'DINING',
          caption: 'Intimate fine dining in a Michelin-starred setting.',
          propertyId: primaryProperty.id,
          featured: true,
          order: 3
        },
        {
          title: 'Celestial Rooftop Pool',
          imageUrl: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&q=80&w=1200',
          category: 'WELLNESS',
          caption: 'Infinity edges that blend with the horizon.',
          propertyId: primaryProperty.id,
          featured: true,
          order: 4
        },
        {
          title: 'Midnight Ballroom',
          imageUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=1200',
          category: 'EVENTS',
          caption: 'Setting the stage for unforgettable gala events.',
          propertyId: primaryProperty.id,
          featured: false,
          order: 5
        },
        {
          title: 'Serenity Spa Pavilion',
          imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=1200',
          category: 'WELLNESS',
          caption: 'An oasis of calm designed for total rejuvenation.',
          propertyId: primaryProperty.id,
          featured: false,
          order: 6
        }
      ]

      for (const item of defaultGalleries) {
        await prisma.gallery.create({ data: item })
      }
    }

    // 5. Seed Stay Extra Services if empty
    const { StayExtraService } = await import('./stay-extra-service')
    await StayExtraService.ensureDefaultExtraServices()

    // 6. Seed Default Footer Links if empty
    const footerCount = await prisma.footerLink.count()
    if (footerCount === 0) {
      const defaultLinks = [
        // Legal
        { label: 'Terms & Conditions', url: '/terms', category: 'Legal', order: 1 },
        { label: 'Privacy Policy', url: '/privacy', category: 'Legal', order: 2 },
        { label: 'Cookie Policy', url: '/cookies', category: 'Legal', order: 3 },
        // Quick Links
        { label: 'Suites & Accommodations', url: '/rooms', category: 'Quick Links', order: 1 },
        { label: 'Resort Facilities', url: '/facilities', category: 'Quick Links', order: 2 },
        { label: 'Photo Archive', url: '/gallery', category: 'Quick Links', order: 3 },
        { label: 'Our Heritage', url: '/about', category: 'Quick Links', order: 4 },
        { label: 'Concierge & Contact', url: '/contact', category: 'Quick Links', order: 5 },
        // Services
        { label: 'Private Butler Service', url: '/facilities', category: 'Services', order: 1 },
        { label: 'Serenity Spa & Hydrotherapy', url: '/facilities', category: 'Services', order: 2 },
        { label: 'Michelin Dining & Lounge', url: '/facilities', category: 'Services', order: 3 },
        { label: 'Chauffeured Airport Transfer', url: '/booking', category: 'Services', order: 4 },
      ]

      for (const link of defaultLinks) {
        await prisma.footerLink.create({
          data: {
            label: link.label,
            url: link.url,
            category: link.category,
            order: link.order,
            active: true
          }
        })
      }
    }

    // 7. Seed Hero Slides if empty
    const heroSlideCount = await prisma.heroSlide.count()
    if (heroSlideCount === 0) {
      const defaultSlides = [
        {
          image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1920',
          title: 'The Art of Luxury',
          subtitle: 'A Sanctuary of Sophistication',
          description: 'Experience unparalleled elegance in our meticulously designed suites, where every detail tells a story of refined luxury.',
          cta: 'Check Availability',
          ctaLink: '/booking',
          order: 1,
          active: true
        },
        {
          image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=1920',
          title: 'Unrivaled Comfort & Grace',
          subtitle: 'World-Class Hospitality',
          description: 'Immerse yourself in panoramic city and ocean vistas, tailored butler service, and Michelin-inspired culinary journeys.',
          cta: 'Explore Suites',
          ctaLink: '/rooms',
          order: 2,
          active: true
        }
      ]
      for (const slide of defaultSlides) {
        await prisma.heroSlide.create({ data: slide })
      }
    }
  }

  /**
   * Fetch Hero Slides from CMS (auto-seeds defaults if empty)
   */
  static async getHeroSlides(options: { activeOnly?: boolean } = {}) {
    let slides = await prisma.heroSlide.findMany({
      where: options.activeOnly ? { active: true } : undefined,
      orderBy: { order: 'asc' }
    })

    if (slides.length === 0) {
      await this.ensureDefaultCmsContent()
      slides = await prisma.heroSlide.findMany({
        where: options.activeOnly ? { active: true } : undefined,
        orderBy: { order: 'asc' }
      })
    }

    return slides
  }

  /**
   * Fetch primary Hotel Front Story Image from CMS or curated luxury default
   */
  static async getStoryImage(): Promise<string> {
    const galleryImage = await prisma.gallery.findFirst({
      where: {
        category: { in: ['EXTERIOR', 'AMENITY'] }
      },
      orderBy: { createdAt: 'desc' }
    })
    return galleryImage?.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1200'
  }
}
