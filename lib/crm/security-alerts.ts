import { prisma } from '@/lib/db'

export interface FlagGuestInput {
  userId: string
  blacklistStatus?: boolean
  blacklistReason?: string
  vipStatus?: 'STANDARD' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'VIP'
  flaggedByPropertyId: string
  incidentReference?: string
  actorUserId?: string
}

export interface SecurityClearanceResult {
  isCleared: boolean
  guest: {
    id: string
    name: string
    email: string
    phone: string | null
    vipStatus: string
    blacklistStatus: boolean
    blacklistReason: string | null
  }
  securityAlert: {
    level: 'CRITICAL_BLOCK' | 'VIP_CONCIERGE' | 'NORMAL'
    message: string
    flaggedOriginProperty?: {
      id: string
      name: string
      code: string
    }
  } | null
}

/**
 * Flags a guest for Security Blacklist or VIP chain-wide propagation
 */
export async function flagGuestSecurityStatus(input: FlagGuestInput) {
  const {
    userId,
    blacklistStatus,
    blacklistReason,
    vipStatus,
    flaggedByPropertyId,
    incidentReference,
    actorUserId
  } = input

  const user = await prisma.user.findUnique({
    where: { id: userId }
  })
  if (!user) {
    throw new Error(`Guest with ID ${userId} not found`)
  }

  const property = await prisma.property.findUnique({
    where: { id: flaggedByPropertyId },
    select: { id: true, name: true, code: true }
  })
  if (!property) {
    throw new Error(`Property ${flaggedByPropertyId} not found`)
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(blacklistStatus != null ? { blacklistStatus } : {}),
      ...(blacklistReason != null
        ? {
            blacklistReason: `[FLAGGED by ${property.code}] ${blacklistReason}${
              incidentReference ? ` (Ref: ${incidentReference})` : ''
            }`
          }
        : {}),
      ...(vipStatus ? { vipStatus } : {})
    }
  })

  // Create audit log for security accountability
  await prisma.auditLog.create({
    data: {
      userId: actorUserId || user.id,
      actor: actorUserId ? `User:${actorUserId}` : 'SECURITY_SYSTEM',
      action: blacklistStatus ? 'GUEST_CHAIN_BLACKLISTED' : 'GUEST_VIP_UPDATED',
      resource: 'User',
      resourceId: user.id,
      details: {
        targetGuestId: user.id,
        targetGuestName: user.name,
        blacklistStatus,
        blacklistReason,
        vipStatus,
        flaggedByProperty: property.code,
        incidentReference
      }
    }
  })

  return {
    success: true,
    guest: {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      vipStatus: updated.vipStatus,
      blacklistStatus: updated.blacklistStatus,
      blacklistReason: updated.blacklistReason
    },
    flaggedByProperty: property
  }
}

/**
 * Checks guest clearance across all properties prior to reservation or check-in
 */
export async function checkGuestSecurityClearance(params: {
  userId?: string
  email?: string
  phone?: string
  currentPropertyId: string
}): Promise<SecurityClearanceResult> {
  const { userId, email, phone, currentPropertyId } = params

  const guest = await prisma.user.findFirst({
    where: {
      deletedAt: null,
      OR: [
        ...(userId ? [{ id: userId }] : []),
        ...(email ? [{ email: { equals: email.toLowerCase().trim(), mode: 'insensitive' as any } }] : []),
        ...(phone ? [{ phone: phone.trim() }] : [])
      ]
    }
  })

  if (!guest) {
    return {
      isCleared: true,
      guest: {
        id: 'UNKNOWN',
        name: 'New Guest',
        email: email || '',
        phone: phone || null,
        vipStatus: 'STANDARD',
        blacklistStatus: false,
        blacklistReason: null
      },
      securityAlert: null
    }
  }

  // 1. Critical Blacklist Interception
  if (guest.blacklistStatus) {
    return {
      isCleared: false,
      guest: {
        id: guest.id,
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
        vipStatus: guest.vipStatus,
        blacklistStatus: true,
        blacklistReason: guest.blacklistReason
      },
      securityAlert: {
        level: 'CRITICAL_BLOCK',
        message: `CHAIN-WIDE SECURITY INTERCEPT: ${guest.blacklistReason || 'Guest is blacklisted for property damage or unpaid charges.'}`
      }
    }
  }

  // 2. High-Value VIP Greeting Protocol
  if (guest.vipStatus === 'VIP' || guest.vipStatus === 'PLATINUM') {
    return {
      isCleared: true,
      guest: {
        id: guest.id,
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
        vipStatus: guest.vipStatus,
        blacklistStatus: false,
        blacklistReason: null
      },
      securityAlert: {
        level: 'VIP_CONCIERGE',
        message: `GLOBAL VIP GUEST (${guest.vipStatus}): Greet by name and notify Duty Manager for welcome amenity protocol.`
      }
    }
  }

  return {
    isCleared: true,
    guest: {
      id: guest.id,
      name: guest.name,
      email: guest.email,
      phone: guest.phone,
      vipStatus: guest.vipStatus,
      blacklistStatus: false,
      blacklistReason: null
    },
    securityAlert: null
  }
}

/**
 * Pardons/clears a guest blacklist status
 */
export async function clearGuestSecurityStatus(userId: string, reason: string, actorUserId?: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('Guest not found')

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      blacklistStatus: false,
      blacklistReason: `[PARDONED] ${reason}`
    }
  })

  await prisma.auditLog.create({
    data: {
      userId: actorUserId || user.id,
      actor: actorUserId ? `User:${actorUserId}` : 'SECURITY_MANAGER',
      action: 'GUEST_BLACKLIST_PARDONED',
      resource: 'User',
      resourceId: user.id,
      details: {
        targetGuestId: user.id,
        reason
      }
    }
  })

  return {
    success: true,
    message: `Guest ${user.name} blacklist status successfully cleared.`,
    guest: updated
  }
}
