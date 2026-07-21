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
const isPusherConfigured = !!(
  process.env.PUSHER_APP_ID && 
  process.env.PUSHER_APP_ID !== 'dummy' &&
  !process.env.PUSHER_APP_ID.includes('YOUR_') &&
  process.env.NEXT_PUBLIC_PUSHER_KEY && 
  process.env.NEXT_PUBLIC_PUSHER_KEY !== 'dummy' &&
  !process.env.NEXT_PUBLIC_PUSHER_KEY.includes('YOUR_') &&
  process.env.PUSHER_SECRET &&
  process.env.PUSHER_SECRET !== 'dummy'
);

const pusherClient = isPusherConfigured 
  ? new Pusher({
      appId: process.env.PUSHER_APP_ID || '',
      key: process.env.NEXT_PUBLIC_PUSHER_KEY || '',
      secret: process.env.PUSHER_SECRET || '',
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1',
      useTLS: true,
    })
  : null;

const safeTrigger = async (channel: string, event: string, data: any) => {
  if (!pusherClient) return;
  try {
    await pusherClient.trigger(channel, event, data);
  } catch (err) {
    console.warn(`[PUSHER_WARNING] Failed to trigger event "${event}" on channel "${channel}":`, (err as any)?.message || err);
  }
};

export const realtime = pusherClient || ({ trigger: safeTrigger } as any);

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
    await safeTrigger(this.CHANNEL_GLOBAL, 'booking.created', payload)
    await safeTrigger(this.CHANNEL_ADMIN, 'admin.alert.new_booking', payload)
  }

  static async emitBookingUpdated(booking: any) {
    const payload = BookingEventSchema.parse({
      ...this.createBase(),
      type: 'booking.updated',
      bookingId: booking.id,
      status: booking.status,
    })
    await safeTrigger(`booking-${booking.id}`, 'updated', payload)
    await safeTrigger(this.CHANNEL_ADMIN, 'booking.updated', payload)
  }

  // Room & Inventory events
  static async emitRoomStatusChanged(room: any) {
    const payload = RoomEventSchema.parse({
      ...this.createBase(),
      type: 'room.status_changed',
      roomId: room.id,
      status: room.status,
    })
    await safeTrigger(this.CHANNEL_GLOBAL, 'room.status_changed', payload)
    await safeTrigger(`room-${room.id}`, 'status_changed', payload)
  }

  static async emitAvailabilityUpdate(roomId: string, available: boolean) {
    const payload = RoomEventSchema.parse({
      ...this.createBase(),
      type: 'inventory.availability_updated',
      roomId,
      available,
    })
    await safeTrigger(this.CHANNEL_GLOBAL, 'inventory.availability_updated', payload)
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
    await safeTrigger(this.CHANNEL_ADMIN, 'task.updated', payload)
    if (task.assignedTo) {
      await safeTrigger(`staff-${task.assignedTo}`, 'task.assigned', payload)
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
    await safeTrigger('ops-center', payload.type, payload)
  }

  // Strategic KPI Updates
  static async emitKpiRefresh(metrics: any) {
    const payload = KpiEventSchema.parse({
      ...this.createBase(),
      type: 'kpis.refresh',
      metrics,
    })
    await safeTrigger(this.CHANNEL_ADMIN, 'kpis.refresh', payload)
  }
}
