import { jest } from '@jest/globals'
import { EventEmitter } from 'events'

const emitMock = jest.fn()
const toEmitMock = jest.fn()
const toMock = jest.fn(() => ({ emit: toEmitMock }))
const onMock = jest.fn()

const ServerConstructor = jest.fn(() => ({
  on: onMock,
  emit: emitMock,
  to: toMock,
}))

jest.mock('socket.io', () => ({
  Server: ServerConstructor,
}))

describe('lib/socket', () => {
  beforeEach(() => {
    jest.resetModules()
    emitMock.mockClear()
    toEmitMock.mockClear()
    toMock.mockClear()
    onMock.mockClear()
    ServerConstructor.mockClear()
    jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  it('initializes socket.io server with configuration and handlers', async () => {
    const fakeServer = new EventEmitter() as any
    const { initSocketIO, ioConfig } = await import('@/lib/socket')

    const io = initSocketIO(fakeServer)

    expect(ServerConstructor).toHaveBeenCalledWith(fakeServer, ioConfig)
    expect(io).toEqual({ on: onMock, emit: emitMock, to: toMock })
    expect(onMock).toHaveBeenCalledWith('connection', expect.any(Function))

    const connectionHandler = onMock.mock.calls.find(call => call[0] === 'connection')?.[1] as ((socket: any) => void) | undefined
    expect(connectionHandler).toBeDefined()

    const handlers = new Map<string, Function>()
    const broadcastEmit = jest.fn()
    const joinMock = jest.fn()
    const leaveMock = jest.fn()

    const socket = {
      id: 'socket-1',
      join: joinMock,
      leave: leaveMock,
      broadcast: { emit: broadcastEmit },
      on: jest.fn((event: string, handler: Function) => {
        handlers.set(event, handler)
      }),
    } as any

    connectionHandler?.(socket)

    expect(socket.on).toHaveBeenCalledWith('joinRoom', expect.any(Function))
    expect(socket.on).toHaveBeenCalledWith('leaveRoom', expect.any(Function))
    expect(socket.on).toHaveBeenCalledWith('joinAdminRoom', expect.any(Function))
    expect(socket.on).toHaveBeenCalledWith('leaveAdminRoom', expect.any(Function))
    expect(socket.on).toHaveBeenCalledWith('requestAvailabilityUpdate', expect.any(Function))
    expect(socket.on).toHaveBeenCalledWith('trackOrder', expect.any(Function))
    expect(socket.on).toHaveBeenCalledWith('stopTrackingOrder', expect.any(Function))

    handlers.get('joinRoom')?.('501')
    expect(joinMock).toHaveBeenCalledWith('room:501')

    handlers.get('leaveRoom')?.('501')
    expect(leaveMock).toHaveBeenCalledWith('room:501')

    handlers.get('joinAdminRoom')?.()
    expect(joinMock).toHaveBeenCalledWith('admin')

    handlers.get('leaveAdminRoom')?.()
    expect(leaveMock).toHaveBeenCalledWith('admin')

    handlers.get('requestAvailabilityUpdate')?.({ roomId: '301', available: false })
    expect(broadcastEmit).toHaveBeenCalledWith('availabilityUpdated', { roomId: '301', available: true })

    handlers.get('trackOrder')?.('order-1')
    expect(joinMock).toHaveBeenCalledWith('order:order-1')

    handlers.get('stopTrackingOrder')?.('order-1')
    expect(leaveMock).toHaveBeenCalledWith('order:order-1')
  })

  it('emits socket events through SocketEvents helpers', async () => {
    const { SocketEvents } = await import('@/lib/socket')
    const fakeIO = {
      emit: emitMock,
      to: toMock,
    } as any

    SocketEvents.setIO(fakeIO)

    SocketEvents.emitBookingCreated({ id: 'booking-1', roomId: 'room-1' })
    expect(emitMock).toHaveBeenCalledWith('bookingCreated', { id: 'booking-1', roomId: 'room-1' })
    expect(toMock).toHaveBeenCalledWith('admin')
    expect(toEmitMock).toHaveBeenCalledWith('newBookingAlert', { id: 'booking-1', roomId: 'room-1' })

    emitMock.mockClear()
    toMock.mockClear()
    toEmitMock.mockClear()

    SocketEvents.emitOrderStatusUpdated({ id: 'order-1' })
    expect(emitMock).toHaveBeenCalledWith('orderStatusUpdated', { id: 'order-1' })
    expect(toMock).toHaveBeenCalledWith('order:order-1')
    expect(toEmitMock).toHaveBeenCalledWith('orderStatusUpdated', { id: 'order-1' })

    emitMock.mockClear()
    SocketEvents.emitNotification('user-9', { message: 'Hello' })
    expect(toMock).toHaveBeenCalledWith('user:user-9')
    expect(toEmitMock).toHaveBeenCalledWith('notificationReceived', { message: 'Hello' })
  })
})
