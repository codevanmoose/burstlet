import { z } from 'zod';

// System Metrics
export interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number; // percentage
    loadAverage: number[];
    cores: number;
  };
  memory: {
    total: number; // bytes
    used: number;
    free: number;
    percentage: number;
  };
  disk: {
    total: number; // bytes
    used: number;
    free: number;
    percentage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
    errors: number;
  };
  process: {
    pid: number;
    uptime: number; // seconds
    memory: number; // bytes
    cpu: number; // percentage
  };
}

// Application Metrics
export interface ApplicationMetrics {
  timestamp: Date;
  requests: {
    total: number;
    perMinute: number;
    byMethod: Record<string, number>;
    byStatus: Record<string, number>;
    byEndpoint: Record<string, number>;
  };
  response: {
    averageTime: number; // milliseconds
    medianTime: number;
    p95Time: number;
    p99Time: number;
    slowest: RequestMetric[];
  };
  errors: {
    total: number;
    byType: Record<string, number>;
    recent: ErrorMetric[];
  };
  activeUsers: number;
  activeSessions: number;
}

export interface RequestMetric {
  id: string;
  method: string;
  path: string;
  duration: number;
  statusCode: number;
  userId?: string;
  timestamp: Date;
}

export interface ErrorMetric {
  id: string;
  type: string;
  message: string;
  stack?: string;
  context?: any;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
}

// Service Health
export interface ServiceHealth {
  name: string;
  status: HealthStatus;
  message?: string;
  lastCheck: Date;
  uptime: number; // percentage
  responseTime?: number; // milliseconds
  details?: any;
}

export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN';

export interface HealthCheck {
  id: string;
  name: string;
  type: HealthCheckType;
  target: string;
  interval: number; // seconds
  timeout: number; // seconds
  retries: number;
  config?: any;
  lastResult?: HealthCheckResult;
  isActive: boolean;
}

export type HealthCheckType = 
  | 'HTTP'
  | 'TCP'
  | 'DATABASE'
  | 'REDIS'
  | 'EXTERNAL_API'
  | 'DISK_SPACE'
  | 'MEMORY'
  | 'CUSTOM';

export interface HealthCheckResult {
  checkId: string;
  status: HealthStatus;
  message?: string;
  responseTime: number;
  timestamp: Date;
  details?: any;
}

// Alerts
export interface MonitoringAlert {
  id: string;
  name: string;
  type: AlertType;
  severity: AlertSeverity;
  condition: AlertCondition;
  channels: AlertChannel[];
  cooldown: number; // seconds
  isActive: boolean;
  lastTriggered?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type AlertType = 
  | 'THRESHOLD'
  | 'ANOMALY'
  | 'ERROR_RATE'
  | 'DOWNTIME'
  | 'PERFORMANCE'
  | 'CUSTOM';

export type AlertSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface AlertCondition {
  metric: string;
  operator: 'GT' | 'LT' | 'EQ' | 'NE' | 'GTE' | 'LTE';
  value: number;
  duration?: number; // seconds
  aggregation?: 'AVG' | 'SUM' | 'MIN' | 'MAX' | 'COUNT';
}

export interface AlertChannel {
  type: 'EMAIL' | 'SLACK' | 'WEBHOOK' | 'SMS';
  config: any;
}

export interface AlertEvent {
  id: string;
  alertId: string;
  status: 'TRIGGERED' | 'RESOLVED';
  value: number;
  message: string;
  timestamp: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

// Logs
export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: Date;
  service: string;
  metadata?: any;
  trace?: TraceContext;
}

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
}

// Custom Metrics
export interface CustomMetric {
  id: string;
  name: string;
  type: MetricType;
  value: number;
  tags: Record<string, string>;
  timestamp: Date;
}

export type MetricType = 'COUNTER' | 'GAUGE' | 'HISTOGRAM' | 'SUMMARY';

// Dashboard
export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  refreshInterval: number; // seconds
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  config: any;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export type WidgetType = 
  | 'LINE_CHART'
  | 'BAR_CHART'
  | 'GAUGE'
  | 'NUMBER'
  | 'TABLE'
  | 'LOG_VIEWER'
  | 'ALERT_LIST';

// Request/Response Schemas
export const GetMetricsSchema = z.object({
  type: z.enum(['system', 'application', 'custom']).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  interval: z.enum(['1m', '5m', '15m', '1h', '6h', '24h']).optional(),
  tags: z.record(z.string()).optional(),
});

