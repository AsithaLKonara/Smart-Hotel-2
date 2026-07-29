import prisma from '@/lib/prisma'

export interface ResortServiceDTO {
  facilityName: string // e.g. "Serenity Spa" or "Championship Golf Course"
  serviceName: string
  durationMins: number
  price: number
}

export interface CompanyProfileDTO {
  name: string
  taxId?: string
  address?: string
  billingEmail?: string
  creditLimit?: number
}

export interface TestimonialDTO {
  name: string
  role?: string
  content: string
  rating?: number
  image?: string
}

export interface GuestHistoryDTO {
  userId: string
  staysDelta?: number
  nightsDelta?: number
  spendDelta?: number
  lastRoomTypeId?: string
}

/**
 * Service: Guest Experience & Corporate Entity Engine
 * Purpose: Activating dead schema models ResortService, CompanyProfile, Testimonial, and GuestHistory
 */
export class GuestExperienceService {
  /**
   * Creates a resort amenity or spa service offering linked to a ResortFacility.
   * Activating Dead Schema: ResortService
   */
  static async addResortService(dto: ResortServiceDTO) {
    return await prisma.$transaction(async (tx) => {
      // Locate or create parent facility
      let facility = await tx.resortFacility.findFirst({
        where: { name: dto.facilityName }
      })

      if (!facility) {
        facility = await tx.resortFacility.create({
          data: {
            name: dto.facilityName,
            type: 'RECREATION_SPA',
            operatingHours: '08:00-20:00',
            status: 'ACTIVE'
          }
        })
      }

      // Create ResortService row (Activating Dead Schema: ResortService)
      return await tx.resortService.create({
        data: {
          facilityId: facility.id,
          name: dto.serviceName,
          durationMins: dto.durationMins,
          price: dto.price
        }
      })
    })
  }

  /**
   * Retrieves active resort services and amenities catalog.
   */
  static async listResortServices() {
    return await prisma.resortService.findMany({
      include: { facility: true },
      orderBy: { createdAt: 'desc' }
    })
  }

  /**
   * Upserts a B2B corporate client contract account in CompanyProfile.
   * Activating Dead Schema: CompanyProfile
   */
  static async registerCompanyProfile(dto: CompanyProfileDTO) {
    const existing = await prisma.companyProfile.findFirst({
      where: { name: dto.name }
    })

    if (existing) {
      return await prisma.companyProfile.update({
        where: { id: existing.id },
        data: {
          taxId: dto.taxId ?? existing.taxId,
          address: dto.address ?? existing.address,
          billingEmail: dto.billingEmail ?? existing.billingEmail,
          creditLimit: dto.creditLimit ?? existing.creditLimit
        }
      })
    }

    return await prisma.companyProfile.create({
      data: {
        name: dto.name,
        taxId: dto.taxId,
        address: dto.address,
        billingEmail: dto.billingEmail,
        creditLimit: dto.creditLimit ?? 5000.00
      }
    })
  }

  /**
   * Retrieves all corporate company billing profiles.
   */
  static async listCompanyProfiles() {
    return await prisma.companyProfile.findMany({
      include: { _count: { select: { folios: true } } },
      orderBy: { name: 'asc' }
    })
  }

  /**
   * Publishes a marketing customer feedback rating in Testimonial.
   * Activating Dead Schema: Testimonial
   */
  static async addTestimonial(dto: TestimonialDTO) {
    return await prisma.testimonial.create({
      data: {
        name: dto.name,
        role: dto.role || 'Verified Guest',
        content: dto.content,
        rating: Math.min(5, Math.max(1, dto.rating || 5)),
        image: dto.image || '/avatars/default-guest.jpg',
        active: true
      }
    })
  }

  /**
   * Retrieves public active testimonials for landing pages and marketing banners.
   */
  static async listActiveTestimonials() {
    return await prisma.testimonial.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' }
    })
  }

  /**
   * Updates historical customer metrics (stays, spend, loyalty tracking) in GuestHistory.
   * Activating Dead Schema: GuestHistory
   */
  static async updateGuestHistory(dto: GuestHistoryDTO) {
    return await prisma.$transaction(async (tx) => {
      // Ensure target User exists
      const user = await tx.user.findUnique({
        where: { id: dto.userId }
      })

      if (!user) {
        throw new Error(`User with ID ${dto.userId} not found`)
      }

      return await tx.guestHistory.upsert({
        where: { userId: dto.userId },
        update: {
          totalStays: { increment: dto.staysDelta || 0 },
          totalNights: { increment: dto.nightsDelta || 0 },
          totalSpend: { increment: dto.spendDelta || 0 },
          lastStayDate: new Date(),
          lastRoomTypeId: dto.lastRoomTypeId || undefined
        },
        create: {
          userId: dto.userId,
          totalStays: Math.max(1, dto.staysDelta || 1),
          totalNights: Math.max(1, dto.nightsDelta || 1),
          totalSpend: dto.spendDelta || 0,
          lastStayDate: new Date(),
          lastRoomTypeId: dto.lastRoomTypeId || null
        }
      })
    })
  }
}
