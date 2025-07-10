import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { MonitoringService } from './service';
import { MonitoringError } from './types';
import os from 'os';

// Mock os module
jest.mock('os');

// Mock fetch
global.fetch = jest.fn();

// Mock Prisma
const mockPrisma = {
  systemMetric: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn(),
  },
  applicationMetric: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn(),
  },
  customMetric: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn(),
  },
  healthCheck: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    delete: jest.fn(),
  },
  healthCheckResult: {
    create: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  monitoringAlert: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  alertEvent: {
    create: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  logEntry: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn(),
  },
  dashboard: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  user: {
    count: jest.fn(),
  },
  session: {
    count: jest.fn(),
  },
  notification: {
    create: jest.fn(),
  },
  $queryRaw: jest.fn(),
} as unknown as PrismaClient;

describe('MonitoringService', () => {
  let service: MonitoringService;

  beforeEach(() => {
    service = new MonitoringService(mockPrisma);
    jest.clearAllMocks();
  });

  describe('collectSystemMetrics', () => {
    it('should collect system metrics', async () => {
      // Mock os functions
      (os.cpus as jest.Mock).mockReturnValue([
        { times: { user: 100, nice: 0, sys: 50, idle: 850, irq: 0 } },
        { times: { user: 120, nice: 0, sys: 60, idle: 820, irq: 0 } },
      ]);
      (os.totalmem as jest.Mock).mockReturnValue(8 * 1024 * 1024 * 1024); // 8GB
      (os.freemem as jest.Mock).mockReturnValue(4 * 1024 * 1024 * 1024); // 4GB
      (os.loadavg as jest.Mock).mockReturnValue([1.5, 1.2, 0.9]);

      (mockPrisma.systemMetric.create as jest.Mock).mockResolvedValue({});

      const metrics = await service.collectSystemMetrics();

      expect(metrics.cpu.cores).toBe(2);
      expect(metrics.cpu.usage).toBeGreaterThan(0);
      expect(metrics.memory.total).toBe(8 * 1024 * 1024 * 1024);
      expect(metrics.memory.free).toBe(4 * 1024 * 1024 * 1024);
      expect(metrics.memory.percentage).toBe(50);
      expect(mockPrisma.systemMetric.create).toHaveBeenCalled();
    });
  });

  describe('collectApplicationMetrics', () => {
    it('should collect application metrics', async () => {
      (mockPrisma.user.count as jest.Mock).mockResolvedValue(10);
      (mockPrisma.session.count as jest.Mock).mockResolvedValue(5);
      (mockPrisma.applicationMetric.create as jest.Mock).mockResolvedValue({});

      // Add some request metrics
      service.recordRequest({
        method: 'GET',
        path: '/api/test',
        duration: 50,
        statusCode: 200,
      });
      service.recordRequest({
        method: 'POST',
        path: '/api/test',
        duration: 150,
        statusCode: 201,
      });

      const metrics = await service.collectApplicationMetrics();

      expect(metrics.requests.total).toBe(2);
      expect(metrics.requests.byMethod['GET']).toBe(1);
      expect(metrics.requests.byMethod['POST']).toBe(1);
      expect(metrics.response.averageTime).toBe(100);
      expect(metrics.activeUsers).toBe(10);
      expect(metrics.activeSessions).toBe(5);
      expect(mockPrisma.applicationMetric.create).toHaveBeenCalled();
    });
  });

  describe('recordRequest', () => {
    it('should record request metrics', () => {
      service.recordRequest({
        method: 'GET',
        path: '/api/users',
        duration: 25,
        statusCode: 200,
        userId: 'user-123',
      });

      // Access private property for testing
      const requests = (service as any).requestMetrics;
      expect(requests).toHaveLength(1);
      expect(requests[0].method).toBe('GET');
      expect(requests[0].duration).toBe(25);
    });

    it('should limit request metrics to 1000', () => {
      // Record 1100 requests
      for (let i = 0; i < 1100; i++) {
        service.recordRequest({
          method: 'GET',
          path: '/api/test',
          duration: 10,
          statusCode: 200,
        });
      }

      const requests = (service as any).requestMetrics;
      expect(requests).toHaveLength(1000);
    });
  });

  describe('recordError', () => {
    it('should record error metrics', () => {
      const error = new Error('Test error');
      service.recordError(error, { userId: 'user-123' });

      const errors = (service as any).errorMetrics;
      expect(errors.size).toBe(1);
      
      const errorMetric = errors.get('Error:Test error');
      expect(errorMetric).toBeDefined();
      expect(errorMetric.count).toBe(1);
      expect(errorMetric.type).toBe('Error');
    });

    it('should increment count for repeated errors', () => {
      const error = new Error('Repeated error');
      
      service.recordError(error);
      service.recordError(error);
      service.recordError(error);

      const errors = (service as any).errorMetrics;
      const errorMetric = errors.get('Error:Repeated error');
      expect(errorMetric.count).toBe(3);
    });
  });

  describe('createHealthCheck', () => {
    it('should create health check', async () => {
      const request = {
        name: 'Test API',
        type: 'HTTP' as const,
        target: 'https://api.example.com/health',
        interval: 60,
        timeout: 10,
        retries: 2,
      };

      const mockHealthCheck = {
        id: 'check-123',
        ...request,
        isActive: true,
      };

      (mockPrisma.healthCheck.create as jest.Mock).mockResolvedValue(mockHealthCheck);

      const result = await service.createHealthCheck(request);

      expect(result.id).toBe('check-123');
      expect(result.name).toBe('Test API');
      expect(mockPrisma.healthCheck.create).toHaveBeenCalled();
    });
  });

  describe('runHealthCheck', () => {
    const mockCheck = {
      id: 'check-123',
      name: 'Test Check',
      type: 'HTTP' as const,
      target: 'https://api.example.com/health',
      interval: 60,
      timeout: 10,
      retries: 2,
      isActive: true,
    };

    it('should run HTTP health check successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });
      (mockPrisma.healthCheckResult.create as jest.Mock).mockResolvedValue({});

      const result = await service.runHealthCheck(mockCheck);

      expect(result.status).toBe('HEALTHY');
      expect(result.message).toContain('HTTP 200');
      expect(global.fetch).toHaveBeenCalledWith(
        mockCheck.target,
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should handle failed HTTP health check', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });
      (mockPrisma.healthCheckResult.create as jest.Mock).mockResolvedValue({});

      const result = await service.runHealthCheck(mockCheck);

      expect(result.status).toBe('UNHEALTHY');
      expect(result.message).toContain('HTTP 503');
    });

    it('should run database health check', async () => {
      const dbCheck = { ...mockCheck, type: 'DATABASE' as const, target: 'prisma' };
      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([{ result: 1 }]);
      (mockPrisma.healthCheckResult.create as jest.Mock).mockResolvedValue({});

      const result = await service.runHealthCheck(dbCheck);

      expect(result.status).toBe('HEALTHY');
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });
  });

  describe('createAlert', () => {
    it('should create monitoring alert', async () => {
      const request = {
        name: 'High CPU Alert',
        type: 'THRESHOLD' as const,
        severity: 'WARNING' as const,
        condition: {
          metric: 'system.cpu.usage',
          operator: 'GT' as const,
          value: 80,
        },
        channels: [
          { type: 'EMAIL' as const, config: { to: 'admin@example.com' } },
        ],
        cooldown: 300,
      };

      const mockAlert = {
        id: 'alert-123',
        ...request,
        isActive: true,
      };

      (mockPrisma.monitoringAlert.create as jest.Mock).mockResolvedValue(mockAlert);

      const result = await service.createAlert(request);

      expect(result.id).toBe('alert-123');
      expect(result.name).toBe('High CPU Alert');
      expect(mockPrisma.monitoringAlert.create).toHaveBeenCalled();
    });
  });

  describe('recordCustomMetric', () => {
    it('should record custom metric', async () => {
      const request = {
        name: 'api.latency',
        type: 'HISTOGRAM' as const,
        value: 125.5,
        tags: { endpoint: '/api/users', method: 'GET' },
      };

      const mockMetric = {
        id: 'metric-123',
        ...request,
        timestamp: new Date(),
      };

      (mockPrisma.customMetric.create as jest.Mock).mockResolvedValue(mockMetric);

      const result = await service.recordCustomMetric(request);

      expect(result.name).toBe('api.latency');
      expect(result.value).toBe(125.5);
      expect(mockPrisma.customMetric.create).toHaveBeenCalled();
    });
  });

  describe('log', () => {
    it('should create log entry', async () => {
      (mockPrisma.logEntry.create as jest.Mock).mockResolvedValue({});

      await service.log('ERROR', 'Test error message', 'test-service', {
        userId: 'user-123',
      });

      expect(mockPrisma.logEntry.create).toHaveBeenCalledWith({
        data: {
          level: 'ERROR',
          message: 'Test error message',
          service: 'test-service',
          metadata: { userId: 'user-123' },
        },
      });
    });
  });

  describe('getLogs', () => {
    it('should retrieve logs with filters', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          level: 'ERROR',
          message: 'Error 1',
          service: 'api',
          timestamp: new Date(),
        },
        {
          id: 'log-2',
          level: 'WARN',
          message: 'Warning 1',
          service: 'api',
          timestamp: new Date(),
        },
      ];

      (mockPrisma.logEntry.findMany as jest.Mock).mockResolvedValue(mockLogs);
      (mockPrisma.logEntry.count as jest.Mock).mockResolvedValue(2);

      const result = await service.getLogs({
        level: 'ERROR',
        service: 'api',
        limit: 10,
        offset: 0,
      });

      expect(result.logs).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('getOverview', () => {
    it('should return monitoring overview', async () => {
      const mockSystemMetric = {
        cpu: { usage: 45 },
        memory: { percentage: 60 },
        disk: { percentage: 70 },
      };
      
      const mockAppMetric = {
        requests: { perMinute: 100, total: 1000 },
        response: { averageTime: 50 },
        errors: { total: 10 },
        activeUsers: 25,
      };

      (mockPrisma.systemMetric.findFirst as jest.Mock).mockResolvedValue(mockSystemMetric);
      (mockPrisma.applicationMetric.findFirst as jest.Mock).mockResolvedValue(mockAppMetric);
      (mockPrisma.healthCheck.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.alertEvent.count as jest.Mock)
        .mockResolvedValueOnce(5)  // active alerts
        .mockResolvedValueOnce(20) // triggered 24h
        .mockResolvedValueOnce(1); // critical active

      const result = await service.getOverview();

      expect(result.system.cpu).toBe(45);
      expect(result.system.memory).toBe(60);
      expect(result.application.requestsPerMinute).toBe(100);
      expect(result.application.errorRate).toBe(1); // 10/1000 * 100
      expect(result.alerts.active).toBe(5);
      expect(result.alerts.triggered24h).toBe(20);
    });
  });
});