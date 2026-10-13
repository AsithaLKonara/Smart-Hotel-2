import { log } from '@/lib/logger';
import { prisma } from '@/lib/db';

export interface AgodaClientOptions {
  clientId: string;
  clientSecret: string;
  hotelCode: string; // Agoda Property ID (e.g. "61027")
  environment?: 'PRODUCTION' | 'TEST' | 'SANDBOX';
  connectionId?: string;
}

export interface AgodaTokenResponse {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface AgodaPingResult {
  healthy: boolean;
  latencyMs?: number;
  error?: string;
}

export class AgodaClient {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly hotelCode: string;
  private readonly environment: 'PRODUCTION' | 'TEST' | 'SANDBOX';
  private readonly connectionId?: string;

  // In-memory token cache to protect against Agoda's 100 attempts/hour limit
  private cachedToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  // Base URLs as per official Agoda documentation
  private readonly authUrl = 'https://supply.agoda.com/token-based-authentication/exchange';
  private readonly otaBaseUrl = 'http://supplyota.agoda.com/b2b/ota/2013A/hotels';

  constructor(options: AgodaClientOptions) {
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.hotelCode = options.hotelCode;
    this.environment = options.environment || 'PRODUCTION';
    this.connectionId = options.connectionId;
  }

  /**
   * Retrieves a valid Bearer JWT. Reuses cached token if valid; otherwise executes OAuth 2.0 exchange.
   */
  public async getAccessToken(): Promise<string> {
    const now = new Date();
    // Safety buffer: refresh 5 minutes (300,000 ms) before expiration
    if (this.cachedToken && this.tokenExpiresAt && this.tokenExpiresAt.getTime() - now.getTime() > 300000) {
      return this.cachedToken;
    }

    // Check if database has an unexpired token for this connection
    if (this.connectionId) {
      try {
        const conn = await prisma.channelConnection.findUnique({
          where: { id: this.connectionId },
          select: { accessTokenEncrypted: true, accessTokenExpiresAt: true }
        });

        if (conn?.accessTokenEncrypted && conn.accessTokenExpiresAt) {
          const dbExpiry = new Date(conn.accessTokenExpiresAt);
          if (conn.accessTokenEncrypted && dbExpiry.getTime() - now.getTime() > 300000) {
            this.cachedToken = conn.accessTokenEncrypted;
            this.tokenExpiresAt = dbExpiry;
            return conn.accessTokenEncrypted;
          }
        }
      } catch (dbErr) {
        log.warn('[AGODA_CLIENT] Could not read token from DB, falling back to network exchange', { error: (dbErr as any)?.message });
      }
    }

    return await this.exchangeToken();
  }

  /**
   * Executes OAuth 2.0 Token Exchange with Agoda IAM
   * POST https://supply.agoda.com/token-based-authentication/exchange
   */
  private async exchangeToken(): Promise<string> {
    log.info('[AGODA_CLIENT] Exchanging client credentials for Bearer token', {
      clientId: this.clientId,
      environment: this.environment
    });

    const response = await fetch(this.authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        clientId: this.clientId,
        clientSecret: this.clientSecret
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      log.error('[AGODA_CLIENT] OAuth exchange failed', {
        status: response.status,
        response: errorText
      });
      throw new Error(`Agoda OAuth Exchange failed [HTTP ${response.status}]: ${errorText}`);
    }

    const data: AgodaTokenResponse = await response.json();
    if (!data.accessToken) {
      throw new Error('Agoda OAuth response did not contain accessToken');
    }

    this.cachedToken = data.accessToken;
    // Agoda tokens expire in 3600 seconds (1 hour). Pre-expire in 55 minutes.
    const ttlSeconds = (data.expiresIn && data.expiresIn > 300) ? data.expiresIn : 3600;
    this.tokenExpiresAt = new Date(Date.now() + ttlSeconds * 1000);

    // Persist to database if connectionId is bound
    if (this.connectionId) {
      try {
        await prisma.channelConnection.update({
          where: { id: this.connectionId },
          data: {
            accessTokenEncrypted: this.cachedToken,
            accessTokenExpiresAt: this.tokenExpiresAt,
            lastSuccessAt: new Date()
          }
        });
      } catch (err) {
        log.warn('[AGODA_CLIENT] Failed to persist refreshed token to DB', { error: (err as any)?.message });
      }
    }

    log.info('[AGODA_CLIENT] Token exchanged successfully', {
      expiresIn: ttlSeconds,
      expiresAt: this.tokenExpiresAt.toISOString()
    });

    return this.cachedToken;
  }

  /**
   * Posts OpenTravel XML payload to Agoda OTA endpoint
   */
  public async postXml(xmlPayload: string, customUrl?: string): Promise<{ status: number; body: string }> {
    const token = await this.getAccessToken();
    const targetUrl = customUrl || this.otaBaseUrl;

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/xml; charset=utf-8',
        'Accept': 'application/xml'
      },
      body: xmlPayload
    });

    const bodyText = await response.text();
    return {
      status: response.status,
      body: bodyText
    };
  }

  /**
   * Tests connectivity and validates credentials
   */
  public async ping(): Promise<AgodaPingResult> {
    const start = Date.now();
    try {
      await this.getAccessToken();
      const latencyMs = Date.now() - start;
      return {
        healthy: true,
        latencyMs
      };
    } catch (err: any) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        error: err.message
      };
    }
  }

  public getHotelCode(): string {
    return this.hotelCode;
  }
}
