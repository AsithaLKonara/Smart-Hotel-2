import { prisma } from '@/lib/db'

export interface DuplicateClusterCandidate {
  confidenceScore: number // 0 - 100
  matchReason: string
  primaryCandidate: {
    id: string
    name: string
    email: string
    phone: string | null
    propertyId: string
    totalBookings: number
    vipStatus: string
  }
  duplicateCandidate: {
    id: string
    name: string
    email: string
    phone: string | null
    propertyId: string
    totalBookings: number
    vipStatus: string
  }
}

/**
 * Scans the database for duplicate guest profiles across properties
 */
export async function scanForDuplicateGuests(): Promise<DuplicateClusterCandidate[]> {
  const users = await prisma.user.findMany({
    where: {
      deletedAt: null
    },
    include: {
      guestBookings: {
        select: { id: true }
      }
    }
  })

  const candidates: DuplicateClusterCandidate[] = []

  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      const u1 = users[i]
      const u2 = users[j]

      let score = 0
      const reasons: string[] = []

      // 1. Exact Email Match (case-insensitive)
      if (u1.email.toLowerCase() === u2.email.toLowerCase()) {
        score = 100
        reasons.push('Exact email address match')
      }

      // 2. Exact Phone Match
      if (u1.phone && u2.phone && u1.phone.trim() === u2.phone.trim()) {
        if (score === 0) {
          score = 90
          reasons.push(`Matching phone number (${u1.phone})`)
        } else {
          score = 100
          reasons.push('Matching phone number')
        }
      }

      // 3. Normalized Name Match
      const cleanName1 = u1.name.toLowerCase().replace(/[^a-z]/g, '')
      const cleanName2 = u2.name.toLowerCase().replace(/[^a-z]/g, '')
      if (cleanName1.length > 3 && cleanName1 === cleanName2) {
        if (score === 0) {
          score = 75
          reasons.push('Matching normalized guest name')
        } else {
          score = Math.min(100, score + 10)
        }
      }

      if (score >= 70) {
        // Designate primary: user with more bookings or earlier created
        const u1IsPrimary = u1.guestBookings.length >= u2.guestBookings.length
        const primary = u1IsPrimary ? u1 : u2
        const duplicate = u1IsPrimary ? u2 : u1

        candidates.push({
          confidenceScore: score,
          matchReason: reasons.join(' • '),
          primaryCandidate: {
            id: primary.id,
            name: primary.name,
            email: primary.email,
            phone: primary.phone,
            propertyId: primary.propertyId,
            totalBookings: primary.guestBookings.length,
            vipStatus: primary.vipStatus
          },
          duplicateCandidate: {
            id: duplicate.id,
            name: duplicate.name,
            email: duplicate.email,
            phone: duplicate.phone,
            propertyId: duplicate.propertyId,
            totalBookings: duplicate.guestBookings.length,
            vipStatus: duplicate.vipStatus
          }
        })
      }
    }
  }

  // Sort candidates by confidence descending
  return candidates.sort((a, b) => b.confidenceScore - a.confidenceScore)
}

/**
 * Atomically merges a duplicate guest profile into the Golden Record
 */
