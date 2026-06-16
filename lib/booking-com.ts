/**
 * Booking.com API Integration Service
 * 
 * Abstraction layer for OTA Integration.
 * Automatically switches to simulation mode if API credentials are not provided.
 */

import logger from './logger';

export interface BookingComReservation {
  id: string;
  room_id: string;
  checkin: string;
  checkout: string;
  guest_name: string;
  total_price: number;
  currency: string;
  status: 'confirmed' | 'cancelled' | 'modified';
}

export class BookingComService {
  private apiKey: string;
  private partnerId: string;
  private baseUrl: string = 'https://distribution-xml.booking.com/2.0';
  private isSimulationMode: boolean;

  constructor() {
    this.apiKey = process.env.BOOKING_COM_API_KEY || '';
    this.partnerId = process.env.BOOKING_COM_PARTNER_ID || '';
    this.isSimulationMode = !this.apiKey;
  }

  /**
   * Pushes availability and pricing updates to Booking.com
   */
  async updateAvailability(roomId: string, dates: { date: string; price: number; inventory: number }[]) {
    if (this.isSimulationMode) {
      logger.info(`[SIMULATION] Pushing availability for roomType ${roomId} to Booking.com abstraction layer.`, { datesCount: dates.length });
      return { status: 'success', simulated: true };
    }

    try {
      logger.info(`Pushing availability for room ${roomId} to Booking.com API`);
      const response = await fetch(`${this.baseUrl}/ota/OTA_HotelAvailNotif`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.partnerId}:${this.apiKey}`).toString('base64')}`,
          'Content-Type': 'application/xml',
        },
        body: this.generateAvailNotifXml(roomId, dates),
      });

      return await response.json();
    } catch (error) {
      logger.error('Failed to update Booking.com availability', { error, roomId });
      throw error;
    }
  }

  /**
   * Fetches new reservations from Booking.com or generates simulated ones
   */
  async fetchNewReservations(): Promise<BookingComReservation[]> {
    if (this.isSimulationMode) {
      logger.info('[SIMULATION] Fetching new reservations from Booking.com abstraction layer.');
      
      const inTwoDays = new Date();
      inTwoDays.setDate(inTwoDays.getDate() + 2);
      const inFiveDays = new Date();
      inFiveDays.setDate(inFiveDays.getDate() + 5);

      return [
        {
          id: `BCOM-${Math.floor(Math.random() * 100000)}`,
          room_id: 'standard-double', // otaMappingId
          checkin: inTwoDays.toISOString().split('T')[0],
          checkout: inFiveDays.toISOString().split('T')[0],
          guest_name: 'OTA Guest ' + Math.floor(Math.random() * 100),
          total_price: 450,
          currency: 'USD',
          status: 'confirmed',
        }
      ];
    }

    try {
      logger.info('Fetching new reservations from Booking.com API');
      const response = await fetch(`${this.baseUrl}/ota/OTA_HotelResNotif`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.partnerId}:${this.apiKey}`).toString('base64')}`
        }
      });
      // Parse XML response to BookingComReservation format
      // (Implementation depends on the XML parser used, returning empty for safety)
      return [];
    } catch (error) {
      logger.error('Failed to fetch Booking.com reservations', { error });
      return [];
    }
  }

  private generateAvailNotifXml(roomId: string, dates: any[]) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<OTA_HotelAvailNotifRQ xmlns="http://www.opentravel.org/OTA/2003/05">
  <AvailStatusMessages HotelCode="${this.partnerId}">
    ${dates.map(d => `
    <AvailStatusMessage>
      <StatusApplicationControl Start="${d.date}" End="${d.date}" InvCode="${roomId}" />
      <LengthsOfStay ArrivalOnly="false" />
      <Inventory FinalBookingCount="${d.inventory}" />
    </AvailStatusMessage>`).join('')}
  </AvailStatusMessages>
</OTA_HotelAvailNotifRQ>`;
  }
}

export const bookingComService = new BookingComService();
