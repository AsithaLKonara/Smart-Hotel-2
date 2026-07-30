import { Prisma } from '@prisma/client'
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
  /* 
   * Methods addResortService, listResortServices, registerCompanyProfile, listCompanyProfiles, 
   * addTestimonial, listActiveTestimonials removed as they reference schemas that do not exist. 
   */

  /**
   * Updates historical customer metrics (stays, spend, loyalty tracking) in GuestHistory.
   * Activating Dead Schema: GuestHistory
   */
  static async updateGuestHistory(dto: GuestHistoryDTO) {
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
