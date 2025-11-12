/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals'

describe('lib/push-notifications', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }

    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'info').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})

    Object.defineProperty(window, 'focus', {
      configurable: true,
      writable: true,
      value: jest.fn(),
    })

    Object.defineProperty(global, 'Notification', {
      configurable: true,
      writable: true,
      value: undefined,
    })

    Object.defineProperty(global, 'navigator', {
      configurable: true,
      writable: true,
      value: {
        ...navigator,
      },
    })

    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
    process.env = originalEnv
  })

  function installNotification({
    permission = 'default',
    requestPermission = jest.fn().mockResolvedValue('default'),
  }: {
    permission?: NotificationPermission
    requestPermission?: jest.Mock
  } = {}) {
    const instances: any[] = []

    const MockNotification = jest.fn(function (this: any, title: string, options: NotificationOptions) {
      this.title = title
      this.options = options
      this.close = jest.fn()
      this.onclick = null
      instances.push(this)
    }) as unknown as jest.MockedClass<typeof Notification>

    MockNotification.permission = permission
    MockNotification.requestPermission = requestPermission as any

    Object.defineProperty(window, 'Notification', {
      configurable: true,
      writable: true,
      value: MockNotification,
    })

    return { MockNotification: MockNotification as typeof Notification, instances }
  }

  it('requestNotificationPermission returns false when notifications unsupported', async () => {
    const { requestNotificationPermission } = await import('@/lib/push-notifications')

    // @ts-expect-error intentionally removing Notification
    delete window.Notification

    const granted = await requestNotificationPermission()
    expect(granted).toBe(false)
    expect(console.warn).toHaveBeenCalledWith('This browser does not support notifications')
  })

  it('requestNotificationPermission resolves based on Notification permission state', async () => {
    const { MockNotification } = installNotification({ permission: 'granted' })
    const { requestNotificationPermission } = await import('@/lib/push-notifications')

    await expect(requestNotificationPermission()).resolves.toBe(true)
    expect(MockNotification.requestPermission).not.toHaveBeenCalled()

    MockNotification.permission = 'default'
    MockNotification.requestPermission.mockResolvedValueOnce('granted')
    await expect(requestNotificationPermission()).resolves.toBe(true)
    expect(MockNotification.requestPermission).toHaveBeenCalled()

    MockNotification.permission = 'denied'
    await expect(requestNotificationPermission()).resolves.toBe(false)
  })

  it('showNotification displays notification and closes automatically', async () => {
    jest.useFakeTimers()
    const { MockNotification, instances } = installNotification({ permission: 'granted' })
    const pushModule = await import('@/lib/push-notifications')

    await pushModule.showNotification({
      title: 'Hello',
      body: 'World',
      data: { url: '/dashboard' },
    })

    expect(MockNotification).toHaveBeenCalledWith(
      'Hello',
      expect.objectContaining({ body: 'World', icon: '/favicon.ico', badge: '/favicon.ico' }),
    )

    const instance = instances[0]
    expect(instance).toBeDefined()
    expect(typeof instance.onclick).toBe('function')
    instance.onclick()
    expect(instance.close).toHaveBeenCalled()

    jest.advanceTimersByTime(5000)
    expect(instance.close).toHaveBeenCalledTimes(2)
    jest.useRealTimers()
  })

  it('showNotification respects requireInteraction and uses provided assets', async () => {
    jest.useFakeTimers()
    const { MockNotification, instances } = installNotification({ permission: 'granted' })
    const pushModule = await import('@/lib/push-notifications')

    await pushModule.showNotification({
      title: 'Sticky',
      body: 'Stay open',
      icon: '/icon.png',
      badge: '/badge.png',
      requireInteraction: true,
    })

    const instance = instances[0]
    expect(instance).toBeDefined()
    jest.advanceTimersByTime(5000)
    expect(instance.close).not.toHaveBeenCalled()
    jest.useRealTimers()
  })

  it('subscribeToPushNotifications returns subscription and posts to server', async () => {
    installNotification({ permission: 'granted' })
    const subscription = { endpoint: 'https://push.example.com' }
    const subscribeMock = jest.fn().mockResolvedValue(subscription)
    ;(navigator as any).serviceWorker = {
      ready: Promise.resolve({
        pushManager: { subscribe: subscribeMock },
      }),
    }
    ;(window as any).PushManager = function () {} // truthy check
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true })
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'BMs_test-key'
    Object.defineProperty(window, 'atob', {
      configurable: true,
      writable: true,
      value: (input: string) => Buffer.from(input, 'base64').toString('binary'),
    })

    const { subscribeToPushNotifications } = await import('@/lib/push-notifications')
    const result = await subscribeToPushNotifications()

    expect(subscribeMock).toHaveBeenCalledWith({
      userVisibleOnly: true,
      applicationServerKey: expect.any(Uint8Array),
    })
    expect(global.fetch).toHaveBeenCalledWith('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    })
    expect(result).toBe(subscription)
  })

  it('subscribeToPushNotifications returns null when not supported', async () => {
    delete (navigator as any).serviceWorker
    delete (window as any).PushManager

    const { subscribeToPushNotifications } = await import('@/lib/push-notifications')

    const result = await subscribeToPushNotifications()
    expect(result).toBeNull()
    expect(console.warn).toHaveBeenCalledWith('Push notifications not supported')
  })

  it('subscribeToPushNotifications catches errors and logs', async () => {
    installNotification({ permission: 'granted' })
    ;(navigator as any).serviceWorker = {
      ready: Promise.resolve({
        pushManager: {
          subscribe: jest.fn().mockRejectedValue(new Error('push failed')),
        },
      }),
    }
    ;(window as any).PushManager = function () {}

    const { subscribeToPushNotifications } = await import('@/lib/push-notifications')
    const result = await subscribeToPushNotifications()

    expect(result).toBeNull()
    expect(console.error).toHaveBeenCalledWith(
      'Error subscribing to push notifications:',
      expect.any(Error),
    )
  })

  it('NotificationHelpers produce structured payloads', async () => {
    const { NotificationHelpers } = await import('@/lib/push-notifications')

    expect(NotificationHelpers.bookingConfirmed('ABC123')).toMatchObject({
      title: expect.stringContaining('Booking Confirmed'),
      data: { url: '/my-bookings', type: 'booking' },
      tag: 'booking-confirmed',
    })

    expect(NotificationHelpers.orderReady('ORDER-42')).toMatchObject({
      requireInteraction: true,
      tag: 'order-ready',
    })

    expect(NotificationHelpers.newMessage('Alex')).toMatchObject({
      body: expect.stringContaining('Alex'),
      tag: 'chat-message',
    })

    expect(NotificationHelpers.checkInReminder('2025-03-01')).toMatchObject({
      tag: 'checkin-reminder',
      data: { url: '/my-bookings', type: 'reminder' },
    })
  })
})

