import NextAuth from 'next-auth'
// Note: UserRole enum doesn't exist in Prisma schema - define locally
type UserRole = 'GUEST' | 'STAFF' | 'MANAGER' | 'SUPER_ADMIN' | 'RECEPTIONIST'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: UserRole
      hotelId?: string | null
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role: UserRole
    hotelId?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
    hotelId?: string | null
  }
} 