export async function mergeGuestIntoGoldenRecord(
  primaryId: string,
  secondaryId: string,
  actorUserId?: string
) {
  if (primaryId === secondaryId) {
    throw new Error('Cannot merge a guest profile into itself')
  }

  const [primary, secondary] = await Promise.all([
    prisma.user.findUnique({
      where: { id: primaryId },
      include: {
        guestBookings: true,
        guestHistory: true,
        loyalty: true,
        guestProfile: true
      }
    }),
    prisma.user.findUnique({
      where: { id: secondaryId },
      include: {
        guestBookings: true,
        guestHistory: true,
        loyalty: true,
        guestProfile: true
      }
    })
  ])

  if (!primary || !secondary) {
    throw new Error('Both primary and secondary guest profiles must exist')
  }

  const now = new Date()

  await prisma.$transaction(async (tx) => {
    // 1. Re-parent all Bookings from secondary to primary
    if (secondary.guestBookings.length > 0) {
      await tx.booking.updateMany({
        where: { primaryGuestId: secondary.id },
        data: { primaryGuestId: primary.id }
      })
    }

    // 2. Merge GuestHistory metrics
    if (secondary.guestHistory) {
      if (primary.guestHistory) {
        await tx.guestHistory.update({
          where: { id: primary.guestHistory.id },
          data: {
            totalStays: primary.guestHistory.totalStays + secondary.guestHistory.totalStays,
            totalNights: primary.guestHistory.totalNights + secondary.guestHistory.totalNights,
            totalSpend: Number(primary.guestHistory.totalSpend) + Number(secondary.guestHistory.totalSpend)
          }
        })
      } else {
        await tx.guestHistory.create({
          data: {
            userId: primary.id,
            totalStays: secondary.guestHistory.totalStays,
            totalNights: secondary.guestHistory.totalNights,
            totalSpend: secondary.guestHistory.totalSpend
          }
        })
      }
      await tx.guestHistory.delete({
        where: { id: secondary.guestHistory.id }
      })
    }

    // 3. Merge Loyalty Points
    if (secondary.loyalty) {
      if (primary.loyalty) {
        await tx.loyaltyPoint.update({
          where: { id: primary.loyalty.id },
          data: {
            points: primary.loyalty.points + secondary.loyalty.points
          }
        })
      } else {
        await tx.loyaltyPoint.create({
          data: {
            userId: primary.id,
            points: secondary.loyalty.points,
            tier: secondary.loyalty.tier
          }
        })
      }
      await tx.loyaltyPoint.delete({
        where: { id: secondary.loyalty.id }
      })
    }

    // 4. Merge GuestProfile preferences
    if (secondary.guestProfile) {
      if (!primary.guestProfile) {
        await tx.guestProfile.create({
          data: {
            userAccountId: primary.id,
            preferences: secondary.guestProfile.preferences as any
          }
        })
      }
      await tx.guestProfile.delete({
        where: { id: secondary.guestProfile.id }
      })
    }

    // 5. Upgrade VIP status if secondary held higher rank
    const vipRanks = ['STANDARD', 'SILVER', 'GOLD', 'PLATINUM', 'VIP']
    const primaryRank = vipRanks.indexOf(primary.vipStatus)
    const secondaryRank = vipRanks.indexOf(secondary.vipStatus)
    if (secondaryRank > primaryRank) {
      await tx.user.update({
        where: { id: primary.id },
        data: { vipStatus: secondary.vipStatus }
      })
    }

    // 6. Inherit blacklist status if flagged
    if (secondary.blacklistStatus && !primary.blacklistStatus) {
      await tx.user.update({
        where: { id: primary.id },
        data: {
          blacklistStatus: true,
          blacklistReason: `[Inherited from merged profile ${secondary.id}] ${secondary.blacklistReason || ''}`
        }
      })
    }

    // 7. Soft delete duplicate secondary profile
    await tx.user.update({
      where: { id: secondary.id },
      data: {
        deletedAt: now,
        email: `${secondary.email}.merged.${Date.now()}`
      }
    })
  })

  // Fetch consolidated Golden Record
  const goldenRecord = await prisma.user.findUnique({
    where: { id: primary.id },
    include: {
      guestBookings: { select: { id: true, confirmationCode: true } },
      guestHistory: true,
      loyalty: true
    }
  })

  return {
    success: true,
    goldenRecord: {
      id: goldenRecord!.id,
      name: goldenRecord!.name,
      email: goldenRecord!.email,
      phone: goldenRecord!.phone,
      vipStatus: goldenRecord!.vipStatus,
      blacklistStatus: goldenRecord!.blacklistStatus,
      totalBookingsCount: goldenRecord!.guestBookings.length,
      loyaltyPoints: goldenRecord!.loyalty?.points || 0,
      totalSpend: goldenRecord!.guestHistory ? Number(goldenRecord!.guestHistory.totalSpend) : 0
    },
    mergedSecondaryId: secondary.id,
    mergedAt: now.toISOString()
  }
}
