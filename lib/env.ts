import { z } from 'zod'

/**
 * Enterprise Environment Configuration & Validation
 * Standardizes access to all external services and secrets.
 * Fails fast on startup if critical keys are missing.
 */

const envSchema = z.object({
  // Core
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url().optional(),

  // Real-time (Pusher)
  PUSHER_APP_ID: z.string(),
  NEXT_PUBLIC_PUSHER_KEY: z.string(),
  PUSHER_SECRET: z.string(),
  NEXT_PUBLIC_PUSHER_CLUSTER: z.string().default('mt1'),

  // Persistence & Locking (Redis)
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string(),

  // Payments (Stripe)
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),

  // Storage (Cloudinary)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Messaging (Email)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  // External Integrations
  BOOKING_COM_API_KEY: z.string().optional(),
  AGODA_API_KEY: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

let _env: Env | null = null

export function validateEnv(): Env {
  if (_env) return _env

  const parsed = envSchema.safeParse(process.env)

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', JSON.stringify(parsed.error.format(), null, 2))
    throw new Error('Invalid environment variables')
  }

  _env = parsed.data
  return _env
}

// Typed environment access object
export const env = validateEnv()
