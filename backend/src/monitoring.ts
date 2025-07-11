import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SystemMetrics {
  timestamp: string;
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    loadAverage: number[];
  };
  database: {
    status: 'connected' | 'disconnected';
    activeConnections?: number;
  };
  api: {
    totalRequests: number;
    errorRate: number;
    averageResponseTime: number;
  };
}

// Simple in-memory metrics store (in production, use Redis or proper monitoring service)
const metrics = {
  requests: 0,
  errors: 0,
  responseTimes: [] as number[],
  lastReset: Date.now(),
};

export const recordRequest = (responseTime: number, isError: boolean = false) => {
  metrics.requests++;
  if (isError) metrics.errors++;
  metrics.responseTimes.push(responseTime);
  
  // Keep only last 1000 response times
  if (metrics.responseTimes.length > 1000) {
    metrics.responseTimes.shift();
  }
};

export const getMetrics = async (): Promise<SystemMetrics> => {
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();
  
  let dbStatus: 'connected' | 'disconnected' = 'disconnected';
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (error) {
    // Database is disconnected
  }
  
  const averageResponseTime = metrics.responseTimes.length > 0
    ? metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length
    : 0;
  
  const errorRate = metrics.requests > 0 ? (metrics.errors / metrics.requests) * 100 : 0;
  
  return {
    timestamp: new Date().toISOString(),
    uptime,
    memory: {
      used: memUsage.heapUsed,
      total: memUsage.heapTotal,
      percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
    },
    cpu: {
      loadAverage: process.platform === 'win32' ? [0, 0, 0] : require('os').loadavg(),
    },
    database: {
      status: dbStatus,
    },
    api: {
      totalRequests: metrics.requests,
      errorRate,
      averageResponseTime,
    },
  };
};

export const metricsHandler = async (req: Request, res: Response) => {
  try {
    const systemMetrics = await getMetrics();
    res.json(systemMetrics);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve metrics',
      timestamp: new Date().toISOString(),
    });
  }
};

// Prometheus-style metrics endpoint
export const prometheusHandler = async (req: Request, res: Response) => {
  try {
    const systemMetrics = await getMetrics();
    
    const prometheus = `# HELP burstlet_uptime_seconds Server uptime in seconds
# TYPE burstlet_uptime_seconds counter
burstlet_uptime_seconds ${systemMetrics.uptime}

# HELP burstlet_memory_usage_bytes Memory usage in bytes
# TYPE burstlet_memory_usage_bytes gauge
burstlet_memory_usage_bytes ${systemMetrics.memory.used}

# HELP burstlet_memory_usage_percentage Memory usage percentage
# TYPE burstlet_memory_usage_percentage gauge
burstlet_memory_usage_percentage ${systemMetrics.memory.percentage}

# HELP burstlet_http_requests_total Total number of HTTP requests
# TYPE burstlet_http_requests_total counter
burstlet_http_requests_total ${systemMetrics.api.totalRequests}

# HELP burstlet_http_error_rate HTTP error rate percentage
# TYPE burstlet_http_error_rate gauge
burstlet_http_error_rate ${systemMetrics.api.errorRate}

# HELP burstlet_http_response_time_ms Average HTTP response time in milliseconds
# TYPE burstlet_http_response_time_ms gauge
burstlet_http_response_time_ms ${systemMetrics.api.averageResponseTime}

# HELP burstlet_database_status Database connection status (1=connected, 0=disconnected)
# TYPE burstlet_database_status gauge
burstlet_database_status ${systemMetrics.database.status === 'connected' ? 1 : 0}
`;

    res.set('Content-Type', 'text/plain');
    res.send(prometheus);
  } catch (error) {
    res.status(500).send('# Error retrieving metrics');
  }
};

// Reset metrics (useful for testing)
export const resetMetrics = () => {
  metrics.requests = 0;
  metrics.errors = 0;
  metrics.responseTimes = [];
  metrics.lastReset = Date.now();
};