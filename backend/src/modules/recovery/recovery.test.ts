import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';
import { RecoverySystemService } from './service';
import { DatabaseRecoveryService, CacheRecoveryService } from './strategies';
import { RecoveryError, CircuitBreakerError } from './types';

// Mock Prisma
const mockPrisma = {
  auditLog: {
    create: jest.fn(),
  },
  $queryRaw: jest.fn(),
  $disconnect: jest.fn(),
  $connect: jest.fn(),
} as unknown as PrismaClient;

// Mock Redis
const mockRedis = {
  ping: jest.fn(),
  flushdb: jest.fn(),
  disconnect: jest.fn(),
  connect: jest.fn(),
};

describe('RecoverySystemService', () => {
  let service: RecoverySystemService;

  beforeEach(() => {
    service = new RecoverySystemService(mockPrisma);
    jest.clearAllMocks();
  });

  describe('Service Registration', () => {
    it('should register a recovery service', () => {
      const dbService = new DatabaseRecoveryService(mockPrisma);
      
      service.registerService(dbService);
      
      expect(service['services'].size).toBe(1);
      expect(service['services'].has('database')).toBe(true);
    });

    it('should initialize circuit breaker for registered service', () => {
      const dbService = new DatabaseRecoveryService(mockPrisma);
      
      service.registerService(dbService);
      
      const breaker = service['circuitBreakers'].get('database');
      expect(breaker).toBeDefined();
      expect(breaker?.state).toBe('closed');
      expect(breaker?.failures).toBe(0);
    });
  });

  describe('Health Monitoring', () => {
    it('should perform health checks on registered services', async () => {
      const dbService = new DatabaseRecoveryService(mockPrisma);
      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([{ result: 1 }]);
      
      service.registerService(dbService);
      
      const health = await service.getServicesHealth();
      
      expect(health).toHaveLength(1);
      expect(health[0].service).toBe('database');
      expect(health[0].status).toBe('healthy');
    });

    it('should handle unhealthy service', async () => {
      const dbService = new DatabaseRecoveryService(mockPrisma);
      (mockPrisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Connection failed'));
      
      service.registerService(dbService);
      
      const health = await service.getServicesHealth();
      
      expect(health[0].status).toBe('unhealthy');
      expect(health[0].message).toContain('Connection failed');
    });
  });

  describe('Circuit Breaker', () => {
    it('should open circuit breaker after threshold failures', async () => {
      const dbService = new DatabaseRecoveryService(mockPrisma);
      service.registerService(dbService);
      
      const breaker = service['circuitBreakers'].get('database')!;
      
      // Simulate failures
      for (let i = 0; i < 5; i++) {
        breaker.failures++;
      }
      
      // Trigger circuit breaker check
      await service['handleUnhealthyService']('database', dbService, {
        service: 'database',
        status: 'unhealthy',
        message: 'Failed',
        lastCheck: new Date(),
        consecutiveFailures: 5,
      });
      
      expect(breaker.state).toBe('open');
      expect(breaker.nextRetry).toBeDefined();
    });

    it('should reset circuit breaker on successful health check', async () => {
      const dbService = new DatabaseRecoveryService(mockPrisma);
      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([{ result: 1 }]);
      
      service.registerService(dbService);
      
      const breaker = service['circuitBreakers'].get('database')!;
      breaker.state = 'open';
      breaker.failures = 5;
      
      // Perform health check
      await service['performHealthChecks']();
      
      expect(breaker.state).toBe('closed');
      expect(breaker.failures).toBe(0);
    });
  });

  describe('Recovery Actions', () => {
    it('should execute recovery action', async () => {
      const restartSpy = jest.spyOn(service as any, 'restartService').mockResolvedValue(undefined);
      
      await service['executeRecoveryAction'](
        { type: 'restart_service', target: 'api', priority: 'high' },
        'Test context'
      );
      
      expect(restartSpy).toHaveBeenCalledWith('api');
    });

    it('should execute multiple recovery actions by priority', async () => {
      const clearCacheSpy = jest.spyOn(service as any, 'clearCache').mockResolvedValue(undefined);
      const notifyAdminSpy = jest.spyOn(service as any, 'notifyAdmin').mockResolvedValue(undefined);
      
      const actions = [
        { type: 'notify_admin' as const, target: 'memory', priority: 'low' as const },
        { type: 'clear_cache' as const, target: 'redis', priority: 'high' as const },
      ];
      
      await service['executeRecoveryActions'](actions, 'High memory');
      
      // High priority should execute first
      expect(clearCacheSpy).toHaveBeenCalled();
      expect(notifyAdminSpy).toHaveBeenCalled();
    });
  });

  describe('Self-Healing', () => {
    it('should detect memory leak', () => {
      // Add increasing memory snapshots
      for (let i = 0; i < 15; i++) {
        service['memorySnapshots'].push({
          timestamp: new Date(),
          heapUsed: 100 * 1024 * 1024 + (i * 2 * 1024 * 1024), // 2MB growth each
          heapTotal: 200 * 1024 * 1024,
          external: 0,
          rss: 300 * 1024 * 1024,
          arrayBuffers: 0,
        });
      }
      
      const hasLeak = service['detectMemoryLeak']();
      
      expect(hasLeak).toBe(true);
    });

    it('should trigger recovery for high memory usage', async () => {
      const clearCacheSpy = jest.spyOn(service as any, 'clearCache').mockResolvedValue(undefined);
      
      // Mock high memory usage
      jest.spyOn(service as any, 'checkMemoryUsage').mockResolvedValue({
        needsRecovery: true,
        actions: [{ type: 'clear_cache', target: 'redis', priority: 'high' }],
        context: 'Memory usage: 90%',
      });
      
      await service['performSelfHealingChecks']();
      
      expect(clearCacheSpy).toHaveBeenCalled();
    });
  });

  describe('Failure Patterns', () => {
    it('should identify failure pattern', () => {
      const error = new Error('ETIMEDOUT: Connection timeout');
      
      const pattern = service['identifyFailurePattern'](error);
      
      expect(pattern).toBeDefined();
      expect(pattern?.id).toBe('network_timeout');
      expect(pattern?.category).toBe('network');
    });

    it('should add custom failure pattern', async () => {
      const pattern = {
        id: 'custom_error',
        pattern: /CUSTOM_ERROR/,
        category: 'api' as const,
        severity: 'high' as const,
        recovery: [{ type: 'restart_service' as const, target: 'api', priority: 'high' as const }],
        cooldown: 60000,
      };
      
      await service.addFailurePattern(pattern, 'admin_123');
      
      const patterns = service.getFailurePatterns();
      expect(patterns).toContainEqual(pattern);
    });
  });

  describe('Manual Recovery', () => {
    it('should trigger manual recovery', async () => {
      const dbService = new DatabaseRecoveryService(mockPrisma);
      service.registerService(dbService);
      
      const executeSpy = jest.spyOn(service as any, 'executeRecoveryAction').mockResolvedValue(undefined);
      
      const result = await service.triggerManualRecovery(
        'database',
        { type: 'reset_connection', target: 'database', priority: 'high' },
        'admin_123'
      );
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('reset_connection');
      expect(executeSpy).toHaveBeenCalled();
    });

    it('should throw error for unknown service', async () => {
      await expect(
        service.triggerManualRecovery(
          'unknown',
          { type: 'restart_service', target: 'unknown', priority: 'high' },
          'admin_123'
        )
      ).rejects.toThrow('Service unknown not found');
    });
  });
});

describe('Recovery Strategies', () => {
  describe('DatabaseRecoveryService', () => {
    let dbService: DatabaseRecoveryService;

    beforeEach(() => {
      dbService = new DatabaseRecoveryService(mockPrisma);
      jest.clearAllMocks();
    });

    it('should perform health check', async () => {
      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([{ result: 1 }]);
      
      const result = await dbService.healthCheck();
      
      expect(result.status).toBe('healthy');
      expect(mockPrisma.$queryRaw).toHaveBeenCalledWith(expect.anything());
    });

    it('should recover from connection error', async () => {
      (mockPrisma.$disconnect as jest.Mock).mockResolvedValue(undefined);
      (mockPrisma.$connect as jest.Mock).mockResolvedValue(undefined);
      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([{ result: 1 }]);
      
      const result = await dbService.recover(new Error('Connection lost'));
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('database_reconnect');
      expect(mockPrisma.$disconnect).toHaveBeenCalled();
      expect(mockPrisma.$connect).toHaveBeenCalled();
    });
  });

  describe('CacheRecoveryService', () => {
    let cacheService: CacheRecoveryService;

    beforeEach(() => {
      cacheService = new CacheRecoveryService(mockRedis as any);
      jest.clearAllMocks();
    });

    it('should perform health check', async () => {
      (mockRedis.ping as jest.Mock).mockResolvedValue('PONG');
      
      const result = await cacheService.healthCheck();
      
      expect(result.status).toBe('healthy');
      expect(mockRedis.ping).toHaveBeenCalled();
    });

    it('should flush cache on memory error', async () => {
      (mockRedis.flushdb as jest.Mock).mockResolvedValue('OK');
      
      const result = await cacheService.recover(new Error('Out of memory'));
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('cache_flush');
      expect(mockRedis.flushdb).toHaveBeenCalled();
    });
  });
});