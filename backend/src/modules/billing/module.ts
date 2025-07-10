import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { BillingService } from './service';
import { BillingController } from './controller';
import { createBillingRoutes } from './routes';
import { AuthMiddleware } from '../auth/middleware';
import { AIGenerationService } from '../ai-generation/service';
import { BillingConfig, UsageType } from './types';

export interface BillingModuleConfig extends BillingConfig {
  prefix?: string;
  enableWebhooks?: boolean;
  enableUsageTracking?: boolean;
  usageCheckInterval?: number; // in minutes
}

export class BillingModule {
  private prisma: PrismaClient;
  private service: BillingService;
  private controller: BillingController;
  private config: BillingModuleConfig;
  private usageTrackingTimer?: NodeJS.Timer;
  private invoiceGenerationTimer?: NodeJS.Timer;

  constructor(
    prisma: PrismaClient,
    config: BillingModuleConfig
  ) {
    this.prisma = prisma;
    this.config = {
      prefix: '/api/v1/billing',
      enableWebhooks: true,
      enableUsageTracking: true,
      usageCheckInterval: 60, // 1 hour
      trialPeriodDays: 7,
      defaultPlanId: 'free',
      currency: 'usd',
      ...config,
    };

    // Validate required config
    if (!this.config.stripeSecretKey) {
      throw new Error('Stripe secret key is required');
    }
    if (this.config.enableWebhooks && !this.config.stripeWebhookSecret) {
      throw new Error('Stripe webhook secret is required when webhooks are enabled');
    }

    // Initialize services
    this.service = new BillingService(prisma, this.config.stripeSecretKey);
    this.controller = new BillingController(
      this.service,
      this.config.stripeSecretKey,
      this.config.stripeWebhookSecret
    );
  }

  /**
   * Initialize the billing module
   */
  async init(app: Express, aiService?: AIGenerationService): Promise<void> {
    // Create auth middleware
    const authMiddleware = new AuthMiddleware(this.prisma);

    // Create and mount routes
    const routes = createBillingRoutes(this.controller, authMiddleware);
    
    // Special handling for webhook endpoint to get raw body
    app.use(
      `${this.config.prefix}/webhook`,
      Express.raw({ type: 'application/json' })
    );
    
    app.use(this.config.prefix!, routes);

    // Setup usage tracking
    if (this.config.enableUsageTracking && aiService) {
      this.setupUsageTracking(aiService);
    }

    // Setup invoice generation
    this.setupInvoiceGeneration();

    // Setup subscription checks
    this.setupSubscriptionChecks();

    console.log(`[BILLING] Module initialized at ${this.config.prefix}`);
    console.log(`[BILLING] Features: Webhooks=${this.config.enableWebhooks}, UsageTracking=${this.config.enableUsageTracking}`);
  }

  /**
   * Setup automatic usage tracking
   */
  private setupUsageTracking(aiService: AIGenerationService): void {
    // Listen to AI generation events
    aiService.on('generation:completed', async (event: any) => {
      try {
        const { userId, type, metadata } = event;
        
        let usageType: UsageType;
        switch (type) {
          case 'VIDEO':
            usageType = 'AI_VIDEO_GENERATION';
            break;
          case 'BLOG':
            usageType = 'AI_BLOG_GENERATION';
            break;
          case 'SOCIAL_POST':
            usageType = 'AI_SOCIAL_POST_GENERATION';
            break;
          case 'SCRIPT':
            usageType = 'AI_SCRIPT_GENERATION';
            break;
          default:
            return;
        }

        await this.service.trackUsage(userId, {
          type: usageType,
          quantity: 1,
          metadata,
        });
      } catch (error) {
        console.error('[BILLING] Error tracking AI usage:', error);
      }
    });

    // Periodic storage usage calculation
    this.usageTrackingTimer = setInterval(async () => {
      try {
        const users = await this.prisma.user.findMany({
          where: {
            subscription: {
              status: 'ACTIVE',
            },
          },
          include: {
            content: true,
          },
        });

        for (const user of users) {
          const storageGB = user.content.reduce((total, content) => {
            return total + (content.metadata?.fileSize || 0);
          }, 0) / (1024 * 1024 * 1024);

          if (storageGB > 0) {
            await this.service.trackUsage(user.id, {
              type: 'CONTENT_STORAGE',
              quantity: Math.ceil(storageGB),
              metadata: { calculated: true },
            });
          }
        }
      } catch (error) {
        console.error('[BILLING] Error tracking storage usage:', error);
      }
    }, this.config.usageCheckInterval! * 60 * 1000);
  }

  /**
   * Setup invoice generation
   */
  private setupInvoiceGeneration(): void {
    // Check for invoices to generate daily
    this.invoiceGenerationTimer = setInterval(async () => {
      try {
        const subscriptions = await this.prisma.subscription.findMany({
          where: {
            status: 'ACTIVE',
            currentPeriodEnd: {
              gte: new Date(),
              lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
            },
          },
        });

        // Stripe will handle invoice generation automatically
        // This is just for monitoring
        console.log(`[BILLING] ${subscriptions.length} subscriptions approaching renewal`);
      } catch (error) {
        console.error('[BILLING] Error checking invoices:', error);
      }
    }, 24 * 60 * 60 * 1000); // Daily
  }

