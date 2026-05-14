import { prisma } from '../db';
import { eventBus } from '../event-bus';

export interface OfflineReservation {
  id: string;
  roomId: string;
  userId: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  offlineTimestamp: string;
  syncSequence: number;
}

export class EdgePropertyRuntime {
  private static localReservationQueue: OfflineReservation[] = [];
  private static sequenceCounter = 0;
  private static isSatelliteLinkActive = true;

  /**
   * Drops or recovers the satellite connection status (simulating SRE outages)
   */
  static setSatelliteLinkStatus(active: boolean): void {
    this.isSatelliteLinkActive = active;
    
    eventBus.emit({
      id: `satellite-status-${Date.now().toString().slice(-4)}`,
      type: 'sre.satellite_link_changed',
      severity: active ? 'INFO' : 'CRITICAL',
      title: active ? 'Satellite Link Recovered' : 'Satellite Connection Severed',
      message: active 
        ? 'Broadband satellite connection restored. Initiating queued transactional sync.' 
        : 'SATELLITE SEVERED: Offline edge fallback runtime active. Operating locally.',
      metadata: { isSatelliteLinkActive: active },
      timestamp: new Date().toISOString()
    });
  }

  static getLinkStatus(): boolean {
    return this.isSatelliteLinkActive;
  }

  /**
   * Submits a reservation. If the satellite link is down, buffers the reservation locally in the edge outbox queue.
   */
  static async submitEdgeReservation(reservation: Omit<OfflineReservation, 'id' | 'offlineTimestamp' | 'syncSequence'>): Promise<{ id: string; status: 'ONLINE_COMMITTED' | 'EDGE_QUEUED' }> {
    const id = `res-edge-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const timestamp = new Date().toISOString();

    if (this.isSatelliteLinkActive) {
      // Direct commit to cloud DB
      await prisma.booking.create({
        data: {
          roomId: reservation.roomId,
          primaryGuestId: reservation.userId,
          checkIn: new Date(reservation.checkIn),
          checkOut: new Date(reservation.checkOut),
          totalAmount: 350,
          status: 'CONFIRMED',
          confirmationCode: id.slice(-6)
        }
      });

      return { id, status: 'ONLINE_COMMITTED' };
    } else {
      // Queue locally inside edge outbox cache
      this.sequenceCounter++;
      const offlineItem: OfflineReservation = {
        id,
        ...reservation,
        offlineTimestamp: timestamp,
        syncSequence: this.sequenceCounter
      };

      this.localReservationQueue.push(offlineItem);

      eventBus.emit({
        id: `offline-q-${id.slice(-4)}`,
        type: 'edge.offline_reservation_queued',
        severity: 'MEDIUM',
        title: 'Offline Booking Buffered At Edge',
        message: `Connection down. Reservation [${id}] for guest [${reservation.guestName}] cached locally (Seq #${this.sequenceCounter})`,
        metadata: { ...offlineItem },
        timestamp
      });

      return { id, status: 'EDGE_QUEUED' };
    }
  }

  /**
   * Replays and synchronizes all cached local offline reservations to the primary database
   */
  static async reconcileSatelliteConnection(): Promise<{ syncedCount: number; failedCount: number }> {
    if (!this.isSatelliteLinkActive) {
      throw new Error("Cannot reconcile: Satellite link is offline.");
    }

    let syncedCount = 0;
    let failedCount = 0;

    // Sort queue chronologically by sequence indices to prevent race conditions
    const sortedQueue = [...this.localReservationQueue].sort((a, b) => a.syncSequence - b.syncSequence);

    for (const res of sortedQueue) {
      try {
        await prisma.$transaction(async (tx: any) => {
          // Check for overbooking overlaps during checkout timestamps
          const overlap = await tx.booking.findFirst({
            where: {
              roomId: res.roomId,
              status: 'CONFIRMED',
              checkIn: { lte: new Date(res.checkOut) },
              checkOut: { gte: new Date(res.checkIn) }
            }
          });

          if (overlap) {
            throw new Error(`Double-booking overlap detected on Room [${res.roomId}] for offline record ${res.id}`);
          }

          await tx.booking.create({
            data: {
              roomId: res.roomId,
              primaryGuestId: res.userId,
              checkIn: new Date(res.checkIn),
              checkOut: new Date(res.checkOut),
              totalAmount: 350,
              status: 'CONFIRMED',
              confirmationCode: res.id.slice(-6)
            }
          });

          // Write SRE log of successful reconciliation
          await tx.auditLog.create({
            data: {
              userId: res.userId,
              actor: 'SATELLITE_RECONCILER',
              action: 'OFFLINE_SYNC_SUCCESS',
              resource: 'Booking',
              resourceId: res.id,
              details: {
                message: `Successfully synchronized offline edge booking [${res.id}]. Local Seq: ${res.syncSequence}`
              },
              createdAt: new Date()
            }
          });
        });

        syncedCount++;
      } catch (err) {
        console.error(`SRE Replay Sync Engine: Failure at Seq #${res.syncSequence}`, err);
        failedCount++;

        // Dispatch alert of overbooking quarantine
        eventBus.emit({
          id: `sync-fail-${res.id.slice(-4)}`,
          type: 'edge.sync_quarantined',
          severity: 'CRITICAL',
          title: 'Offline Sync Quarantined',
          message: `Booking conflict resolved: Record ${res.id} bypassed. Manual review required.`,
          metadata: { reservationId: res.id, guestName: res.guestName, reason: (err as Error).message },
          timestamp: new Date().toISOString()
        });
      }
    }

    // Flush successfully synced items
    this.localReservationQueue = [];
    return { syncedCount, failedCount };
  }

  static getLocalQueueLength(): number {
    return this.localReservationQueue.length;
  }
}

export default EdgePropertyRuntime;
