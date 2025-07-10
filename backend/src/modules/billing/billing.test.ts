import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { BillingService } from './service';
import { BillingError, PaymentError, QuotaError } from './types';

// Mock Stripe
jest.mock('stripe');
const mockStripe = {
  customers: {
    create: jest.fn(),
    update: jest.fn(),
  },
  checkout: {
    sessions: {
      create: jest.fn(),
    },
  },
  subscriptions: {
    update: jest.fn(),
    retrieve: jest.fn(),
  },
  paymentMethods: {
    attach: jest.fn(),
    detach: jest.fn(),
  },
  invoices: {
    retrieveUpcoming: jest.fn(),
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
} as any;

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  subscription: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
    groupBy: jest.fn(),
  },
  paymentMethod: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
  },
  usageRecord: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  invoice: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    upsert: jest.fn(),
  },
  billingEvent: {
    create: jest.fn(),
    updateMany: jest.fn(),
  },
  coupon: {
    findFirst: jest.fn(),
  },
  notification: {
    create: jest.fn(),
  },
  content: {
    findMany: jest.fn(),
  },
} as unknown as PrismaClient;

describe('BillingService', () => {
  let service: BillingService;

  beforeEach(() => {
    (Stripe as any).mockImplementation(() => mockStripe);
    service = new BillingService(mockPrisma, 'test_stripe_key');
    jest.clearAllMocks();
  });

  describe('createCheckoutSession', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      subscription: null,
    };

    const createRequest = {
      planId: 'pro',
      billingCycle: 'MONTHLY' as const,
      successUrl: 'https://app.burstlet.com/success',
      cancelUrl: 'https://app.burstlet.com/cancel',
    };

    it('should create checkout session for new subscription', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockStripe.customers.create as jest.Mock).mockResolvedValue({
        id: 'cus_test123',
      });
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        stripeCustomerId: 'cus_test123',
      });
      (mockStripe.checkout.sessions.create as jest.Mock).mockResolvedValue({
        id: 'cs_test123',
        url: 'https://checkout.stripe.com/test',
      });

      const result = await service.createCheckoutSession('user-123', createRequest);

      expect(result.sessionId).toBe('cs_test123');
      expect(result.url).toBe('https://checkout.stripe.com/test');
      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: mockUser.email,
        name: mockUser.name,
        metadata: { userId: mockUser.id },
      });
    });

    it('should reject if user already has active subscription', async () => {
      const userWithSub = {
        ...mockUser,
        subscription: { status: 'ACTIVE' },
      };
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(userWithSub);

      await expect(
        service.createCheckoutSession('user-123', createRequest)
      ).rejects.toThrow(BillingError);
    });
  });

  describe('updateSubscription', () => {
    const mockSubscription = {
      id: 'sub-123',
      userId: 'user-123',
      planId: 'pro',
      billingCycle: 'MONTHLY',
      stripeSubscriptionId: 'sub_test123',
      status: 'ACTIVE',
    };

    it('should update subscription plan', async () => {
      (mockPrisma.subscription.findUnique as jest.Mock).mockResolvedValue(mockSubscription);
      (mockStripe.subscriptions.retrieve as jest.Mock).mockResolvedValue({
        items: { data: [{ id: 'si_test123' }] },
      });
      (mockStripe.subscriptions.update as jest.Mock).mockResolvedValue({
        status: 'active',
      });
      (mockPrisma.subscription.update as jest.Mock).mockResolvedValue({
        ...mockSubscription,
        planId: 'business',
      });

      const result = await service.updateSubscription('user-123', {
        planId: 'business',
      });

      expect(mockStripe.subscriptions.update).toHaveBeenCalled();
      expect(mockPrisma.subscription.update).toHaveBeenCalled();
    });

    it('should handle subscription cancellation', async () => {
      (mockPrisma.subscription.findUnique as jest.Mock).mockResolvedValue(mockSubscription);
      (mockStripe.subscriptions.update as jest.Mock).mockResolvedValue({
        status: 'active',
        cancel_at_period_end: true,
      });
      (mockPrisma.subscription.update as jest.Mock).mockResolvedValue({
        ...mockSubscription,
        cancelAtPeriodEnd: true,
      });

      await service.updateSubscription('user-123', {
        cancelAtPeriodEnd: true,
      });

      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith(
        'sub_test123',
        { cancel_at_period_end: true }
      );
    });
  });

  describe('trackUsage', () => {
    const mockSubscription = {
      id: 'sub-123',
      userId: 'user-123',
      planId: 'pro',
      currentPeriodStart: new Date(),
    };

    it('should track usage within quota', async () => {
      (mockPrisma.subscription.findUnique as jest.Mock).mockResolvedValue(mockSubscription);
      (mockPrisma.usageRecord.findMany as jest.Mock).mockResolvedValue([
        { type: 'AI_VIDEO_GENERATION', quantity: 5 },
      ]);
      (mockPrisma.usageRecord.create as jest.Mock).mockResolvedValue({});

      await service.trackUsage('user-123', {
        type: 'AI_VIDEO_GENERATION',
        quantity: 1,
      });

      expect(mockPrisma.usageRecord.create).toHaveBeenCalled();
    });

    it('should reject when quota exceeded', async () => {
      (mockPrisma.subscription.findUnique as jest.Mock).mockResolvedValue(mockSubscription);
      (mockPrisma.usageRecord.findMany as jest.Mock).mockResolvedValue([
        { type: 'AI_VIDEO_GENERATION', quantity: 20 }, // Pro limit is 20
      ]);

      await expect(
        service.trackUsage('user-123', {
          type: 'AI_VIDEO_GENERATION',
          quantity: 1,
        })
      ).rejects.toThrow(QuotaError);
    });
  });

  describe('addPaymentMethod', () => {
    const mockUser = {
      id: 'user-123',
      stripeCustomerId: 'cus_test123',
    };

    it('should add payment method', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockStripe.paymentMethods.attach as jest.Mock).mockResolvedValue({
        id: 'pm_test123',
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2025,
        },
      });
      (mockPrisma.paymentMethod.create as jest.Mock).mockResolvedValue({
        id: 'pay-123',
        stripePaymentMethodId: 'pm_test123',
      });

      const result = await service.addPaymentMethod('user-123', {
        paymentMethodId: 'pm_test123',
      });

      expect(result.stripePaymentMethodId).toBe('pm_test123');
      expect(mockStripe.paymentMethods.attach).toHaveBeenCalledWith(
        'pm_test123',
        { customer: 'cus_test123' }
      );
    });

    it('should set payment method as default', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockStripe.paymentMethods.attach as jest.Mock).mockResolvedValue({
        id: 'pm_test123',
        type: 'card',
      });
      (mockStripe.customers.update as jest.Mock).mockResolvedValue({});
      (mockPrisma.paymentMethod.updateMany as jest.Mock).mockResolvedValue({});
      (mockPrisma.paymentMethod.create as jest.Mock).mockResolvedValue({
        id: 'pay-123',
        isDefault: true,
      });

      const result = await service.addPaymentMethod('user-123', {
        paymentMethodId: 'pm_test123',
        setAsDefault: true,
      });

      expect(result.isDefault).toBe(true);
      expect(mockStripe.customers.update).toHaveBeenCalledWith(
        'cus_test123',
        { invoice_settings: { default_payment_method: 'pm_test123' } }
      );
    });
  });

  describe('getUsageSummary', () => {
    const mockSubscription = {
      id: 'sub-123',
      userId: 'user-123',
      planId: 'pro',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };

    it('should calculate usage summary', async () => {
      (mockPrisma.subscription.findUnique as jest.Mock).mockResolvedValue(mockSubscription);
      (mockPrisma.usageRecord.findMany as jest.Mock).mockResolvedValue([
        { type: 'AI_VIDEO_GENERATION', quantity: 5 },
        { type: 'AI_VIDEO_GENERATION', quantity: 3 },
        { type: 'AI_BLOG_GENERATION', quantity: 10 },
        { type: 'CONTENT_STORAGE', quantity: 15 },
      ]);

      const result = await service.getUsageSummary('user-123');

      expect(result.usage.aiGenerations.videos).toBe(8);
      expect(result.usage.aiGenerations.blogs).toBe(10);
      expect(result.usage.contentStorage).toBe(15);
      expect(result.percentages.aiVideos).toBe(40); // 8/20 * 100
      expect(result.percentages.storage).toBe(30); // 15/50 * 100
    });
  });

  describe('getBillingOverview', () => {
    it('should return comprehensive billing overview', async () => {
      const mockSubscription = {
        id: 'sub-123',
        status: 'ACTIVE',
        stripeCustomerId: 'cus_test123',
      };

      (mockPrisma.subscription.findUnique as jest.Mock).mockResolvedValue(mockSubscription);
      (mockPrisma.usageRecord.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.paymentMethod.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.invoice.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.invoice.count as jest.Mock).mockResolvedValue(0);
      (mockStripe.invoices.retrieveUpcoming as jest.Mock).mockResolvedValue({
        amount_due: 2900,
        period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      });

      const result = await service.getBillingOverview('user-123');

      expect(result.subscription).toBeDefined();
      expect(result.plan).toBeDefined();
      expect(result.usage).toBeDefined();
      expect(result.nextInvoice).toBeDefined();
      expect(result.nextInvoice?.amount).toBe(29);
    });
  });

  describe('handleWebhook', () => {
    it('should handle checkout completed event', async () => {
      const event = {
        id: 'evt_test123',
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: {
              userId: 'user-123',
              planId: 'pro',
              billingCycle: 'MONTHLY',
            },
            subscription: 'sub_test123',
            customer: 'cus_test123',
          },
        },
      } as any;

      (mockPrisma.billingEvent.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.subscription.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.billingEvent.updateMany as jest.Mock).mockResolvedValue({});

      await service.handleWebhook(event);

      expect(mockPrisma.subscription.create).toHaveBeenCalled();
      expect(mockPrisma.billingEvent.updateMany).toHaveBeenCalledWith({
        where: { stripeEventId: 'evt_test123' },
        data: { processed: true, processedAt: expect.any(Date) },
      });
    });

    it('should handle payment failed event', async () => {
      const event = {
        id: 'evt_test123',
        type: 'invoice.payment_failed',
        data: {
          object: {
            id: 'in_test123',
            subscription: 'sub_test123',
            metadata: { userId: 'user-123' },
          },
        },
      } as any;

      (mockPrisma.billingEvent.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.subscription.updateMany as jest.Mock).mockResolvedValue({});
      (mockPrisma.notification.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.billingEvent.updateMany as jest.Mock).mockResolvedValue({});

      await service.handleWebhook(event);

      expect(mockPrisma.subscription.updateMany).toHaveBeenCalledWith({
        where: { stripeSubscriptionId: 'sub_test123' },
        data: { status: 'PAST_DUE' },
      });
      expect(mockPrisma.notification.create).toHaveBeenCalled();
    });
  });
});