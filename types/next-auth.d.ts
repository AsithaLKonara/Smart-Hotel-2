import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      roleId?: string | null
      roleName?: string
      permissions: string[]
      hotelId?: string | null
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    roleId?: string | null
    roleName?: string
    permissions: string[]
    hotelId?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    roleId?: string | null
    roleName?: string
    permissions?: string[]
    hotelId?: string | null
  }
}