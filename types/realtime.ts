import { z } from 'zod'

/**
 * Enterprise Real-time Event Schema (v1)
 * Standardizes all events emitted across the SmartHotel OS event bus.
 */

export const RealtimeEventSchema = z.object({
  v: z.number().default(1),
  ts: z.string().datetime(),
  actor: z.string().optional(),
  propertyId: z.string().optional(),
})

// --- Entity Specific Schemas ---

export const BookingEventSchema = RealtimeEventSchema.extend({
  type: z.enum(['booking.created', 'booking.updated', 'booking.cancelled']),
  bookingId: z.string(),
  status: z.string().optional(),
})

export const RoomEventSchema = RealtimeEventSchema.extend({
  type: z.enum(['room.status_changed', 'inventory.availability_updated']),
  roomId: z.string(),
  status: z.string().optional(),
  available: z.boolean().optional(),
})

export const KitchenOrderEventSchema = RealtimeEventSchema.extend({
  type: z.enum(['KITCHEN_ORDER_NEW', 'KITCHEN_ORDER_UPDATE']),
  orderId: z.string(),
  status: z.string(),
  roomNumber: z.string().optional(),
})

export const TaskEventSchema = RealtimeEventSchema.extend({
  type: z.enum(['task.updated', 'task.assigned']),
  taskId: z.string(),
  status: z.string(),
  assignedTo: z.string().optional(),
})

export const KpiEventSchema = RealtimeEventSchema.extend({
  type: z.literal('kpis.refresh'),
  metrics: z.record(z.any()),
})

// --- Unified Type Definitions ---

export type RealtimeEvent = z.infer<typeof RealtimeEventSchema>
export type BookingEvent = z.infer<typeof BookingEventSchema>
export type RoomEvent = z.infer<typeof RoomEventSchema>
export type KitchenOrderEvent = z.infer<typeof KitchenOrderEventSchema>
export type TaskEvent = z.infer<typeof TaskEventSchema>
export type KpiEvent = z.infer<typeof KpiEventSchema>

export type SmartHotelEvent = 
  | BookingEvent 
  | RoomEvent 
  | KitchenOrderEvent 
  | TaskEvent 
  | KpiEvent
