import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { AnalyticsService } from './service';
import { AnalyticsController } from './controller';
import { createAnalyticsRoutes } from './routes';
import { AuthMiddleware } from '../auth/middleware';
import { PlatformIntegrationsService } from '../platform-integrations/service';

export interface AnalyticsModuleConfig {
  prefix?: string;
  enableRealtime?: boolean;
  enableAlerts?: boolean;
  enableReports?: boolean;
  retentionDays?: number;
  aggregationInterval?: number; // in minutes
}

export class AnalyticsModule {
  private prisma: PrismaClient;
  private service: AnalyticsService;
  private controller: AnalyticsController;
  private config: AnalyticsModuleConfig;
  private aggregationTimer?: NodeJS.Timer;
  private alertMonitoringTimer?: NodeJS.Timer;

  constructor(
    prisma: PrismaClient,
    config: AnalyticsModuleConfig = {}
  ) {
    this.prisma = prisma;
    this.config = {
      prefix: '/api/v1/analytics',
      enableRealtime: true,
      enableAlerts: true,
      enableReports: true,
      retentionDays: 90,
      aggregationInterval: 5,
      ...config,
    };

    // Initialize services
    this.service = new AnalyticsService(prisma);
    this.controller = new AnalyticsController(this.service);
  }

  /**
   * Initialize the analytics module
   */
  async init(app: Express, platformService?: PlatformIntegrationsService): Promise<void> {
    // Create auth middleware
    const authMiddleware = new AuthMiddleware(this.prisma);

    // Create and mount routes
    const routes = createAnalyticsRoutes(this.controller, authMiddleware);
    app.use(this.config.prefix!, routes);

    // Start background tasks
    this.startMetricsAggregation(platformService);
    
    if (this.config.enableAlerts) {
      this.startAlertMonitoring();
    }

    // Setup data retention
    this.setupDataRetention();

    console.log(`[ANALYTICS] Module initialized at ${this.config.prefix}`);
    console.log(`[ANALYTICS] Features: Realtime=${this.config.enableRealtime}, Alerts=${this.config.enableAlerts}, Reports=${this.config.enableReports}`);
  }

  /**
   * Start metrics aggregation from platforms
   */
  private startMetricsAggregation(platformService?: PlatformIntegrationsService): void {
    if (!platformService) {
      console.log('[ANALYTICS] Platform service not provided, skipping automatic metrics collection');
      return;
    }

    this.aggregationTimer = setInterval(async () => {
      try {
        // Get all platform integrations
        const integrations = await this.prisma.platformIntegration.findMany({
          where: { isActive: true },
          include: {
            user: true,
            platformPosts: {
              where: {
                status: 'PUBLISHED',
                content: {
                  status: 'PUBLISHED',
                },
              },
              include: {
                content: true,
              },
            },
          },
        });

        for (const integration of integrations) {
          try {
            // Fetch analytics for each published post
            for (const post of integration.platformPosts) {
              const analytics = await platformService.getPostAnalytics(
                integration.userId,
                integration.id,
                post.platformPostId
              );

              if (analytics) {
                await this.service.collectMetrics(
                  integration.userId,
                  post.contentId,
                  integration.platform,
                  {
                    views: analytics.views || 0,
                    likes: analytics.likes || 0,
                    comments: analytics.comments || 0,
                    shares: analytics.shares || 0,
                    impressions: analytics.impressions || 0,
                    saves: analytics.saves || 0,
                  }
                );
              }
            }
          } catch (error) {
            console.error(`[ANALYTICS] Error collecting metrics for integration ${integration.id}:`, error);
          }
        }
      } catch (error) {
        console.error('[ANALYTICS] Error in metrics aggregation:', error);
      }
    }, this.config.aggregationInterval! * 60 * 1000);
  }

  /**
   * Start alert monitoring
   */
  private startAlertMonitoring(): void {
    this.alertMonitoringTimer = setInterval(async () => {
      try {
        const activeAlerts = await this.prisma.analyticsAlert.findMany({
          where: { isActive: true },
        });

        for (const alert of activeAlerts) {
          try {
            await this.checkAlert(alert);
          } catch (error) {
            console.error(`[ANALYTICS] Error checking alert ${alert.id}:`, error);
          }
        }
      } catch (error) {
        console.error('[ANALYTICS] Error in alert monitoring:', error);
      }
    }, 60 * 1000); // Check every minute
  }

