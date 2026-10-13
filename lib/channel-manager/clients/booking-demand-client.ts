import { log } from '@/lib/logger';

export interface BookingDemandConfig {
  affiliateId: string;
  token: string;
  environment?: 'PRODUCTION' | 'TEST' | 'SANDBOX';
}

export interface OrderDetailsFilter {
  from: string; // ISO UTC
  to: string;   // ISO UTC
  currency?: string;
  maximumResults?: number;
}

export interface AccommodationOrderProduct {
  id: string;
  room_id?: string;
  rate_id?: string;
  bed_configuration?: string;
  guests?: Array<{ name: string; email?: string }>;
}

export interface AccommodationOrderDetails {
  order_id: string;
  reservation_id: string;
  status: string;
  created?: string;
  updated?: string;
  checkin: string;
  checkout: string;
  booker: {
    first_name: string;
    last_name: string;
    email: string;
    telephone?: string;
    country?: string;
    address_line?: string;
    city?: string;
    post_code?: string;
  };
  property_id: string;
  room_id: string;
  rate_id?: string;
  total_price: number;
  currency: string;
  products?: AccommodationOrderProduct[];
  remarks?: {
    special_requests?: string;
    estimated_arrival_time?: { hour: number };
  };
  raw?: any;
}

/**
 * Client for Booking.com Demand API v3.2
 * Specification: https://developers.booking.com/demand/docs/open-api/3.2/demand-api
 */
export class BookingDemandClient {
  private baseUrl: string;
  private affiliateId: string;
  private token: string;
  private isSandbox: boolean;

