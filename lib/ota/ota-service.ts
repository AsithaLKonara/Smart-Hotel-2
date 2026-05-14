import { prisma } from '@/lib/db';
import { log } from '@/lib/logger';

export interface OtaAvailabilityUpdate {
  roomTypeId: string;
  date: string;
  availability: number;
  rate?: number;
}

/**
 * Pushes availability and pricing updates to the OTA middleware (Channex/Beds24)
 */
export async function pushAvailabilityToOTA(update: OtaAvailabilityUpdate) {
  const { roomTypeId, date, availability, rate } = update;

  try {
    // 1. Get mapping and config
    const mapping = await prisma.roomMapping.findFirst({
      where: { localRoomTypeId: roomTypeId, syncEnabled: true }
    });

    const config = await prisma.channelConfig.findFirst({
      where: { isEnabled: true }
    });

    if (!mapping || !config) {
      log.warn('OTA Push skipped: Missing mapping or active configuration', { roomTypeId });
      return;
    }

    // 2. Apply Safety Buffer and Markups
    // Safety Buffer: If availability is > 1, we subtract 1 to prevent last-second overbookings
    const bufferedAvailability = availability > 0 ? Math.max(0, availability - 1) : 0;

    // Price Markup: Apply the percentage from mapping (default 15%)
    const markup = mapping.priceMarkupPercentage || 15.0;
    const finalRate = rate ? Math.round(rate * (1 + markup / 100)) : undefined;

    const payload = {
      values: [{
        property_id: config.propertyId,
        room_type_id: mapping.otaRoomTypeId,
        date: date,
        availability: bufferedAvailability,
        ...(finalRate && { rate: finalRate })
      }]
    };

    // 3. Execute push
    const apiUrl = config.provider === 'CHANNEX' 
      ? 'https://api.channex.io/v1/availability' 
      : 'https://api.beds24.com/json/setAvailability'; // Placeholder for Beds24

    log.info(`Pushing OTA update to ${config.provider}`, { roomTypeId, date, availability });

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'user-api-key': config.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    // 4. Log the sync attempt
    await prisma.syncLog.create({
      data: {
        direction: 'PUSH',
        status: response.ok ? 'SUCCESS' : 'FAILED',
        entityType: 'AVAILABILITY',
        entityId: roomTypeId,
        payload: payload as any,
        errorMessage: response.ok ? null : JSON.stringify(result),
      }
    });

    if (!response.ok) {
      throw new Error(`OTA API Error: ${JSON.stringify(result)}`);
    }

    return result;
  } catch (error: any) {
    log.error('Failed to push availability to OTA', { error: error.message, roomTypeId });
    
    // Log failure even if fetch failed
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
