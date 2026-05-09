import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import prisma, { connectWithRetry } from './db'
import { logAction, AUDIT_ACTIONS } from './audit'
import { isDatabaseConfigured } from './db-helpers'
// Note: UserRole enum doesn't exist in Prisma schema - define locally
type UserRole = 'GUEST' | 'STAFF' | 'MANAGER' | 'SUPER_ADMIN' | 'RECEPTIONIST'

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
          role: "GUEST",
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
          let user = null;
          if (isDatabaseConfigured()) {
            user = await connectWithRetry(async () => {
              return await prisma.user.findFirst({ 
                where: { email: credentials.email.toLowerCase().trim() } 
              })
            }, 3, 1000)
          } else {
            // Mock authentication for demo purposes when DB is not configured
            const demoUsers = [
              { email: 'admin@smarthotel.com', password: 'SmartHotel@2025!Admin', role: 'SUPER_ADMIN', name: 'Demo Admin' },
              { email: 'manager@smarthotel.com', password: 'SmartHotel@2025!Manager', role: 'MANAGER', name: 'Demo Manager' },
              { email: 'guest@example.com', password: 'SmartHotel@2025!Guest', role: 'GUEST', name: 'Demo Guest' }
            ]
            const demoUser = demoUsers.find(u => u.email === credentials.email.toLowerCase().trim())
            if (demoUser && credentials.password === demoUser.password) {
              return {
                id: 'demo-user-id',
                email: demoUser.email,
                name: demoUser.name,
                role: demoUser.role as UserRole,
              }
            }
          }
          
          console.info('Credentials authorize: user found', !!user)

          if (!user) {
            // Log failed login attempt (non-blocking)
            logAction(
              req as any,
              undefined,
              AUDIT_ACTIONS.USER_LOGIN,
              'User',
              undefined,
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
          if (user.role === 'GUEST' && !user.email.includes('@')) {
            // Additional checks for guest accounts if needed
          }

          // Log successful login (non-blocking)
          logAction(
            req as any,
            user.id,
            AUDIT_ACTIONS.USER_LOGIN,
            'User',
            user.id,
            { email: credentials.email, role: user.role }
          ).catch(err => console.error('Failed to log action:', err))

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role as UserRole,
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
          role: 'GUEST',
          hotelId: null,
          iat: 0,
        }
      }

      if (user) {
        token.id = user.id
        token.role = user.role
        token.hotelId = user.hotelId
      }
      
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as any
        session.user.hotelId = token.hotelId as string
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
  secret: process.env.NEXTAUTH_SECRET,
} 