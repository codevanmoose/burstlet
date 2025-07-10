import { Request, Response } from 'express';
import Stripe from 'stripe';
import { BillingService } from './service';
import {
  CreateCheckoutSessionSchema,
  UpdateSubscriptionSchema,
  CreatePaymentMethodSchema,
  UpdatePaymentMethodSchema,
  CreateUsageRecordSchema,
  GetInvoicesSchema,
  PreviewUpgradeSchema,
  BillingError,
  PaymentError,
  QuotaError,
} from './types';

export class BillingController {
  private stripe: Stripe;

  constructor(
    private billingService: BillingService,
    stripeSecretKey: string,
    private webhookSecret: string
  ) {
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });
  }

  /**
   * Create checkout session
   * POST /billing/checkout
   */
  async createCheckoutSession(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = CreateCheckoutSessionSchema.parse(req.body);
      const userId = req.user!.id;

      const session = await this.billingService.createCheckoutSession(userId, validatedData);

      res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      if (error instanceof BillingError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
      } else {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error instanceof Error ? error.message : 'Invalid request',
          },
        });
      }
    }
  }

  /**
   * Get subscription
   * GET /billing/subscription
   */
  async getSubscription(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const subscription = await this.billingService.getSubscription(userId);

      res.json({
        success: true,
        data: subscription,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get subscription',
        },
      });
    }
  }

  /**
   * Update subscription
   * PUT /billing/subscription
   */
  async updateSubscription(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = UpdateSubscriptionSchema.parse(req.body);
      const userId = req.user!.id;

      const subscription = await this.billingService.updateSubscription(userId, validatedData);

      res.json({
        success: true,
        data: subscription,
      });
    } catch (error) {
      if (error instanceof BillingError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
      } else {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error instanceof Error ? error.message : 'Invalid request',
          },
        });
      }
    }
  }

  /**
   * Cancel subscription
   * DELETE /billing/subscription
   */
  async cancelSubscription(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      await this.billingService.cancelSubscription(userId);

      res.json({
        success: true,
        message: 'Subscription will be canceled at the end of the current billing period',
      });
    } catch (error) {
      if (error instanceof BillingError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Failed to cancel subscription',
          },
        });
      }
    }
  }

  /**
   * Add payment method
   * POST /billing/payment-methods
   */
  async addPaymentMethod(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = CreatePaymentMethodSchema.parse(req.body);
      const userId = req.user!.id;

      const paymentMethod = await this.billingService.addPaymentMethod(userId, validatedData);

      res.status(201).json({
        success: true,
        data: { paymentMethod },
      });
    } catch (error) {
      if (error instanceof PaymentError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
      } else {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error instanceof Error ? error.message : 'Invalid request',
          },
        });
      }
    }
  }

  /**
   * Get payment methods
   * GET /billing/payment-methods
   */
  async getPaymentMethods(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const paymentMethods = await this.billingService.getPaymentMethods(userId);

      res.json({
        success: true,
        data: paymentMethods,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get payment methods',
        },
      });
    }
  }

  /**
   * Update payment method
   * PUT /billing/payment-methods/:id
   */
  async updatePaymentMethod(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validatedData = UpdatePaymentMethodSchema.parse(req.body);
      const userId = req.user!.id;

      // For now, only support setting as default
      if (validatedData.setAsDefault) {
        const paymentMethods = await this.billingService.getPaymentMethods(userId);
        const paymentMethod = paymentMethods.paymentMethods.find(pm => pm.id === id);
        
        if (!paymentMethod) {
          throw new PaymentError('Payment method not found', 'PAYMENT_METHOD_NOT_FOUND', 404);
        }

        await this.billingService.addPaymentMethod(userId, {
          paymentMethodId: paymentMethod.stripePaymentMethodId,
          setAsDefault: true,
        });
      }

      res.json({
        success: true,
        message: 'Payment method updated',
      });
    } catch (error) {
      if (error instanceof PaymentError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
      } else {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error instanceof Error ? error.message : 'Invalid request',
          },
        });
      }
    }
  }

  /**
   * Remove payment method
   * DELETE /billing/payment-methods/:id
   */
  async removePaymentMethod(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      await this.billingService.removePaymentMethod(userId, id);

      res.json({
        success: true,
        message: 'Payment method removed',
      });
    } catch (error) {
      if (error instanceof PaymentError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Failed to remove payment method',
          },
        });
      }
    }
  }

  /**
   * Track usage
   * POST /billing/usage
   */
  async trackUsage(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = CreateUsageRecordSchema.parse(req.body);
      const userId = req.user!.id;

      await this.billingService.trackUsage(userId, validatedData);

      res.json({
        success: true,
        message: 'Usage recorded',
      });
    } catch (error) {
      if (error instanceof QuotaError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            limit: error.limit,
            current: error.current,
          },
        });
      } else if (error instanceof BillingError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
      } else {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error instanceof Error ? error.message : 'Invalid request',
          },
        });
      }
    }
  }

  /**
   * Get usage summary
   * GET /billing/usage
   */
  async getUsageSummary(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const usage = await this.billingService.getUsageSummary(userId);

      res.json({
        success: true,
        data: usage,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get usage summary',
        },
      });
    }
  }

  /**
   * Get invoices
   * GET /billing/invoices
   */
  async getInvoices(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = GetInvoicesSchema.parse(req.query);
      const userId = req.user!.id;

      const invoices = await this.billingService.getInvoices(userId, validatedData);

      res.json({
        success: true,
        data: invoices,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error instanceof Error ? error.message : 'Invalid request',
        },
      });
    }
  }

  /**
   * Get billing overview
   * GET /billing/overview
   */
  async getBillingOverview(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const overview = await this.billingService.getBillingOverview(userId);

      res.json({
        success: true,
        data: overview,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get billing overview',
        },
      });
    }
  }

  /**
   * Preview upgrade
   * POST /billing/preview-upgrade
   */
  async previewUpgrade(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = PreviewUpgradeSchema.parse(req.body);
      const userId = req.user!.id;

      const preview = await this.billingService.previewUpgrade(userId, validatedData);

      res.json({
        success: true,
        data: preview,
      });
    } catch (error) {
      if (error instanceof BillingError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
      } else {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error instanceof Error ? error.message : 'Invalid request',
          },
        });
      }
    }
  }

  /**
   * Get subscription plans
   * GET /billing/plans
   */
  async getPlans(req: Request, res: Response): Promise<void> {
    try {
      // Return plan configurations
      const plans = [
        { id: 'free', ...SUBSCRIPTION_PLANS.FREE },
        { id: 'pro', ...SUBSCRIPTION_PLANS.PRO },
        { id: 'business', ...SUBSCRIPTION_PLANS.BUSINESS },
        { id: 'enterprise', ...SUBSCRIPTION_PLANS.ENTERPRISE },
      ];

      res.json({
        success: true,
        data: { plans },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get plans',
        },
      });
    }
  }

  /**
   * Handle Stripe webhook
   * POST /billing/webhook
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const sig = req.headers['stripe-signature'] as string;
      const event = this.stripe.webhooks.constructEvent(
        req.body,
        sig,
        this.webhookSecret
      );

      await this.billingService.handleWebhook(event);

      res.json({ received: true });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'WEBHOOK_ERROR',
          message: error instanceof Error ? error.message : 'Webhook error',
        },
      });
    }
  }

  /**
   * Health check
   * GET /billing/health
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      // Check Stripe connectivity
      await this.stripe.products.list({ limit: 1 });

      res.json({
        success: true,
        data: {
          status: 'healthy',
          stripe: 'connected',
          timestamp: new Date(),
        },
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        error: {
          code: 'UNHEALTHY',
          message: 'Billing service is unhealthy',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }
}

// Import plan definitions
import { SUBSCRIPTION_PLANS } from './types';