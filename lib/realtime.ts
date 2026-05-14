import Pusher from 'pusher'

/**
 * Enterprise Real-time Infrastructure
 * Replaced Socket.IO with Pusher for serverless production compatibility.
 */
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || '',
  secret: process.env.PUSHER_SECRET || '',
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1',
  useTLS: true,
})

export const realtime = pusher

export class RealtimeEvents {
  private static CHANNEL_GLOBAL = 'global'
  private static CHANNEL_ADMIN = 'admin'

  // Booking events
  static async emitBookingCreated(booking: any) {
    await pusher.trigger(this.CHANNEL_GLOBAL, 'booking.created', booking)
    await pusher.trigger(this.CHANNEL_ADMIN, 'admin.alert.new_booking', booking)
  }

  static async emitBookingUpdated(booking: any) {
    await pusher.trigger(`booking-${booking.id}`, 'updated', booking)
    await pusher.trigger(this.CHANNEL_ADMIN, 'booking.updated', booking)
  }

  // Room & Inventory events
  static async emitRoomStatusChanged(room: any) {
    await pusher.trigger(this.CHANNEL_GLOBAL, 'room.status_changed', room)
    await pusher.trigger(`room-${room.id}`, 'status_changed', room)
  }

  static async emitAvailabilityUpdate(roomId: string, available: boolean) {
    await pusher.trigger(this.CHANNEL_GLOBAL, 'inventory.availability_updated', { roomId, available })
  }

  // Housekeeping & Staff events
  static async emitTaskUpdated(task: any) {
    await pusher.trigger(this.CHANNEL_ADMIN, 'task.updated', task)
    if (task.assignedTo) {
      await pusher.trigger(`staff-${task.assignedTo}`, 'task.assigned', task)
    }
  }

  // Operational Messaging
  static async emitOpsMessage(message: any) {
    await pusher.trigger('ops-center', 'new_message', message)
  }

  // Strategic KPI Updates
  static async emitKpiRefresh(metrics: any) {
    await pusher.trigger(this.CHANNEL_ADMIN, 'kpis.refresh', metrics)
  }
}
