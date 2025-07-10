import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { AIGenerationService } from './service';
import { AIGenerationController } from './controller';
import { createAIGenerationRoutes } from './routes';
import { AuthService } from '../auth/service';
import { AuthMiddleware } from '../auth/middleware';
import { ProviderFactory, ProviderConfig } from './providers/factory';

export interface AIGenerationModuleConfig {
  prefix?: string;
  providers: ProviderConfig[];
  enableBatching?: boolean;
  enableWebhooks?: boolean;
  webhookUrl?: string;
}

export class AIGenerationModule {
  private prisma: PrismaClient;
  private authService: AuthService;
  private aiService: AIGenerationService;
  private controller: AIGenerationController;
  private config: AIGenerationModuleConfig;

  constructor(
    prisma: PrismaClient,
    authService: AuthService,
    config: AIGenerationModuleConfig
  ) {
    this.prisma = prisma;
    this.authService = authService;
    this.config = {
      prefix: '/api/v1/ai',
      enableBatching: true,
      enableWebhooks: false,
      ...config,
    };

    // Initialize services
    this.aiService = new AIGenerationService(prisma, authService);
    this.controller = new AIGenerationController(this.aiService);
  }

  /**
   * Initialize the AI generation module
   */
  async init(app: Express): Promise<void> {
    // Initialize providers
    ProviderFactory.initialize(this.config.providers);

    // Create auth middleware
    const authMiddleware = new AuthMiddleware(this.prisma);

    // Create and mount routes
    const routes = createAIGenerationRoutes(this.controller, authMiddleware);
    app.use(this.config.prefix!, routes);

    // Setup cleanup tasks
    this.startCleanupTasks();

    // Health check for providers
    await this.performInitialHealthCheck();

    console.log(`[AI-GENERATION] Module initialized at ${this.config.prefix}`);
    console.log(`[AI-GENERATION] Providers: ${this.config.providers.map(p => p.name).join(', ')}`);
  }

  /**
   * Get module statistics
   */
  async getStats(): Promise<{
    totalGenerations: number;
    activeGenerations: number;
    completedGenerations: number;
    failedGenerations: number;
    totalCost: number;
    providerStats: any;
  }> {
    const [
      totalGenerations,
      activeGenerations,
      completedGenerations,
      failedGenerations,
      costResult,
    ] = await Promise.all([
      this.prisma.contentGeneration.count(),
      this.prisma.contentGeneration.count({
        where: { status: { in: ['PENDING', 'GENERATING'] } },
      }),
      this.prisma.contentGeneration.count({
        where: { status: 'COMPLETED' },
      }),
      this.prisma.contentGeneration.count({
        where: { status: 'FAILED' },
      }),
      this.prisma.usageRecord.aggregate({
        _sum: { cost: true },
      }),
    ]);

    const providerStats = ProviderFactory.getProviderStats();

    return {
      totalGenerations,
      activeGenerations,
      completedGenerations,
      failedGenerations,
      totalCost: costResult._sum.cost || 0,
      providerStats,
    };
  }

  /**
   * Health check for the AI generation module
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    providers: Array<{ name: string; healthy: boolean }>;
    database: boolean;
    details: any;
  }> {
    try {
      // Check database connectivity
      const dbTest = await this.prisma.contentGeneration.count();
      const databaseHealthy = true;

      // Check provider health
      const providers = ProviderFactory.getAllProviders();
      const providerHealth = await Promise.all(
        providers.map(async (provider) => ({
          name: provider.getName(),
          healthy: await provider.isHealthy(),
        }))
      );

      const healthyProviders = providerHealth.filter(p => p.healthy).length;
      const totalProviders = providerHealth.length;

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (healthyProviders === 0) {
        status = 'unhealthy';
      } else if (healthyProviders < totalProviders) {
        status = 'degraded';
      }

      return {
        status,
        providers: providerHealth,
        database: databaseHealthy,
        details: {
          totalProviders,
          healthyProviders,
          databaseConnected: databaseHealthy,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        providers: [],
        database: false,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Start cleanup tasks
   */
  private startCleanupTasks(): void {
    // Clean up old generations every hour
    setInterval(async () => {
      try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 30); // Keep 30 days

        const result = await this.prisma.contentGeneration.deleteMany({
          where: {
            createdAt: { lt: cutoffDate },
            status: { in: ['COMPLETED', 'FAILED'] },
          },
        });

        if (result.count > 0) {
          console.log(`[AI-GENERATION] Cleaned up ${result.count} old generations`);
        }
      } catch (error) {
        console.error('[AI-GENERATION] Error cleaning up old generations:', error);
      }
    }, 60 * 60 * 1000); // 1 hour

    // Clean up stale pending generations every 15 minutes
    setInterval(async () => {
      try {
        const staleDate = new Date();
        staleDate.setHours(staleDate.getHours() - 2); // 2 hours ago

        const result = await this.prisma.contentGeneration.updateMany({
          where: {
            status: { in: ['PENDING', 'GENERATING'] },
            createdAt: { lt: staleDate },
          },
          data: {
            status: 'FAILED',
            error: 'Generation timed out',
          },
        });

        if (result.count > 0) {
          console.log(`[AI-GENERATION] Marked ${result.count} stale generations as failed`);
        }
      } catch (error) {
        console.error('[AI-GENERATION] Error cleaning up stale generations:', error);
      }
    }, 15 * 60 * 1000); // 15 minutes
  }

  /**
   * Perform initial health check
   */
  private async performInitialHealthCheck(): Promise<void> {
    const healthCheck = await this.healthCheck();
    
    if (healthCheck.status === 'unhealthy') {
      console.error('[AI-GENERATION] Module is unhealthy:', healthCheck.details);
    } else if (healthCheck.status === 'degraded') {
      console.warn('[AI-GENERATION] Module is degraded:', healthCheck.details);
    }

    // Log provider status
    for (const provider of healthCheck.providers) {
      const status = provider.healthy ? 'healthy' : 'unhealthy';
      console.log(`[AI-GENERATION] Provider ${provider.name}: ${status}`);
    }
  }

  /**
   * Get AI service instance
   */
  getAIService(): AIGenerationService {
    return this.aiService;
  }

  /**
   * Get controller instance
   */
  getController(): AIGenerationController {
    return this.controller;
  }

  /**
   * Update provider configuration
   */
  updateProviderConfig(name: string, config: Partial<ProviderConfig>): void {
    const providerIndex = this.config.providers.findIndex(p => p.name === name as any);
    if (providerIndex >= 0) {
      this.config.providers[providerIndex] = {
        ...this.config.providers[providerIndex],
        ...config,
      };
      
      // Update in factory
      ProviderFactory.updateProviderConfig(name as any, config);
    }
  }

  /**
   * Add new provider
   */
  addProvider(config: ProviderConfig): void {
    this.config.providers.push(config);
    ProviderFactory.updateProviderConfig(config.name, config);
  }

  /**
   * Remove provider
   */
  removeProvider(name: string): void {
    this.config.providers = this.config.providers.filter(p => p.name !== name);
    ProviderFactory.removeProvider(name as any);
  }

  /**
   * Get provider configurations
   */
  getProviderConfigs(): ProviderConfig[] {
    return this.config.providers;
  }

  /**
   * Get module configuration
   */
  getModuleConfig(): AIGenerationModuleConfig {
    return this.config;
  }
}