import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { SecurityService } from './service';
import { SecurityError, ValidationError } from './types';
import bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');

// Mock Prisma
const mockPrisma = {
  apiKey: {
    count: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  securityEvent: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
    deleteMany: jest.fn(),
  },
  ipRule: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn(),
  },
  rateLimitRecord: {
    count: jest.fn(),
  },
  notification: {
    create: jest.fn(),
  },
} as unknown as PrismaClient;

describe('SecurityService', () => {
  let service: SecurityService;
  const encryptionConfig = {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    saltRounds: 10,
    secret: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  };

  beforeEach(() => {
    service = new SecurityService(mockPrisma, encryptionConfig);
    jest.clearAllMocks();
  });

  describe('createApiKey', () => {
    const createRequest = {
      name: 'Test API Key',
      permissions: [
        { resource: 'content', actions: ['read', 'write'] },
      ],
      expiresIn: 30,
    };

    it('should create API key successfully', async () => {
      (mockPrisma.apiKey.count as jest.Mock).mockResolvedValue(0);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_key');
      (mockPrisma.apiKey.create as jest.Mock).mockResolvedValue({
        id: 'key-123',
        userId: 'user-123',
        name: 'Test API Key',
        key: 'bst_abc...xyz',
        hashedKey: 'hashed_key',
        permissions: createRequest.permissions,
        isActive: true,
        createdAt: new Date(),
      });
      (mockPrisma.auditLog.create as jest.Mock).mockResolvedValue({});

      const result = await service.createApiKey('user-123', createRequest);

      expect(result.apiKey).toHaveProperty('id');
      expect(result.apiKey.key).toMatch(/^bst_/);
      expect(mockPrisma.apiKey.create).toHaveBeenCalled();
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });

    it('should enforce API key limit', async () => {
      (mockPrisma.apiKey.count as jest.Mock).mockResolvedValue(10);

      await expect(
        service.createApiKey('user-123', createRequest)
      ).rejects.toThrow(SecurityError);
    });
  });

  describe('validateApiKey', () => {
    const mockApiKeys = [
      {
        id: 'key-123',
        userId: 'user-123',
        hashedKey: 'hashed_key_1',
        isActive: true,
        permissions: [],
      },
      {
        id: 'key-456',
        userId: 'user-456',
        hashedKey: 'hashed_key_2',
        isActive: true,
        permissions: [],
      },
    ];

    it('should validate correct API key', async () => {
      (mockPrisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockApiKeys);
      (bcrypt.compare as jest.Mock)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);
      (mockPrisma.apiKey.update as jest.Mock).mockResolvedValue(mockApiKeys[1]);

      const result = await service.validateApiKey('test_key');

      expect(result).toBeTruthy();
      expect(result?.id).toBe('key-456');
      expect(mockPrisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: 'key-456' },
        data: { lastUsedAt: expect.any(Date) },
      });
    });

    it('should return null for invalid key', async () => {
      (mockPrisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockApiKeys);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      (mockPrisma.securityEvent.create as jest.Mock).mockResolvedValue({});

      const result = await service.validateApiKey('invalid_key');

      expect(result).toBeNull();
      expect(mockPrisma.securityEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'INVALID_API_KEY',
          severity: 'MEDIUM',
        }),
      });
    });
  });

  describe('createIpRule', () => {
    const createRequest = {
      ipAddress: '192.168.1.100',
      type: 'BLOCK' as const,
      reason: 'Suspicious activity',
      createdBy: 'admin-123',
    };

    it('should create IP rule successfully', async () => {
      (mockPrisma.ipRule.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.ipRule.create as jest.Mock).mockResolvedValue({
        id: 'rule-123',
        ...createRequest,
        expiresAt: null,
        createdAt: new Date(),
      });
      (mockPrisma.auditLog.create as jest.Mock).mockResolvedValue({});

      const result = await service.createIpRule(createRequest);

      expect(result.ipAddress).toBe('192.168.1.100');
      expect(result.type).toBe('BLOCK');
      expect(mockPrisma.ipRule.create).toHaveBeenCalled();
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });

    it('should prevent duplicate IP rules', async () => {
      (mockPrisma.ipRule.findFirst as jest.Mock).mockResolvedValue({
        id: 'existing-rule',
        ipAddress: '192.168.1.100',
      });

      await expect(
        service.createIpRule(createRequest)
      ).rejects.toThrow(SecurityError);
    });
  });

  describe('analyzeIp', () => {
    it('should analyze IP address', async () => {
      (mockPrisma.auditLog.count as jest.Mock).mockResolvedValue(100);
      (mockPrisma.securityEvent.count as jest.Mock).mockResolvedValue(5);
      (mockPrisma.auditLog.findFirst as jest.Mock).mockResolvedValue({
        createdAt: new Date(),
      });

      const result = await service.analyzeIp('192.168.1.100');

      expect(result.ipAddress).toBe('192.168.1.100');
      expect(result.geolocation).toBeDefined();
      expect(result.reputation.score).toBeGreaterThanOrEqual(0);
      expect(result.reputation.score).toBeLessThanOrEqual(100);
      expect(result.history.requests).toBe(100);
      expect(result.history.blockedAttempts).toBe(5);
      expect(result.recommendation).toBeDefined();
    });
  });

  describe('createSecurityEvent', () => {
    const eventData = {
      type: 'RATE_LIMIT_EXCEEDED' as const,
      severity: 'MEDIUM' as const,
      ipAddress: '192.168.1.100',
      details: { endpoint: '/api/v1/test' },
    };

    it('should create security event', async () => {
      const mockEvent = {
        id: 'event-123',
        ...eventData,
        resolved: false,
        createdAt: new Date(),
      };

      (mockPrisma.securityEvent.create as jest.Mock).mockResolvedValue(mockEvent);
      (mockPrisma.securityEvent.count as jest.Mock).mockResolvedValue(10);

      const result = await service.createSecurityEvent(eventData);

      expect(result.id).toBe('event-123');
      expect(result.resolved).toBe(false);
      expect(mockPrisma.securityEvent.create).toHaveBeenCalled();
    });
  });

  describe('getSecurityEvents', () => {
    it('should return security events with summary', async () => {
      const mockEvents = [
        { id: 'event-1', type: 'RATE_LIMIT_EXCEEDED', severity: 'MEDIUM' },
        { id: 'event-2', type: 'INVALID_API_KEY', severity: 'LOW' },
      ];

      (mockPrisma.securityEvent.findMany as jest.Mock).mockResolvedValue(mockEvents);
      (mockPrisma.securityEvent.count as jest.Mock).mockResolvedValue(2);
      (mockPrisma.securityEvent.groupBy as jest.Mock)
        .mockResolvedValueOnce([
          { type: 'RATE_LIMIT_EXCEEDED', _count: 1 },
          { type: 'INVALID_API_KEY', _count: 1 },
        ])
        .mockResolvedValueOnce([
          { severity: 'MEDIUM', _count: 1 },
          { severity: 'LOW', _count: 1 },
        ]);

      const result = await service.getSecurityEvents({ limit: 20, offset: 0 });

      expect(result.events).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.summary.byType['RATE_LIMIT_EXCEEDED']).toBe(1);
      expect(result.summary.bySeverity['MEDIUM']).toBe(1);
    });
  });

  describe('encryption', () => {
    it('should encrypt and decrypt data correctly', () => {
      const plaintext = 'This is a secret message';

      const encrypted = service.encrypt(plaintext);
      expect(encrypted.data).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.authTag).toBeDefined();

      const decrypted = service.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should use different IVs for each encryption', () => {
      const plaintext = 'Same message';

      const encrypted1 = service.encrypt(plaintext);
      const encrypted2 = service.encrypt(plaintext);

      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.data).not.toBe(encrypted2.data);
    });
  });

  describe('sanitizeInput', () => {
    it('should remove XSS vectors', () => {
      const maliciousInput = '<script>alert("XSS")</script>Hello<iframe src="evil.com"></iframe>';
      const sanitized = service.sanitizeInput(maliciousInput);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('</script>');
      expect(sanitized).not.toContain('<iframe>');
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).toContain('Hello');
    });

    it('should escape HTML entities', () => {
      const input = '<div>Test & "quotes" \'single\'</div>';
      const sanitized = service.sanitizeInput(input);

      expect(sanitized).toContain('&lt;');
      expect(sanitized).toContain('&gt;');
      expect(sanitized).toContain('&amp;');
      expect(sanitized).toContain('&quot;');
      expect(sanitized).toContain('&#x27;');
    });
  });

  describe('validateRequest', () => {
    it('should validate required fields', () => {
      const rules = {
        email: { required: true, type: 'string' },
        age: { required: true, type: 'number' },
      };

      const data = { email: 'test@example.com' };

      expect(() => service.validateRequest(data, rules)).toThrow(ValidationError);
    });

    it('should validate field types', () => {
      const rules = {
        email: { required: true, type: 'string' },
        age: { required: true, type: 'number' },
      };

      const data = { email: 'test@example.com', age: '25' };

      expect(() => service.validateRequest(data, rules)).toThrow(ValidationError);
    });

    it('should pass valid data', () => {
      const rules = {
        email: { required: true, type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
        age: { required: true, type: 'number' },
      };

      const data = { email: 'test@example.com', age: 25 };

      expect(() => service.validateRequest(data, rules)).not.toThrow();
    });
  });

  describe('getSecurityStatus', () => {
    it('should return comprehensive security status', async () => {
      (mockPrisma.securityEvent.count as jest.Mock)
        .mockResolvedValueOnce(10) // active threats
        .mockResolvedValueOnce(20) // resolved threats
        .mockResolvedValueOnce(2); // critical threats
      
      (mockPrisma.rateLimitRecord.count as jest.Mock).mockResolvedValue(5);
      (mockPrisma.apiKey.count as jest.Mock)
        .mockResolvedValueOnce(50) // total
        .mockResolvedValueOnce(40) // active
        .mockResolvedValueOnce(3); // expiring soon
      
      (mockPrisma.ipRule.count as jest.Mock)
        .mockResolvedValueOnce(10) // allowed
        .mockResolvedValueOnce(25); // blocked
      
      (mockPrisma.securityEvent.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getSecurityStatus();

      expect(result.status).toBe('SECURE');
      expect(result.threats.active).toBe(10);
      expect(result.threats.resolved).toBe(20);
      expect(result.threats.critical).toBe(2);
      expect(result.apiKeys.total).toBe(50);
      expect(result.ipRules.blocked).toBe(25);
    });
  });
});