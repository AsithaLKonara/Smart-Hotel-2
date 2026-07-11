const mockCapture = jest.fn();
const mockRefund = jest.fn();

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      capture: mockCapture,
      create: jest.fn(),
    },
    refunds: {
      create: mockRefund,
    }
  }));
});

import Stripe from 'stripe';
import prisma from '../../../../lib/prisma';

// Mock Prisma
jest.mock('../../../../lib/prisma', () => ({
  __esModule: true,
  default: {
    payment: {
      findFirst: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    }
  }
}));

describe('StripeGateway Unit Tests', () => {
  const mockChargeId = 'pi_test123';
  const mockAmount = 500;
  
  let StripeGateway: any;

  beforeAll(() => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
    StripeGateway = require('../../../../lib/integrations/stripe-gateway').StripeGateway;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('capturePayment', () => {
    it('should include idempotencyKey when capturing payment', async () => {
      (prisma.payment.findFirst as jest.Mock).mockResolvedValue({
        id: 'txn_123',
        providerId: mockChargeId,
        currency: 'usd',
      });
      
      mockCapture.mockResolvedValue({
        id: mockChargeId,
        status: 'succeeded'
      });

      await StripeGateway.capturePayment(mockChargeId, mockAmount);

      expect(mockCapture).toHaveBeenCalledWith(
        mockChargeId,
        { amount_to_capture: mockAmount * 100 },
        { idempotencyKey: `capture_${mockChargeId}_${mockAmount}` }
      );
    });
  });

  describe('refundPayment', () => {
    it('should include idempotencyKey when refunding payment', async () => {
      (prisma.payment.findFirst as jest.Mock).mockResolvedValue({
        id: 'txn_123',
        providerId: mockChargeId,
        currency: 'usd',
      });
      
      mockRefund.mockResolvedValue({
        id: 're_test123',
        status: 'succeeded'
      });

      await StripeGateway.refundPayment(mockChargeId, mockAmount);

      expect(mockRefund).toHaveBeenCalledWith(
        {
          payment_intent: mockChargeId,
          amount: mockAmount * 100
        },
        { idempotencyKey: `refund_${mockChargeId}_${mockAmount}` }
      );
    });
  });
});
