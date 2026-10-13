import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { NextResponse } from 'next/server';

/**
 * Ensures the request is authenticated.
 * Returns an error response if unauthorized, otherwise returns the session.
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null };
  }
  return { errorResponse: null, session };
}

/**
 * Ensures the request is authenticated and the user has one of the allowed roles.
 * Returns an error response if unauthorized or forbidden, otherwise returns the session.
 */
export async function requireRoles(allowedRoles: string[]) {
  const { errorResponse, session } = await requireAuth();
  if (errorResponse) return { errorResponse, session: null };
  
  const userRole = (session.user as any).role?.name || (session.user as any).roleName;
  if (!userRole || !allowedRoles.includes(userRole)) {
    return { errorResponse: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), session };
  }
  
  return { errorResponse: null, session };
}
