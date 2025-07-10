import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import {
  SubscriptionPlan,
  Subscription,
  PaymentMethod,
  Invoice,
  UsageRecord,
  BillingEvent,
  CreateCheckoutSessionRequest,
  UpdateSubscriptionRequest,
  CreatePaymentMethodRequest,
  CreateUsageRecordRequest,
  GetInvoicesRequest,
  PreviewUpgradeRequest,
  CheckoutSessionResponse,
  SubscriptionResponse,
  PaymentMethodsResponse,
  InvoicesResponse,
  BillingOverviewResponse,
  UpgradePreviewResponse,
  UsageSummary,
  BillingError,
  PaymentError,
  QuotaError,
  PlanTier,
  SUBSCRIPTION_PLANS,
  UsageType,
  SubscriptionStatus,
} from './types';

export class BillingService {
  private stripe: Stripe;

  constructor(
    private prisma: PrismaClient,
    stripeSecretKey: string
  ) {
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });
  }

  /**
   * Create a checkout session for subscription
   */
  async createCheckoutSession(
    userId: string,
    request: CreateCheckoutSessionRequest
  ): Promise<CheckoutSessionResponse> {
    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      throw new BillingError('User not found', 'USER_NOT_FOUND', 404);
    }

    // Check if user already has active subscription
    if (user.subscription && user.subscription.status === 'ACTIVE') {
      throw new BillingError(
        'User already has an active subscription',
        'SUBSCRIPTION_EXISTS',
        400
      );
    }

    // Get plan details
    const plan = await this.getPlanById(request.planId);
    if (!plan) {
      throw new BillingError('Invalid plan', 'INVALID_PLAN', 400);
    }

    // Get or create Stripe customer
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: { userId },
      });
      
      stripeCustomerId = customer.id;
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId },
      });
    }

    // Get price ID based on billing cycle
    const priceId = request.billingCycle === 'MONTHLY' 
      ? plan.stripePrices.monthly 
      : plan.stripePrices.yearly;

    // Create checkout session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: request.successUrl,
      cancel_url: request.cancelUrl,
      metadata: {
        userId,
        planId: plan.id,
        billingCycle: request.billingCycle,
      },
      subscription_data: {
        trial_period_days: plan.tier === 'FREE' ? 0 : 7,
        metadata: {
          userId,
          planId: plan.id,
        },
      },
    };

    // Apply coupon if provided
    if (request.couponCode) {
      const coupon = await this.validateCoupon(request.couponCode, plan.tier);
      if (coupon) {
        sessionParams.discounts = [{
          coupon: coupon.stripeCouponId,
        }];
      }
    }

    const session = await this.stripe.checkout.sessions.create(sessionParams);

    return {
      sessionId: session.id,
      url: session.url!,
    };
  }

  /**
   * Get user's subscription details
   */
  async getSubscription(userId: string): Promise<SubscriptionResponse | null> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      return null;
    }

    const plan = await this.getPlanById(subscription.planId);
    const usage = await this.getUsageSummary(userId);

    return {
      subscription,
      plan: plan!,
      usage,
    };
  }

  /**
   * Update subscription
   */
  async updateSubscription(
    userId: string,
    request: UpdateSubscriptionRequest
  ): Promise<SubscriptionResponse> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new BillingError('No active subscription', 'NO_SUBSCRIPTION', 404);
    }

    // Handle plan change
    if (request.planId && request.planId !== subscription.planId) {
      await this.changePlan(subscription, request.planId, request.billingCycle);
    }

    // Handle billing cycle change
    if (request.billingCycle && request.billingCycle !== subscription.billingCycle) {
      await this.changeBillingCycle(subscription, request.billingCycle);
    }

    // Handle cancellation
    if (request.cancelAtPeriodEnd !== undefined) {
      const stripeSubscription = await this.stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        { cancel_at_period_end: request.cancelAtPeriodEnd }
      );

      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          cancelAtPeriodEnd: request.cancelAtPeriodEnd,
          status: stripeSubscription.status.toUpperCase() as SubscriptionStatus,
        },
      });
    }

    return this.getSubscription(userId)!;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new BillingError('No active subscription', 'NO_SUBSCRIPTION', 404);
    }

    // Cancel in Stripe
    await this.stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      { cancel_at_period_end: true }
    );

    // Update database
    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { cancelAtPeriodEnd: true },
    });
  }

  /**
   * Add payment method
   */
  async addPaymentMethod(
    userId: string,
    request: CreatePaymentMethodRequest
  ): Promise<PaymentMethod> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BillingError('User not found', 'USER_NOT_FOUND', 404);
    }

    // Attach payment method to customer
    const paymentMethod = await this.stripe.paymentMethods.attach(
      request.paymentMethodId,
      { customer: user.stripeCustomerId! }
    );

    // Set as default if requested
    if (request.setAsDefault) {
      await this.stripe.customers.update(user.stripeCustomerId!, {
        invoice_settings: { default_payment_method: paymentMethod.id },
      });

      // Update other payment methods
      await this.prisma.paymentMethod.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Save to database
    const savedPaymentMethod = await this.prisma.paymentMethod.create({
      data: {
        userId,
        type: paymentMethod.type === 'card' ? 'CARD' : 'BANK_ACCOUNT',
        isDefault: request.setAsDefault || false,
        stripePaymentMethodId: paymentMethod.id,
        card: paymentMethod.card ? {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          expMonth: paymentMethod.card.exp_month,
          expYear: paymentMethod.card.exp_year,
        } : undefined,
      },
    });

    return savedPaymentMethod;
  }

  /**
   * Get payment methods
   */
  async getPaymentMethods(userId: string): Promise<PaymentMethodsResponse> {
    const paymentMethods = await this.prisma.paymentMethod.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const defaultMethod = paymentMethods.find(pm => pm.isDefault);

    return {
      paymentMethods,
      defaultPaymentMethodId: defaultMethod?.id,
    };
  }

  /**
   * Remove payment method
   */
  async removePaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    const paymentMethod = await this.prisma.paymentMethod.findFirst({
      where: { id: paymentMethodId, userId },
    });

    if (!paymentMethod) {
      throw new BillingError('Payment method not found', 'PAYMENT_METHOD_NOT_FOUND', 404);
    }

    // Detach from Stripe
    await this.stripe.paymentMethods.detach(paymentMethod.stripePaymentMethodId);

    // Delete from database
    await this.prisma.paymentMethod.delete({
      where: { id: paymentMethodId },
    });
  }

  /**
   * Track usage
   */
  async trackUsage(
    userId: string,
    request: CreateUsageRecordRequest
  ): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new BillingError('No active subscription', 'NO_SUBSCRIPTION', 404);
    }

    // Check quota
    await this.checkQuota(userId, request.type, request.quantity);

    // Record usage
    await this.prisma.usageRecord.create({
      data: {
        userId,
        subscriptionId: subscription.id,
        type: request.type,
        quantity: request.quantity,
        metadata: request.metadata,
        billingPeriod: subscription.currentPeriodStart,
      },
    });
  }

  /**
   * Get usage summary
   */
  async getUsageSummary(userId: string): Promise<UsageSummary> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new BillingError('No active subscription', 'NO_SUBSCRIPTION', 404);
    }

    const plan = await this.getPlanById(subscription.planId);
    const limits = plan!.limits;

    // Get usage records for current period
    const usage = await this.prisma.usageRecord.findMany({
      where: {
        userId,
        billingPeriod: subscription.currentPeriodStart,
      },
    });

    // Calculate usage by type
    const aiGenerations = {
      videos: this.sumUsageByType(usage, 'AI_VIDEO_GENERATION'),
      blogs: this.sumUsageByType(usage, 'AI_BLOG_GENERATION'),
      socialPosts: this.sumUsageByType(usage, 'AI_SOCIAL_POST_GENERATION'),
      scripts: this.sumUsageByType(usage, 'AI_SCRIPT_GENERATION'),
    };

    const contentStorage = this.sumUsageByType(usage, 'CONTENT_STORAGE');
    const apiCalls = this.sumUsageByType(usage, 'API_CALLS');

    // Calculate percentages
    const percentages = {
      aiVideos: this.calculatePercentage(aiGenerations.videos, limits.aiGenerations.videos),
      aiBlogs: this.calculatePercentage(aiGenerations.blogs, limits.aiGenerations.blogs),
      aiSocialPosts: this.calculatePercentage(aiGenerations.socialPosts, limits.aiGenerations.socialPosts),
      aiScripts: this.calculatePercentage(aiGenerations.scripts, limits.aiGenerations.scripts),
      storage: this.calculatePercentage(contentStorage, limits.contentStorage),
      apiCalls: this.calculatePercentage(apiCalls, limits.apiCalls),
    };

    return {
      period: {
        start: subscription.currentPeriodStart,
        end: subscription.currentPeriodEnd,
      },
      usage: {
        aiGenerations,
        contentStorage,
        apiCalls,
      },
      limits,
      percentages,
    };
  }

  /**
   * Get invoices
   */
  async getInvoices(
    userId: string,
    request: GetInvoicesRequest
  ): Promise<InvoicesResponse> {
    const where: any = { userId };
    
    if (request.status) {
      where.status = request.status;
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: request.limit,
        skip: request.offset,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      invoices,
      total,
      hasMore: total > request.offset + request.limit,
    };
  }

  /**
   * Get billing overview
   */
  async getBillingOverview(userId: string): Promise<BillingOverviewResponse> {
    const [subscription, paymentMethods, recentInvoices] = await Promise.all([
      this.getSubscription(userId),
      this.getPaymentMethods(userId),
      this.getInvoices(userId, { limit: 5, offset: 0 }),
    ]);

    const plan = subscription?.plan || (await this.getPlanById('free'))!;
    const usage = subscription?.usage || await this.getUsageSummary(userId);

    let nextInvoice;
    if (subscription?.subscription && !subscription.subscription.cancelAtPeriodEnd) {
      try {
        const upcoming = await this.stripe.invoices.retrieveUpcoming({
          customer: subscription.subscription.stripeCustomerId,
        });
        nextInvoice = {
          amount: upcoming.amount_due / 100,
          dueDate: new Date(upcoming.period_end * 1000),
        };
      } catch (error) {
        // No upcoming invoice
      }
    }

    return {
      subscription: subscription?.subscription || null,
      plan,
      usage,
      nextInvoice,
      paymentMethods: paymentMethods.paymentMethods,
      recentInvoices: recentInvoices.invoices,
    };
  }

  /**
   * Preview subscription upgrade
   */
  async previewUpgrade(
    userId: string,
    request: PreviewUpgradeRequest
  ): Promise<UpgradePreviewResponse> {
    const currentSubscription = await this.getSubscription(userId);
    if (!currentSubscription) {
      throw new BillingError('No active subscription', 'NO_SUBSCRIPTION', 404);
    }

    const newPlan = await this.getPlanById(request.planId);
    if (!newPlan) {
      throw new BillingError('Invalid plan', 'INVALID_PLAN', 400);
    }

    const currentPlan = currentSubscription.plan;

    // Calculate prorated amount
    const proration = await this.calculateProration(
      currentSubscription.subscription,
      newPlan,
      request.billingCycle
    );

    // Compare features
    const changes = this.compareFeatures(currentPlan, newPlan);

    return {
      currentPlan,
      newPlan,
      proratedAmount: proration.amount,
      immediatePayment: proration.immediatePayment,
      nextBillingAmount: request.billingCycle === 'MONTHLY' 
        ? newPlan.price.monthly 
        : newPlan.price.yearly,
      changes,
    };
  }

  /**
   * Handle Stripe webhook
   */
  async handleWebhook(event: Stripe.Event): Promise<void> {
    // Save event
    await this.prisma.billingEvent.create({
      data: {
        type: this.mapStripeEventType(event.type),
        data: event.data.object,
        stripeEventId: event.id,
        processed: false,
      },
    });

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
    }

    // Mark as processed
    await this.prisma.billingEvent.updateMany({
      where: { stripeEventId: event.id },
      data: { processed: true, processedAt: new Date() },
    });
  }

  // Private helper methods

  private async getPlanById(planId: string): Promise<SubscriptionPlan | null> {
    const tier = planId.toUpperCase() as PlanTier;
    const planConfig = SUBSCRIPTION_PLANS[tier];
    
    if (!planConfig) {
      return null;
    }

    return {
      id: planId,
      ...planConfig,
    };
  }

  private async validateCoupon(code: string, planTier: PlanTier): Promise<any> {
    const coupon = await this.prisma.coupon.findFirst({
      where: {
        code,
        isActive: true,
        validFrom: { lte: new Date() },
        validUntil: { gte: new Date() },
      },
    });

    if (!coupon || !coupon.applicablePlans.includes(planTier)) {
      return null;
    }

    if (coupon.maxRedemptions && coupon.currentRedemptions >= coupon.maxRedemptions) {
      return null;
    }

    return coupon;
  }

  private async checkQuota(userId: string, type: UsageType, quantity: number): Promise<void> {
    const summary = await this.getUsageSummary(userId);
    const limits = summary.limits;
    let current = 0;
    let limit = 0;

    switch (type) {
      case 'AI_VIDEO_GENERATION':
        current = summary.usage.aiGenerations.videos;
        limit = limits.aiGenerations.videos;
        break;
      case 'AI_BLOG_GENERATION':
        current = summary.usage.aiGenerations.blogs;
        limit = limits.aiGenerations.blogs;
        break;
      case 'AI_SOCIAL_POST_GENERATION':
        current = summary.usage.aiGenerations.socialPosts;
        limit = limits.aiGenerations.socialPosts;
        break;
      case 'AI_SCRIPT_GENERATION':
        current = summary.usage.aiGenerations.scripts;
        limit = limits.aiGenerations.scripts;
        break;
      case 'CONTENT_STORAGE':
        current = summary.usage.contentStorage;
        limit = limits.contentStorage;
        break;
      case 'API_CALLS':
        current = summary.usage.apiCalls;
        limit = limits.apiCalls;
        break;
    }

    if (limit !== -1 && current + quantity > limit) {
      throw new QuotaError(
        `${type} quota exceeded`,
        'QUOTA_EXCEEDED',
        limit,
        current + quantity
      );
    }
  }

  private sumUsageByType(usage: UsageRecord[], type: UsageType): number {
    return usage
      .filter(u => u.type === type)
      .reduce((sum, u) => sum + u.quantity, 0);
  }

  private calculatePercentage(used: number, limit: number): number {
    if (limit === -1) return 0;
    return Math.min((used / limit) * 100, 100);
  }

  private async changePlan(
    subscription: Subscription,
    newPlanId: string,
    billingCycle?: 'MONTHLY' | 'YEARLY'
  ): Promise<void> {
    const newPlan = await this.getPlanById(newPlanId);
    if (!newPlan) {
      throw new BillingError('Invalid plan', 'INVALID_PLAN', 400);
    }

    const priceId = (billingCycle || subscription.billingCycle) === 'MONTHLY'
      ? newPlan.stripePrices.monthly
      : newPlan.stripePrices.yearly;

    // Update Stripe subscription
    await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [{
        id: (await this.stripe.subscriptions.retrieve(subscription.stripeSubscriptionId)).items.data[0].id,
        price: priceId,
      }],
      proration_behavior: 'create_prorations',
    });

    // Update database
    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        planId: newPlanId,
        tier: newPlan.tier,
        billingCycle: billingCycle || subscription.billingCycle,
      },
    });
  }

  private async changeBillingCycle(
    subscription: Subscription,
    billingCycle: 'MONTHLY' | 'YEARLY'
  ): Promise<void> {
    const plan = await this.getPlanById(subscription.planId);
    const priceId = billingCycle === 'MONTHLY'
      ? plan!.stripePrices.monthly
      : plan!.stripePrices.yearly;

    // Update Stripe subscription
    await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [{
        id: (await this.stripe.subscriptions.retrieve(subscription.stripeSubscriptionId)).items.data[0].id,
        price: priceId,
      }],
      proration_behavior: 'create_prorations',
    });

    // Update database
    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { billingCycle },
    });
  }

  private async calculateProration(
    subscription: Subscription,
    newPlan: SubscriptionPlan,
    billingCycle: 'MONTHLY' | 'YEARLY'
  ): Promise<{ amount: number; immediatePayment: number }> {
    // Simplified proration calculation
    const currentPlan = await this.getPlanById(subscription.planId);
    const daysRemaining = Math.ceil(
      (subscription.currentPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    
    const currentDailyRate = subscription.billingCycle === 'MONTHLY'
      ? currentPlan!.price.monthly / 30
      : currentPlan!.price.yearly / 365;
    
    const newDailyRate = billingCycle === 'MONTHLY'
      ? newPlan.price.monthly / 30
      : newPlan.price.yearly / 365;
    
    const creditAmount = currentDailyRate * daysRemaining;
    const chargeAmount = newDailyRate * daysRemaining;
    
    return {
      amount: chargeAmount - creditAmount,
      immediatePayment: Math.max(0, chargeAmount - creditAmount),
    };
  }

  private compareFeatures(
    currentPlan: SubscriptionPlan,
    newPlan: SubscriptionPlan
  ): Array<{ feature: string; from: string | number; to: string | number }> {
    const changes = [];

    // Compare AI generations
    if (currentPlan.limits.aiGenerations.videos !== newPlan.limits.aiGenerations.videos) {
      changes.push({
        feature: 'AI Video Generations',
        from: currentPlan.limits.aiGenerations.videos === -1 ? 'Unlimited' : currentPlan.limits.aiGenerations.videos,
        to: newPlan.limits.aiGenerations.videos === -1 ? 'Unlimited' : newPlan.limits.aiGenerations.videos,
      });
    }

    // Compare storage
    if (currentPlan.limits.contentStorage !== newPlan.limits.contentStorage) {
      changes.push({
        feature: 'Content Storage',
        from: currentPlan.limits.contentStorage === -1 ? 'Unlimited' : `${currentPlan.limits.contentStorage} GB`,
        to: newPlan.limits.contentStorage === -1 ? 'Unlimited' : `${newPlan.limits.contentStorage} GB`,
      });
    }

    // Compare team members
    if (currentPlan.limits.teamMembers !== newPlan.limits.teamMembers) {
      changes.push({
        feature: 'Team Members',
        from: currentPlan.limits.teamMembers === -1 ? 'Unlimited' : currentPlan.limits.teamMembers,
        to: newPlan.limits.teamMembers === -1 ? 'Unlimited' : newPlan.limits.teamMembers,
      });
    }

    return changes;
  }

  private mapStripeEventType(stripeType: string): string {
    const mapping: Record<string, string> = {
      'checkout.session.completed': 'SUBSCRIPTION_CREATED',
      'customer.subscription.updated': 'SUBSCRIPTION_UPDATED',
      'customer.subscription.deleted': 'SUBSCRIPTION_DELETED',
      'invoice.paid': 'INVOICE_PAID',
      'invoice.payment_failed': 'INVOICE_PAYMENT_FAILED',
    };
    
    return mapping[stripeType] || stripeType.toUpperCase();
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const { userId, planId, billingCycle } = session.metadata!;
    
    // Create subscription record
    await this.prisma.subscription.create({
      data: {
        userId,
        planId,
        tier: planId.toUpperCase() as PlanTier,
        status: 'ACTIVE',
        billingCycle: billingCycle as 'MONTHLY' | 'YEARLY',
        currentPeriodStart: new Date(session.subscription! as any).current_period_start * 1000,
        currentPeriodEnd: new Date(session.subscription! as any).current_period_end * 1000,
        cancelAtPeriodEnd: false,
        stripeSubscriptionId: session.subscription as string,
        stripeCustomerId: session.customer as string,
      },
    });
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    await this.prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: subscription.status.toUpperCase() as SubscriptionStatus,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    await this.prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: { status: 'CANCELED' },
    });
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    // Create or update invoice record
    await this.prisma.invoice.upsert({
      where: { stripeInvoiceId: invoice.id },
      create: {
        userId: invoice.metadata?.userId || '',
        subscriptionId: invoice.subscription as string,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
        status: 'PAID',
        paidAt: new Date(invoice.status_transitions.paid_at! * 1000),
        stripeInvoiceId: invoice.id,
        lineItems: invoice.lines.data.map(item => ({
          description: item.description || '',
          amount: item.amount / 100,
          quantity: item.quantity || 1,
          unitPrice: item.price?.unit_amount ? item.price.unit_amount / 100 : 0,
        })),
        downloadUrl: invoice.invoice_pdf,
      },
      update: {
        status: 'PAID',
        paidAt: new Date(invoice.status_transitions.paid_at! * 1000),
        downloadUrl: invoice.invoice_pdf,
      },
    });
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    // Update subscription status
    await this.prisma.subscription.updateMany({
      where: { stripeSubscriptionId: invoice.subscription as string },
      data: { status: 'PAST_DUE' },
    });

    // Send notification
    await this.prisma.notification.create({
      data: {
        userId: invoice.metadata?.userId || '',
        type: 'PAYMENT_FAILED',
        title: 'Payment Failed',
        message: 'We were unable to process your payment. Please update your payment method.',
        data: { invoiceId: invoice.id },
      },
    });
  }
}