  /**
   * Setup subscription status checks
   */
  private setupSubscriptionChecks(): void {
    // Check subscription statuses every hour
    setInterval(async () => {
      try {
        const expiredSubscriptions = await this.prisma.subscription.findMany({
          where: {
            status: 'ACTIVE',
            currentPeriodEnd: { lt: new Date() },
          },
        });

        for (const subscription of expiredSubscriptions) {
          // Update status
          await this.prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: 'PAST_DUE' },
          });

          // Send notification
          await this.prisma.notification.create({
            data: {
              userId: subscription.userId,
              type: 'SUBSCRIPTION_EXPIRED',
              title: 'Subscription Expired',
              message: 'Your subscription has expired. Please update your payment method to continue.',
            },
          });
        }
      } catch (error) {
        console.error('[BILLING] Error checking subscriptions:', error);
      }
    }, 60 * 60 * 1000); // Hourly
  }

  /**
   * Check if user can perform action based on quotas
   */
  async checkQuota(userId: string, type: UsageType, quantity: number = 1): Promise<boolean> {
    try {
      await this.service.trackUsage(userId, { type, quantity, metadata: { check: true } });
      return true;
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaError') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get module statistics
   */
  async getStats(): Promise<{
    totalSubscribers: number;
    activeSubscriptions: number;
    monthlyRecurringRevenue: number;
    churnRate: number;
    trialConversions: number;
    topPlan: string;
  }> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalSubscribers,
      activeSubscriptions,
      subscriptionsByPlan,
      canceledLastMonth,
      trialConversions,
    ] = await Promise.all([
      this.prisma.subscription.count(),
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      this.prisma.subscription.groupBy({
        by: ['tier'],
        where: { status: 'ACTIVE' },
        _count: true,
      }),
      this.prisma.subscription.count({
        where: {
          status: 'CANCELED',
          updatedAt: { gte: thirtyDaysAgo },
        },
      }),
      this.prisma.subscription.count({
        where: {
          status: 'ACTIVE',
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
    ]);

    // Calculate MRR
    const monthlyRecurringRevenue = await this.calculateMRR();

    // Calculate churn rate
    const churnRate = activeSubscriptions > 0
      ? (canceledLastMonth / activeSubscriptions) * 100
      : 0;

    // Find top plan
    const topPlan = subscriptionsByPlan.reduce((top, current) => {
      return current._count > (top?._count || 0) ? current : top;
    }, subscriptionsByPlan[0])?.tier || 'FREE';

    return {
      totalSubscribers,
      activeSubscriptions,
      monthlyRecurringRevenue,
      churnRate,
      trialConversions,
      topPlan,
    };
  }

  /**
   * Calculate Monthly Recurring Revenue
   */
  private async calculateMRR(): Promise<number> {
    const activeSubscriptions = await this.prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      include: { plan: true },
    });

    return activeSubscriptions.reduce((total, sub) => {
      const monthlyAmount = sub.billingCycle === 'MONTHLY'
        ? sub.plan.price.monthly
        : sub.plan.price.yearly / 12;
      return total + monthlyAmount;
    }, 0);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    database: boolean;
    stripe: boolean;
    details: any;
  }> {
    try {
      // Check database
      await this.prisma.subscription.count();
      const databaseHealthy = true;

      // Check Stripe (controller handles this)
      const stripeHealthy = true; // Would check via API

      return {
        status: databaseHealthy && stripeHealthy ? 'healthy' : 'degraded',
        database: databaseHealthy,
        stripe: stripeHealthy,
        details: {
          usageTracking: this.config.enableUsageTracking,
          webhooks: this.config.enableWebhooks,
          currency: this.config.currency,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        database: false,
        stripe: false,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Shutdown module
   */
  async shutdown(): Promise<void> {
    if (this.usageTrackingTimer) {
      clearInterval(this.usageTrackingTimer);
    }
    
    if (this.invoiceGenerationTimer) {
      clearInterval(this.invoiceGenerationTimer);
    }

    console.log('[BILLING] Module shut down');
  }

  /**
   * Get service instance
   */
  getService(): BillingService {
    return this.service;
  }

  /**
   * Get controller instance
   */
  getController(): BillingController {
    return this.controller;
  }

  /**
   * Update module configuration
   */
  updateConfig(config: Partial<BillingModuleConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Restart timers if intervals changed
    if (config.usageCheckInterval !== undefined && this.usageTrackingTimer) {
      clearInterval(this.usageTrackingTimer);
      this.setupUsageTracking(undefined as any); // Would need AI service reference
    }
  }

  /**
   * Create a test subscription (for development)
   */
  async createTestSubscription(userId: string, planId: string): Promise<void> {
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('Test subscriptions only available in development');
    }

    await this.prisma.subscription.create({
      data: {
        userId,
        planId,
        tier: planId.toUpperCase() as any,
        status: 'ACTIVE',
        billingCycle: 'MONTHLY',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
        stripeSubscriptionId: `test_sub_${Date.now()}`,
        stripeCustomerId: `test_cus_${Date.now()}`,
      },
    });
  }
}