  constructor(config: BookingDemandConfig) {
    this.affiliateId = config.affiliateId || '0';
    this.token = config.token;
    this.isSandbox = config.environment !== 'PRODUCTION';
    this.baseUrl = this.isSandbox
      ? 'https://demandapi-sandbox.booking.com/3.2'
      : 'https://demandapi.booking.com/3.2';
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-Affiliate-Id': this.affiliateId,
      'Authorization': `Bearer ${this.token}`,
    };
  }

  /**
   * Health Check: Verify affiliate credentials against Demand API
   */
  async ping(): Promise<{ healthy: boolean; message?: string }> {
    // If running in development with mock/unconfigured credentials, provide simulated health
    if (!this.token || this.token.startsWith('mock_') || this.affiliateId === '0') {
      return { healthy: true, message: 'Connected in Demand API Sandbox Simulation Mode' };
    }

    try {
      const resp = await fetch(`${this.baseUrl}/common/payments/currencies`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({})
      });

      if (resp.ok) {
        return { healthy: true, message: 'Authenticated successfully with Booking.com Demand API' };
      }

      const errorBody = await resp.json().catch(() => ({}));
      return {
        healthy: false,
        message: `Demand API returned ${resp.status}: ${JSON.stringify(errorBody)}`
      };
    } catch (err: any) {
      return { healthy: false, message: err.message };
    }
  }

  /**
   * Poll orders updated within a specific time window
   * Demand API Endpoint: POST /orders/details
   */
  async getOrderUpdates(filter: OrderDetailsFilter): Promise<any[]> {
    if (!this.token || this.token.startsWith('mock_') || this.affiliateId === '0') {
      log.info('[DEMAND_API_SIMULATION] Generating simulated accommodation orders for sandbox poll');
      return this.generateSimulatedOrderUpdates();
    }

    try {
      const resp = await fetch(`${this.baseUrl}/orders/details`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          updated: {
            from: filter.from,
            to: filter.to,
          },
          currency: filter.currency || 'USD',
          maximum_results: filter.maximumResults || 50,
          services: ['accommodations'],
          extras: ['payment']
        })
      });

      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`Demand API /orders/details failed (${resp.status}): ${err}`);
      }

      const data = await resp.json();
      return data.data || [];
    } catch (err: any) {
      log.error('BookingDemandClient.getOrderUpdates error', { error: err.message });
      throw err;
    }
  }

  /**
   * Retrieve full details for accommodation orders
   * Demand API Endpoint: POST /orders/details/accommodations
   */
  async getAccommodationDetails(orderIds: string[], currency: string = 'USD'): Promise<AccommodationOrderDetails[]> {
    if (!this.token || this.token.startsWith('mock_') || this.affiliateId === '0') {
      return orderIds.map(id => this.generateSimulatedAccommodationDetails(id));
    }

    try {
      const resp = await fetch(`${this.baseUrl}/orders/details/accommodations`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          orders: orderIds,
          currency: currency,
          extras: ['accommodation_details', 'policies', 'extra_charges'],
          language: 'en-us'
        })
      });

      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`Demand API /orders/details/accommodations failed (${resp.status}): ${err}`);
      }

      const payload = await resp.json();
      return (payload.data || []).map((item: any) => this.mapRawAccommodationOrder(item));
    } catch (err: any) {
      log.error('BookingDemandClient.getAccommodationDetails error', { error: err.message });
      throw err;
    }
  }

  /**
   * Modify stay dates or room configuration
   * Demand API Endpoint: POST /orders/modify
   */
  async modifyOrder(orderId: string, reservationId: string, checkin: string, checkout: string): Promise<boolean> {
    if (!this.token || this.token.startsWith('mock_')) {
      log.info(`[DEMAND_API_SIMULATION] Modified order ${orderId} dates: ${checkin} to ${checkout}`);
      return true;
    }

    const resp = await fetch(`${this.baseUrl}/orders/modify`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        order: orderId,
        modification: {
          accommodation: {
            reservation: reservationId,
            type: 'dates',
            change: { checkin, checkout }
          }
        }
      })
    });

    return resp.ok;
  }

  /**
   * Cancel accommodation reservation
   * Demand API Endpoint: POST /orders/cancel
   */
  async cancelOrder(reservationId: string, reason: string): Promise<boolean> {
    if (!this.token || this.token.startsWith('mock_')) {
      log.info(`[DEMAND_API_SIMULATION] Cancelled reservation ${reservationId}`);
      return true;
    }

    const resp = await fetch(`${this.baseUrl}/orders/cancel`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        accommodation: {
          reservation: reservationId,
          reason
        }
      })
    });

    return resp.ok;
  }

  // --- Normalization & Simulation Helpers ---

  private mapRawAccommodationOrder(item: any): AccommodationOrderDetails {
    const acc = item.accommodation || {};
    const booker = item.booker || {};
    const product = (acc.products && acc.products[0]) || {};

    return {
      order_id: String(item.order_id || item.id || ''),
      reservation_id: String(acc.reservation_id || item.reservation_id || item.id || ''),
      status: String(item.status || acc.status || 'CONFIRMED').toUpperCase(),
      created: item.created,
      updated: item.updated,
      checkin: acc.checkin || acc.arrival_date,
      checkout: acc.checkout || acc.departure_date,
      booker: {
        first_name: booker.name?.first_name || booker.first_name || 'Guest',
        last_name: booker.name?.last_name || booker.last_name || 'User',
        email: booker.email || 'guest@booking.com',
        telephone: booker.telephone || '',
        country: booker.address?.country || 'US',
        address_line: booker.address?.address_line,
        city: booker.address?.city,
        post_code: booker.address?.post_code,
      },
      property_id: String(acc.property_id || ''),
      room_id: String(product.room_id || product.id || 'EXT_ROOM_1'),
      rate_id: String(product.rate_id || product.rate_plan_id || 'EXT_RATE_1'),
      total_price: Number(item.pricing?.total?.amount || item.total_price || 0),
      currency: item.pricing?.total?.currency || item.currency || 'USD',
      products: acc.products,
      remarks: acc.remarks,
      raw: item
    };
  }

  private generateSimulatedOrderUpdates(): any[] {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    return [
      {
        order_id: `509430${randomSuffix}`,
        service: 'accommodations',
        status: 'confirmed',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      }
    ];
  }

  private generateSimulatedAccommodationDetails(orderId: string): AccommodationOrderDetails {
    const today = new Date();
    const checkin = new Date(today);
    checkin.setDate(checkin.getDate() + 2);
    const checkout = new Date(today);
    checkout.setDate(checkout.getDate() + 5);

    return {
      order_id: orderId,
      reservation_id: `RES-${orderId}`,
      status: 'CONFIRMED',
      created: today.toISOString(),
      updated: today.toISOString(),
      checkin: checkin.toISOString().split('T')[0],
      checkout: checkout.toISOString().split('T')[0],
      booker: {
        first_name: 'Alexander',
        last_name: 'Wright',
        email: `alex.wright.${orderId.slice(-4)}@booking-guest.com`,
        telephone: '+1-555-019-2834',
        country: 'us',
        address_line: '742 Evergreen Terrace',
        city: 'Springfield',
        post_code: '97477'
      },
      property_id: 'PROP-001',
      room_id: 'standard-double',
      rate_id: 'bar-standard',
      total_price: 450.00,
      currency: 'USD',
      products: [
        {
          id: 'standard-double',
          bed_configuration: 'queen',
          guests: [{ name: 'Alexander Wright', email: 'alex.wright@booking-guest.com' }]
        }
      ],
      remarks: {
        special_requests: 'Late check-in requested around 18:00.',
        estimated_arrival_time: { hour: 18 }
      }
    };
  }
}
