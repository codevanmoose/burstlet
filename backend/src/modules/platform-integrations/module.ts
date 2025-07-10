import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { PlatformIntegrationsService } from './service';
import { PlatformIntegrationsController } from './controller';
import { createPlatformIntegrationsRoutes } from './routes';
import { AuthMiddleware } from '../auth/middleware';
import { PlatformProviderFactory } from './providers/factory';
import { PlatformType, PlatformConfig } from './types';

export interface PlatformIntegrationsModuleConfig {
  prefix?: string;
  platforms: Record<PlatformType, PlatformConfig>;
  webhookSecret?: string;
  enableWebhooks?: boolean;
  enableAnalytics?: boolean;
}

export class PlatformIntegrationsModule {
  private prisma: PrismaClient;
  private service: PlatformIntegrationsService;
  private controller: PlatformIntegrationsController;
  private config: PlatformIntegrationsModuleConfig;

  constructor(
    prisma: PrismaClient,
    config: PlatformIntegrationsModuleConfig
  ) {
    this.prisma = prisma;
    this.config = {
      prefix: '/api/v1/platforms',
      enableWebhooks: true,
      enableAnalytics: true,
      ...config,
    };

    // Initialize services
    this.service = new PlatformIntegrationsService(prisma);
    this.controller = new PlatformIntegrationsController(this.service);
  }

  /**
   * Initialize the platform integrations module
   */
  async init(app: Express): Promise<void> {
    // Initialize platform providers
    PlatformProviderFactory.initialize(this.config.platforms);

    // Create auth middleware
    const authMiddleware = new AuthMiddleware(this.prisma);

    // Create and mount routes
    const routes = createPlatformIntegrationsRoutes(this.controller, authMiddleware);
    app.use(this.config.prefix!, routes);

    // Setup webhook handlers if enabled
    if (this.config.enableWebhooks) {
      this.setupWebhookHandlers(app);
    }

    // Setup cleanup tasks
    this.startCleanupTasks();

    // Health check for providers
    await this.performInitialHealthCheck();

    console.log(`[PLATFORM-INTEGRATIONS] Module initialized at ${this.config.prefix}`);
    console.log(`[PLATFORM-INTEGRATIONS] Platforms: ${Object.keys(this.config.platforms).join(', ')}`);
  }

