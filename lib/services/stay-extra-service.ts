import prisma from '@/lib/db'

export interface ExtraServiceInput {
  name: string
  code: string
  description: string
  price: number | string
  priceType?: 'PER_STAY' | 'PER_NIGHT' | 'PER_GUEST'
  imageUrl?: string | null
  icon?: string | null
  active?: boolean
  order?: number
  propertyId?: string | null
}

export class StayExtraService {
  /**
   * Fetch all extra services, optionally filtered by property and active status
   */
  static async getExtraServices(options: { propertyId?: string | null; activeOnly?: boolean } = {}) {
    const { propertyId, activeOnly = true } = options
    const where: any = {}

    if (activeOnly) {
      where.active = true
    }

    if (propertyId && propertyId !== 'all') {
      where.OR = [
        { propertyId },
        { propertyId: null } // Global extras apply to all properties
      ]
    }

    return prisma.extraService.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      include: {
        property: {
          select: { id: true, name: true, city: true, code: true }
        }
      }
    })
  }

  /**
   * Fetch single extra service by ID
   */
  static async getExtraServiceById(id: string) {
    return prisma.extraService.findUnique({
      where: { id },
      include: {
        property: {
          select: { id: true, name: true, city: true, code: true }
        }
      }
    })
  }

  /**
   * Create a new extra service
   */
  static async createExtraService(data: ExtraServiceInput) {
    return prisma.extraService.create({
      data: {
        name: data.name,
        code: data.code.trim().toUpperCase(),
        description: data.description,
        price: data.price,
        priceType: data.priceType || 'PER_STAY',
        imageUrl: data.imageUrl || null,
        icon: data.icon || '✨',
        active: data.active ?? true,
        order: data.order ?? 0,
        propertyId: data.propertyId || null
      },
      include: {
        property: {
          select: { id: true, name: true, city: true, code: true }
        }
      }
    })
  }

  /**
   * Update an existing extra service
   */
  static async updateExtraService(id: string, data: Partial<ExtraServiceInput>) {
    return prisma.extraService.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.code !== undefined && { code: data.code.trim().toUpperCase() }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.priceType !== undefined && { priceType: data.priceType }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.active !== undefined && { active: data.active }),
        ...(data.order !== undefined && { order: data.order }),
        ...(data.propertyId !== undefined && { propertyId: data.propertyId || null }),
      },
      include: {
        property: {
          select: { id: true, name: true, city: true, code: true }
        }
      }
    })
  }

  /**
   * Delete an extra service
   */
  static async deleteExtraService(id: string) {
    return prisma.extraService.delete({
      where: { id }
    })
  }

  /**
   * Seed default luxury stay extras if table is empty
   */
  static async ensureDefaultExtraServices() {
    try {
      const count = await prisma.extraService.count()
      if (count > 0) return

      const defaults: ExtraServiceInput[] = [
        {
          name: 'Artisan Champagne Breakfast',
          code: 'BREAKFAST',
          description: 'Daily gourmet breakfast curated by our Chef de Cuisine, featuring organic farm-to-table delicacies and vintage champagne.',
          price: 25,
          priceType: 'PER_NIGHT',
          icon: '🥐',
          imageUrl: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&q=80&w=800',
          order: 1,
          active: true
        },
        {
          name: 'Royal Late Check-out (4:00 PM)',
          code: 'LATE_CHECKOUT',
          description: 'Extend your relaxation with guaranteed late departure privileges and luggage valet service until 4:00 PM.',
          price: 50,
          priceType: 'PER_STAY',
          icon: '⏱️',
          imageUrl: 'https://images.unsplash.com/photo-1590490359683-658d3d23f972?auto=format&fit=crop&q=80&w=800',
          order: 2,
          active: true
        },
        {
          name: 'Chauffeured Luxury Airport Transfer',
          code: 'AIRPORT_SHUTTLE',
          description: 'Private executive limousine or Mercedes-Maybach transfer directly from airport tarmac to the hotel entrance.',
          price: 75,
          priceType: 'PER_STAY',
          icon: '🚘',
          imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800',
          order: 3,
          active: true
        },
        {
          name: 'Serenity Spa & Hydrotherapy Pass',
          code: 'SPA_ACCESS',
          description: 'Full-day access to thermal mineral baths, vitality steam saunas, herbal inhalation chambers, and zen relaxation lounge.',
          price: 100,
          priceType: 'PER_STAY',
          icon: '💆',
          imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=800',
          order: 4,
          active: true
        }
      ]

      for (const item of defaults) {
        await prisma.extraService.create({
          data: {
            name: item.name,
            code: item.code,
            description: item.description,
            price: item.price,
            priceType: item.priceType || 'PER_STAY',
            imageUrl: item.imageUrl,
            icon: item.icon,
            order: item.order || 0,
            active: true
          }
        })
      }
    } catch (error) {
      console.warn('StayExtraService: Failed to seed default extras:', error)
    }
  }
}
