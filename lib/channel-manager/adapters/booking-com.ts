import { ChannelConnector } from '../connector';
import { prisma } from '@/lib/db';
import { addDays, format } from 'date-fns';

export class BookingComAdapter implements ChannelConnector {
  public readonly providerCode = 'BOOKING_COM';

  private async getAccessToken(connectionId: string): Promise<string> {
    const connection = await prisma.channelConnection.findUnique({
      where: { id: connectionId }
    });

    if (!connection || !connection.clientId || !connection.clientSecretEncrypted) {
      throw new Error(`Invalid or missing credentials for connection: ${connectionId}`);
    }

    // If token is valid and not expiring within 5 minutes, reuse it
    if (connection.accessTokenEncrypted && connection.accessTokenExpiresAt) {
      const now = new Date();
      const expiresAt = new Date(connection.accessTokenExpiresAt);
      if (expiresAt.getTime() > now.getTime() + 300000) {
        return connection.accessTokenEncrypted; // Normally we'd decrypt this
      }
    }

    // Authenticate with Booking.com OAuth2 Machine-to-Machine endpoint
    const tokenUrl = connection.environment === 'PRODUCTION' 
      ? 'https://oauth.booking.com/token' 
      : 'https://oauth.test.booking.com/token';

    // Mock API call to get a new JWT token
    const mockNewToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock_token_${Date.now()}`;
    
    await prisma.channelConnection.update({
      where: { id: connectionId },
      data: {
        accessTokenEncrypted: mockNewToken,
        accessTokenExpiresAt: addDays(new Date(), 1) // Valid for 1 day
      }
    });

    return mockNewToken;
  }

  async connect(connectionId: string): Promise<boolean> {
    try {
      await this.getAccessToken(connectionId);
      
      await prisma.channelConnection.update({
        where: { id: connectionId },
        data: { status: 'HEALTHY' }
      });
      return true;
    } catch (error) {
      await prisma.channelConnection.update({
        where: { id: connectionId },
        data: { status: 'ERROR' }
      });
      return false;
    }
  }

  async disconnect(connectionId: string): Promise<boolean> {
    await prisma.channelConnection.update({
      where: { id: connectionId },
      data: { status: 'DISCONNECTED', accessTokenEncrypted: null, accessTokenExpiresAt: null }
    });
    return true;
  }

  async pullReservations(connectionId: string): Promise<any[]> {
    const token = await this.getAccessToken(connectionId);
    
    // In production, we would GET https://supply.booking.com/reservations
    // We mock receiving two reservations here
    const mockReservations = [
      {
        id: `BKG-${Math.floor(Math.random() * 1000000)}`,
        status: 'CONFIRMED',
        room_id: 'EXT_ROOM_1',
        rate_id: 'EXT_RATE_1',
        checkin: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
        checkout: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
        guest_name: 'John Doe'
      }
    ];

    return mockReservations;
  }

  async acknowledgeReservation(connectionId: string, externalReservationId: string): Promise<boolean> {
    const token = await this.getAccessToken(connectionId);
    
    // In production, we would POST to https://supply.booking.com/reservations/{id}/acknowledgement
    return true;
  }

  async pushAvailability(connectionId: string, externalRoomId: string, timeline: Record<string, number>): Promise<boolean> {
    const token = await this.getAccessToken(connectionId);
    
    // In production, we would construct the XML/JSON for OTA_HotelAvailNotifRQ
    // and POST to https://supply.booking.com/availability
    return true;
  }

  async pushRates(connectionId: string, externalRateId: string, timeline: Record<string, number>): Promise<boolean> {
    const token = await this.getAccessToken(connectionId);
    
    // In production, we would construct the XML/JSON for OTA_HotelRateAmountNotifRQ
    return true;
  }

  async healthCheck(connectionId: string): Promise<{ isHealthy: boolean; message?: string }> {
    try {
      await this.getAccessToken(connectionId);
      return { isHealthy: true, message: 'Connected and authenticated' };
    } catch (err: any) {
      return { isHealthy: false, message: err.message };
    }
  }
}
