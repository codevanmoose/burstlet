import { z } from 'zod';
import Stripe from 'stripe';

// Subscription Plans
export type PlanTier = 'FREE' | 'PRO' | 'BUSINESS' | 'ENTERPRISE';

export interface SubscriptionPlan {
  id: string;
  tier: PlanTier;
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: PlanFeature[];
  limits: PlanLimits;
  stripeProductId: string;
  stripePrices: {
    monthly: string;
    yearly: string;
  };
}

export interface PlanFeature {
  name: string;
  description: string;
  included: boolean;
  value?: string | number;
}

export interface PlanLimits {
  aiGenerations: {
    videos: number;
    blogs: number;
    socialPosts: number;
    scripts: number;
  };
  platformIntegrations: number;
  contentStorage: number; // in GB
  teamMembers: number;
  analytics: {
    historyDays: number;
    customReports: number;
  };
  apiCalls: number; // per month
}

// Subscription Types
export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  tier: PlanTier;
  status: SubscriptionStatus;
  billingCycle: 'MONTHLY' | 'YEARLY';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export type SubscriptionStatus = 
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCELED'
  | 'INCOMPLETE'
  | 'INCOMPLETE_EXPIRED'
  | 'TRIALING'
  | 'UNPAID';

// Usage Tracking
export interface UsageRecord {
  id: string;
  userId: string;
  subscriptionId: string;
  type: UsageType;
  quantity: number;
  metadata?: any;
  timestamp: Date;
  billingPeriod: Date;
}

export type UsageType = 
  | 'AI_VIDEO_GENERATION'
  | 'AI_BLOG_GENERATION'
  | 'AI_SOCIAL_POST_GENERATION'
  | 'AI_SCRIPT_GENERATION'
  | 'CONTENT_STORAGE'
  | 'API_CALLS';

export interface UsageSummary {
  period: {
    start: Date;
    end: Date;
  };
  usage: {
    aiGenerations: {
      videos: number;
      blogs: number;
      socialPosts: number;
      scripts: number;
    };
    contentStorage: number;
    apiCalls: number;
  };
  limits: PlanLimits;
  percentages: {
    aiVideos: number;
    aiBlogs: number;
    aiSocialPosts: number;
    aiScripts: number;
    storage: number;
    apiCalls: number;
  };
}

// Payment Methods
export interface PaymentMethod {
  id: string;
  userId: string;
  type: 'CARD' | 'BANK_ACCOUNT';
  isDefault: boolean;
  stripePaymentMethodId: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  bankAccount?: {
    bankName: string;
    last4: string;
  };
  createdAt: Date;
}

// Invoices
export interface Invoice {
  id: string;
  userId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  dueDate?: Date;
  paidAt?: Date;
  stripeInvoiceId: string;
  lineItems: InvoiceLineItem[];
  downloadUrl?: string;
  createdAt: Date;
}

export type InvoiceStatus = 
  | 'DRAFT'
  | 'OPEN'
  | 'PAID'
  | 'VOID'
  | 'UNCOLLECTIBLE';

export interface InvoiceLineItem {
  description: string;
  amount: number;
  quantity: number;
  unitPrice: number;
}

// Billing Events
export interface BillingEvent {
  id: string;
  userId?: string;
  type: BillingEventType;
  data: any;
  stripeEventId: string;
  processed: boolean;
  processedAt?: Date;
  error?: string;
  createdAt: Date;
}

export type BillingEventType = 
  | 'SUBSCRIPTION_CREATED'
  | 'SUBSCRIPTION_UPDATED'
  | 'SUBSCRIPTION_DELETED'
  | 'PAYMENT_SUCCEEDED'
  | 'PAYMENT_FAILED'
  | 'INVOICE_CREATED'
  | 'INVOICE_PAID'
  | 'INVOICE_PAYMENT_FAILED';

// Request/Response Schemas
export const CreateCheckoutSessionSchema = z.object({
  planId: z.string(),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  couponCode: z.string().optional(),
});

