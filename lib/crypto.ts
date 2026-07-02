/// <reference types="node" />
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex') // Must be 32 bytes (256 bits)
const ALGORITHM = 'aes-256-gcm'

/**
 * Encrypts a plaintext string.
 */
export function encryptPII(text: string): string {
  if (!text) return text
  
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag().toString('hex')
  
  // Format: iv:authTag:encryptedText
  return `${iv.toString('hex')}:${authTag}:${encrypted}`
}

/**
 * Decrypts a ciphertext string.
 */
export function decryptPII(ciphertext: string): string {
  if (!ciphertext || !ciphertext.includes(':')) return ciphertext
  
  try {
    const [ivHex, authTagHex, encryptedText] = ciphertext.split(':')
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), Buffer.from(ivHex, 'hex'))
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'))
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (err) {
    console.error('PII Decryption failed:', err)
    return 'DECRYPTION_ERROR'
  }
}

/**
 * Masks a string, e.g., Passport or CC number.
 * "AB1234567" -> "AB1***567" or "XXXXXXXX1234"
 */
export function maskIdentity(identity: string): string {
  if (!identity) return ''
  
  // Keep first 2 and last 3 characters, mask the rest
  if (identity.length <= 5) return identity.replace(/./g, '*')
  
  const first = identity.substring(0, 2)
  const last = identity.substring(identity.length - 3)
  const masked = '*'.repeat(identity.length - 5)
  
  return `${first}${masked}${last}`
}
