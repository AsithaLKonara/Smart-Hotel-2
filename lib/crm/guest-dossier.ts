import { prisma } from '@/lib/db'

export interface GetGuestDossierParams {
  userId?: string
  email?: string
  phone?: string
  viewingPropertyId?: string
}

export interface UpdatePreferencesInput {
  userId: string
  dietaryRestrictions?: string[]
  allergies?: string[]
  roomPreferences?: string[]
  conciergeNotes?: Record<string, any>
  updatedByPropertyId?: string
  actorUserId?: string
}

export async function getUnifiedGuestDossier(params: GetGuestDossierParams) {
  const { userId, email, phone, viewingPropertyId } = params

  if (!userId && !email && !phone) {
    throw new Error('At least one identifier (userId, email, or phone) must be provided')
  }

  const guest = await prisma.user.findFirst({
    where: {
      deletedAt: null,
      OR: [
        ...(userId ? [{ id: userId }] : []),
        ...(email ? [{ email: { equals: email.toLowerCase().trim(), mode: 'insensitive' as any } }] : []),
        ...(phone ? [{ phone: phone.trim() }] : [])
      ]
    },
    include: {
      property: { select: { id: true, name: true, code: true } },
      guestPreferences: true,
      guestProfile: true,
      complaints: {
        orderBy: { createdAt: 'desc' },
        include: {
          booking: {
            include: {
              property: { select: { id: true, name: true, code: true } }
            }
          }
        }
      },
      guestBookings: {
        orderBy: { checkIn: 'desc' },
        include: {
          property: { select: { id: true, name: true, code: true } },
          roomAssignments: {
            include: {
              room: {
                select: {
                  id: true,
                  number: true,
                  roomType: { select: { id: true, name: true } }
                }
              }
            }
          }
        }
      },
      loyalty: true
    }
  })

  if (!guest) {
    return null
  }

  // Aggregate Cross-Property Stays & Spend
  const staysByProperty: Record<string, { propertyName: string; propertyCode: string; staysCount: number; totalSpend: number }> = {}
  let totalChainSpend = 0
  let totalChainStays = 0

  for (const b of guest.guestBookings) {
    if (b.status === 'CANCELLED') continue
    const propCode = b.property?.code || 'UNKNOWN'
    const propName = b.property?.name || 'Unknown Property'
    const amount = Number(b.totalAmount) || 0

    if (!staysByProperty[propCode]) {
      staysByProperty[propCode] = {
        propertyName: propName,
        propertyCode: propCode,
        staysCount: 0,
        totalSpend: 0
      }
    }

    staysByProperty[propCode].staysCount += 1
    staysByProperty[propCode].totalSpend += amount
    totalChainStays += 1
    totalChainSpend += amount
  }

  // Cross-Property Service Insights & Recommendations for Staff
  const serviceAlerts: string[] = []
  if (guest.guestPreferences?.allergies?.length) {
    serviceAlerts.push(`DIETARY ALERT: Guest has allergies: ${guest.guestPreferences.allergies.join(', ')}`)
  }
  if (guest.guestPreferences?.roomPreferences?.length) {
    serviceAlerts.push(`ROOM SETUP: Preferred amenities: ${guest.guestPreferences.roomPreferences.join(', ')}`)
  }
  if (guest.complaints.some((c) => c.status === 'OPEN')) {
    serviceAlerts.push('ATTENTION: Guest has unresolved complaints from sister properties')
  }

  return {
    guest: {
      id: guest.id,
      name: guest.name,
      email: guest.email,
      phone: guest.phone,
      vipStatus: guest.vipStatus,
      blacklistStatus: guest.blacklistStatus,
      homeProperty: guest.property,
      loyaltyPoints: guest.loyalty?.points || 0
    },
    preferences: {
      dietaryRestrictions: guest.guestPreferences?.dietaryRestrictions || [],
      allergies: guest.guestPreferences?.allergies || [],
      roomPreferences: guest.guestPreferences?.roomPreferences || [],
      notes: (guest.guestProfile?.preferences as any)?.notes || null,
      customProfileData: guest.guestProfile?.preferences || null
    },
    serviceAlerts,
    stayMetrics: {
      totalChainStays,
      totalChainSpend,
      staysByProperty: Object.values(staysByProperty)
    },
    recentStays: guest.guestBookings.slice(0, 10).map((b) => ({
      bookingId: b.id,
      confirmationCode: b.confirmationCode,
      property: b.property,
      roomNumber: b.roomAssignments?.[0]?.room?.number || null,
      roomType: b.roomAssignments?.[0]?.room?.roomType?.name || null,
      checkIn: b.checkIn,
      checkOut: b.checkOut,
      status: b.status,
      totalAmount: b.totalAmount
    })),
    complaintsHistory: guest.complaints.map((c) => ({
      id: c.id,
      subject: c.subject,
      description: c.description,
      status: c.status,
      priority: c.priority,
      createdAt: c.createdAt,
      propertyName: c.booking?.property?.name || 'General'
    }))
  }
}

export async function updateCrossPropertyPreferences(input: UpdatePreferencesInput) {
  const {
    userId,
    dietaryRestrictions,
    allergies,
    roomPreferences,
    conciergeNotes,
    updatedByPropertyId,
    actorUserId
  } = input

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new Error(`Guest with ID ${userId} not found`)
  }

  // Upsert GuestPreference
  const updatedPref = await prisma.guestPreference.upsert({
    where: { userId },
    create: {
      userId,
      dietaryRestrictions: dietaryRestrictions || [],
      allergies: allergies || [],
      roomPreferences: roomPreferences || []
    },
    update: {
      ...(dietaryRestrictions !== undefined ? { dietaryRestrictions } : {}),
      ...(allergies !== undefined ? { allergies } : {}),
      ...(roomPreferences !== undefined ? { roomPreferences } : {})
    }
  })

  // Upsert GuestProfile for concierge notes
  if (conciergeNotes) {
    const existingProfile = await prisma.guestProfile.findUnique({
      where: { userAccountId: userId }
    })
    const mergedPreferences = {
      ...((existingProfile?.preferences as object) || {}),
      ...conciergeNotes,
      lastUpdatedPropertyId: updatedByPropertyId,
      updatedAt: new Date().toISOString()
    }

    await prisma.guestProfile.upsert({
      where: { userAccountId: userId },
      create: {
        userAccountId: userId,
        preferences: mergedPreferences
      },
      update: {
        preferences: mergedPreferences
      }
    })
  }

  // Audit log for traceability
  await prisma.auditLog.create({
    data: {
      userId: actorUserId || user.id,
      actor: actorUserId ? `User:${actorUserId}` : 'CRM_SYSTEM',
      action: 'GUEST_PREFERENCES_UPDATED',
      resource: 'UserPreference',
      resourceId: user.id,
      details: {
        targetGuestId: user.id,
        updatedByPropertyId,
        dietaryRestrictions,
        allergies,
        roomPreferences
      }
    }
  })

  return {
    success: true,
    preferences: updatedPref
  }
}
