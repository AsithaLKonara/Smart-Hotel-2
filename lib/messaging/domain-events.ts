export type DomainEventType = 
  | 'BookingCreated'
  | 'BookingCancelled'
  | 'CheckInCompleted'
  | 'CheckOutCompleted'
  | 'RoomStatusChanged'
  | 'PaymentReceived'
  | 'MaintenanceCreated'
  | 'InventoryUpdated'
  | 'FolioCreated'
  | 'FolioLineItemAdded';

export interface DomainEvent<T = any> {
  eventId: string;
  eventType: DomainEventType;
  aggregateId: string;
  payload: T;
  occurredAt: Date;
  metadata?: Record<string, any>;
}

export interface BookingCreatedPayload {
  bookingId: string;
  guestId?: string;
  roomId?: string; // Legacy
  checkInDate: string;
  checkOutDate: string;
}

export interface CheckInCompletedPayload {
  bookingId: string;
  roomAssignmentId: string;
  stayEventId: string;
  checkInTime: string;
}

export interface CheckOutCompletedPayload {
  bookingId: string;
  checkInDate: string;
  checkOutDate: string;
}

export interface RoomStatusChangedPayload {
  roomId: string;
  oldStatus: string;
  newStatus: string;
}

export interface PaymentReceivedPayload {
  paymentId: string;
  folioId?: string;
  bookingId?: string; // Legacy
  amount: number;
  currency: string;
}

export interface InventoryUpdatedPayload {
  itemId: string;
  movementId: string;
  quantityChange: number;
  newQuantity: number;
  type: string;
}
