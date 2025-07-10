export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: PlanFeature[];
  limits: PlanLimits;
  stripePriceId: string;
  popular?: boolean;
}

export interface PlanFeature {
  name: string;
  included: boolean;
  value?: string | number;
}

export interface PlanLimits {
  videoGenerations: number;
  blogPosts: number;
  socialPosts: number;
  storage: number; // in GB
  teamMembers: number;
  apiRequests: number;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  plan: SubscriptionPlan;
  status: 'active' | 'cancelled' | 'past_due' | 'trialing' | 'paused';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: string;
  trialEnd?: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
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
  isDefault: boolean;
  createdAt: string;
  stripePaymentMethodId: string;
}

export interface Invoice {
  id: string;
  number: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  amount: number;
  currency: string;
  description?: string;
  periodStart: string;
  periodEnd: string;
  dueDate?: string;
  paidAt?: string;
  invoicePdf?: string;
  stripeInvoiceId: string;
  createdAt: string;
}

export interface UsageStats {
  videoGenerations: {
    used: number;
    limit: number;
    percentage: number;
  };
  blogPosts: {
    used: number;
    limit: number;
    percentage: number;
  };
  socialPosts: {
    used: number;
    limit: number;
    percentage: number;
  };
  storage: {
    used: number; // in GB
    limit: number; // in GB
    percentage: number;
  };
  apiRequests: {
    used: number;
    limit: number;
    percentage: number;
  };
  billingPeriod: {
    start: string;
    end: string;
    daysRemaining: number;
  };
}

export interface CheckoutSession {
  id: string;
  url: string;
  stripeSessionId: string;
}

export interface ProrationPreview {
  amount: number;
  currency: string;
  prorationDate: string;
  invoiceItems: Array<{
    description: string;
    amount: number;
  }>;
}

export interface BillingPortalSession {
  url: string;
}

export interface AddPaymentMethodInput {
  paymentMethodId: string; // Stripe payment method ID from Elements
}

export interface CancelSubscriptionInput {
  reason?: string;
  feedback?: string;
}