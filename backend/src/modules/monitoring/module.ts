import { Express, Application } from 'express';
import { PrismaClient } from '@prisma/client';
import { MonitoringService } from './service';
import { MonitoringController } from './controller';
import { MonitoringMiddleware } from './middleware';
import { createMonitoringRoutes } from './routes';
import { AuthMiddleware } from '../auth/middleware';
import { MonitoringConfig, HealthCheck, MonitoringAlert } from './types';

export interface MonitoringModuleConfig extends MonitoringConfig {
  prefix?: string;
}

export class MonitoringModule {
  private prisma: PrismaClient;
  private service: MonitoringService;
  private controller: MonitoringController;
  private middleware: MonitoringMiddleware;
  private config: MonitoringModuleConfig;
  private metricsCollectionTimer?: NodeJS.Timer;
  private alertCheckTimer?: NodeJS.Timer;
  private healthCheckTimers: Map<string, NodeJS.Timer> = new Map();

  constructor(
    prisma: PrismaClient,
    config: Partial<MonitoringModuleConfig> = {}
  ) {
    this.prisma = prisma;
    
    // Default configuration
    this.config = {
      prefix: '/api/v1/monitoring',
      enabled: true,
      collectInterval: 60, // 1 minute
      retentionDays: 30,
      services: {
        database: true,
        redis: false,
        externalApis: [],
        ...config.services,
      },
      metrics: {
        system: true,
        application: true,
        custom: true,
        ...config.metrics,
      },
      alerts: {
        enabled: true,
        defaultChannels: [],
        ...config.alerts,
      },
      logging: {
        level: 'INFO',
        retention: 7,
        ...config.logging,
      },
      tracing: {
        enabled: true,
        samplingRate: 0.1,
        ...config.tracing,
      },
      ...config,
    };

    // Initialize services
    this.service = new MonitoringService(prisma);
    this.controller = new MonitoringController(this.service);
    this.middleware = new MonitoringMiddleware(this.service);
  }

  /**
   * Initialize the monitoring module
   */
  async init(app: Express): Promise<void> {
    if (!this.config.enabled) {
      console.log('[MONITORING] Module disabled');
      return;
    }

    // Apply global monitoring middleware
    this.applyGlobalMiddleware(app);

    // Create auth middleware for routes
    const authMiddleware = new AuthMiddleware(this.prisma);

    // Create and mount routes
    const routes = createMonitoringRoutes(this.controller, authMiddleware);
    app.use(this.config.prefix!, routes);

    // Setup default health checks
    await this.setupDefaultHealthChecks();

    // Setup default alerts
    await this.setupDefaultAlerts();

    // Start background tasks
    this.startMetricsCollection();
    
    if (this.config.alerts.enabled) {
      this.startAlertChecking();
    }

    // Start health check timers
    await this.startHealthChecks();

    console.log(`[MONITORING] Module initialized at ${this.config.prefix}`);
    console.log(`[MONITORING] Features: Metrics=${this.config.metrics.system}, Alerts=${this.config.alerts.enabled}, Tracing=${this.config.tracing.enabled}`);
  }

  /**
   * Apply global monitoring middleware
   */
  private applyGlobalMiddleware(app: Application): void {
    // Request monitoring (should be early in the stack)
    app.use(this.middleware.requestMonitoring());

    // Tracing
    if (this.config.tracing.enabled) {
      app.use(this.middleware.tracing());
    }

    // Performance monitoring
    app.use(this.middleware.slaMonitoring());

    // Business metrics
    app.use(this.middleware.businessMetrics());

    // Memory monitoring (sample based on rate)
    app.use((req, res, next) => {
      if (Math.random() < this.config.tracing.samplingRate) {
        this.middleware.memoryMonitoring()(req, res, next);
      } else {
        next();
      }
    });

    // Database monitoring
    app.use(this.middleware.databaseMonitoring());

    // Health check endpoint
    app.use(this.middleware.healthCheckEndpoint('/health'));

    // Metrics endpoint (Prometheus format)
    app.use(this.middleware.metricsEndpoint('/metrics'));

    // Error monitoring (should be late in the stack)
    app.use(this.middleware.errorMonitoring());
  }

