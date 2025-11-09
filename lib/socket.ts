import { Server as NetServer } from 'http'
import { NextApiResponse } from 'next'
import { Server as ServerIO } from 'socket.io'

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: ServerIO
    }
  }
}

// Socket.IO event types
export interface ServerToClientEvents {
  // Booking events
  bookingCreated: (booking: any) => void
  bookingUpdated: (booking: any) => void
  bookingCancelled: (bookingId: string) => void
  
  // Room events
  roomStatusChanged: (room: any) => void
  availabilityUpdated: (data: { roomId: string; available: boolean }) => void
  
  // Order events
  orderCreated: (order: any) => void
  orderStatusUpdated: (order: any) => void
  orderReady: (order: any) => void
  
  // Notification events
  notificationReceived: (notification: any) => void
  
  // Admin events
  newBookingAlert: (booking: any) => void
  occupancyUpdate: (data: { date: string; occupancy: number }) => void
  revenueUpdate: (data: { period: string; amount: number }) => void
  
  // General events
  connection: () => void
  disconnect: () => void
}

export interface ClientToServerEvents {
  // Join rooms
  joinRoom: (roomId: string) => void
  leaveRoom: (roomId: string) => void
  joinAdminRoom: () => void
  leaveAdminRoom: () => void
  
  // Real-time updates
  requestAvailabilityUpdate: (data: { checkIn: string; checkOut: string }) => void
  requestOccupancyUpdate: () => void
  
  // Order tracking
  trackOrder: (orderId: string) => void
  stopTrackingOrder: (orderId: string) => void
}

export interface InterServerEvents {
  ping: () => void
}

export interface SocketData {
  userId?: string
  userRole?: string
  isAdmin?: boolean
}

// Socket.IO configuration
export const ioConfig = {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_APP_URL 
      : ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'] as any
}

// Initialize Socket.IO server
export function initSocketIO(server: NetServer) {
  const io = new ServerIO<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
    server,
    ioConfig
  )

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`)

    // Handle room joining
    socket.on('joinRoom', (roomId) => {
      socket.join(`room:${roomId}`)
      console.log(`Socket ${socket.id} joined room ${roomId}`)
    })

    socket.on('leaveRoom', (roomId) => {
      socket.leave(`room:${roomId}`)
      console.log(`Socket ${socket.id} left room ${roomId}`)
    })

    // Handle admin room joining
    socket.on('joinAdminRoom', () => {
      socket.join('admin')
      console.log(`Socket ${socket.id} joined admin room`)
    })

    socket.on('leaveAdminRoom', () => {
      socket.leave('admin')
      console.log(`Socket ${socket.id} left admin room`)
    })

    // Handle availability updates
    socket.on('requestAvailabilityUpdate', (data: any) => {
      // Broadcast to all clients in the room
      socket.broadcast.emit('availabilityUpdated', {
        roomId: data.roomId || 'all',
        available: data.available || true
      })
    })

    // Handle order tracking
    socket.on('trackOrder', (orderId) => {
      socket.join(`order:${orderId}`)
      console.log(`Socket ${socket.id} tracking order ${orderId}`)
    })

    socket.on('stopTrackingOrder', (orderId) => {
      socket.leave(`order:${orderId}`)
      console.log(`Socket ${socket.id} stopped tracking order ${orderId}`)
    })

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`)
    })
  })

  return io
}

// Socket.IO event emitters for server-side use
export class SocketEvents {
  private static io: ServerIO

  static setIO(io: ServerIO) {
    this.io = io
  }

  // Booking events
  static emitBookingCreated(booking: any) {
    this.io.emit('bookingCreated', booking)
    this.io.to('admin').emit('newBookingAlert', booking)
  }

  static emitBookingUpdated(booking: any) {
    this.io.emit('bookingUpdated', booking)
    this.io.to(`room:${booking.roomId}`).emit('bookingUpdated', booking)
  }

  static emitBookingCancelled(bookingId: string, roomId: string) {
    this.io.emit('bookingCancelled', bookingId)
    this.io.to(`room:${roomId}`).emit('bookingCancelled', bookingId)
  }

  // Room events
  static emitRoomStatusChanged(room: any) {
    this.io.emit('roomStatusChanged', room)
    this.io.to(`room:${room.id}`).emit('roomStatusChanged', room)
  }

  static emitAvailabilityUpdate(roomId: string, available: boolean) {
    this.io.emit('availabilityUpdated', { roomId, available })
  }

  // Order events
  static emitOrderCreated(order: any) {
    this.io.emit('orderCreated', order)
    this.io.to('admin').emit('orderCreated', order)
  }

  static emitOrderStatusUpdated(order: any) {
    this.io.emit('orderStatusUpdated', order)
    this.io.to(`order:${order.id}`).emit('orderStatusUpdated', order)
  }

  static emitOrderReady(order: any) {
    this.io.emit('orderReady', order)
    this.io.to(`order:${order.id}`).emit('orderReady', order)
  }

  // Notification events
  static emitNotification(userId: string, notification: any) {
    this.io.to(`user:${userId}`).emit('notificationReceived', notification)
  }

  // Admin events
  static emitOccupancyUpdate(data: { date: string; occupancy: number }) {
    this.io.to('admin').emit('occupancyUpdate', data)
  }

  static emitRevenueUpdate(data: { period: string; amount: number }) {
    this.io.to('admin').emit('revenueUpdate', data)
  }
}

// Client-side socket hook moved to hooks/use-socket.ts
