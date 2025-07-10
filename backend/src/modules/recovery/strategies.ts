import { RecoveryService, RecoveryResult, HealthCheckResult, RecoveryConfig } from './types';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { Queue } from 'bullmq';

/**
 * Database recovery service
 */
export class DatabaseRecoveryService implements RecoveryService {
  name = 'database';
  type = 'database' as const;
  
  config: RecoveryConfig = {
    enabled: true,
    retryAttempts: 3,
    retryDelay: 5000,
    backoffMultiplier: 2,
    maxRetryDelay: 60000,
    circuitBreaker: {
      enabled: true,
      failureThreshold: 5,
      resetTimeout: 60000,
      halfOpenRequests: 3,
    },
  };

  constructor(private prisma: PrismaClient) {}

  async healthCheck(): Promise<HealthCheckResult> {
    try {
      // Test database connection
      await this.prisma.$queryRaw`SELECT 1`;
      
      return {
        service: this.name,
        status: 'healthy',
        message: 'Database connection is healthy',
        lastCheck: new Date(),
        consecutiveFailures: 0,
      };
    } catch (error) {
      return {
        service: this.name,
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Database check failed',
        lastCheck: new Date(),
        consecutiveFailures: 1,
      };
    }
  }

  async recover(error: Error): Promise<RecoveryResult> {
    const startTime = Date.now();
    
    try {
      // Attempt to reconnect
      await this.prisma.$disconnect();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.prisma.$connect();
      
      // Verify connection
      await this.prisma.$queryRaw`SELECT 1`;
      
      return {
        success: true,
        action: 'database_reconnect',
        service: this.name,
        attempts: 1,
        duration: Date.now() - startTime,
        metadata: { reconnected: true },
      };
    } catch (recoveryError) {
      return {
        success: false,
        action: 'database_reconnect',
        service: this.name,
        error: recoveryError as Error,
        attempts: 1,
        duration: Date.now() - startTime,
      };
    }
  }
}

/**
 * Redis cache recovery service
 */
export class CacheRecoveryService implements RecoveryService {
  name = 'cache';
  type = 'cache' as const;
  
  config: RecoveryConfig = {
    enabled: true,
    retryAttempts: 3,
    retryDelay: 2000,
    backoffMultiplier: 1.5,
    maxRetryDelay: 30000,
    circuitBreaker: {
      enabled: true,
      failureThreshold: 3,
      resetTimeout: 30000,
      halfOpenRequests: 2,
    },
  };

  constructor(private redis: Redis) {}

  async healthCheck(): Promise<HealthCheckResult> {
    try {
      const pong = await this.redis.ping();
      
      if (pong === 'PONG') {
        return {
          service: this.name,
          status: 'healthy',
          message: 'Redis connection is healthy',
          lastCheck: new Date(),
          consecutiveFailures: 0,
        };
      }
      
      return {
        service: this.name,
        status: 'degraded',
        message: 'Redis ping response unexpected',
        lastCheck: new Date(),
        consecutiveFailures: 0,
      };
    } catch (error) {
      return {
        service: this.name,
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Redis check failed',
        lastCheck: new Date(),
        consecutiveFailures: 1,
      };
    }
  }

  async recover(error: Error): Promise<RecoveryResult> {
    const startTime = Date.now();
    
    try {
      // Clear cache if memory issues
      if (error.message.includes('memory')) {
        await this.redis.flushdb();
        
        return {
          success: true,
          action: 'cache_flush',
          service: this.name,
          attempts: 1,
          duration: Date.now() - startTime,
          metadata: { flushed: true },
        };
      }
      
      // Otherwise, reconnect
      this.redis.disconnect();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.redis.connect();
      
      return {
        success: true,
        action: 'cache_reconnect',
        service: this.name,
        attempts: 1,
        duration: Date.now() - startTime,
        metadata: { reconnected: true },
      };
    } catch (recoveryError) {
      return {
        success: false,
        action: 'cache_recovery',
        service: this.name,
        error: recoveryError as Error,
        attempts: 1,
        duration: Date.now() - startTime,
      };
    }
  }
}

