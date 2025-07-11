import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

interface PerformanceMetric {
  timestamp: number;
  duration: number;
  method: string;
  endpoint: string;
  statusCode: number;
  userAgent?: string;
  ip?: string;
  requestId?: string;
}

interface BusinessMetric {
  timestamp: number;
  metric: string;
  value: number;
  metadata?: Record<string, any>;
}

interface ErrorMetric {
  timestamp: number;
  error: string;
  stack?: string;
  endpoint: string;
  method: string;
  requestId?: string;
  userId?: string;
}

class APMCollector {
  private performanceMetrics: PerformanceMetric[] = [];
  private businessMetrics: BusinessMetric[] = [];
  private errorMetrics: ErrorMetric[] = [];
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
    
    // Clean up old metrics every hour
    setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000);
  }

  // Record performance metrics
  recordPerformance(metric: PerformanceMetric) {
    this.performanceMetrics.push(metric);
    
    // Keep only last 10,000 metrics in memory
    if (this.performanceMetrics.length > 10000) {
      this.performanceMetrics.shift();
    }
  }

  // Record business metrics
  recordBusiness(metric: BusinessMetric) {
    this.businessMetrics.push(metric);
    
    // Keep only last 5,000 business metrics
    if (this.businessMetrics.length > 5000) {
      this.businessMetrics.shift();
    }
  }

  // Record error metrics
  recordError(metric: ErrorMetric) {
    this.errorMetrics.push(metric);
    
    // Keep only last 1,000 errors
    if (this.errorMetrics.length > 1000) {
      this.errorMetrics.shift();
    }
  }

  // Get performance statistics
  getPerformanceStats(timeWindowMs: number = 15 * 60 * 1000) {
    const cutoff = Date.now() - timeWindowMs;
    const recentMetrics = this.performanceMetrics.filter(m => m.timestamp > cutoff);

    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        requestsPerMinute: 0,
        slowestEndpoints: [],
        statusCodeDistribution: {},
      };
    }

    const totalRequests = recentMetrics.length;
    const averageResponseTime = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests;
    const errorRequests = recentMetrics.filter(m => m.statusCode >= 400).length;
    const errorRate = (errorRequests / totalRequests) * 100;
    const requestsPerMinute = (totalRequests / (timeWindowMs / 60000));

    // Find slowest endpoints
    const endpointStats = recentMetrics.reduce((acc, metric) => {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!acc[key]) {
        acc[key] = { totalTime: 0, count: 0, maxTime: 0 };
      }
      acc[key].totalTime += metric.duration;
      acc[key].count += 1;
      acc[key].maxTime = Math.max(acc[key].maxTime, metric.duration);
      return acc;
    }, {} as Record<string, { totalTime: number; count: number; maxTime: number }>);

    const slowestEndpoints = Object.entries(endpointStats)
      .map(([endpoint, stats]) => ({
        endpoint,
        averageTime: stats.totalTime / stats.count,
        maxTime: stats.maxTime,
        requestCount: stats.count,
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 10);

    // Status code distribution
    const statusCodeDistribution = recentMetrics.reduce((acc, metric) => {
      const code = metric.statusCode.toString();
      acc[code] = (acc[code] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      requestsPerMinute: Math.round(requestsPerMinute),
      slowestEndpoints,
      statusCodeDistribution,
    };
  }

  // Get business metrics
  getBusinessMetrics(timeWindowMs: number = 24 * 60 * 60 * 1000) {
    const cutoff = Date.now() - timeWindowMs;
    const recentMetrics = this.businessMetrics.filter(m => m.timestamp > cutoff);

    const groupedMetrics = recentMetrics.reduce((acc, metric) => {
      if (!acc[metric.metric]) {
        acc[metric.metric] = [];
      }
      acc[metric.metric].push(metric.value);
      return acc;
    }, {} as Record<string, number[]>);

    return Object.entries(groupedMetrics).reduce((acc, [metric, values]) => {
      acc[metric] = {
        count: values.length,
        sum: values.reduce((sum, val) => sum + val, 0),
        average: values.reduce((sum, val) => sum + val, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
      };
      return acc;
    }, {} as Record<string, any>);
  }

  // Get error statistics
  getErrorStats(timeWindowMs: number = 60 * 60 * 1000) {
    const cutoff = Date.now() - timeWindowMs;
    const recentErrors = this.errorMetrics.filter(m => m.timestamp > cutoff);

    const errorsByType = recentErrors.reduce((acc, error) => {
      acc[error.error] = (acc[error.error] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const errorsByEndpoint = recentErrors.reduce((acc, error) => {
      const key = `${error.method} ${error.endpoint}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalErrors: recentErrors.length,
      errorsByType,
      errorsByEndpoint,
      recentErrors: recentErrors.slice(-10), // Last 10 errors
    };
  }

  // Cleanup old metrics
  private cleanup() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    this.performanceMetrics = this.performanceMetrics.filter(m => m.timestamp > oneHourAgo);
    this.businessMetrics = this.businessMetrics.filter(m => m.timestamp > oneHourAgo);
    this.errorMetrics = this.errorMetrics.filter(m => m.timestamp > oneHourAgo);
  }

  // Get all metrics for dashboard
  getAllMetrics() {
    return {
      performance: this.getPerformanceStats(),
      business: this.getBusinessMetrics(),
      errors: this.getErrorStats(),
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString(),
      },
    };
  }
}

// Global APM instance
export const apm = new APMCollector();

// Express middleware for performance tracking
export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    apm.recordPerformance({
      timestamp: Date.now(),
      duration,
      method: req.method,
      endpoint: req.route?.path || req.path,
      statusCode: res.statusCode,
      userAgent: req.get('user-agent'),
      ip: req.ip,
      requestId: req.headers['x-request-id'] as string,
    });
  });

  next();
};

// Business metrics tracking functions
export const trackBusinessMetric = (metric: string, value: number, metadata?: Record<string, any>) => {
  apm.recordBusiness({
    timestamp: Date.now(),
    metric,
    value,
    metadata,
  });
};

// Error tracking middleware
export const errorTrackingMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  apm.recordError({
    timestamp: Date.now(),
    error: err.name || 'Unknown Error',
    stack: err.stack,
    endpoint: req.route?.path || req.path,
    method: req.method,
    requestId: req.headers['x-request-id'] as string,
    userId: req.headers['user-id'] as string, // TODO: Extract from JWT
  });

  next(err);
};

// Business metric helpers
export const businessMetrics = {
  userRegistration: () => trackBusinessMetric('user_registration', 1),
  userLogin: () => trackBusinessMetric('user_login', 1),
  videoGeneration: (duration?: number) => trackBusinessMetric('video_generation', 1, { duration }),
  blogGeneration: (wordCount?: number) => trackBusinessMetric('blog_generation', 1, { wordCount }),
  socialPost: (platform?: string) => trackBusinessMetric('social_post', 1, { platform }),
  subscriptionUpgrade: (fromPlan: string, toPlan: string) => 
    trackBusinessMetric('subscription_upgrade', 1, { fromPlan, toPlan }),
  paymentSuccess: (amount: number, currency: string = 'usd') => 
    trackBusinessMetric('payment_success', amount, { currency }),
  paymentFailure: (amount: number, reason?: string) => 
    trackBusinessMetric('payment_failure', amount, { reason }),
  apiUsage: (endpoint: string, cost?: number) => 
    trackBusinessMetric('api_usage', 1, { endpoint, cost }),
};