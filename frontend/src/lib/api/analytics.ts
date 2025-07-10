import { apiClient } from './client';

// Types
export interface AnalyticsOverview {
  totalContent: number;
  totalViews: number;
  totalEngagement: number;
  totalFollowers: number;
  contentByType: Record<string, number>;
  contentByStatus: Record<string, number>;
  growthRate: number;
  engagementRate: number;
}

export interface MetricData {
  date: string;
  value: number;
}

export interface AnalyticsMetrics {
  views: MetricData[];
  likes: MetricData[];
  shares: MetricData[];
  comments: MetricData[];
  followers: MetricData[];
  engagement: MetricData[];
}

export interface ContentAnalytics {
  contentId: string;
  title: string;
  type: string;
  publishedAt: string;
  platforms: string[];
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  totalComments: number;
  engagementRate: number;
  performanceScore: number;
  trending: boolean;
}

export interface PlatformPerformance {
  platform: string;
  metrics: {
    posts: number;
    views: number;
    engagement: number;
    followers: number;
    growthRate: number;
  };
  topContent: ContentAnalytics[];
}

export interface AudienceInsights {
  demographics: {
    age: Record<string, number>;
    gender: Record<string, number>;
    location: Record<string, number>;
    interests: string[];
  };
  behavior: {
    activeHours: Record<string, number>;
    activeDays: Record<string, number>;
    deviceTypes: Record<string, number>;
    contentPreferences: Record<string, number>;
  };
}

export interface Report {
  id: string;
  name: string;
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  period: {
    startDate: string;
    endDate: string;
  };
  metrics: string[];
  platforms: string[];
  data: any;
  createdAt: string;
}

// API functions
export const analyticsApi = {
  /**
   * Get analytics overview
   */
  async getOverview(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<AnalyticsOverview> {
    return apiClient.get('/analytics/overview', { params });
  },

  /**
   * Get metrics over time
   */
  async getMetrics(params: {
    metrics: string[];
    startDate: string;
    endDate: string;
    interval?: 'hour' | 'day' | 'week' | 'month';
    platform?: string;
  }): Promise<AnalyticsMetrics> {
    return apiClient.get('/analytics/metrics', { params });
  },

  /**
   * Get content analytics
   */
  async getContentAnalytics(params?: {
    contentId?: string;
    type?: string;
    platform?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    content: ContentAnalytics[];
    total: number;
  }> {
    return apiClient.get('/analytics/content', { params });
  },

  /**
   * Get platform performance
   */
  async getPlatformPerformance(params?: {
    platform?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PlatformPerformance[]> {
    return apiClient.get('/analytics/platforms', { params });
  },

  /**
   * Get audience insights
   */
  async getAudienceInsights(params?: {
    platform?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<AudienceInsights> {
    return apiClient.get('/analytics/audience', { params });
  },

  /**
   * Get trending content
   */
  async getTrendingContent(params?: {
    platform?: string;
    limit?: number;
  }): Promise<ContentAnalytics[]> {
    return apiClient.get('/analytics/trending', { params });
  },

  /**
   * Get engagement funnel
   */
  async getEngagementFunnel(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    impressions: number;
    views: number;
    engagements: number;
    conversions: number;
  }> {
    return apiClient.get('/analytics/funnel', { params });
  },

  /**
   * Generate report
   */
  async generateReport(data: {
    name: string;
    type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
    startDate: string;
    endDate: string;
    metrics: string[];
    platforms?: string[];
    format?: 'PDF' | 'CSV' | 'JSON';
  }): Promise<Report> {
    return apiClient.post('/analytics/reports', data);
  },

  /**
   * Get reports
   */
  async getReports(params?: {
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    reports: Report[];
    total: number;
  }> {
    return apiClient.get('/analytics/reports', { params });
  },

  /**
   * Download report
   */
  async downloadReport(reportId: string, format: 'PDF' | 'CSV' | 'JSON'): Promise<Blob> {
    const response = await apiClient.get(`/analytics/reports/${reportId}/download`, {
      params: { format },
      responseType: 'blob',
    });
    return response as any;
  },

  /**
   * Get real-time analytics
   */
  async getRealTimeAnalytics(): Promise<{
    activeUsers: number;
    currentViews: number;
    recentPosts: Array<{
      platform: string;
      title: string;
      views: number;
      timestamp: string;
    }>;
  }> {
    return apiClient.get('/analytics/realtime');
  },

  /**
   * Get AI insights
   */
  async getAIInsights(): Promise<{
    recommendations: Array<{
      type: 'content' | 'timing' | 'platform' | 'audience';
      title: string;
      description: string;
      impact: 'high' | 'medium' | 'low';
      action?: string;
    }>;
    predictions: Array<{
      metric: string;
      current: number;
      predicted: number;
      change: number;
      confidence: number;
    }>;
  }> {
    return apiClient.get('/analytics/insights');
  },
};