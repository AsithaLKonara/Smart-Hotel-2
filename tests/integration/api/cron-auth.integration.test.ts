/**
 * @jest-environment node
 */
import { GET } from '@/app/api/cron/night-audit/roll-forward/route'

describe('Cron Authentication (CFG-004)', () => {
  const ORIGINAL_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...ORIGINAL_ENV }
  })

  afterAll(() => {
    process.env = ORIGINAL_ENV
  })

  it('should return 500 Server Misconfiguration when CRON_SECRET is missing', async () => {
    // 1. Arrange: Unset the secret entirely
    delete process.env.CRON_SECRET

    const req = new Request('http://localhost/api/cron/night-audit/roll-forward', {
      method: 'GET'
    })

    // 2. Act
    const response = await GET(req)
    const json = await response.json()

    // 3. Assert
    expect(response.status).toBe(500)
    expect(json.error).toBe('Server Misconfiguration')
  })

  it('should return 401 Unauthorized when CRON_SECRET is present but Authorization header is missing', async () => {
    // 1. Arrange: Set a valid secret
    process.env.CRON_SECRET = 'valid-test-secret'

    const req = new Request('http://localhost/api/cron/night-audit/roll-forward', {
      method: 'GET'
    })

    // 2. Act
    const response = await GET(req)
    const json = await response.json()

    // 3. Assert
    expect(response.status).toBe(401)
    expect(json.error).toBe('Unauthorized')
  })
})
