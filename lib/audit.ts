import { NextRequest } from 'next/server'
import prisma from './db'

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
    await prisma.auditLog.create({
      data: {
        userId: data.userId || '',
        action: data.action,
        entityType: data.resource,
        entityId: data.resourceId || '',
        details: data.details || undefined,
        ipAddress: data.ipAddress || undefined,
        userAgent: data.userAgent || undefined,
      }
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
    // Don't throw error to avoid breaking the main functionality
  }
}

export function getClientInfo(req: NextRequest) {
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const ip = forwarded ? forwarded.split(',')[0] : realIp || 'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'
  
  return { ipAddress: ip, userAgent }
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