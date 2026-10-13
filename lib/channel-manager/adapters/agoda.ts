import { ChannelConnector } from '../connector';
import { prisma } from '@/lib/db';
import { AgodaClient } from '../clients/agoda-client';
import { buildAvailNotifRQ, buildRateAmountNotifRQ, AvailMessageItem, RateMessageItem } from '../serializers/agoda-xml';
import { log } from '@/lib/logger';

export class AgodaAdapter implements ChannelConnector {
  public readonly providerCode = 'AGODA';

  /**
   * Instantiates the AgodaClient using credentials in ChannelConnection
   */
  private async getClient(connectionId: string): Promise<AgodaClient> {
    const connection = await prisma.channelConnection.findUnique({
      where: { id: connectionId },
      include: { property: true }
    });

    if (!connection) {
      throw new Error(`Channel connection not found: ${connectionId}`);
    }

    const clientId = connection.clientId || '';
    const clientSecret = connection.clientSecretEncrypted || '';
    const hotelCode = connection.affiliateId || connection.clientId || connection.property.code;

    if (!clientId || !clientSecret) {
      throw new Error(`Agoda credentials (clientId / clientSecret) missing for connection ${connectionId}`);
    }

    return new AgodaClient({
      clientId,
      clientSecret,
      hotelCode,
      environment: connection.environment as any,
      connectionId: connection.id
    });
  }

  /**
   * Tests Agoda connectivity and initializes connection status
   */
  async connect(connectionId: string): Promise<boolean> {
    try {
      const client = await this.getClient(connectionId);
      const pingResult = await client.ping();

      await prisma.channelConnection.update({
        where: { id: connectionId },
        data: {
          status: pingResult.healthy ? 'HEALTHY' : 'WARNING',
          lastSuccessAt: pingResult.healthy ? new Date() : undefined,
          lastErrorAt: !pingResult.healthy ? new Date() : undefined
        }
      });

      return pingResult.healthy;
    } catch (error: any) {
      log.error('AgodaAdapter.connect failed', { connectionId, error: error.message });
      await prisma.channelConnection.update({
        where: { id: connectionId },
        data: { status: 'ERROR', lastErrorAt: new Date() }
      });
      return false;
    }
  }

  async disconnect(connectionId: string): Promise<boolean> {
    await prisma.channelConnection.update({
      where: { id: connectionId },
      data: {
        status: 'DISCONNECTED',
        accessTokenEncrypted: null,
        accessTokenExpiresAt: null
      }
    });
    return true;
  }

  /**
   * Pulls recently ingested reservations recorded for this Agoda connection
   */
  async pullReservations(connectionId: string): Promise<any[]> {
    const recentReservations = await prisma.channelReservation.findMany({
      where: { connectionId },
      orderBy: { receivedAt: 'desc' },
      take: 50
    });

    return recentReservations.map((r: any) => r.payload);
  }

  /**
   * Acknowledges that a reservation was successfully processed
   */
  async acknowledgeReservation(connectionId: string, externalReservationId: string): Promise<boolean> {
    try {
      await prisma.channelReservation.updateMany({
        where: {
          connectionId,
          externalReservationId
        },
        data: {
          acknowledgedAt: new Date()
        }
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Pushes daily room availability to Agoda via OTA_HotelAvailNotifRQ
   */
  async pushAvailability(connectionId: string, externalRoomId: string, timeline: Record<string, number>): Promise<boolean> {
    try {
      const client = await this.getClient(connectionId);
      const hotelCode = client.getHotelCode();

      // Transform daily timeline to AvailMessageItems
      const items: AvailMessageItem[] = Object.entries(timeline).map(([date, count]) => ({
        startDate: date,
        endDate: date,
        invTypeCode: externalRoomId,
        bookingLimit: Math.max(0, count)
      }));

      if (items.length === 0) {
        return true;
      }

      // Build OpenTravel XML
      const xmlPayload = buildAvailNotifRQ(hotelCode, items);

      log.info(`[AGODA_ADAPTER] Pushing availability for room ${externalRoomId} (${items.length} days)`, {
        connectionId,
        hotelCode
      });

      const { status, body } = await client.postXml(xmlPayload);

      // Verify response contains <Success />
      const isSuccess = status === 200 && (body.includes('<Success') || body.includes('<Success/>'));

      if (!isSuccess) {
        log.error('[AGODA_ADAPTER] Availability push rejected by Agoda', { status, body });
      }

      return isSuccess;
    } catch (error: any) {
      log.error('[AGODA_ADAPTER] pushAvailability failed', { connectionId, error: error.message });
      return false;
    }
  }

  /**
   * Pushes rates for a specific rate plan via OTA_HotelRateAmountNotifRQ
   */
  async pushRates(connectionId: string, externalRateId: string, timeline: Record<string, number>): Promise<boolean> {
    try {
      const client = await this.getClient(connectionId);
      const hotelCode = client.getHotelCode();

      const items: RateMessageItem[] = Object.entries(timeline).map(([date, rate]) => ({
        startDate: date,
        endDate: date,
        invTypeCode: 'STANDARD',
        ratePlanCode: externalRateId,
        currencyCode: 'USD',
        amountAfterTax: rate,
        amountBeforeTax: Math.round(rate / 1.12 * 100) / 100
      }));

      const xmlPayload = buildRateAmountNotifRQ(hotelCode, items);
      const { status, body } = await client.postXml(xmlPayload);

      return status === 200 && (body.includes('<Success') || body.includes('<Success/>'));
    } catch (error: any) {
      log.error('[AGODA_ADAPTER] pushRates failed', { connectionId, error: error.message });
      return false;
    }
  }

  /**
   * Connection health check
   */
  async healthCheck(connectionId: string): Promise<{ isHealthy: boolean; message?: string }> {
    try {
      const client = await this.getClient(connectionId);
      const ping = await client.ping();
      return {
        isHealthy: ping.healthy,
        message: ping.healthy ? `Healthy (${ping.latencyMs}ms)` : ping.error
      };
    } catch (err: any) {
      return {
        isHealthy: false,
        message: err.message
      };
    }
  }
}