export const CreateHealthCheckSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['HTTP', 'TCP', 'DATABASE', 'REDIS', 'EXTERNAL_API', 'DISK_SPACE', 'MEMORY', 'CUSTOM']),
  target: z.string(),
  interval: z.number().min(10).max(3600), // 10s to 1h
  timeout: z.number().min(1).max(60),
  retries: z.number().min(0).max(5),
  config: z.any().optional(),
});

export const CreateAlertSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['THRESHOLD', 'ANOMALY', 'ERROR_RATE', 'DOWNTIME', 'PERFORMANCE', 'CUSTOM']),
  severity: z.enum(['INFO', 'WARNING', 'ERROR', 'CRITICAL']),
  condition: z.object({
    metric: z.string(),
    operator: z.enum(['GT', 'LT', 'EQ', 'NE', 'GTE', 'LTE']),
    value: z.number(),
    duration: z.number().optional(),
    aggregation: z.enum(['AVG', 'SUM', 'MIN', 'MAX', 'COUNT']).optional(),
  }),
  channels: z.array(z.object({
    type: z.enum(['EMAIL', 'SLACK', 'WEBHOOK', 'SMS']),
    config: z.any(),
  })),
  cooldown: z.number().min(60).max(86400), // 1min to 24h
});

export const GetLogsSchema = z.object({
  level: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']).optional(),
  service: z.string().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  search: z.string().optional(),
  traceId: z.string().optional(),
  limit: z.number().min(1).max(1000).optional().default(100),
  offset: z.number().min(0).optional().default(0),
});

export const CreateDashboardSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  widgets: z.array(z.object({
    type: z.enum(['LINE_CHART', 'BAR_CHART', 'GAUGE', 'NUMBER', 'TABLE', 'LOG_VIEWER', 'ALERT_LIST']),
    title: z.string(),
    config: z.any(),
    position: z.object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    }),
  })),
  refreshInterval: z.number().min(5).max(3600),
  isPublic: z.boolean().optional().default(false),
});

export const RecordCustomMetricSchema = z.object({
  name: z.string(),
  type: z.enum(['COUNTER', 'GAUGE', 'HISTOGRAM', 'SUMMARY']),
  value: z.number(),
  tags: z.record(z.string()).optional(),
});

// API Response Types
export interface MetricsResponse {
  metrics: Array<SystemMetrics | ApplicationMetrics | CustomMetric>;
  summary?: {
    avgCpu?: number;
    avgMemory?: number;
    totalRequests?: number;
    errorRate?: number;
  };
}

export interface HealthStatusResponse {
  overall: HealthStatus;
  services: ServiceHealth[];
  lastCheck: Date;
  uptime: {
    percentage: number;
    duration: number; // seconds
  };
}

export interface AlertsResponse {
  alerts: MonitoringAlert[];
  activeAlerts: number;
  recentEvents: AlertEvent[];
}

export interface LogsResponse {
  logs: LogEntry[];
  total: number;
  hasMore: boolean;
}

export interface MonitoringOverviewResponse {
  system: {
    status: HealthStatus;
    cpu: number;
    memory: number;
    disk: number;
    uptime: number;
  };
  application: {
    requestsPerMinute: number;
    averageResponseTime: number;
    errorRate: number;
    activeUsers: number;
  };
  alerts: {
    active: number;
    triggered24h: number;
    criticalActive: number;
  };
  services: ServiceHealth[];
}

// Error Types
export class MonitoringError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'MonitoringError';
  }
}

// Configuration
export interface MonitoringConfig {
  enabled: boolean;
  collectInterval: number; // seconds
  retentionDays: number;
  services: {
    database: boolean;
    redis: boolean;
    externalApis: string[];
  };
  metrics: {
    system: boolean;
    application: boolean;
    custom: boolean;
  };
  alerts: {
    enabled: boolean;
    defaultChannels: AlertChannel[];
  };
  logging: {
    level: LogLevel;
    retention: number; // days
  };
  tracing: {
    enabled: boolean;
    samplingRate: number; // 0-1
  };
}

// Type exports
export type GetMetricsRequest = z.infer<typeof GetMetricsSchema>;
export type CreateHealthCheckRequest = z.infer<typeof CreateHealthCheckSchema>;
export type CreateAlertRequest = z.infer<typeof CreateAlertSchema>;
export type GetLogsRequest = z.infer<typeof GetLogsSchema>;
export type CreateDashboardRequest = z.infer<typeof CreateDashboardSchema>;
export type RecordCustomMetricRequest = z.infer<typeof RecordCustomMetricSchema>;