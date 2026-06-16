import { Session } from 'next-auth';

export type UserRole = 'GUEST' | 'RECEPTIONIST' | 'MANAGER' | 'SUPER_ADMIN' | 'KITCHEN' | 'HOUSEKEEPING' | 'MAINTENANCE';

export const ROLE_HIERARCHY: Record<string, number> = {
  GUEST: 10,
  KITCHEN: 20,
  HOUSEKEEPING: 20,
  MAINTENANCE: 20,
  RECEPTIONIST: 30,
  MANAGER: 80,
  SUPER_ADMIN: 100,
  ADMIN: 100 // Safely normalize ADMIN to SUPER_ADMIN level
};

/**
 * Safely get user role from session
 */
export function getUserRole(session: Session | null | undefined): UserRole | null {
  if (!session || !session.user) return null;
  
  const roleName = 
    (session.user as any).roleName || 
    (session.user as any).role?.name || 
    (session as any).roleName;
    
  if (!roleName) return null;
  return roleName === 'ADMIN' ? 'SUPER_ADMIN' : roleName as UserRole;
}

/**
 * Get the numeric authorization level of a user
 */
export function getUserLevel(session: Session | null | undefined): number {
  const role = getUserRole(session);
  return role ? (ROLE_HIERARCHY[role] || 0) : 0;
}

/**
 * Check if user has required role (supports exact match or higher level override)
 */
export function hasRole(session: Session | null | undefined, requiredRoles: UserRole[]): boolean {
  const userRole = getUserRole(session);
  const userLevel = getUserLevel(session);
  
  if (!userRole) return false;
  
  // Managers and Super Admins (Level 80+) can override and access lateral roles automatically
  if (userLevel >= ROLE_HIERARCHY.MANAGER) {
    return true;
  }
  
  return requiredRoles.includes(userRole);
}

export function isAuthenticated(session: Session | null | undefined): boolean {
  return !!session?.user;
}

export function canAccessAdminDashboard(session: Session | null | undefined): boolean {
  return getUserLevel(session) >= ROLE_HIERARCHY.MANAGER;
}

export function canAccessReceptionistFeatures(session: Session | null | undefined): boolean {
  return getUserLevel(session) >= ROLE_HIERARCHY.RECEPTIONIST;
}

export function canAccessManagerFeatures(session: Session | null | undefined): boolean {
  return getUserLevel(session) >= ROLE_HIERARCHY.MANAGER;
}

export function canAccessSuperAdminFeatures(session: Session | null | undefined): boolean {
  return getUserLevel(session) >= ROLE_HIERARCHY.SUPER_ADMIN;
}

export function canAccessKitchenFeatures(session: Session | null | undefined): boolean {
  return hasRole(session, ['KITCHEN']);
}

export function canAccessHousekeepingFeatures(session: Session | null | undefined): boolean {
  return hasRole(session, ['HOUSEKEEPING']);
}

export function getAllowedRoles(route: string): UserRole[] {
  const routeRoles: Record<string, UserRole[]> = {
    '/admin/dashboard': ['MANAGER', 'SUPER_ADMIN'],
    '/admin/analytics': ['MANAGER', 'SUPER_ADMIN'],
    '/admin/staff': ['MANAGER', 'SUPER_ADMIN'],
    '/admin/rooms': ['MANAGER', 'SUPER_ADMIN'],
    '/admin/menu': ['MANAGER', 'SUPER_ADMIN'],
    '/admin/orders': ['MANAGER', 'SUPER_ADMIN'],
    '/admin/inventory': ['MANAGER', 'SUPER_ADMIN'],
    '/admin/gallery': ['MANAGER', 'SUPER_ADMIN'],
    '/admin/bookings': ['RECEPTIONIST'],
    '/admin/calendar': ['RECEPTIONIST'],
    '/admin/dashboard/checkin-checkout': ['RECEPTIONIST'],
    '/admin/tasks': ['RECEPTIONIST', 'HOUSEKEEPING', 'MAINTENANCE'],
    '/admin/qr-codes': ['RECEPTIONIST'],
    '/admin/receptionist': ['RECEPTIONIST'],
    '/admin/housekeeping': ['HOUSEKEEPING'],
    '/admin/manager': ['MANAGER', 'SUPER_ADMIN'],
    '/admin/executive': ['MANAGER', 'SUPER_ADMIN'],
    '/kitchen/dashboard': ['KITCHEN'],
  };
  
  return routeRoles[route] || [];
}

export function canAccessRoute(session: Session | null | undefined, route: string): boolean {
  const allowedRoles = getAllowedRoles(route);
  if (allowedRoles.length === 0) return true;
  return hasRole(session, allowedRoles);
}

