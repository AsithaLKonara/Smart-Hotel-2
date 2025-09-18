import { NextRequest } from 'next/server'

interface SecretConfig {
  name: string
  required: boolean
  defaultValue?: string
}

// Secret configuration for different environments
const SECRET_CONFIGS: Record<string, SecretConfig> = {
  DATABASE_URL: {
    name: 'DATABASE_URL',
    required: true
  },
  NEXTAUTH_SECRET: {
    name: 'NEXTAUTH_SECRET',
    required: true
  },
  STRIPE_SECRET_KEY: {
    name: 'STRIPE_SECRET_KEY',
    required: true
  },
  STRIPE_PUBLISHABLE_KEY: {
    name: 'STRIPE_PUBLISHABLE_KEY',
    required: true
  },
  STRIPE_WEBHOOK_SECRET: {
    name: 'STRIPE_WEBHOOK_SECRET',
    required: true
  },
  SMTP_HOST: {
    name: 'SMTP_HOST',
    required: false,
    defaultValue: ''
  },
  SMTP_USER: {
    name: 'SMTP_USER',
    required: false,
    defaultValue: ''
  },
  SMTP_PASS: {
    name: 'SMTP_PASS',
    required: false,
    defaultValue: ''
  },
  REDIS_URL: {
    name: 'REDIS_URL',
    required: false,
    defaultValue: 'redis://localhost:6379'
  },
  ADMIN_EMAIL: {
    name: 'ADMIN_EMAIL',
    required: false,
    defaultValue: 'admin@smarthotel.com'
  }
}

class SimpleSecretsManager {
  private secrets: Map<string, string> = new Map()
  private initialized = false

  async initialize() {
    if (this.initialized) return

    try {
      // Load from environment variables (Vercel compatible)
      await this.loadFromEnvironment()
      
      this.initialized = true
      console.log('✅ Secrets manager initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize secrets manager:', error)
      throw error
    }
  }

  private async loadFromEnvironment() {
    for (const [key, config] of Object.entries(SECRET_CONFIGS)) {
      const value = process.env[key]
      if (value) {
        this.secrets.set(key, value)
      } else if (config.required) {
        throw new Error(`Required environment variable ${key} not found`)
      } else if (config.defaultValue) {
        this.secrets.set(key, config.defaultValue)
      }
    }
  }

  get(key: string): string {
    if (!this.initialized) {
      throw new Error('Secrets manager not initialized. Call initialize() first.')
    }
    
    const value = this.secrets.get(key)
    if (!value && SECRET_CONFIGS[key]?.required) {
      throw new Error(`Required secret ${key} not found`)
    }
    
    return value || ''
  }

  getAll(): Record<string, string> {
    if (!this.initialized) {
      throw new Error('Secrets manager not initialized. Call initialize() first.')
    }
    
    return Object.fromEntries(this.secrets)
  }

  // Validate that all required secrets are present
  validate(): { valid: boolean; missing: string[] } {
    const missing: string[] = []
    
    for (const [key, config] of Object.entries(SECRET_CONFIGS)) {
      if (config.required && !this.secrets.has(key)) {
        missing.push(key)
      }
    }
    
    return {
      valid: missing.length === 0,
      missing
    }
  }
}

// Singleton instance
const secretsManager = new SimpleSecretsManager()

// Initialize on module load
secretsManager.initialize().catch(error => {
  console.error('Failed to initialize secrets manager:', error)
  // Don't exit in production, just log the error
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1)
  }
})

export default secretsManager

// Helper function to get secrets in API routes
export async function getSecret(key: string): Promise<string> {
  await secretsManager.initialize()
  return secretsManager.get(key)
}

// Helper function to get all secrets
export async function getAllSecrets(): Promise<Record<string, string>> {
  await secretsManager.initialize()
  return secretsManager.getAll()
}

// Validation function
export async function validateSecrets(): Promise<{ valid: boolean; missing: string[] }> {
  await secretsManager.initialize()
  return secretsManager.validate()
}
