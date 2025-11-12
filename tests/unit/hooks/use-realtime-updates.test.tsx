/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react'
import { useRealtimeUpdates } from '@/hooks/use-realtime-updates'

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

jest.mock('@/hooks/use-socket', () => ({
  useSocket: jest.fn(),
}))

describe('useRealtimeUpdates', () => {
  const mockUseSession = require('next-auth/react').useSession as jest.Mock
  const mockUseSocket = require('@/hooks/use-socket').useSocket as jest.Mock

  const socketOn = jest.fn()
  const socketOff = jest.fn()
  const socketEmit = jest.fn()

  beforeEach(() => {
    jest.useFakeTimers()
    socketOn.mockClear()
    socketOff.mockClear()
    socketEmit.mockClear()

    mockUseSession.mockReturnValue({ data: null })
    mockUseSocket.mockReturnValue({
      socket: {
        on: socketOn,
        off: socketOff,
        emit: socketEmit,
      },
      isConnected: true,
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('registers socket listeners and updates lastUpdate on events', () => {
    const mockHandlers: Record<string, (...args: unknown[]) => void> = {}
    socketOn.mockImplementation((event: string, handler: (...args: unknown[]) => void) => {
      mockHandlers[event] = handler
    })

    const { result, unmount } = renderHook(() => useRealtimeUpdates())

    expect(socketOn).toHaveBeenCalledTimes(5)
    expect(socketEmit).not.toHaveBeenCalled()
    expect(result.current.lastUpdate).toBeNull()

    const updateEvents = ['bookingCreated', 'bookingUpdated', 'orderStatusUpdated', 'orderReady', 'notificationReceived']
    updateEvents.forEach(event => {
      act(() => mockHandlers[event]?.({ id: event }))
      expect(result.current.lastUpdate).toBeInstanceOf(Date)
    })

    unmount()
    expect(socketOff).toHaveBeenCalledTimes(5)
  })

  it('joins and leaves admin room when user has elevated role', () => {
    const mockHandlers: Record<string, (...args: unknown[]) => void> = {}
    socketOn.mockImplementation((event: string, handler: (...args: unknown[]) => void) => {
      mockHandlers[event] = handler
    })

    mockUseSession.mockReturnValue({
      data: {
        user: { id: 'admin', role: 'MANAGER' },
      },
    })

    const { unmount } = renderHook(() => useRealtimeUpdates())
    expect(socketEmit).toHaveBeenCalledWith('joinAdminRoom')

    unmount()
    expect(socketEmit).toHaveBeenCalledWith('leaveAdminRoom')
  })

  it('skips setup when socket is unavailable', () => {
    mockUseSocket.mockReturnValue({
      socket: null,
      isConnected: false,
    })

    renderHook(() => useRealtimeUpdates())
    expect(socketOn).not.toHaveBeenCalled()
    expect(socketEmit).not.toHaveBeenCalled()
  })
})