/**
 * Queue recovery service
 */
export class QueueRecoveryService implements RecoveryService {
  name = 'queue';
  type = 'queue' as const;
  
  config: RecoveryConfig = {
    enabled: true,
    retryAttempts: 5,
    retryDelay: 3000,
    backoffMultiplier: 2,
    maxRetryDelay: 60000,
    circuitBreaker: {
      enabled: true,
      failureThreshold: 5,
      resetTimeout: 120000,
      halfOpenRequests: 1,
    },
  };

  constructor(private queues: Map<string, Queue>) {}

  async healthCheck(): Promise<HealthCheckResult> {
    try {
      const unhealthyQueues: string[] = [];
      
      for (const [name, queue] of this.queues) {
        const isPaused = await queue.isPaused();
        const jobCounts = await queue.getJobCounts();
        
        if (isPaused) {
          unhealthyQueues.push(`${name} (paused)`);
        } else if (jobCounts.failed > 100) {
          unhealthyQueues.push(`${name} (high failures: ${jobCounts.failed})`);
        }
      }
      
      if (unhealthyQueues.length > 0) {
        return {
          service: this.name,
          status: 'degraded',
          message: `Unhealthy queues: ${unhealthyQueues.join(', ')}`,
          lastCheck: new Date(),
          consecutiveFailures: 0,
          metadata: { unhealthyQueues },
        };
      }
      
      return {
        service: this.name,
        status: 'healthy',
        message: 'All queues are healthy',
        lastCheck: new Date(),
        consecutiveFailures: 0,
      };
    } catch (error) {
      return {
        service: this.name,
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Queue check failed',
        lastCheck: new Date(),
        consecutiveFailures: 1,
      };
    }
  }

  async recover(error: Error): Promise<RecoveryResult> {
    const startTime = Date.now();
    
    try {
      const actions: string[] = [];
      
      // Resume paused queues
      for (const [name, queue] of this.queues) {
        const isPaused = await queue.isPaused();
        if (isPaused) {
          await queue.resume();
          actions.push(`resumed ${name}`);
        }
        
        // Clean failed jobs if too many
        const jobCounts = await queue.getJobCounts();
        if (jobCounts.failed > 100) {
          await queue.clean(1000, 1000, 'failed');
          actions.push(`cleaned failed jobs in ${name}`);
        }
        
        // Drain delayed jobs if stuck
        if (jobCounts.delayed > 1000) {
          await queue.drain(true);
          actions.push(`drained delayed jobs in ${name}`);
        }
      }
      
      return {
        success: true,
        action: 'queue_recovery',
        service: this.name,
        attempts: 1,
        duration: Date.now() - startTime,
        metadata: { actions },
      };
    } catch (recoveryError) {
      return {
        success: false,
        action: 'queue_recovery',
        service: this.name,
        error: recoveryError as Error,
        attempts: 1,
        duration: Date.now() - startTime,
      };
    }
  }
}

/**
 * External API recovery service
 */
export class ExternalAPIRecoveryService implements RecoveryService {
  name: string;
  type = 'external' as const;
  
  config: RecoveryConfig = {
    enabled: true,
    retryAttempts: 3,
    retryDelay: 10000,
    backoffMultiplier: 3,
    maxRetryDelay: 300000, // 5 minutes
    circuitBreaker: {
      enabled: true,
      failureThreshold: 10,
      resetTimeout: 300000, // 5 minutes
      halfOpenRequests: 1,
    },
  };

  constructor(
    name: string,
    private healthEndpoint: string,
    private fallbackEndpoint?: string
  ) {
    this.name = name;
  }

