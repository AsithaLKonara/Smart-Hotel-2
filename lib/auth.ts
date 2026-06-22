import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import prisma, { connectWithRetry } from './db'
import { User as PrismaUser } from '@prisma/client'
import { logAction, AUDIT_ACTIONS } from './audit'
import { isDatabaseConfigured } from './db-helpers'

export const authOptions: NextAuthOptions = {
  ...(isDatabaseConfigured() ? { adapter: PrismaAdapter(prisma) } : {}),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
    {
      id: "facebook",
      name: "Facebook",
      type: "oauth",
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
      wellKnown: "https://www.facebook.com/.well-known/openid-configuration/",
      authorization: { params: { scope: "email,public_profile" } },
      idToken: true,
      profile(profile) {
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          image: profile.picture.data.url,
          roleName: "GUEST",
          permissions: [],
        }
      },
    },
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          console.warn('Credentials authorize: missing email or password')
          return null
        }

        try {
          console.info('Credentials authorize: lookup user', credentials.email)
          
          // Use connection retry wrapper to handle MongoDB Atlas sleeping
          let user: PrismaUser & { role?: any } | null = null;
          if (isDatabaseConfigured()) {
            user = await connectWithRetry(async () => {
              return await prisma.user.findFirst({ 
                where: { email: credentials.email.toLowerCase().trim() },
                include: {
                  role: {
                    include: {
                      permissions: {
                        include: { permission: true }
                      }
                    }
                  }
                }
              })
            }, 3, 1000)
          } else {
            // Mock authentication for demo purposes when DB is not configured
            const demoUsers = [
              { email: 'admin@smarthotel.com', password: 'SmartHotel@2025!Admin', roleName: 'SUPER_ADMIN', name: 'Demo Admin' },
              { email: 'manager@smarthotel.com', password: 'SmartHotel@2025!Manager', roleName: 'MANAGER', name: 'Demo Manager' },
              { email: 'guest@example.com', password: 'SmartHotel@2025!Guest', roleName: 'GUEST', name: 'Demo Guest' }
            ]
            const demoUser = demoUsers.find(u => u.email === credentials.email.toLowerCase().trim())
            if (demoUser && credentials.password === demoUser.password) {
              return {
                id: 'demo-user-id',
                email: demoUser.email,
                name: demoUser.name,
                roleName: demoUser.roleName,
                permissions: demoUser.roleName === 'SUPER_ADMIN' ? ['*'] : [],
              }
            }
          }
          
          console.info('Credentials authorize: user found', !!user)

          if (!user) {
            // Log failed login attempt (non-blocking)
            logAction(
              req as any,
              'GUEST',
              AUDIT_ACTIONS.USER_LOGIN,
              'User',
              'unknown',
              { email: credentials.email, reason: 'User not found' }
            ).catch(err => console.error('Failed to log action:', err))
            return null
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          console.info('Credentials authorize: password valid', isPasswordValid)

          if (!isPasswordValid) {
            // Log failed login attempt (non-blocking)
            logAction(
              req as any,
              user.id,
              AUDIT_ACTIONS.USER_LOGIN,
              'User',
              user.id,
              { email: credentials.email, reason: 'Invalid password' }
            ).catch(err => console.error('Failed to log action:', err))
            return null
          }

          // Check if user account is active
          if (user.role?.name === 'GUEST' && !user.email.includes('@')) {
            // Additional checks for guest accounts if needed
          }

          // Log successful login (non-blocking)
          logAction(
            req as any,
            user.id,
            AUDIT_ACTIONS.USER_LOGIN,
            'User',
            user.id,
            { email: credentials.email, roleName: user.role?.name }
          ).catch(err => console.error('Failed to log action:', err))

          const permissions = user.role?.name?.permissions?.map((p: any) => p.permission.action) || [];

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            roleId: user.roleId,
            roleName: user.role?.name,
            permissions,
            hotelId: (user as any).hotelId || null,
          }
        } catch (error) {
          console.error('Authentication error:', error)
          // Log the error for debugging
          if (error instanceof Error) {
            console.error('Authentication error details:', {
              message: error.message,
              stack: error.stack
            })
          }
          return null
        }
      }
    })
  ],
  session: { 
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours (reduced for security)
    updateAge: 30 * 60, // 30 minutes
  },
  jwt: {
    maxAge: 8 * 60 * 60, // 8 hours
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Set iat if not present (isolated unit test support)
      if (!token.iat) {
        token.iat = Math.floor(Date.now() / 1000)
      }

      // Check if token has expired (older than 8 hours)
      const maxAgeSeconds = 8 * 60 * 60
      const currentTimestamp = Math.floor(Date.now() / 1000)
      if (token.iat && (currentTimestamp - (token.iat as number)) > maxAgeSeconds) {
        return {
          id: '',
          roleId: null,
          roleName: 'GUEST',
          permissions: [],
          hotelId: null,
          iat: 0,
        }
      }

      if (user) {
        token.id = user.id
        token.roleId = user.roleId
        token.roleName = (user as any).roleName || (user as any).role?.name
        token.permissions = user.permissions || []
        token.hotelId = user.hotelId
      }
      
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.roleId = token.roleId as string | undefined
        if (!(session.user as any).role) {
          (session.user as any).role = { name: token.roleName as string };
        } else {
          (session.user as any).role.name = token.roleName as string;
        }
        (session.user as any).roleName = token.roleName as string | undefined
        session.user.permissions = token.permissions as string[] || []
        session.user.hotelId = token.hotelId as string | undefined
      }
      return session
    },
    async signIn({ user, account, profile, email, credentials }) {
      // Additional sign-in validation can be added here
      return true
    }
  },
  pages: { 
    signIn: '/auth/signin'
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.callback-url' : 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production' ? '__Host-next-auth.csrf-token' : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
} 