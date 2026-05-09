import crypto from 'crypto'

export interface RequestSignatureDetails {
  apiKey: string
  signature: string
  nonce: string
  timestampMs: number
  payloadStr: string
}

export class ZeroTrustGateway {
  private static nonceRegistry = new Set<string>()
  private static secretsVault = new Map<string, string>()
  private static tenantIpWhitelist = new Map<string, Set<string>>()

  // Stores secure credentials dynamically inside our vault to prevent environment variable leaks
  static storeSecret(key: string, secretValue: string): void {
    this.secretsVault.set(key, secretValue)
  }

  static getSecret(key: string): string {
    return this.secretsVault.get(key) || process.env[key] || ''
  }

  // Configures allowed client IP addresses per tenant property
  static registerTenantIp(tenantId: string, ip: string): void {
    if (!this.tenantIpWhitelist.has(tenantId)) {
      this.tenantIpWhitelist.set(tenantId, new Set())
    }
    this.tenantIpWhitelist.get(tenantId)!.add(ip)
  }

  // Enforces IP gating for tenant access
  static validateClientIp(tenantId: string, clientIp: string): boolean {
    const whitelist = this.tenantIpWhitelist.get(tenantId)
    if (!whitelist) return true // If no IP list defined, default pass
    return whitelist.has(clientIp)
  }

  // Verifies requests using HMAC signatures, short-lived nonces, and timestamp checks (anti-replay defense)
  static verifyRequest(req: RequestSignatureDetails, tenantId: string, clientIp: string): {
    isValid: boolean
    reason?: string
  } {
    // 1. Enforce client IP check
    if (!this.validateClientIp(tenantId, clientIp)) {
      return { isValid: false, reason: 'SECURITY_BREACH: Client IP not allowed.' }
    }

    // 2. Enforce timestamp validity window (max 5 minutes) to block old stale payloads
    const now = Date.now()
    const fiveMinutesMs = 300000
    if (Math.abs(now - req.timestampMs) > fiveMinutesMs) {
      return { isValid: false, reason: 'SECURITY_BREACH: Request timestamp outside validity window.' }
    }

    // 3. Enforce single-use nonce checks to block playbacks
    if (this.nonceRegistry.has(req.nonce)) {
      return { isValid: false, reason: 'SECURITY_BREACH: Single-use request nonce has already been consumed.' }
    }

    // 4. Validate cryptographic HMAC-SHA256 signature
    const apiKeySecret = this.getSecret(`API_KEY_SECRET_${req.apiKey}`)
    if (!apiKeySecret) {
      return { isValid: false, reason: 'SECURITY_BREACH: Invalid or unmapped API key.' }
    }

    const payloadToSign = `${req.nonce}:${req.timestampMs}:${req.payloadStr}`
    const computedSignature = crypto
      .createHmac('sha256', apiKeySecret)
      .update(payloadToSign)
      .digest('hex')

    if (!crypto.timingSafeEqual(Buffer.from(computedSignature, 'hex'), Buffer.from(req.signature, 'hex'))) {
      return { isValid: false, reason: 'SECURITY_BREACH: Cryptographic signature mismatch.' }
    }

    // Register nonce as consumed
    this.nonceRegistry.add(req.nonce)
    return { isValid: true }
  }

  static clearRegistry(): void {
    this.nonceRegistry.clear()
    this.secretsVault.clear()
    this.tenantIpWhitelist.clear()
  }
}

export default ZeroTrustGateway