  async healthCheck(): Promise<HealthCheckResult> {
    try {
      const response = await fetch(this.healthEndpoint, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      
      if (response.ok) {
        return {
          service: this.name,
          status: 'healthy',
          message: `${this.name} API is healthy`,
          lastCheck: new Date(),
          consecutiveFailures: 0,
          metadata: { status: response.status },
        };
      }
      
      return {
        service: this.name,
        status: response.status >= 500 ? 'unhealthy' : 'degraded',
        message: `${this.name} API returned ${response.status}`,
        lastCheck: new Date(),
        consecutiveFailures: 1,
        metadata: { status: response.status },
      };
    } catch (error) {
      return {
        service: this.name,
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'API check failed',
        lastCheck: new Date(),
        consecutiveFailures: 1,
      };
    }
  }

  async recover(error: Error): Promise<RecoveryResult> {
    const startTime = Date.now();
    
    try {
      // If we have a fallback endpoint, try it
      if (this.fallbackEndpoint) {
        const response = await fetch(this.fallbackEndpoint, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });
        
        if (response.ok) {
          return {
            success: true,
            action: 'api_failover',
            service: this.name,
            attempts: 1,
            duration: Date.now() - startTime,
            metadata: { 
              failedOver: true,
              fallbackEndpoint: this.fallbackEndpoint,
            },
          };
        }
      }
      
      // Otherwise, just wait and retry
      await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
      
      return {
        success: false,
        action: 'api_retry',
        service: this.name,
        error,
        attempts: 1,
        duration: Date.now() - startTime,
      };
    } catch (recoveryError) {
      return {
        success: false,
        action: 'api_recovery',
        service: this.name,
        error: recoveryError as Error,
        attempts: 1,
        duration: Date.now() - startTime,
      };
    }
  }
}

/**
 * Process recovery service for worker processes
 */
export class ProcessRecoveryService implements RecoveryService {
  name = 'process';
  type = 'internal' as const;
  
  config: RecoveryConfig = {
    enabled: true,
    retryAttempts: 3,
    retryDelay: 5000,
    backoffMultiplier: 2,
    maxRetryDelay: 60000,
    circuitBreaker: {
      enabled: false, // Don't circuit break process recovery
      failureThreshold: 5,
      resetTimeout: 60000,
      halfOpenRequests: 1,
    },
  };

  constructor(private processName: string) {}

  async healthCheck(): Promise<HealthCheckResult> {
    try {
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();
      
      // Check memory usage
      const heapPercentage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
      
      if (heapPercentage > 90) {
        return {
          service: this.name,
          status: 'unhealthy',
          message: `High memory usage: ${heapPercentage.toFixed(2)}%`,
          lastCheck: new Date(),
          consecutiveFailures: 1,
          metadata: { memoryUsage, uptime },
        };
      }
      
      if (heapPercentage > 75) {
        return {
          service: this.name,
          status: 'degraded',
          message: `Elevated memory usage: ${heapPercentage.toFixed(2)}%`,
          lastCheck: new Date(),
          consecutiveFailures: 0,
          metadata: { memoryUsage, uptime },
        };
      }
      
      return {
        service: this.name,
        status: 'healthy',
        message: 'Process is healthy',
        lastCheck: new Date(),
        consecutiveFailures: 0,
        metadata: { memoryUsage, uptime },
      };
    } catch (error) {
      return {
        service: this.name,
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Process check failed',
        lastCheck: new Date(),
        consecutiveFailures: 1,
      };
    }
  }

  async recover(error: Error): Promise<RecoveryResult> {
    const startTime = Date.now();
    
    try {
      // Try garbage collection
      if (global.gc) {
        global.gc();
        
        // Wait a bit and check if memory improved
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const memoryUsage = process.memoryUsage();
        const heapPercentage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
        
        if (heapPercentage < 75) {
          return {
            success: true,
            action: 'process_gc',
            service: this.name,
            attempts: 1,
            duration: Date.now() - startTime,
            metadata: { heapPercentage },
          };
        }
      }
      
      // If GC didn't help, schedule restart
      console.log(`Process ${this.processName} needs restart due to: ${error.message}`);
      
      // In production, would use PM2 or similar
      // process.exit(1); // Let process manager restart
      
      return {
        success: false,
        action: 'process_restart_scheduled',
        service: this.name,
        error,
        attempts: 1,
        duration: Date.now() - startTime,
      };
    } catch (recoveryError) {
      return {
        success: false,
        action: 'process_recovery',
        service: this.name,
        error: recoveryError as Error,
        attempts: 1,
        duration: Date.now() - startTime,
      };
    }
  }
}