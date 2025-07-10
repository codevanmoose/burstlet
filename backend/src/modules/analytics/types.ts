import { z } from 'zod';

// Analytics Types
export interface AnalyticsMetric {
  id: string;
  userId: string;
  contentId?: string;
  platformPostId?: string;
  platform?: 'YOUTUBE' | 'TIKTOK' | 'INSTAGRAM' | 'TWITTER';
  metricType: MetricType;
  value: number;
  metadata?: any;
  timestamp: Date;
  createdAt: Date;
}

export type MetricType = 
  | 'VIEWS' 
  | 'LIKES' 
  | 'COMMENTS' 
  | 'SHARES' 
  | 'SAVES'
  | 'IMPRESSIONS'
  | 'REACH'
  | 'ENGAGEMENT_RATE'
  | 'WATCH_TIME'
  | 'AVG_VIEW_DURATION'
  | 'CLICK_THROUGH_RATE'
  | 'FOLLOWERS_GAINED'
  | 'REVENUE';

export interface ContentAnalytics {
  contentId: string;
  title: string;
  type: string;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalRevenue: number;
  engagementRate: number;
  platforms: PlatformAnalytics[];
  trends: TrendData[];
  bestPerformingPlatform?: string;
  roi?: number;
}

export interface PlatformAnalytics {
  platform: string;
  platformPostId: string;
  metrics: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves?: number;
    impressions?: number;
    reach?: number;
    engagementRate: number;
    watchTime?: number;
    avgViewDuration?: number;
  };
  demographics?: DemographicData;
  peakEngagementTime?: Date;
  lastUpdated: Date;
}

export interface DemographicData {
  age: Record<string, number>;
  gender: Record<string, number>;
  location: Record<string, number>;
  device: Record<string, number>;
  interests?: string[];
}

export interface TrendData {
  date: Date;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
  newFollowers?: number;
}

export interface AudienceAnalytics {
  totalFollowers: number;
  followersGrowth: number;
  avgEngagementRate: number;
  topLocations: Array<{ location: string; percentage: number }>;
  topAgeGroups: Array<{ ageGroup: string; percentage: number }>;
  topInterests: Array<{ interest: string; score: number }>;
  bestPostingTimes: Array<{ dayOfWeek: number; hour: number; engagement: number }>;
  audienceRetention: number;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  revenueByPlatform: Record<string, number>;
  revenueByContent: Array<{
    contentId: string;
    title: string;
    revenue: number;
    views: number;
    rpu: number; // Revenue per view
  }>;
  revenueGrowth: number;
  projectedRevenue: number;
  topEarningContent: Array<{
    contentId: string;
    title: string;
    revenue: number;
  }>;
}

export interface AnalyticsReport {
  id: string;
  userId: string;
  name: string;
  type: 'PERFORMANCE' | 'AUDIENCE' | 'REVENUE' | 'CUSTOM';
  dateRange: {
    start: Date;
    end: Date;
  };
  filters?: any;
  data: any;
  format: 'PDF' | 'CSV' | 'JSON';
  createdAt: Date;
  downloadUrl?: string;
}

export interface AnalyticsAlert {
  id: string;
  userId: string;
  name: string;
  type: 'THRESHOLD' | 'ANOMALY' | 'MILESTONE' | 'TREND';
  condition: AlertCondition;
  isActive: boolean;
  lastTriggered?: Date;
  notifications: NotificationSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertCondition {
  metric: MetricType;
  operator: 'GREATER_THAN' | 'LESS_THAN' | 'EQUALS' | 'CHANGE_BY';
  value: number;
  timeWindow?: string; // e.g., '1h', '24h', '7d'
  platform?: string;
}

export interface NotificationSettings {
  email: boolean;
  inApp: boolean;
  webhook?: string;
}

// Request/Response Schemas
export const GetAnalyticsSchema = z.object({
  contentId: z.string().optional(),
  platform: z.enum(['YOUTUBE', 'TIKTOK', 'INSTAGRAM', 'TWITTER']).optional(),
  dateFrom: z.string().datetime(),
  dateTo: z.string().datetime(),
  metrics: z.array(z.string()).optional(),
  groupBy: z.enum(['day', 'week', 'month', 'platform']).optional(),
});

export const GetContentAnalyticsSchema = z.object({
  contentIds: z.array(z.string()).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  includeRevenue: z.boolean().optional().default(false),
  includeDemographics: z.boolean().optional().default(false),
});

export const GetAudienceAnalyticsSchema = z.object({
  platforms: z.array(z.string()).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  includeInterests: z.boolean().optional().default(true),
});

export const GetRevenueAnalyticsSchema = z.object({
  dateFrom: z.string().datetime(),
  dateTo: z.string().datetime(),
  groupBy: z.enum(['day', 'week', 'month', 'platform', 'content']).optional(),
  includeProjections: z.boolean().optional().default(false),
});

export const CreateReportSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['PERFORMANCE', 'AUDIENCE', 'REVENUE', 'CUSTOM']),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }),
  filters: z.record(z.any()).optional(),
  format: z.enum(['PDF', 'CSV', 'JSON']).default('JSON'),
  includeCharts: z.boolean().optional().default(true),
});