  /**
   * Check if an alert should be triggered
   */
  private async checkAlert(alert: any): Promise<void> {
    const { condition, userId } = alert;
    
    // Get metric value based on time window
    const timeWindow = condition.timeWindow || '1h';
    const windowMs = this.parseTimeWindow(timeWindow);
    const since = new Date(Date.now() - windowMs);

    const metrics = await this.prisma.analyticsMetric.findMany({
      where: {
        userId,
        metricType: condition.metric,
        platform: condition.platform || undefined,
        timestamp: { gte: since },
      },
    });

    const currentValue = metrics.reduce((sum, m) => sum + m.value, 0);
    let shouldTrigger = false;

    switch (condition.operator) {
      case 'GREATER_THAN':
        shouldTrigger = currentValue > condition.value;
        break;
      case 'LESS_THAN':
        shouldTrigger = currentValue < condition.value;
        break;
      case 'EQUALS':
        shouldTrigger = currentValue === condition.value;
        break;
      case 'CHANGE_BY':
        // Compare with previous period
        const previousMetrics = await this.prisma.analyticsMetric.findMany({
          where: {
            userId,
            metricType: condition.metric,
            platform: condition.platform || undefined,
            timestamp: {
              gte: new Date(since.getTime() - windowMs),
              lt: since,
            },
          },
        });
        const previousValue = previousMetrics.reduce((sum, m) => sum + m.value, 0);
        const changePercent = previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;
        shouldTrigger = Math.abs(changePercent) >= condition.value;
        break;
    }

    if (shouldTrigger) {
      await this.triggerAlert(alert, currentValue);
    }
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(alert: any, value: number): Promise<void> {
    // Update last triggered time
    await this.prisma.analyticsAlert.update({
      where: { id: alert.id },
      data: { lastTriggered: new Date() },
    });

    // Send notifications
    if (alert.notifications.inApp) {
      // Create in-app notification
      await this.prisma.notification.create({
        data: {
          userId: alert.userId,
          type: 'ANALYTICS_ALERT',
          title: `Alert: ${alert.name}`,
          message: `Metric ${alert.condition.metric} triggered with value ${value}`,
          data: {
            alertId: alert.id,
            value,
            condition: alert.condition,
          },
        },
      });
    }

    if (alert.notifications.email) {
      // Queue email notification (would integrate with email service)
      console.log(`[ANALYTICS] Email notification queued for alert ${alert.id}`);
    }

    if (alert.notifications.webhook) {
      // Send webhook notification
      try {
        await fetch(alert.notifications.webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alertId: alert.id,
            name: alert.name,
            value,
            condition: alert.condition,
            triggeredAt: new Date(),
          }),
        });
      } catch (error) {
        console.error(`[ANALYTICS] Webhook notification failed for alert ${alert.id}:`, error);
      }
    }
  }

  /**
   * Parse time window string to milliseconds
   */
  private parseTimeWindow(window: string): number {
    const match = window.match(/^(\d+)([hdwm])$/);
    if (!match) return 3600000; // Default 1 hour

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      case 'w':
        return value * 7 * 24 * 60 * 60 * 1000;
      case 'm':
        return value * 30 * 24 * 60 * 60 * 1000;
      default:
        return 3600000;
    }
  }

  /**
   * Setup data retention
   */
  private setupDataRetention(): void {
    // Clean up old analytics data daily
    setInterval(async () => {
      try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays!);

        const result = await this.prisma.analyticsMetric.deleteMany({
          where: {
            timestamp: { lt: cutoffDate },
          },
        });

        if (result.count > 0) {
          console.log(`[ANALYTICS] Cleaned up ${result.count} old metrics`);
        }

        // Clean up old reports
        const reportResult = await this.prisma.analyticsReport.deleteMany({
          where: {
            createdAt: { lt: cutoffDate },
          },
        });

        if (reportResult.count > 0) {
          console.log(`[ANALYTICS] Cleaned up ${reportResult.count} old reports`);
        }
      } catch (error) {
        console.error('[ANALYTICS] Error in data retention cleanup:', error);
      }
    }, 24 * 60 * 60 * 1000); // Daily
  }

  /**
   * Stop all background tasks
   */
  async shutdown(): Promise<void> {
    if (this.aggregationTimer) {
      clearInterval(this.aggregationTimer);
    }
    
    if (this.alertMonitoringTimer) {
      clearInterval(this.alertMonitoringTimer);
    }

    console.log('[ANALYTICS] Module shut down');
  }

  /**
   * Get module statistics
   */
  async getStats(): Promise<{
    totalMetrics: number;
    totalReports: number;
    activeAlerts: number;
    recentMetrics: number;
    storageUsed: number;
  }> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      totalMetrics,
      totalReports,
      activeAlerts,
      recentMetrics,
    ] = await Promise.all([
      this.prisma.analyticsMetric.count(),
      this.prisma.analyticsReport.count(),
      this.prisma.analyticsAlert.count({ where: { isActive: true } }),
      this.prisma.analyticsMetric.count({
        where: { timestamp: { gte: oneDayAgo } },
      }),
    ]);

    // Estimate storage (simplified)
    const avgMetricSize = 100; // bytes
    const avgReportSize = 10000; // bytes
    const storageUsed = (totalMetrics * avgMetricSize) + (totalReports * avgReportSize);

    return {
      totalMetrics,
      totalReports,
      activeAlerts,
      recentMetrics,
      storageUsed,
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    database: boolean;
    aggregation: boolean;
    alerts: boolean;
    details: any;
  }> {
    try {
      // Check database connectivity
      await this.prisma.analyticsMetric.count();
      const databaseHealthy = true;

      // Check background tasks
      const aggregationHealthy = !!this.aggregationTimer;
      const alertsHealthy = !this.config.enableAlerts || !!this.alertMonitoringTimer;

      const allHealthy = databaseHealthy && aggregationHealthy && alertsHealthy;

      return {
        status: allHealthy ? 'healthy' : 'degraded',
        database: databaseHealthy,
        aggregation: aggregationHealthy,
        alerts: alertsHealthy,
        details: {
          retentionDays: this.config.retentionDays,
          aggregationInterval: `${this.config.aggregationInterval} minutes`,
          features: {
            realtime: this.config.enableRealtime,
            alerts: this.config.enableAlerts,
            reports: this.config.enableReports,
          },
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        database: false,
        aggregation: false,
        alerts: false,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Get service instance
   */
  getService(): AnalyticsService {
    return this.service;
  }

  /**
   * Get controller instance
   */
  getController(): AnalyticsController {
    return this.controller;
  }

  /**
   * Update module configuration
   */
  updateConfig(config: Partial<AnalyticsModuleConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Restart background tasks if intervals changed
    if (config.aggregationInterval !== undefined) {
      if (this.aggregationTimer) {
        clearInterval(this.aggregationTimer);
        this.startMetricsAggregation();
      }
    }
  }
}