export const UpdateSubscriptionSchema = z.object({
  planId: z.string().optional(),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']).optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
});

export const CreatePaymentMethodSchema = z.object({
  paymentMethodId: z.string(), // Stripe payment method ID from frontend
  setAsDefault: z.boolean().optional().default(false),
});

export const UpdatePaymentMethodSchema = z.object({
  setAsDefault: z.boolean(),
});

export const CreateUsageRecordSchema = z.object({
  type: z.enum([
    'AI_VIDEO_GENERATION',
    'AI_BLOG_GENERATION',
    'AI_SOCIAL_POST_GENERATION',
    'AI_SCRIPT_GENERATION',
    'CONTENT_STORAGE',
    'API_CALLS',
  ]),
  quantity: z.number().positive(),
  metadata: z.any().optional(),
});

export const GetInvoicesSchema = z.object({
  status: z.enum(['DRAFT', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE']).optional(),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
});

export const PreviewUpgradeSchema = z.object({
  planId: z.string(),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']),
});

// API Response Types
export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export interface SubscriptionResponse {
  subscription: Subscription;
  plan: SubscriptionPlan;
  usage?: UsageSummary;
}

export interface PaymentMethodsResponse {
  paymentMethods: PaymentMethod[];
  defaultPaymentMethodId?: string;
}

export interface InvoicesResponse {
  invoices: Invoice[];
  total: number;
  hasMore: boolean;
}

export interface BillingOverviewResponse {
  subscription: Subscription | null;
  plan: SubscriptionPlan;
  usage: UsageSummary;
  nextInvoice?: {
    amount: number;
    dueDate: Date;
  };
  paymentMethods: PaymentMethod[];
  recentInvoices: Invoice[];
}

export interface UpgradePreviewResponse {
  currentPlan: SubscriptionPlan;
  newPlan: SubscriptionPlan;
  proratedAmount: number;
  immediatePayment: number;
  nextBillingAmount: number;
  changes: {
    feature: string;
    from: string | number;
    to: string | number;
  }[];
}

// Error Types
export class BillingError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'BillingError';
  }
}

export class PaymentError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 402
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

export class QuotaError extends Error {
  constructor(
    message: string,
    public code: string,
    public limit: number,
    public current: number,
    public statusCode: number = 403
  ) {
    super(message);
    this.name = 'QuotaError';
  }
}

// Webhook Types
export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}

// Billing Configuration
export interface BillingConfig {
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  trialPeriodDays: number;
  defaultPlanId: string;
  currency: string;
  taxRates?: string[];
}

// Coupon/Discount Types
export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  applicablePlans: PlanTier[];
  validFrom: Date;
  validUntil: Date;
  maxRedemptions?: number;
  currentRedemptions: number;
  stripeCouponId: string;
  isActive: boolean;
  createdAt: Date;
}

// Type exports
export type CreateCheckoutSessionRequest = z.infer<typeof CreateCheckoutSessionSchema>;
export type UpdateSubscriptionRequest = z.infer<typeof UpdateSubscriptionSchema>;
export type CreatePaymentMethodRequest = z.infer<typeof CreatePaymentMethodSchema>;
export type UpdatePaymentMethodRequest = z.infer<typeof UpdatePaymentMethodSchema>;
export type CreateUsageRecordRequest = z.infer<typeof CreateUsageRecordSchema>;
export type GetInvoicesRequest = z.infer<typeof GetInvoicesSchema>;
export type PreviewUpgradeRequest = z.infer<typeof PreviewUpgradeSchema>;

