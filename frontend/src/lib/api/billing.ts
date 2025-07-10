import { apiClient } from './client';

// Types
export interface Subscription {
  id: string;
  userId: string;
  plan: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEnd?: string;
  metadata?: any;
}

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    videos: number;
    blogs: number;
    socialPosts: number;
    storage: number;
    platforms: number;
  };
  popular?: boolean;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  brand?: string;
  last4: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  createdAt: string;
}

export interface Invoice {
  id: string;
  number: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  amount: number;
  currency: string;
  dueDate?: string;
  paidAt?: string;
  downloadUrl?: string;
  items: Array<{
    description: string;
    amount: number;
    quantity: number;
  }>;
  createdAt: string;
}

export interface Usage {
  period: {
    start: string;
    end: string;
  };
  usage: {
    videos: { used: number; limit: number };
    blogs: { used: number; limit: number };
    socialPosts: { used: number; limit: number };
    storage: { used: number; limit: number };
  };
  overage?: {
    videos: number;
    blogs: number;
    socialPosts: number;
    storage: number;
    totalCost: number;
  };
}

// API functions
export const billingApi = {
  /**
   * Get current subscription
   */
  async getSubscription(): Promise<Subscription> {
    return apiClient.get('/billing/subscription');
  },

  /**
   * Get available pricing plans
   */
  async getPricingPlans(): Promise<PricingPlan[]> {
    return apiClient.get('/billing/plans');
  },

  /**
   * Subscribe to a plan
   */
  async subscribe(planId: string, paymentMethodId?: string): Promise<{
    subscription: Subscription;
    clientSecret?: string;
  }> {
    return apiClient.post('/billing/subscribe', { planId, paymentMethodId });
  },

  /**
   * Update subscription
   */
  async updateSubscription(planId: string): Promise<Subscription> {
    return apiClient.post('/billing/subscription/update', { planId });
  },

  /**
   * Cancel subscription
   */
  async cancelSubscription(immediately?: boolean): Promise<Subscription> {
    return apiClient.post('/billing/subscription/cancel', { immediately });
  },

  /**
   * Resume subscription
   */
  async resumeSubscription(): Promise<Subscription> {
    return apiClient.post('/billing/subscription/resume');
  },

  /**
   * Get payment methods
   */
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    return apiClient.get('/billing/payment-methods');
  },

  /**
   * Add payment method
   */
  async addPaymentMethod(paymentMethodId: string): Promise<PaymentMethod> {
    return apiClient.post('/billing/payment-methods', { paymentMethodId });
  },

  /**
   * Remove payment method
   */
  async removePaymentMethod(paymentMethodId: string): Promise<{ message: string }> {
    return apiClient.delete(`/billing/payment-methods/${paymentMethodId}`);
  },

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(paymentMethodId: string): Promise<PaymentMethod> {
    return apiClient.post(`/billing/payment-methods/${paymentMethodId}/default`);
  },

  /**
   * Get invoices
   */
  async getInvoices(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    invoices: Invoice[];
    total: number;
  }> {
    return apiClient.get('/billing/invoices', { params });
  },

  /**
   * Download invoice
   */
  async downloadInvoice(invoiceId: string): Promise<Blob> {
    const response = await apiClient.get(`/billing/invoices/${invoiceId}/download`, {
      responseType: 'blob',
    });
    return response as any;
  },

  /**
   * Get usage
   */
  async getUsage(period?: { start: string; end: string }): Promise<Usage> {
    return apiClient.get('/billing/usage', { params: period });
  },

  /**
   * Get billing portal URL
   */
  async getBillingPortalUrl(): Promise<{ url: string }> {
    return apiClient.post('/billing/portal');
  },

  /**
   * Create checkout session
   */
  async createCheckoutSession(data: {
    planId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ sessionId: string; url: string }> {
    return apiClient.post('/billing/checkout', data);
  },

  /**
   * Apply promo code
   */
  async applyPromoCode(code: string): Promise<{
    discount: number;
    description: string;
  }> {
    return apiClient.post('/billing/promo', { code });
  },

  /**
   * Get tax info
   */
  async getTaxInfo(): Promise<{
    taxId?: string;
    taxRate: number;
    country: string;
    state?: string;
  }> {
    return apiClient.get('/billing/tax');
  },

  /**
   * Update tax info
   */
  async updateTaxInfo(data: {
    taxId?: string;
    country: string;
    state?: string;
  }): Promise<{ message: string }> {
    return apiClient.post('/billing/tax', data);
  },
};