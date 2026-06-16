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
  CHECK_OUT: 'CHECK_OUT',
  GALLERY_CREATE: 'GALLERY_CREATE',
  GALLERY_DELETE: 'GALLERY_DELETE',
  INVENTORY_CREATE: 'INVENTORY_CREATE',
  INVENTORY_UPDATE: 'INVENTORY_UPDATE',
  STAFF_CREATE: 'STAFF_CREATE',
  TASK_DELETE: 'TASK_DELETE',
  INVENTORY_DELETE: 'INVENTORY_DELETE',
  GALLERY_UPDATE: 'GALLERY_UPDATE'
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
    // Extract IP from either standard NextRequest or NextAuth request object
    let ip = 'system'
    if (request) {
      const headers = request.headers instanceof Headers 
        ? Object.fromEntries(request.headers.entries()) 
        : (request.headers as any || {})
        
      ip = (headers['x-forwarded-for'] as string) || 'system'
    }
    
    // Normalize audit entry for the Enterprise Schema
    // Only link to userId if actor is a valid UUID to prevent foreign key constraints
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(actor);
    
    const log = await prisma.auditLog.create({
      data: {
        userId: isUUID ? actor : null,
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