  /**
   * Setup default health checks
   */
  private async setupDefaultHealthChecks(): Promise<void> {
    const defaultChecks: Partial<HealthCheck>[] = [
      {
        name: 'Database',
        type: 'DATABASE',
        target: 'prisma',
        interval: 30,
        timeout: 5,
        retries: 2,
      },
      {
        name: 'Memory',
        type: 'MEMORY',
        target: 'system',
        interval: 60,
        timeout: 1,
        retries: 0,
      },
      {
        name: 'Disk Space',
        type: 'DISK_SPACE',
        target: 'system',
        interval: 300, // 5 minutes
        timeout: 1,
        retries: 0,
      },
    ];

    // Add external API checks
    for (const api of this.config.services.externalApis) {
      defaultChecks.push({
        name: `External API: ${api}`,
        type: 'HTTP',
        target: api,
        interval: 60,
        timeout: 10,
        retries: 1,
      });
    }

    // Create checks if they don't exist
    for (const check of defaultChecks) {
      const existing = await this.prisma.healthCheck.findFirst({
        where: { name: check.name },
      });

      if (!existing) {
        await this.service.createHealthCheck(check as any);
      }
    }
  }

  /**
   * Setup default alerts
   */
  private async setupDefaultAlerts(): Promise<void> {
    const defaultAlerts: Partial<MonitoringAlert>[] = [
      {
        name: 'High CPU Usage',
        type: 'THRESHOLD',
        severity: 'WARNING',
        condition: {
          metric: 'system.cpu.usage',
          operator: 'GT',
          value: 80,
          duration: 300, // 5 minutes
        },
        channels: this.config.alerts.defaultChannels,
        cooldown: 900, // 15 minutes
      },
      {
        name: 'High Memory Usage',
        type: 'THRESHOLD',
        severity: 'WARNING',
        condition: {
          metric: 'system.memory.percentage',
          operator: 'GT',
          value: 90,
          duration: 300,
        },
        channels: this.config.alerts.defaultChannels,
        cooldown: 900,
      },
      {
        name: 'High Error Rate',
        type: 'ERROR_RATE',
        severity: 'ERROR',
        condition: {
          metric: 'app.errors.rate',
          operator: 'GT',
          value: 5, // 5% error rate
          duration: 60,
        },
        channels: this.config.alerts.defaultChannels,
        cooldown: 300,
      },
      {
        name: 'Service Down',
        type: 'DOWNTIME',
        severity: 'CRITICAL',
        condition: {
          metric: 'health.status',
          operator: 'EQ',
          value: 0, // 0 = unhealthy
        },
        channels: this.config.alerts.defaultChannels,
        cooldown: 60,
      },
    ];

    // Create alerts if they don't exist
    for (const alert of defaultAlerts) {
      const existing = await this.prisma.monitoringAlert.findFirst({
        where: { name: alert.name },
      });

      if (!existing && this.config.alerts.defaultChannels.length > 0) {
        await this.service.createAlert(alert as any);
      }
    }
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    this.metricsCollectionTimer = setInterval(async () => {
      try {
        const promises: Promise<any>[] = [];

        if (this.config.metrics.system) {
          promises.push(this.service.collectSystemMetrics());
        }

        if (this.config.metrics.application) {
          promises.push(this.service.collectApplicationMetrics());
        }

        await Promise.all(promises);
      } catch (error) {
        console.error('[MONITORING] Error collecting metrics:', error);
      }
    }, this.config.collectInterval * 1000);

    // Collect immediately
    if (this.config.metrics.system) {
      this.service.collectSystemMetrics().catch(console.error);
    }
    if (this.config.metrics.application) {
      this.service.collectApplicationMetrics().catch(console.error);
    }
  }

  /**
   * Start alert checking
   */
  private startAlertChecking(): void {
    this.alertCheckTimer = setInterval(async () => {
      try {
        await this.service.checkAlerts();
      } catch (error) {
        console.error('[MONITORING] Error checking alerts:', error);
      }
    }, 30 * 1000); // Check every 30 seconds
  }

  /**
   * Start health checks
   */
  private async startHealthChecks(): Promise<void> {
    const checks = await this.prisma.healthCheck.findMany({
      where: { isActive: true },
    });

    for (const check of checks) {
      // Run immediately
      this.service.runHealthCheck(check).catch(console.error);

      // Schedule periodic checks
      const timer = setInterval(async () => {
        try {
          await this.service.runHealthCheck(check);
        } catch (error) {
          console.error(`[MONITORING] Health check ${check.name} failed:`, error);
        }
      }, check.interval * 1000);

      this.healthCheckTimers.set(check.id, timer);
    }
  }