  /**
   * Get module statistics
   */
  async getStats(): Promise<{
    totalConnections: number;
    activeConnections: number;
    totalPosts: number;
    publishedPosts: number;
    failedPosts: number;
    platformBreakdown: Record<string, number>;
  }> {
    const [
      totalConnections,
      activeConnections,
      totalPosts,
      publishedPosts,
      failedPosts,
      platformCounts,
    ] = await Promise.all([
      this.prisma.platformConnection.count(),
      this.prisma.platformConnection.count({ where: { isActive: true } }),
      this.prisma.platformPost.count(),
      this.prisma.platformPost.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.platformPost.count({ where: { status: 'FAILED' } }),
      this.prisma.platformConnection.groupBy({
        by: ['platform'],
        _count: true,
      }),
    ]);

    const platformBreakdown = platformCounts.reduce((acc, curr) => {
      acc[curr.platform] = curr._count;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalConnections,
      activeConnections,
      totalPosts,
      publishedPosts,
      failedPosts,
      platformBreakdown,
    };
  }

  /**
   * Health check for the platform integrations module
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    platforms: Record<string, boolean>;
    database: boolean;
    details: any;
  }> {
    try {
      // Check database connectivity
      const dbTest = await this.prisma.platformConnection.count();
      const databaseHealthy = true;

      // Check platform health
      const platformHealth = await PlatformProviderFactory.getHealthStatus();
      const healthyPlatforms = Object.values(platformHealth).filter(healthy => healthy).length;
      const totalPlatforms = Object.keys(platformHealth).length;

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (healthyPlatforms === 0) {
        status = 'unhealthy';
      } else if (healthyPlatforms < totalPlatforms) {
        status = 'degraded';
      }

      return {
        status,
        platforms: platformHealth,
        database: databaseHealthy,
        details: {
          totalPlatforms,
          healthyPlatforms,
          databaseConnected: databaseHealthy,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        platforms: {},
        database: false,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Setup webhook handlers
   */
  private setupWebhookHandlers(app: Express): void {
    // YouTube webhook handler
    app.post(`${this.config.prefix}/webhooks/youtube`, async (req, res) => {
      try {
        // Verify webhook signature
        // Process webhook event
        res.status(200).send('OK');
      } catch (error) {
        console.error('[PLATFORM-INTEGRATIONS] YouTube webhook error:', error);
        res.status(500).send('Error');
      }
    });

    // Twitter webhook handler
    app.post(`${this.config.prefix}/webhooks/twitter`, async (req, res) => {
      try {
        // Verify webhook signature
        // Process webhook event
        res.status(200).send('OK');
      } catch (error) {
        console.error('[PLATFORM-INTEGRATIONS] Twitter webhook error:', error);
        res.status(500).send('Error');
      }
    });

    console.log('[PLATFORM-INTEGRATIONS] Webhook handlers registered');
  }

  /**
   * Start cleanup tasks
   */
  private startCleanupTasks(): void {
    // Clean up old posts every day
    setInterval(async () => {
      try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 90); // Keep 90 days

        const result = await this.prisma.platformPost.deleteMany({
          where: {
            createdAt: { lt: cutoffDate },
            status: { in: ['PUBLISHED', 'FAILED'] },
          },
        });

        if (result.count > 0) {
          console.log(`[PLATFORM-INTEGRATIONS] Cleaned up ${result.count} old posts`);
        }
      } catch (error) {
        console.error('[PLATFORM-INTEGRATIONS] Error cleaning up old posts:', error);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours

    // Refresh tokens that are about to expire
    setInterval(async () => {
      try {
        const expiringDate = new Date();
        expiringDate.setHours(expiringDate.getHours() + 24); // 24 hours from now

        const connections = await this.prisma.platformConnection.findMany({
          where: {
            isActive: true,
            tokenExpiresAt: {
              lte: expiringDate,
              gte: new Date(),
            },
          },
        });

        for (const connection of connections) {
          try {
            await this.service['ensureValidToken'](connection);
            console.log(`[PLATFORM-INTEGRATIONS] Refreshed token for connection ${connection.id}`);
          } catch (error) {
            console.error(`[PLATFORM-INTEGRATIONS] Failed to refresh token for connection ${connection.id}:`, error);
          }
        }
      } catch (error) {
        console.error('[PLATFORM-INTEGRATIONS] Error refreshing expiring tokens:', error);
      }
    }, 60 * 60 * 1000); // 1 hour

    // Sync analytics for active posts
    if (this.config.enableAnalytics) {
      setInterval(async () => {
        try {
          const recentPosts = await this.prisma.platformPost.findMany({
            where: {
              status: 'PUBLISHED',
              publishedAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
              },
            },
            include: { platformConnection: true },
          });

          for (const post of recentPosts) {
            try {
              await this.service.getPostAnalytics(post.userId, post.id);
            } catch (error) {
              console.error(`[PLATFORM-INTEGRATIONS] Failed to sync analytics for post ${post.id}:`, error);
            }
          }
        } catch (error) {
          console.error('[PLATFORM-INTEGRATIONS] Error syncing analytics:', error);
        }
      }, 6 * 60 * 60 * 1000); // 6 hours
    }
  }

  /**
   * Perform initial health check
   */
  private async performInitialHealthCheck(): Promise<void> {
    const healthCheck = await this.healthCheck();
    
    if (healthCheck.status === 'unhealthy') {
      console.error('[PLATFORM-INTEGRATIONS] Module is unhealthy:', healthCheck.details);
    } else if (healthCheck.status === 'degraded') {
      console.warn('[PLATFORM-INTEGRATIONS] Module is degraded:', healthCheck.details);
    }

    // Log platform status
    for (const [platform, healthy] of Object.entries(healthCheck.platforms)) {
      const status = healthy ? 'healthy' : 'unhealthy';
      console.log(`[PLATFORM-INTEGRATIONS] Platform ${platform}: ${status}`);
    }
  }

  /**
   * Get service instance
   */
  getService(): PlatformIntegrationsService {
    return this.service;
  }

  /**
   * Get controller instance
   */
  getController(): PlatformIntegrationsController {
    return this.controller;
  }

  /**
   * Update platform configuration
   */
  updatePlatformConfig(platform: PlatformType, config: PlatformConfig): void {
    this.config.platforms[platform] = config;
    PlatformProviderFactory.updateConfig(platform, config);
  }

  /**
   * Get module configuration
   */
  getModuleConfig(): PlatformIntegrationsModuleConfig {
    return this.config;
  }
}