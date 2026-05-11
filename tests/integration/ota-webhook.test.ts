import { NextRequest } from 'next/server';
import { POST as webhookHandler } from '../../app/api/webhooks/ota/route';
import { processOtaReservation } from '../../lib/ota/webhook-handler';

// Mock the webhook handler logic
jest.mock('../../lib/ota/webhook-handler', () => ({
  processOtaReservation: jest.fn(),
}));

jest.mock('../../lib/logger', () => ({
  log: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('OTA Webhook API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should accept and process a valid OTA reservation webhook', async () => {
    const payload = {
      ota_reservation_code: 'BCOM-999',
      ota_room_type_id: 'room-type-1',
      check_in: '2026-06-01',
      check_out: '2026-06-05',
      guest_name: 'Test Guest',
      total_price: 500,
      currency: 'USD',
      status: 'new'
    };

    (processOtaReservation as jest.Mock).mockResolvedValue({ status: 'INGESTED', id: 'booking-123' });

    const req = new NextRequest('http://localhost:3000/api/webhooks/ota', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await webhookHandler(req);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.result.id).toBe('booking-123');
    expect(processOtaReservation).toHaveBeenCalledWith(payload);
  });

  it('should return 500 if processing fails', async () => {
    const payload = {
      ota_reservation_code: 'BCOM-ERROR',
      status: 'new'
    };

    (processOtaReservation as jest.Mock).mockRejectedValue(new Error('Database Connection Failed'));

    const req = new NextRequest('http://localhost:3000/api/webhooks/ota', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await webhookHandler(req);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Database Connection Failed');
  });
});
