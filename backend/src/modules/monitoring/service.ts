import { PrismaClient } from '@prisma/client';
import os from 'os';
import { performance } from 'perf_hooks';
import {
  SystemMetrics,
  ApplicationMetrics,
  ServiceHealth,
  HealthCheck,
  HealthCheckResult,
  MonitoringAlert,
  AlertEvent,
  LogEntry,
  CustomMetric,
  Dashboard,
  GetMetricsRequest,
  CreateHealthCheckRequest,
  CreateAlertRequest,
  GetLogsRequest,
  CreateDashboardRequest,
  RecordCustomMetricRequest,
  MetricsResponse,
  HealthStatusResponse,
  AlertsResponse,
  LogsResponse,
  MonitoringOverviewResponse,
  MonitoringError,
  HealthStatus,
  RequestMetric,
  ErrorMetric,
  LogLevel,
} from './types';

export class MonitoringService {
  private metricsCache: Map<string, any> = new Map();
  private requestMetrics: RequestMetric[] = [];
  private errorMetrics: Map<string, ErrorMetric> = new Map();
  private startTime: Date;

  constructor(private prisma: PrismaClient) {
    this.startTime = new Date();
  }

  /**
   * Collect system metrics
   */
  async collectSystemMetrics(): Promise<SystemMetrics> {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    // Calculate CPU usage
    const cpuUsage = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      const idle = cpu.times.idle;
      return acc + ((total - idle) / total) * 100;
    }, 0) / cpus.length;

    // Get network stats (simplified - would use node-os-utils in production)
    const networkStats = {
      bytesIn: 0,
      bytesOut: 0,
      packetsIn: 0,
      packetsOut: 0,
      errors: 0,
    };

    // Get disk usage (simplified - would use disk-usage package)
    const diskStats = {
      total: 100 * 1024 * 1024 * 1024, // 100GB mock
      used: 50 * 1024 * 1024 * 1024, // 50GB mock
      free: 50 * 1024 * 1024 * 1024,
      percentage: 50,
    };

    const metrics: SystemMetrics = {
      timestamp: new Date(),
      cpu: {
        usage: cpuUsage,
        loadAverage: os.loadavg(),
        cores: cpus.length,
      },
      memory: {
        total: totalMemory,
        used: usedMemory,
        free: freeMemory,
        percentage: (usedMemory / totalMemory) * 100,
      },
      disk: diskStats,
      network: networkStats,
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        memory: process.memoryUsage().heapUsed,
        cpu: cpuUsage, // Simplified
      },
    };

    // Store in database
    await this.prisma.systemMetric.create({
      data: {
        cpu: metrics.cpu,
        memory: metrics.memory,
        disk: metrics.disk,
        network: metrics.network,
        process: metrics.process,
      },
    });

    return metrics;
  }

  /**
   * Collect application metrics
   */
  async collectApplicationMetrics(): Promise<ApplicationMetrics> {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

    // Get request counts
    const recentRequests = this.requestMetrics.filter(
      r => r.timestamp >= oneMinuteAgo
    );

    const requestsByMethod = recentRequests.reduce((acc, r) => {
      acc[r.method] = (acc[r.method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const requestsByStatus = recentRequests.reduce((acc, r) => {
      const statusGroup = `${Math.floor(r.statusCode / 100)}xx`;
      acc[statusGroup] = (acc[statusGroup] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const requestsByEndpoint = recentRequests.reduce((acc, r) => {
      acc[r.path] = (acc[r.path] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate response times
    const responseTimes = recentRequests.map(r => r.duration).sort((a, b) => a - b);
    const avgResponseTime = responseTimes.length
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;
    
    const medianResponseTime = responseTimes.length
      ? responseTimes[Math.floor(responseTimes.length / 2)]
      : 0;
    
    const p95ResponseTime = responseTimes.length
      ? responseTimes[Math.floor(responseTimes.length * 0.95)]
      : 0;
    
    const p99ResponseTime = responseTimes.length
      ? responseTimes[Math.floor(responseTimes.length * 0.99)]
      : 0;

    // Get slowest requests
    const slowestRequests = [...this.requestMetrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    // Get error metrics
    const recentErrors = Array.from(this.errorMetrics.values())
      .filter(e => e.lastSeen >= oneMinuteAgo);

    const errorsByType = recentErrors.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + e.count;
      return acc;
    }, {} as Record<string, number>);

    // Get active users and sessions
    const [activeUsers, activeSessions] = await Promise.all([
      this.prisma.user.count({
        where: { lastActive: { gte: new Date(Date.now() - 5 * 60 * 1000) } },
      }),
      this.prisma.session.count({
        where: { expiresAt: { gte: now } },
      }),
    ]);

    const metrics: ApplicationMetrics = {
      timestamp: now,
      requests: {
        total: this.requestMetrics.length,
        perMinute: recentRequests.length,
        byMethod: requestsByMethod,
        byStatus: requestsByStatus,
        byEndpoint: requestsByEndpoint,
      },
      response: {
        averageTime: avgResponseTime,
        medianTime: medianResponseTime,
        p95Time: p95ResponseTime,
        p99Time: p99ResponseTime,
        slowest: slowestRequests,
      },
      errors: {
        total: Array.from(this.errorMetrics.values()).reduce((sum, e) => sum + e.count, 0),
        byType: errorsByType,
        recent: Array.from(this.errorMetrics.values()).slice(0, 10),
      },
      activeUsers,
      activeSessions,
    };

    // Store in database
    await this.prisma.applicationMetric.create({
      data: {
        requests: metrics.requests,
        response: metrics.response,
        errors: metrics.errors,
        activeUsers: metrics.activeUsers,
        activeSessions: metrics.activeSessions,
      },
    });

    return metrics;
  }

  /**
   * Record request metric
   */
  recordRequest(metric: Omit<RequestMetric, 'id' | 'timestamp'>): void {
    const request: RequestMetric = {
      ...metric,
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    this.requestMetrics.push(request);

    // Keep only last 1000 requests in memory
    if (this.requestMetrics.length > 1000) {
      this.requestMetrics = this.requestMetrics.slice(-1000);
    }
  }

  /**
   * Record error metric
   */
  recordError(error: Error, context?: any): void {
    const errorKey = `${error.name}:${error.message}`;
    const existing = this.errorMetrics.get(errorKey);

    if (existing) {
      existing.count++;
      existing.lastSeen = new Date();
      if (context) {
        existing.context = { ...existing.context, ...context };
      }
    } else {
      this.errorMetrics.set(errorKey, {
        id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: error.name,
        message: error.message,
        stack: error.stack,
        context,
        count: 1,
        firstSeen: new Date(),
        lastSeen: new Date(),
      });
    }

    // Keep only last 100 unique errors
    if (this.errorMetrics.size > 100) {
      const oldest = Array.from(this.errorMetrics.entries())
        .sort((a, b) => a[1].lastSeen.getTime() - b[1].lastSeen.getTime())
        .slice(0, this.errorMetrics.size - 100);
      
      oldest.forEach(([key]) => this.errorMetrics.delete(key));
    }
  }

  /**
   * Get metrics
   */
  async getMetrics(request: GetMetricsRequest): Promise<MetricsResponse> {
    const where: any = {};
    
    if (request.startTime) {
      where.timestamp = { gte: new Date(request.startTime) };
    }
    if (request.endTime) {
      where.timestamp = { ...where.timestamp, lte: new Date(request.endTime) };
    }

    let metrics: any[] = [];

    switch (request.type) {
      case 'system':
        metrics = await this.prisma.systemMetric.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          take: 100,
        });
        break;
      
      case 'application':
        metrics = await this.prisma.applicationMetric.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          take: 100,
        });
        break;
      
      case 'custom':
        const customWhere = { ...where };
        if (request.tags) {
          customWhere.tags = { equals: request.tags };
        }
        metrics = await this.prisma.customMetric.findMany({
          where: customWhere,
          orderBy: { timestamp: 'desc' },
          take: 100,
        });
        break;
      
      default:
        // Get all types
        const [system, application, custom] = await Promise.all([
          this.prisma.systemMetric.findMany({ where, take: 50 }),
          this.prisma.applicationMetric.findMany({ where, take: 50 }),
          this.prisma.customMetric.findMany({ where, take: 50 }),
        ]);
        metrics = [...system, ...application, ...custom];
    }

    // Calculate summary
    const summary: any = {};
    
    if (request.type === 'system' || !request.type) {
      const systemMetrics = metrics.filter(m => m.cpu);
      if (systemMetrics.length) {
        summary.avgCpu = systemMetrics.reduce((sum, m) => sum + m.cpu.usage, 0) / systemMetrics.length;
        summary.avgMemory = systemMetrics.reduce((sum, m) => sum + m.memory.percentage, 0) / systemMetrics.length;
      }
    }

    if (request.type === 'application' || !request.type) {
      const appMetrics = metrics.filter(m => m.requests);
      if (appMetrics.length) {
        summary.totalRequests = appMetrics.reduce((sum, m) => sum + m.requests.total, 0);
        const totalErrors = appMetrics.reduce((sum, m) => sum + m.errors.total, 0);
        summary.errorRate = summary.totalRequests > 0 ? (totalErrors / summary.totalRequests) * 100 : 0;
      }
    }

    return { metrics, summary };
  }

  /**
   * Create health check
   */
  async createHealthCheck(request: CreateHealthCheckRequest): Promise<HealthCheck> {
    const healthCheck = await this.prisma.healthCheck.create({
      data: {
        ...request,
        isActive: true,
      },
    });

    return healthCheck;
  }

  /**
   * Run health check
   */
  async runHealthCheck(check: HealthCheck): Promise<HealthCheckResult> {
    const startTime = performance.now();
    let status: HealthStatus = 'UNKNOWN';
    let message: string | undefined;
    let details: any;

    try {
      switch (check.type) {
        case 'HTTP':
          const response = await fetch(check.target, {
            method: 'GET',
            signal: AbortSignal.timeout(check.timeout * 1000),
          });
          status = response.ok ? 'HEALTHY' : 'UNHEALTHY';
          message = `HTTP ${response.status} ${response.statusText}`;
          details = { statusCode: response.status };
          break;

        case 'DATABASE':
          await this.prisma.$queryRaw`SELECT 1`;
          status = 'HEALTHY';
          break;

        case 'DISK_SPACE':
          const diskMetrics = await this.collectSystemMetrics();
          const diskUsage = diskMetrics.disk.percentage;
          if (diskUsage < 80) {
            status = 'HEALTHY';
          } else if (diskUsage < 90) {
            status = 'DEGRADED';
            message = `Disk usage at ${diskUsage.toFixed(1)}%`;
          } else {
            status = 'UNHEALTHY';
            message = `Critical disk usage at ${diskUsage.toFixed(1)}%`;
          }
          details = { diskUsage };
          break;

        case 'MEMORY':
          const memoryMetrics = await this.collectSystemMetrics();
          const memoryUsage = memoryMetrics.memory.percentage;
          if (memoryUsage < 80) {
            status = 'HEALTHY';
          } else if (memoryUsage < 90) {
            status = 'DEGRADED';
            message = `Memory usage at ${memoryUsage.toFixed(1)}%`;
          } else {
            status = 'UNHEALTHY';
            message = `Critical memory usage at ${memoryUsage.toFixed(1)}%`;
          }
          details = { memoryUsage };
          break;

        default:
          status = 'UNKNOWN';
          message = `Unsupported check type: ${check.type}`;
      }
    } catch (error) {
      status = 'UNHEALTHY';
      message = error instanceof Error ? error.message : 'Health check failed';
    }

    const responseTime = performance.now() - startTime;

    const result: HealthCheckResult = {
      checkId: check.id,
      status,
      message,
      responseTime,
      timestamp: new Date(),
      details,
    };

    // Store result
    await this.prisma.healthCheckResult.create({
      data: result,
    });

    return result;
  }

  /**
   * Get health status
   */
  async getHealthStatus(): Promise<HealthStatusResponse> {
    // Get all active health checks
    const checks = await this.prisma.healthCheck.findMany({
      where: { isActive: true },
      include: {
        results: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });

    // Run checks that need updating
    const services: ServiceHealth[] = [];
    
    for (const check of checks) {
      const lastResult = check.results[0];
      const needsUpdate = !lastResult || 
        new Date().getTime() - lastResult.timestamp.getTime() > check.interval * 1000;

      if (needsUpdate) {
        const result = await this.runHealthCheck(check);
        services.push({
          name: check.name,
          status: result.status,
          message: result.message,
          lastCheck: result.timestamp,
          uptime: await this.calculateUptime(check.id),
          responseTime: result.responseTime,
          details: result.details,
        });
      } else {
        services.push({
          name: check.name,
          status: lastResult.status,
          message: lastResult.message,
          lastCheck: lastResult.timestamp,
          uptime: await this.calculateUptime(check.id),
          responseTime: lastResult.responseTime,
          details: lastResult.details,
        });
      }
    }

    // Determine overall status
    const unhealthyCount = services.filter(s => s.status === 'UNHEALTHY').length;
    const degradedCount = services.filter(s => s.status === 'DEGRADED').length;
    
    let overall: HealthStatus;
    if (unhealthyCount > 0) {
      overall = 'UNHEALTHY';
    } else if (degradedCount > 0) {
      overall = 'DEGRADED';
    } else {
      overall = 'HEALTHY';
    }

    // Calculate system uptime
    const uptimeDuration = (new Date().getTime() - this.startTime.getTime()) / 1000;
    const uptimePercentage = services.length > 0
      ? services.reduce((sum, s) => sum + s.uptime, 0) / services.length
      : 100;

    return {
      overall,
      services,
      lastCheck: new Date(),
      uptime: {
        percentage: uptimePercentage,
        duration: uptimeDuration,
      },
    };
  }

  /**
   * Create alert
   */
  async createAlert(request: CreateAlertRequest): Promise<MonitoringAlert> {
    const alert = await this.prisma.monitoringAlert.create({
      data: {
        ...request,
        isActive: true,
      },
    });

    return alert;
  }

  /**
   * Check alerts
   */
  async checkAlerts(): Promise<void> {
    const activeAlerts = await this.prisma.monitoringAlert.findMany({
      where: { isActive: true },
    });

    for (const alert of activeAlerts) {
      try {
        const shouldTrigger = await this.evaluateAlertCondition(alert);
        
        if (shouldTrigger) {
          await this.triggerAlert(alert);
        }
      } catch (error) {
        console.error(`[MONITORING] Error checking alert ${alert.id}:`, error);
      }
    }
  }

  /**
   * Record custom metric
   */
  async recordCustomMetric(request: RecordCustomMetricRequest): Promise<CustomMetric> {
    const metric = await this.prisma.customMetric.create({
      data: {
        name: request.name,
        type: request.type,
        value: request.value,
        tags: request.tags || {},
      },
    });

    return metric;
  }

  /**
   * Log entry
   */
  async log(
    level: LogLevel,
    message: string,
    service: string,
    metadata?: any
  ): Promise<void> {
    await this.prisma.logEntry.create({
      data: {
        level,
        message,
        service,
        metadata,
      },
    });
  }

  /**
   * Get logs
   */
  async getLogs(request: GetLogsRequest): Promise<LogsResponse> {
    const where: any = {};

    if (request.level) where.level = request.level;
    if (request.service) where.service = request.service;
    if (request.search) {
      where.message = { contains: request.search };
    }
    if (request.startTime || request.endTime) {
      where.timestamp = {};
      if (request.startTime) where.timestamp.gte = new Date(request.startTime);
      if (request.endTime) where.timestamp.lte = new Date(request.endTime);
    }

    const [logs, total] = await Promise.all([
      this.prisma.logEntry.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: request.limit,
        skip: request.offset,
      }),
      this.prisma.logEntry.count({ where }),
    ]);

    return {
      logs,
      total,
      hasMore: total > request.offset + request.limit,
    };
  }

  /**
   * Create dashboard
   */
  async createDashboard(
    userId: string,
    request: CreateDashboardRequest
  ): Promise<Dashboard> {
    const dashboard = await this.prisma.dashboard.create({
      data: {
        ...request,
        createdBy: userId,
      },
    });

    return dashboard;
  }

  /**
   * Get monitoring overview
   */
  async getOverview(): Promise<MonitoringOverviewResponse> {
    // Get latest metrics
    const [systemMetric, appMetric] = await Promise.all([
      this.prisma.systemMetric.findFirst({ orderBy: { timestamp: 'desc' } }),
      this.prisma.applicationMetric.findFirst({ orderBy: { timestamp: 'desc' } }),
    ]);

    // Get health status
    const healthStatus = await this.getHealthStatus();

    // Get alert counts
    const [activeAlerts, triggered24h, criticalActive] = await Promise.all([
      this.prisma.alertEvent.count({
        where: { status: 'TRIGGERED', acknowledgedAt: null },
      }),
      this.prisma.alertEvent.count({
        where: {
          timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
      this.prisma.alertEvent.count({
        where: {
          status: 'TRIGGERED',
          acknowledgedAt: null,
          alert: { severity: 'CRITICAL' },
        },
      }),
    ]);

    return {
      system: {
        status: healthStatus.overall,
        cpu: systemMetric?.cpu.usage || 0,
        memory: systemMetric?.memory.percentage || 0,
        disk: systemMetric?.disk.percentage || 0,
        uptime: healthStatus.uptime.duration,
      },
      application: {
        requestsPerMinute: appMetric?.requests.perMinute || 0,
        averageResponseTime: appMetric?.response.averageTime || 0,
        errorRate: appMetric?.errors.total && appMetric?.requests.total
          ? (appMetric.errors.total / appMetric.requests.total) * 100
          : 0,
        activeUsers: appMetric?.activeUsers || 0,
      },
      alerts: {
        active: activeAlerts,
        triggered24h,
        criticalActive,
      },
      services: healthStatus.services,
    };
  }

  // Private helper methods

  private async calculateUptime(checkId: string): Promise<number> {
    const results = await this.prisma.healthCheckResult.findMany({
      where: {
        checkId,
        timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    if (results.length === 0) return 100;

    const healthyCount = results.filter(r => r.status === 'HEALTHY').length;
    return (healthyCount / results.length) * 100;
  }

  private async evaluateAlertCondition(alert: MonitoringAlert): Promise<boolean> {
    const { condition } = alert;
    
    // Get metric value based on condition
    let currentValue: number | undefined;
    
    if (condition.metric.startsWith('system.')) {
      const metric = await this.prisma.systemMetric.findFirst({
        orderBy: { timestamp: 'desc' },
      });
      
      const path = condition.metric.split('.');
      currentValue = this.getNestedValue(metric, path.slice(1));
    } else if (condition.metric.startsWith('app.')) {
      const metric = await this.prisma.applicationMetric.findFirst({
        orderBy: { timestamp: 'desc' },
      });
      
      const path = condition.metric.split('.');
      currentValue = this.getNestedValue(metric, path.slice(1));
    }

    if (currentValue === undefined) return false;

    // Evaluate condition
    switch (condition.operator) {
      case 'GT': return currentValue > condition.value;
      case 'LT': return currentValue < condition.value;
      case 'GTE': return currentValue >= condition.value;
      case 'LTE': return currentValue <= condition.value;
      case 'EQ': return currentValue === condition.value;
      case 'NE': return currentValue !== condition.value;
      default: return false;
    }
  }

  private getNestedValue(obj: any, path: string[]): any {
    return path.reduce((current, key) => current?.[key], obj);
  }

  private async triggerAlert(alert: MonitoringAlert): Promise<void> {
    // Check cooldown
    if (alert.lastTriggered) {
      const cooldownEnd = new Date(alert.lastTriggered.getTime() + alert.cooldown * 1000);
      if (new Date() < cooldownEnd) return;
    }

    // Create alert event
    const event = await this.prisma.alertEvent.create({
      data: {
        alertId: alert.id,
        status: 'TRIGGERED',
        value: 0, // Would get actual value
        message: `Alert ${alert.name} triggered`,
      },
    });

    // Update last triggered
    await this.prisma.monitoringAlert.update({
      where: { id: alert.id },
      data: { lastTriggered: new Date() },
    });

    // Send notifications
    for (const channel of alert.channels) {
      await this.sendAlertNotification(alert, event, channel);
    }
  }

  private async sendAlertNotification(
    alert: MonitoringAlert,
    event: AlertEvent,
    channel: any
  ): Promise<void> {
    switch (channel.type) {
      case 'EMAIL':
        // Send email notification
        console.log(`[MONITORING] Email alert: ${alert.name}`);
        break;
      
      case 'SLACK':
        // Send Slack notification
        console.log(`[MONITORING] Slack alert: ${alert.name}`);
        break;
      
      case 'WEBHOOK':
        // Send webhook
        try {
          await fetch(channel.config.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              alert: alert.name,
              severity: alert.severity,
              event,
              timestamp: new Date(),
            }),
          });
        } catch (error) {
          console.error(`[MONITORING] Webhook failed for alert ${alert.id}:`, error);
        }
        break;
    }
  }
}