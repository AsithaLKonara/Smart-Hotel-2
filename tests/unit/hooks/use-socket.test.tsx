/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from '@testing-library/react'
import { useSocket } from '@/hooks/use-socket'

jest.mock('socket.io-client', () => {
  const listeners: Record<string, Array<(...args: unknown[]) => void>> = {}

  return {
    io: jest.fn(() => ({
      on: jest.fn((event: string, handler: (...args: unknown[]) => void) => {
        listeners[event] = listeners[event] || []
        listeners[event].push(handler)
      }),
      close: jest.fn(() => {
        Object.keys(listeners).forEach(key => {
          listeners[key] = []
        })
      }),
      emit: jest.fn(),
    })),
    __listeners: listeners,
  }
})

describe('useSocket', () => {
  const originalFetch = global.fetch
  const mockIo = require('socket.io-client')

  beforeEach(() => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true })) as any
    ;(mockIo.io as jest.Mock).mockClear()
    Object.values(mockIo.__listeners as Record<string, unknown[]>).forEach(arr => arr.splice(0))
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('initializes socket connection in browser environment', async () => {
    const { result } = renderHook(() => useSocket())

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/socket'))
    await waitFor(() => expect(mockIo.io).toHaveBeenCalled())

    const connectListeners = mockIo.__listeners.connect as Array<() => void>
    const disconnectListeners = mockIo.__listeners.disconnect as Array<() => void>

    act(() => connectListeners.forEach(handler => handler()))
    expect(result.current.isConnected).toBe(true)
    expect(result.current.socket).not.toBeNull()

    act(() => disconnectListeners.forEach(handler => handler()))
    expect(result.current.isConnected).toBe(false)
  })

  it('does not initialize when running on the server', async () => {
    const originalWindow = global.window
    // Simulate server-side by removing window
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete global.window

    const { result } = renderHook(() => useSocket())
    expect(result.current.socket).toBeNull()
    expect(result.current.isConnected).toBe(false)

    await waitFor(() => expect(mockIo.io).not.toHaveBeenCalled())

    global.window = originalWindow
  })
})

