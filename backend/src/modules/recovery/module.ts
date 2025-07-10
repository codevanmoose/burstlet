import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { Queue } from 'bullmq';
import { RecoverySystemService } from './service';
import { RecoveryController } from './controller';
import { createRecoveryRoutes } from './routes';
import { AuthMiddleware } from '../auth/middleware';
import {
  DatabaseRecoveryService,
  CacheRecoveryService,
  QueueRecoveryService,
  ExternalAPIRecoveryService,
  ProcessRecoveryService,
} from './strategies';
import { SelfHealingConfig } from './types';

export interface RecoveryModuleConfig extends Partial<SelfHealingConfig> {
  prefix?: string;
  enableAutoRecovery?: boolean;
  enableHealthMonitoring?: boolean;
  healthCheckInterval?: number;
}

export class RecoveryModule {
  private service: RecoverySystemService;
  private controller: RecoveryController;
  private config: RecoveryModuleConfig;

  constructor(
    private prisma: PrismaClient,
    private redis: Redis,
    private queues: Map<string, Queue>,
    config: RecoveryModuleConfig = {}
  ) {
    this.config = {
      prefix: '/api/v1/recovery',
      enableAutoRecovery: true,
      enableHealthMonitoring: true,
      healthCheckInterval: 60000, // 1 minute
      ...config,
    };

    // Initialize service and controller
    this.service = new RecoverySystemService(prisma, config);
    this.controller = new RecoveryController(this.service);
  }

  /**
   * Initialize the recovery module
   */
  async init(app: Express): Promise<void> {
    // Register recovery services
    this.registerRecoveryServices();

    // Create auth middleware
    const authMiddleware = new AuthMiddleware(this.prisma);

    // Create and mount routes
    const routes = createRecoveryRoutes(this.controller, authMiddleware);
    app.use(this.config.prefix!, routes);

    // Setup event listeners
    this.setupEventListeners();

    // Start monitoring if enabled
    if (this.config.enableHealthMonitoring) {
      this.service.startHealthMonitoring(this.config.healthCheckInterval);
    }

    if (this.config.enableAutoRecovery) {
      this.service.startSelfHealing();
    }

    console.log(`[RECOVERY] Module initialized at ${this.config.prefix}`);
    console.log(`[RECOVERY] Auto-recovery: ${this.config.enableAutoRecovery}, Health monitoring: ${this.config.enableHealthMonitoring}`);
  }

  /**
   * Register recovery services
   */
  private registerRecoveryServices(): void {
    // Database recovery
    this.service.registerService(
      new DatabaseRecoveryService(this.prisma)
    );

    // Cache recovery
    this.service.registerService(
      new CacheRecoveryService(this.redis)
    );

    // Queue recovery
    this.service.registerService(
      new QueueRecoveryService(this.queues)
    );

    // External API recovery
    this.service.registerService(
      new ExternalAPIRecoveryService(
        'hailuoai',
        'https://api.hailuoai.com/health',
        'https://api-backup.hailuoai.com/health'
      )
    );

    this.service.registerService(
      new ExternalAPIRecoveryService(
        'openai',
        'https://api.openai.com/v1/models',
        undefined
      )
    );

    this.service.registerService(
      new ExternalAPIRecoveryService(
        'stripe',
        'https://api.stripe.com/v1/charges',
        undefined
      )
    );

    // Process recovery
    this.service.registerService(
      new ProcessRecoveryService('api-server')
    );
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Service events
    this.service.on('service:registered', ({ service }) => {
      console.log(`[RECOVERY] Service registered: ${service}`);
    });

    this.service.on('service:degraded', ({ service, result }) => {
      console.warn(`[RECOVERY] Service degraded: ${service}`, result.message);
    });

    this.service.on('service:recovered', ({ service, result }) => {
      console.log(`[RECOVERY] Service recovered: ${service}`, result);
    });

    // Circuit breaker events
    this.service.on('circuit:open', ({ service, breaker }) => {
      console.error(`[RECOVERY] Circuit breaker opened: ${service}`, breaker);
    });

    this.service.on('circuit:half-open', ({ service }) => {
      console.log(`[RECOVERY] Circuit breaker half-open: ${service}`);
    });

    this.service.on('circuit:closed', ({ service }) => {
      console.log(`[RECOVERY] Circuit breaker closed: ${service}`);
    });

    // Health events
    this.service.on('health:high_memory', ({ percentage }) => {
      console.warn(`[RECOVERY] High memory usage: ${percentage.toFixed(2)}%`);
    });

    this.service.on('health:high_cpu', ({ usage }) => {
      console.warn(`[RECOVERY] High CPU usage: ${usage}%`);
    });

    this.service.on('health:high_disk', ({ percentage }) => {
      console.warn(`[RECOVERY] High disk usage: ${percentage}%`);
    });

    this.service.on('health:slow_response', ({ avgResponseTime }) => {
      console.warn(`[RECOVERY] Slow response time: ${avgResponseTime}ms`);
    });

    this.service.on('health:high_errors', ({ errorRate }) => {
      console.error(`[RECOVERY] High error rate: ${errorRate}%`);
    });

    // Recovery events
    this.service.on('recovery:action', (event) => {
      console.log(`[RECOVERY] Executing action: ${event.action.type} on ${event.service}`);
    });

    this.service.on('recovery:failed', ({ service, error }) => {
      console.error(`[RECOVERY] Recovery failed for ${service}:`, error);
    });
  }

  /**
   * Get recovery service for external use
   */
  getService(): RecoverySystemService {
    return this.service;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
    circuitBreakers: {
      open: number;
      halfOpen: number;
      closed: number;
    };
  }> {
    try {
      const servicesHealth = await this.service.getServicesHealth();
      const circuitBreakers = this.service.getCircuitBreakerStates();

      const healthy = servicesHealth.filter(s => s.status === 'healthy').length;
      const degraded = servicesHealth.filter(s => s.status === 'degraded').length;
      const unhealthy = servicesHealth.filter(s => s.status === 'unhealthy').length;

      const openBreakers = circuitBreakers.filter(b => b.state === 'open').length;
      const halfOpenBreakers = circuitBreakers.filter(b => b.state === 'half-open').length;
      const closedBreakers = circuitBreakers.filter(b => b.state === 'closed').length;

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (unhealthy > 0 || openBreakers > 0) {
        status = 'unhealthy';
      } else if (degraded > 0 || halfOpenBreakers > 0) {
        status = 'degraded';
      }

      return {
        status,
        services: servicesHealth.length,
        healthy,
        degraded,
        unhealthy,
        circuitBreakers: {
          open: openBreakers,
          halfOpen: halfOpenBreakers,
          closed: closedBreakers,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        services: 0,
        healthy: 0,
        degraded: 0,
        unhealthy: 0,
        circuitBreakers: {
          open: 0,
          halfOpen: 0,
          closed: 0,
        },
      };
    }
  }

  /**
   * Get module statistics
   */
  async getStats(): Promise<{
    totalServices: number;
    totalRecoveryEvents: number;
    successfulRecoveries: number;
    failedRecoveries: number;
    averageRecoveryTime: number;
  }> {
    const stats = await this.service.getRecoveryStatistics({});

    return {
      totalServices: this.service.getServicesHealth.length,
      totalRecoveryEvents: stats.totalEvents,
      successfulRecoveries: stats.successfulRecoveries,
      failedRecoveries: stats.failedRecoveries,
      averageRecoveryTime: 0, // Would calculate from events
    };
  }

  /**
   * Shutdown module
   */
  async shutdown(): Promise<void> {
    this.service.stop();
    console.log('[RECOVERY] Module shut down');
  }
}