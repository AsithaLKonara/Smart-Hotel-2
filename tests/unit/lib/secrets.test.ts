import { jest } from '@jest/globals'

const REQUIRED_ENV = {
  DATABASE_URL: 'mongodb://localhost:27017/smarthotel_test',
  NEXTAUTH_SECRET: 'test-secret',
  STRIPE_SECRET_KEY: 'sk_test_secret',
  STRIPE_PUBLISHABLE_KEY: 'pk_test_publish',
  STRIPE_WEBHOOK_SECRET: 'whsec_test',
}

describe('lib/secrets', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
    Object.assign(process.env, REQUIRED_ENV)
  })

  afterEach(() => {
    process.env = originalEnv
    jest.restoreAllMocks()
  })

  it('initializes secrets manager with environment values and exposes getters', async () => {
    delete process.env.ADMIN_EMAIL

    const { getSecret, getAllSecrets, validateSecrets } = await import('@/lib/secrets')

    await expect(getSecret('DATABASE_URL')).resolves.toBe(REQUIRED_ENV.DATABASE_URL)
    await expect(getSecret('NEXTAUTH_SECRET')).resolves.toBe(REQUIRED_ENV.NEXTAUTH_SECRET)

    const allSecrets = await getAllSecrets()
    expect(allSecrets).toMatchObject({
      DATABASE_URL: REQUIRED_ENV.DATABASE_URL,
      NEXTAUTH_SECRET: REQUIRED_ENV.NEXTAUTH_SECRET,
    })
    expect(allSecrets.ADMIN_EMAIL).toBe('admin@smarthotel.com')

    await expect(validateSecrets()).resolves.toEqual({ valid: true, missing: [] })
  })

  it('uses default values for optional secrets when not provided', async () => {
    delete process.env.REDIS_URL

    const { getSecret } = await import('@/lib/secrets')

    await expect(getSecret('REDIS_URL')).resolves.toBe('redis://localhost:6379')
  })

  it('returns empty string for optional SMTP secrets without defaults', async () => {
    delete process.env.SMTP_HOST

    const { getSecret } = await import('@/lib/secrets')

    await expect(getSecret('SMTP_HOST')).resolves.toBe('')
  })

  it('throws when required secret is missing from the cache', async () => {
    const module = await import('@/lib/secrets')
    const secretsManager = module.default as any
    await module.getAllSecrets()

    secretsManager.secrets.delete('STRIPE_SECRET_KEY')
    await expect(module.getSecret('STRIPE_SECRET_KEY')).rejects.toThrow('Required secret STRIPE_SECRET_KEY not found')
  })

  it('exits process when initialization fails outside production', async () => {
    process.env = { NODE_ENV: 'test' }

    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => undefined) as never)
    jest.spyOn(console, 'error').mockImplementation(() => {})

    jest.isolateModules(() => {
      require('@/lib/secrets')
    })

    await new Promise(resolve => setImmediate(resolve))
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  it('does not exit when initialization fails in production', async () => {
    process.env = {
      NODE_ENV: 'production',
    }
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => undefined) as never)
    jest.spyOn(console, 'error').mockImplementation(() => {})

    jest.isolateModules(() => {
      require('@/lib/secrets')
    })

    await new Promise(resolve => setImmediate(resolve))
    expect(exitSpy).not.toHaveBeenCalled()
  })
})

