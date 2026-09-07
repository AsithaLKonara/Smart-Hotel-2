/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST as DoorLocksPost } from '@/app/api/integrations/door-locks/route'
import { POST as OcrPost } from '@/app/api/integrations/ocr/route'
import { POST as WebhookPost } from '@/app/api/channels/webhook/route'
import { GET as ConfigGet } from '@/app/api/channels/config/route'

jest.mock('@/lib/auth-utils', () => {
  return {
    requireRoles: jest.fn(),
    requireAuth: jest.fn()
  }
})

import { requireRoles } from '@/lib/auth-utils'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

describe('Hardening Verification Tests', () => {
  const ORIGINAL_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...ORIGINAL_ENV }
    jest.clearAllMocks()
  })

  afterAll(() => {
    process.env = ORIGINAL_ENV
  })

  describe('RBAC Validation', () => {
    it('OCR should reject unauthenticated users', async () => {
      (requireRoles as jest.Mock).mockResolvedValue({
        errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        session: null
      })
      const req = new Request('http://localhost/api/integrations/ocr', { method: 'POST' })
      const res = await OcrPost(req)
      expect(res.status).toBe(401)
    })

    it('Door Locks should reject unauthorized roles', async () => {
      (requireRoles as jest.Mock).mockResolvedValue({
        errorResponse: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
        session: { user: { roleName: 'HOUSEKEEPING' } }
      })
      const req = new Request('http://localhost/api/integrations/door-locks', { method: 'POST' })
      const res = await DoorLocksPost(req)
      expect(res.status).toBe(403)
    })
  })

  describe('OCR Validation', () => {
    beforeEach(() => {
      (requireRoles as jest.Mock).mockResolvedValue({
        errorResponse: null,
        session: { user: { roleName: 'SUPER_ADMIN' } }
      })
    })

    it('should reject invalid base64', async () => {
      const req = new Request('http://localhost/api/integrations/ocr', {
        method: 'POST',
        body: JSON.stringify({ base64Image: 'invalid-base64!', documentType: 'PASSPORT' })
      })
      const res = await OcrPost(req)
      const data = await res.json()
      expect(res.status).toBe(400)
      expect(data.error).toBe('Validation failed')
    })
  })

  describe('Secrets Validation', () => {
    it('Webhook should fail closed if OTA_WEBHOOK_SECRET is missing', async () => {
      delete process.env.OTA_WEBHOOK_SECRET
      const req = new NextRequest('http://localhost/api/channels/webhook', { method: 'POST' })
      const res = await WebhookPost(req)
      expect(res.status).toBe(500)
    })
  })
})
