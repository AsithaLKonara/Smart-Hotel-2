import { prisma } from './db'
import { NextRequest } from 'next/server'

export const AUDIT_ACTIONS = {
  BOOKING_CREATE: 'BOOKING_CREATE',
  BOOKING_UPDATE: 'BOOKING_UPDATE',
  BOOKING_DELETE: 'BOOKING_DELETE',
  ROOM_UPDATE: 'ROOM_UPDATE',
  TASK_CREATE: 'TASK_CREATE',
  TASK_UPDATE: 'TASK_UPDATE',
  USER_LOGIN: 'USER_LOGIN',
  SECURITY_VIOLATION: 'SECURITY_VIOLATION',
  CHECK_IN: 'CHECK_IN',
  CHECK_OUT: 'CHECK_OUT'
}

/**
 * Enterprise-grade Audit Logging utility.
 * Captures all critical system actions for security and compliance.
 */
export async function logAction(
  request: NextRequest | null,
  actor: string,
  action: string,
  resource: string,
  resourceId: string,
  details: any
) {
  try {
    const ip = request?.headers.get('x-forwarded-for') || 'system'
    
    // Normalize audit entry for the Enterprise Schema
    const log = await prisma.auditLog.create({
      data: {
        actor,
        action,
        resource,
        resourceId,
        details: { ...details, ip }
      }
    })
    
    return log
  } catch (error) {
    console.error('CRITICAL: Audit log failed to persist:', error)
    return null
  }
}