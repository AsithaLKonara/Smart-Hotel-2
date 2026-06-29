'use client';

import { useSession } from 'next-auth/react';
import { ReactNode } from 'react';

interface PermissionGateProps {
  children: ReactNode;
  requiredPermission: string;
  fallback?: ReactNode;
}

/**
 * Granular RBAC Component.
 * Wraps sensitive UI elements and unmounts them if the current user session
 * lacks the `requiredPermission`.
 * 
 * Example usage:
 * <PermissionGate requiredPermission="manage:users">
 *   <button>Delete User</button>
 * </PermissionGate>
 */
export function PermissionGate({ children, requiredPermission, fallback = null }: PermissionGateProps) {
  const { data: session, status } = useSession();

  // If loading or unauthenticated, do not render the protected content
  if (status === 'loading' || status === 'unauthenticated') {
    return <>{fallback}</>;
  }

  const permissions = session?.user?.permissions || [];

  // Super Admin implicitly has all permissions
  if (session?.user?.roleName === 'SUPER_ADMIN') {
    return <>{children}</>;
  }

  const hasPermission = permissions.includes(requiredPermission);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
