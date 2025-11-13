import { NextRequest } from 'next/server'
import prisma from './db'
import { log } from './logger'

export interface AuditLogData {
  userId?: string
  action: string
  resource: string
  resourceId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

export async function createAuditLog(data: AuditLogData) {
  try {
    // Note: AuditLog model doesn't exist in schema
    // Logging would need to be implemented via a separate service or added to schema
    console.log('Audit log:', data)
    return
    /* await prisma.auditLog.create({
      data: {
        userId: data.userId || '',
        action: data.action,
        entityType: data.resource,
        entityId: data.resourceId || '',
        details: data.details || undefined,
        ipAddress: data.ipAddress || undefined,
        userAgent: data.userAgent || undefined,
      }
    }) */
  } catch (error) {
    log.error('Failed to create audit log', error, {
      userId: data.userId,
      action: data.action,
      resource: data.resource,
    })
    // Don't throw error to avoid breaking the main functionality
  }
}

type RequestLike =
  | NextRequest
  | {
      headers?: Headers | Record<string, string | string[] | undefined>
      socket?: { remoteAddress?: string | null }
    }

export function getClientInfo(req?: RequestLike) {
  if (!req) {
    return { ipAddress: 'unknown', userAgent: 'unknown' }
  }

  const headers = (req as any).headers
  let ip: string | undefined
  let userAgent: string | undefined

  if (headers) {
    if (typeof headers.get === 'function') {
      const forwarded = headers.get('x-forwarded-for')
      const realIp = headers.get('x-real-ip')
      ip = forwarded ? forwarded.split(',')[0]?.trim() : realIp ?? undefined
      userAgent = headers.get('user-agent') ?? undefined
    } else if (typeof headers === 'object') {
      const lookup = (key: string) => {
        const value = headers[key] ?? headers[key.toLowerCase()]
        if (Array.isArray(value)) return value[0]
        return value
      }
      const forwarded = lookup('x-forwarded-for')
      const realIp = lookup('x-real-ip')
      ip = forwarded ? forwarded.split(',')[0]?.trim() : realIp ?? undefined
      userAgent = lookup('user-agent') ?? undefined
    }
  }

  if (!ip) {
    const socketIp = (req as any).socket?.remoteAddress
    if (typeof socketIp === 'string' && socketIp.length > 0) {
      ip = socketIp
    }
  }

  return {
    ipAddress: ip ?? 'unknown',
    userAgent: userAgent ?? 'unknown',
  }
}

// Predefined audit actions
export const AUDIT_ACTIONS = {
  // User actions
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_REGISTER: 'USER_REGISTER',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',
  
  // Staff actions
  STAFF_CREATE: 'STAFF_CREATE',
  STAFF_UPDATE: 'STAFF_UPDATE',
  STAFF_DELETE: 'STAFF_DELETE',
  
  // Room actions
  ROOM_CREATE: 'ROOM_CREATE',
  ROOM_UPDATE: 'ROOM_UPDATE',
  ROOM_DELETE: 'ROOM_DELETE',
  ROOM_STATUS_CHANGE: 'ROOM_STATUS_CHANGE',
  
  // Booking actions
  BOOKING_CREATE: 'BOOKING_CREATE',
  BOOKING_UPDATE: 'BOOKING_UPDATE',
  BOOKING_CANCEL: 'BOOKING_CANCEL',
  BOOKING_STATUS_CHANGE: 'BOOKING_STATUS_CHANGE',
  BOOKING_CHECK_IN: 'BOOKING_CHECK_IN',
  BOOKING_CHECK_OUT: 'BOOKING_CHECK_OUT',
  
  // Payment actions
  PAYMENT_CREATE: 'PAYMENT_CREATE',
  PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_REFUND: 'PAYMENT_REFUND',
  
  // Task actions
  TASK_CREATE: 'TASK_CREATE',
  TASK_ASSIGN: 'TASK_ASSIGN',
  TASK_UPDATE: 'TASK_UPDATE',
  TASK_COMPLETE: 'TASK_COMPLETE',
  TASK_DELETE: 'TASK_DELETE',
  
  // Inventory actions
  INVENTORY_CREATE: 'INVENTORY_CREATE',
  INVENTORY_UPDATE: 'INVENTORY_UPDATE',
  INVENTORY_DELETE: 'INVENTORY_DELETE',
  INVENTORY_ADJUST: 'INVENTORY_ADJUST',
  
  // Gallery actions
  GALLERY_CREATE: 'GALLERY_CREATE',
  GALLERY_UPDATE: 'GALLERY_UPDATE',
  GALLERY_DELETE: 'GALLERY_DELETE',
  
  // System actions
  SETTING_UPDATE: 'SETTING_UPDATE',
  BACKUP_CREATE: 'BACKUP_CREATE',
  SYSTEM_MAINTENANCE: 'SYSTEM_MAINTENANCE',
} as const

// Helper function to log common actions
export async function logAction(
  req: NextRequest,
  userId: string | undefined,
  action: string,
  resource: string,
  resourceId?: string,
  details?: Record<string, any>
) {
  const { ipAddress, userAgent } = getClientInfo(req)
  
  await createAuditLog({
    userId,
    action,
    resource,
    resourceId,
    details,
    ipAddress,
    userAgent,
  })
} 