import Pusher from 'pusher'
import { 
  BookingEventSchema, 
  RoomEventSchema, 
  KitchenOrderEventSchema, 
  TaskEventSchema, 
  KpiEventSchema 
} from '@/types/realtime'

/**
 * Enterprise Real-time Infrastructure
 * Standardized on Pusher for high-availability distributed events.
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

  private static createBase() {
    return {
      v: 1,
      ts: new Date().toISOString(),
    }
  }

  // Booking events
  static async emitBookingCreated(booking: any) {
    const payload = BookingEventSchema.parse({
      ...this.createBase(),
      type: 'booking.created',
      bookingId: booking.id,
      status: booking.status,
    })
    await pusher.trigger(this.CHANNEL_GLOBAL, 'booking.created', payload)
    await pusher.trigger(this.CHANNEL_ADMIN, 'admin.alert.new_booking', payload)
  }

  static async emitBookingUpdated(booking: any) {
    const payload = BookingEventSchema.parse({
      ...this.createBase(),
      type: 'booking.updated',
      bookingId: booking.id,
      status: booking.status,
    })
    await pusher.trigger(`booking-${booking.id}`, 'updated', payload)
    await pusher.trigger(this.CHANNEL_ADMIN, 'booking.updated', payload)
  }

  // Room & Inventory events
  static async emitRoomStatusChanged(room: any) {
    const payload = RoomEventSchema.parse({
      ...this.createBase(),
      type: 'room.status_changed',
      roomId: room.id,
      status: room.status,
    })
    await pusher.trigger(this.CHANNEL_GLOBAL, 'room.status_changed', payload)
    await pusher.trigger(`room-${room.id}`, 'status_changed', payload)
  }

  static async emitAvailabilityUpdate(roomId: string, available: boolean) {
    const payload = RoomEventSchema.parse({
      ...this.createBase(),
      type: 'inventory.availability_updated',
      roomId,
      available,
    })
    await pusher.trigger(this.CHANNEL_GLOBAL, 'inventory.availability_updated', payload)
  }

  // Housekeeping & Staff events
  static async emitTaskUpdated(task: any) {
    const payload = TaskEventSchema.parse({
      ...this.createBase(),
      type: 'task.updated',
      taskId: task.id,
      status: task.status,
      assignedTo: task.assignedTo,
    })
    await pusher.trigger(this.CHANNEL_ADMIN, 'task.updated', payload)
    if (task.assignedTo) {
      await pusher.trigger(`staff-${task.assignedTo}`, 'task.assigned', payload)
    }
  }

  // Operational Messaging (Standardized)
  static async emitOpsMessage(message: any) {
    const payload = KitchenOrderEventSchema.parse({
      ...this.createBase(),
      type: message.type,
      orderId: message.orderId,
      status: message.status,
      roomNumber: message.roomNumber,
    })
    await pusher.trigger('ops-center', payload.type, payload)
  }

  // Strategic KPI Updates
  static async emitKpiRefresh(metrics: any) {
    const payload = KpiEventSchema.parse({
      ...this.createBase(),
      type: 'kpis.refresh',
      metrics,
    })
    await pusher.trigger(this.CHANNEL_ADMIN, 'kpis.refresh', payload)
  }
}
