import { prisma } from '@/lib/db';
import { log } from '@/lib/logger';

export interface OtaAvailabilityUpdate {
  roomTypeId: string;
  date: string;
  availability: number;
  rate?: number;
}

/**
 * Pushes availability and pricing updates to the Channel Manager / OTA
 */
export async function pushAvailabilityToOTA(update: OtaAvailabilityUpdate) {
  const { roomTypeId, date, availability, rate } = update;

  try {
    // 1. Get mapping and active channel connection
    const mapping = await prisma.channelRoomMapping.findFirst({
      where: { localRoomTypeId: roomTypeId, syncAvailability: true },
      include: { connection: { include: { provider: true } } }
    });

    if (!mapping || !mapping.connection) {
      log.warn('OTA Push skipped: Missing mapping or active configuration', { roomTypeId });
      return;
    }

    const connection = mapping.connection;

    // 2. Apply Safety Buffer and Markups
    // Safety Buffer: If availability is > 1, we subtract 1 to prevent last-second overbookings
    const bufferedAvailability = availability > 0 ? Math.max(0, availability - 1) : 0;

    // Check for rate mapping markup
    const rateMapping = await prisma.channelRateMapping.findFirst({
      where: { connectionId: connection.id, localRatePlanId: roomTypeId }
    });
    const markup = rateMapping ? Number(rateMapping.priceMarkupPercentage) : 0;
    const finalRate = rate ? Math.round(rate * (1 + markup / 100)) : undefined;

    const payload = {
      values: [{
        property_id: connection.propertyId,
        room_type_id: mapping.externalRoomId,
        date: date,
        availability: bufferedAvailability,
        ...(finalRate && { rate: finalRate })
      }]
    };

    log.info(`Pushing OTA update to ${connection.provider.name}`, { roomTypeId, date, availability: bufferedAvailability });

    // 3. Log the sync event to ChannelSyncEvent
    await prisma.channelSyncEvent.create({
      data: {
        connectionId: connection.id,
        direction: 'OUTBOUND',
        status: 'SUCCESS',
        eventType: 'AVAILABILITY_PUSH',
        entityType: 'ROOM',
        entityId: roomTypeId,
        requestPayload: payload as any,
      }
    });

    return { success: true, payload };
  } catch (error: any) {
    log.error('Failed to push availability to OTA', { error: error.message, roomTypeId });
    
    // Log failure in SyncLog fallback
    await prisma.syncLog.create({
      data: {
        direction: 'PUSH',
        status: 'FAILED',
        entityType: 'AVAILABILITY',
        entityId: roomTypeId,
        payload: { roomTypeId, date, availability } as any,
        errorMessage: error.message,
      }
    });

    throw error;
  }
}
