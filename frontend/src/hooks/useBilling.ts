import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { billingApi } from '@/lib/api/services/billing';
import type { 
  Subscription, 
  PaymentMethod, 
  Invoice,
  UsageStats,
  SubscriptionPlan,
  CheckoutSession 
} from '@/types/billing';

export function useSubscription() {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: billingApi.getSubscription,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: ['payment-methods'],
    queryFn: billingApi.getPaymentMethods,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useInvoices(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: () => billingApi.getInvoices(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUsageStats() {
  return useQuery({
    queryKey: ['usage-stats'],
    queryFn: billingApi.getUsageStats,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useAvailablePlans() {
  return useQuery({
    queryKey: ['available-plans'],
    queryFn: billingApi.getAvailablePlans,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useCreateCheckoutSession() {
  const router = useRouter();
  
  return useMutation({
    mutationFn: (planId: string) => billingApi.createCheckoutSession(planId),
    onSuccess: (session: CheckoutSession) => {
      if (session.url) {
        window.location.href = session.url;
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create checkout session');
    },
  });
}

export function useAddPaymentMethod() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: billingApi.addPaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      toast.success('Payment method added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add payment method');
    },
  });
}

export function useUpdateDefaultPaymentMethod() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (paymentMethodId: string) => 
      billingApi.updateDefaultPaymentMethod(paymentMethodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      toast.success('Default payment method updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update default payment method');
    },
  });
}

export function useRemovePaymentMethod() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (paymentMethodId: string) => 
      billingApi.removePaymentMethod(paymentMethodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      toast.success('Payment method removed');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove payment method');
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (reason?: string) => billingApi.cancelSubscription(reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      toast.success('Subscription cancelled. You will have access until the end of your billing period.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel subscription');
    },
  });
}

export function useReactivateSubscription() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: billingApi.reactivateSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      toast.success('Subscription reactivated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reactivate subscription');
    },
  });
}

export function useDownloadInvoice() {
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const blob = await billingApi.downloadInvoice(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to download invoice');
    },
  });
}

export function usePreviewProration() {
  return useMutation({
    mutationFn: (planId: string) => billingApi.previewProration(planId),
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to calculate proration');
    },
  });
}