export const CreateAlertSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['THRESHOLD', 'ANOMALY', 'MILESTONE', 'TREND']),
  condition: z.object({
    metric: z.string(),
    operator: z.enum(['GREATER_THAN', 'LESS_THAN', 'EQUALS', 'CHANGE_BY']),
    value: z.number(),
    timeWindow: z.string().optional(),
    platform: z.string().optional(),
  }),
  notifications: z.object({
    email: z.boolean().default(true),
    inApp: z.boolean().default(true),
    webhook: z.string().url().optional(),
  }),
});

export const CompareContentSchema = z.object({
  contentIds: z.array(z.string()).min(2).max(10),
  metrics: z.array(z.string()).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export const GetInsightsSchema = z.object({
  type: z.enum(['CONTENT', 'AUDIENCE', 'PLATFORM', 'TIMING']),
  limit: z.number().min(1).max(20).optional().default(5),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

// API Response Types
export interface AnalyticsResponse {
  metrics: AnalyticsMetric[];
  aggregated: Record<string, any>;
  period: {
    start: Date;
    end: Date;
  };
}

export interface ContentAnalyticsResponse {
  contents: ContentAnalytics[];
  summary: {
    totalViews: number;
    totalEngagement: number;
    avgEngagementRate: number;
    totalRevenue?: number;
  };
}

export interface AudienceAnalyticsResponse {
  analytics: AudienceAnalytics;
  platforms: Record<string, AudienceAnalytics>;
  growth: TrendData[];
}

export interface RevenueAnalyticsResponse {
  analytics: RevenueAnalytics;
  trends: Array<{
    date: Date;
    revenue: number;
    platform?: string;
  }>;
  forecast?: Array<{
    date: Date;
    projectedRevenue: number;
    confidence: number;
  }>;
}

export interface ComparisonResponse {
  contents: Array<{
    contentId: string;
    title: string;
    metrics: Record<string, number>;
    rank: Record<string, number>;
  }>;
  winner: {
    contentId: string;
    title: string;
    winningMetrics: string[];
  };
}

export interface InsightResponse {
  insights: Array<{
    type: string;
    title: string;
    description: string;
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
    recommendation?: string;
    data?: any;
  }>;
}

export interface DashboardData {
  overview: {
    totalViews: number;
    totalEngagement: number;
    totalRevenue: number;
    activeContent: number;
    viewsChange: number;
    engagementChange: number;
    revenueChange: number;
  };
  recentContent: ContentAnalytics[];
  topPerformers: ContentAnalytics[];
  platformBreakdown: Record<string, {
    views: number;
    engagement: number;
    revenue: number;
  }>;
  trends: TrendData[];
}

// Error Types
export class AnalyticsError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AnalyticsError';
  }
}

export class ReportError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ReportError';
  }
}

// Analytics Aggregation Types
export interface AggregationOptions {
  groupBy?: 'day' | 'week' | 'month' | 'platform';
  metrics?: MetricType[];
  platforms?: string[];
  contentTypes?: string[];
}

export interface MetricAggregation {
  period: string;
  platform?: string;
  metrics: Record<MetricType, number>;
  count: number;
}

// Real-time Analytics Types
export interface RealtimeMetric {
  metric: MetricType;
  value: number;
  change: number;
  timestamp: Date;
  platform?: string;
  contentId?: string;
}

export interface RealtimeSession {
  userId: string;
  activeViewers: number;
  engagementRate: number;
  recentEvents: RealtimeMetric[];
  lastUpdated: Date;
}

// Export Types
export interface ExportOptions {
  format: 'CSV' | 'JSON' | 'EXCEL';
  includeRawData: boolean;
  includeCharts: boolean;
  dateFormat?: string;
  timezone?: string;
}

// Type exports
export type GetAnalyticsRequest = z.infer<typeof GetAnalyticsSchema>;
export type GetContentAnalyticsRequest = z.infer<typeof GetContentAnalyticsSchema>;
export type GetAudienceAnalyticsRequest = z.infer<typeof GetAudienceAnalyticsSchema>;
export type GetRevenueAnalyticsRequest = z.infer<typeof GetRevenueAnalyticsSchema>;
export type CreateReportRequest = z.infer<typeof CreateReportSchema>;
export type CreateAlertRequest = z.infer<typeof CreateAlertSchema>;
export type CompareContentRequest = z.infer<typeof CompareContentSchema>;
export type GetInsightsRequest = z.infer<typeof GetInsightsSchema>;