// Plan definitions (would typically be in a config file)
export const SUBSCRIPTION_PLANS: Record<PlanTier, Omit<SubscriptionPlan, 'id'>> = {
  FREE: {
    tier: 'FREE',
    name: 'Free',
    description: 'Get started with basic features',
    price: { monthly: 0, yearly: 0 },
    features: [
      { name: 'AI Generations', description: '10 per month', included: true, value: 10 },
      { name: 'Platform Integrations', description: '2 platforms', included: true, value: 2 },
      { name: 'Content Storage', description: '1 GB', included: true, value: 1 },
      { name: 'Basic Analytics', description: '7 days history', included: true },
      { name: 'Community Support', included: true },
    ],
    limits: {
      aiGenerations: { videos: 2, blogs: 3, socialPosts: 5, scripts: 5 },
      platformIntegrations: 2,
      contentStorage: 1,
      teamMembers: 1,
      analytics: { historyDays: 7, customReports: 0 },
      apiCalls: 100,
    },
    stripeProductId: '',
    stripePrices: { monthly: '', yearly: '' },
  },
  PRO: {
    tier: 'PRO',
    name: 'Pro',
    description: 'For content creators and influencers',
    price: { monthly: 29, yearly: 290 },
    features: [
      { name: 'AI Generations', description: '100 per month', included: true, value: 100 },
      { name: 'Platform Integrations', description: 'All platforms', included: true, value: -1 },
      { name: 'Content Storage', description: '50 GB', included: true, value: 50 },
      { name: 'Advanced Analytics', description: '90 days history', included: true },
      { name: 'Priority Support', included: true },
      { name: 'Custom Branding', included: true },
    ],
    limits: {
      aiGenerations: { videos: 20, blogs: 30, socialPosts: 50, scripts: 50 },
      platformIntegrations: -1,
      contentStorage: 50,
      teamMembers: 1,
      analytics: { historyDays: 90, customReports: 10 },
      apiCalls: 10000,
    },
    stripeProductId: '',
    stripePrices: { monthly: '', yearly: '' },
  },
  BUSINESS: {
    tier: 'BUSINESS',
    name: 'Business',
    description: 'For teams and agencies',
    price: { monthly: 99, yearly: 990 },
    features: [
      { name: 'AI Generations', description: '500 per month', included: true, value: 500 },
      { name: 'Platform Integrations', description: 'All platforms', included: true, value: -1 },
      { name: 'Content Storage', description: '200 GB', included: true, value: 200 },
      { name: 'Advanced Analytics', description: 'Unlimited history', included: true },
      { name: 'Team Collaboration', description: 'Up to 5 members', included: true, value: 5 },
      { name: 'API Access', included: true },
      { name: 'White Label Options', included: true },
    ],
    limits: {
      aiGenerations: { videos: 100, blogs: 150, socialPosts: 250, scripts: 250 },
      platformIntegrations: -1,
      contentStorage: 200,
      teamMembers: 5,
      analytics: { historyDays: -1, customReports: 50 },
      apiCalls: 50000,
    },
    stripeProductId: '',
    stripePrices: { monthly: '', yearly: '' },
  },
  ENTERPRISE: {
    tier: 'ENTERPRISE',
    name: 'Enterprise',
    description: 'Custom solutions for large organizations',
    price: { monthly: 499, yearly: 4990 },
    features: [
      { name: 'AI Generations', description: 'Unlimited', included: true, value: -1 },
      { name: 'Platform Integrations', description: 'All platforms', included: true, value: -1 },
      { name: 'Content Storage', description: 'Unlimited', included: true, value: -1 },
      { name: 'Advanced Analytics', description: 'Unlimited history', included: true },
      { name: 'Unlimited Team Members', included: true, value: -1 },
      { name: 'Dedicated Support', included: true },
      { name: 'Custom Integrations', included: true },
      { name: 'SLA Guarantee', included: true },
    ],
    limits: {
      aiGenerations: { videos: -1, blogs: -1, socialPosts: -1, scripts: -1 },
      platformIntegrations: -1,
      contentStorage: -1,
      teamMembers: -1,
      analytics: { historyDays: -1, customReports: -1 },
      apiCalls: -1,
    },
    stripeProductId: '',
    stripePrices: { monthly: '', yearly: '' },
  },
};