  /**
   * Get monitoring service for external use
   */
  getService(): MonitoringService {
    return this.service;
  }

  /**
   * Get monitoring middleware for external use
   */
  getMiddleware(): MonitoringMiddleware {
    return this.middleware;
  }

  /**
   * Shutdown module
   */
  async shutdown(): Promise<void> {
    if (this.metricsCollectionTimer) {
      clearInterval(this.metricsCollectionTimer);
    }

    if (this.alertCheckTimer) {
      clearInterval(this.alertCheckTimer);
    }

    // Clear health check timers
    for (const timer of this.healthCheckTimers.values()) {
      clearInterval(timer);
    }
    this.healthCheckTimers.clear();

    console.log('[MONITORING] Module shut down');
  }

  /**
   * Get module statistics
   */
  async getStats(): Promise<{
    totalMetrics: number;
    totalHealthChecks: number;
    activeAlerts: number;
    totalLogs: number;
    dashboards: number;
    storageUsed: number;
  }> {
    const [
      systemMetrics,
      appMetrics,
      customMetrics,
      healthChecks,
      activeAlerts,
      logs,
      dashboards,
    ] = await Promise.all([
      this.prisma.systemMetric.count(),
      this.prisma.applicationMetric.count(),
      this.prisma.customMetric.count(),
      this.prisma.healthCheck.count({ where: { isActive: true } }),
      this.prisma.alertEvent.count({
        where: { status: 'TRIGGERED', acknowledgedAt: null },
      }),
      this.prisma.logEntry.count(),
      this.prisma.dashboard.count(),
    ]);

    const totalMetrics = systemMetrics + appMetrics + customMetrics;

    // Estimate storage (simplified)
    const avgMetricSize = 200; // bytes
    const avgLogSize = 500; // bytes
    const storageUsed = (totalMetrics * avgMetricSize) + (logs * avgLogSize);

    return {
      totalMetrics,
      totalHealthChecks: healthChecks,
      activeAlerts,
      totalLogs: logs,
      dashboards,
      storageUsed,
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    monitoring: boolean;
    database: boolean;
    collection: boolean;
    details: any;
  }> {
    try {
      // Check database
      await this.prisma.systemMetric.count();
      const databaseHealthy = true;

      // Check monitoring service
      const health = await this.service.getHealthStatus();
      const monitoringHealthy = health.overall !== 'UNHEALTHY';

      // Check collection
      const collectionHealthy = !!this.metricsCollectionTimer;

      const allHealthy = databaseHealthy && monitoringHealthy && collectionHealthy;

      return {
        status: allHealthy ? 'healthy' : monitoringHealthy ? 'degraded' : 'unhealthy',
        monitoring: monitoringHealthy,
        database: databaseHealthy,
        collection: collectionHealthy,
        details: {
          services: health.services.length,
          uptime: health.uptime,
          collectInterval: this.config.collectInterval,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        monitoring: false,
        database: false,
        collection: false,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Clean up old data
   */
  async cleanupOldData(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

    try {
      const [metrics, logs, results] = await Promise.all([
        // Clean up metrics
        Promise.all([
          this.prisma.systemMetric.deleteMany({
            where: { timestamp: { lt: cutoffDate } },
          }),
          this.prisma.applicationMetric.deleteMany({
            where: { timestamp: { lt: cutoffDate } },
          }),
          this.prisma.customMetric.deleteMany({
            where: { timestamp: { lt: cutoffDate } },
          }),
        ]),
        // Clean up logs
        this.prisma.logEntry.deleteMany({
          where: {
            timestamp: {
              lt: new Date(Date.now() - this.config.logging.retention * 24 * 60 * 60 * 1000),
            },
          },
        }),
        // Clean up health check results
        this.prisma.healthCheckResult.deleteMany({
          where: { timestamp: { lt: cutoffDate } },
        }),
      ]);

      console.log('[MONITORING] Cleanup completed');
    } catch (error) {
      console.error('[MONITORING] Cleanup error:', error);
    }
  }
}