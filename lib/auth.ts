import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import prisma from './db'
import { logAction, AUDIT_ACTIONS } from './audit'
import { UserRole } from '@prisma/client'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true, // Allow linking accounts with same email
    }),
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
          const user = await prisma.user.findUnique({ 
            where: { email: credentials.email.toLowerCase().trim() } 
          })
          console.info('Credentials authorize: user found', !!user)

          if (!user) {
            // Log failed login attempt
            await logAction(
              req as any,
              undefined,
              AUDIT_ACTIONS.USER_LOGIN,
              'User',
              undefined,
              { email: credentials.email, reason: 'User not found' }
            )
            return null
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          console.info('Credentials authorize: password valid', isPasswordValid)

          if (!isPasswordValid) {
            // Log failed login attempt
            await logAction(
              req as any,
              user.id,
              AUDIT_ACTIONS.USER_LOGIN,
              'User',
              user.id,
              { email: credentials.email, reason: 'Invalid password' }
            )
            return null
          }

          // Check if user account is active
          if (user.role === 'GUEST' && !user.email.includes('@')) {
            // Additional checks for guest accounts if needed
          }

          // Log successful login
          await logAction(
            req as any,
            user.id,
            AUDIT_ACTIONS.USER_LOGIN,
            'User',
            user.id,
            { email: credentials.email, role: user.role }
          )

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            hotelId: user.hotelId,
          }
        } catch (error) {
          console.error('Authentication error:', error)
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
      if (user) {
        token.id = user.id
        token.role = user.role
        token.hotelId = user.hotelId
        token.iat = Math.floor(Date.now() / 1000)
      }
      
      // Add session validation
      if (token.iat && typeof token.iat === 'number' && Date.now() - (token.iat * 1000) > 8 * 60 * 60 * 1000) {
        // Token expired, force re-authentication
        return {
          id: '',
          role: 'GUEST' as UserRole,
          hotelId: null,
          iat: 0
        }
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
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'strict', // Stricter same-site policy
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 8 * 60 * 60, // 8 hours
      }
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: 'strict',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 8 * 60 * 60,
      }
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 8 * 60 * 60,
      }
    }
  }
} 