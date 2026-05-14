/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from '@testing-library/react'
import { usePushNotifications } from '@/hooks/use-push-notifications'

jest.mock('@/lib/push-notifications', () => ({
  requestNotificationPermission: jest.fn(),
  subscribeToPushNotifications: jest.fn(),
  showNotification: jest.fn(),
  NotificationHelpers: {
    promptInstall: jest.fn(),
  },
}))

describe('usePushNotifications', () => {
  const originalNotification = global.Notification
  let originalServiceWorker: ServiceWorkerContainer | undefined
  const mockPushModule = require('@/lib/push-notifications')

  beforeEach(() => {
    const mockNotification = jest.fn()
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    global.Notification = mockNotification
    ;(global.Notification as any).permission = 'default'
    originalServiceWorker = navigator.serviceWorker
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {},
      configurable: true,
    })
    mockPushModule.requestNotificationPermission.mockResolvedValue(true)
    mockPushModule.subscribeToPushNotifications.mockResolvedValue({ endpoint: 'mock-endpoint' })
    mockPushModule.showNotification.mockResolvedValue(undefined)
  })

  afterEach(() => {
    global.Notification = originalNotification
    if (originalServiceWorker === undefined) {
      delete (navigator as any).serviceWorker
    } else {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: originalServiceWorker,
        configurable: true,
      })
    }
    jest.clearAllMocks()
    jest.resetModules()
  })

  it('initializes support state and subscribes when permission granted', async () => {
    const { result } = renderHook(() => usePushNotifications())

    await waitFor(() => expect(result.current.isSupported).toBe(true))
    expect(result.current.permission).toBe('default')

    await waitFor(() => expect(mockPushModule.requestNotificationPermission).toHaveBeenCalled())

    await waitFor(() => expect(mockPushModule.subscribeToPushNotifications).toHaveBeenCalled())
    expect(result.current.isSubscribed).toBe(true)
  })

  it('does not attempt subscription if permission denied', async () => {
    mockPushModule.requestNotificationPermission.mockResolvedValueOnce(false)

    renderHook(() => usePushNotifications())
    await waitFor(() => expect(mockPushModule.requestNotificationPermission).toHaveBeenCalled())

    expect(mockPushModule.subscribeToPushNotifications).not.toHaveBeenCalled()
  })

  it('exposes notify helper that delegates to showNotification', async () => {
    const { result } = renderHook(() => usePushNotifications())
    const payload = { title: 'Hello world', body: 'Test body' }

    await act(async () => {
      await result.current.notify(payload)
    })

    expect(mockPushModule.showNotification).toHaveBeenCalledWith(payload)
  })
})

