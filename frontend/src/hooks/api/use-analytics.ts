import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';

export interface AnalyticsParams {
  dateFrom?: string;
  dateTo?: string;
  platform?: string;
  contentType?: string;
  contentId?: string;
}

export function useAnalytics(params?: AnalyticsParams) {
  return useQuery({
    queryKey: ['analytics', params],
    queryFn: () => analyticsApi.getOverview({
      startDate: params?.dateFrom,
      endDate: params?.dateTo,
    }),
  });
}

export function useContentAnalytics(params?: AnalyticsParams) {
  return useQuery({
    queryKey: ['analytics', 'content', params],
    queryFn: () => analyticsApi.getContentAnalytics({
      startDate: params?.dateFrom,
      endDate: params?.dateTo,
      platform: params?.platform,
      type: params?.contentType,
    }),
  });
}

export function usePlatformAnalytics(params?: AnalyticsParams) {
  return useQuery({
    queryKey: ['analytics', 'platform', params],
    queryFn: () => analyticsApi.getPlatformPerformance({
      platform: params?.platform,
      startDate: params?.dateFrom,
      endDate: params?.dateTo,
    }),
  });
}

export function useAudienceInsights(params?: AnalyticsParams) {
  return useQuery({
    queryKey: ['analytics', 'audience', params],
    queryFn: () => analyticsApi.getAudienceInsights({
      platform: params?.platform,
      startDate: params?.dateFrom,
      endDate: params?.dateTo,
    }),
  });
}

export function usePerformanceMetrics(params?: AnalyticsParams) {
  return useQuery({
    queryKey: ['analytics', 'performance', params],
    queryFn: () => analyticsApi.getMetrics({
      metrics: ['views', 'engagement', 'reach', 'impressions'],
      startDate: params?.dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: params?.dateTo || new Date().toISOString(),
      platform: params?.platform,
      interval: 'day',
    }),
  });
}

export function useTopContent(params?: AnalyticsParams & { limit?: number }) {
  return useQuery({
    queryKey: ['analytics', 'top-content', params],
    queryFn: () => analyticsApi.getContentAnalytics({
      startDate: params?.dateFrom,
      endDate: params?.dateTo,
      platform: params?.platform,
      sortBy: 'engagementRate',
      limit: params?.limit || 10,
    }),
  });
}

export function useTrendAnalysis(params?: AnalyticsParams) {
  return useQuery({
    queryKey: ['analytics', 'trends', params],
    queryFn: () => analyticsApi.getTrendingContent({
      platform: params?.platform,
      limit: 10,
    }),
  });
}