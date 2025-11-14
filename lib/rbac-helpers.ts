/**
 * RBAC Helper Functions
 * Provides safe role checking and route protection utilities
 */

import { Session } from 'next-auth';

export type UserRole = 'GUEST' | 'RECEPTIONIST' | 'MANAGER' | 'SUPER_ADMIN' | 'KITCHEN_STAFF' | 'HOUSEKEEPING';

/**
 * Safely get user role from session
 */
export function getUserRole(session: Session | null | undefined): UserRole | null {
  if (!session?.user?.role) {
    return null;
  }
  return session.user.role as UserRole;
}

/**
 * Check if user has required role
 */
export function hasRole(session: Session | null | undefined, requiredRoles: UserRole[]): boolean {
  const userRole = getUserRole(session);
  if (!userRole) {
    return false;
  }
  return requiredRoles.includes(userRole);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(session: Session | null | undefined): boolean {
  return !!session?.user;
}

/**
 * Check if user can access admin dashboard
 */
export function canAccessAdminDashboard(session: Session | null | undefined): boolean {
  return hasRole(session, ['MANAGER', 'SUPER_ADMIN']);
}

/**
 * Check if user can access receptionist features
 */
export function canAccessReceptionistFeatures(session: Session | null | undefined): boolean {
  return hasRole(session, ['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN']);
}

/**
 * Check if user can access manager features
 */
export function canAccessManagerFeatures(session: Session | null | undefined): boolean {
  return hasRole(session, ['MANAGER', 'SUPER_ADMIN']);
}

/**
 * Check if user can access super admin features
 */
export function canAccessSuperAdminFeatures(session: Session | null | undefined): boolean {
  return hasRole(session, ['SUPER_ADMIN']);
}

/**
 * Get allowed roles for a route
 */
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
    '/admin/bookings': ['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'],
    '/admin/calendar': ['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'],
    '/admin/dashboard/checkin-checkout': ['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'],
    '/admin/tasks': ['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'],
    '/admin/qr-codes': ['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'],
    '/kitchen/dashboard': ['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'],
  };
  
  return routeRoles[route] || [];
}

/**
 * Check if user can access a specific route
 */
export function canAccessRoute(session: Session | null | undefined, route: string): boolean {
  const allowedRoles = getAllowedRoles(route);
  if (allowedRoles.length === 0) {
    return true; // Public route
  }
  return hasRole(session, allowedRoles);
}

