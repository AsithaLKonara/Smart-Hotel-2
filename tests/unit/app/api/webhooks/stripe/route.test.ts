import { NextRequest } from 'next/server';
import { POST } from '../../../../../../app/api/webhooks/stripe/route';

// Mock dependencies
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: jest.fn().mockReturnValue({
        id: 'evt_test',
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_test', metadata: { bookingId: 'b_test' } } }
      })
    }
  }));
});

jest.mock('@upstash/redis', () => ({
  Redis: {
    fromEnv: jest.fn()
  }
}));

describe('Stripe Webhook Redis Failure', () => {
  const mockSignature = 'test_signature';
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    
    mockRequest = {
      text: jest.fn().mockResolvedValue('test body'),
      headers: new Headers({
        'stripe-signature': mockSignature
      })
    } as unknown as NextRequest;
  });

  it('should fail closed and return 503 if Redis is unavailable (fromEnv throws)', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'http://test';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test';
    
    const { Redis } = require('@upstash/redis');
    Redis.fromEnv.mockImplementation(() => {
      throw new Error('Redis initialization failed');
    });

    const response = await POST(mockRequest);
    
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error).toContain('Deduplication Engine Offline');
  });

  it('should fail closed and return 503 if Redis is unconfigured', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    
    const response = await POST(mockRequest);
    
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error).toContain('Deduplication Engine Offline');
  });

  it('should fail closed and return 503 if Redis set operation fails', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'http://test';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test';
    
    const { Redis } = require('@upstash/redis');
    const mockSet = jest.fn().mockRejectedValue(new Error('Network error'));
    Redis.fromEnv.mockImplementation(() => ({
      set: mockSet
    }));

    const response = await POST(mockRequest);
    
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error).toContain('Deduplication Engine Offline');
  });
});
