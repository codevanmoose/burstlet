import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { AdminService } from './service';
import { AdminError } from './types';

// Mock Prisma
const mockPrisma = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
    aggregate: jest.fn(),
  },
  content: {
    count: jest.fn(),
  },
  subscription: {
    count: jest.fn(),
    findMany: jest.fn(),
    aggregate: jest.fn(),
  },
  aiGenerationJob: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
  apiKey: {
    create: jest.fn(),
    aggregate: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn(),
  },
  session: {
    deleteMany: jest.fn(),
  },
} as unknown as PrismaClient;

describe('AdminService', () => {
  let service: AdminService;

  beforeEach(() => {
    service = new AdminService(mockPrisma);
    jest.clearAllMocks();
  });

  describe('getUsers', () => {
    it('should return paginated users list', async () => {
      const mockUsers = [
        {
          id: 'user_1',
          email: 'user1@example.com',
          name: 'User 1',
          role: 'user',
          status: 'active',
          createdAt: new Date(),
          lastActive: new Date(),
          metadata: {},
          subscription: null,
          _count: { content: 5 },
        },
        {
          id: 'user_2',
          email: 'user2@example.com',
          name: 'User 2',
          role: 'admin',
          status: 'active',
          createdAt: new Date(),
          lastActive: new Date(),
          metadata: {},
          subscription: {
            plan: 'pro',
            status: 'active',
            currentPeriodEnd: new Date(),
          },
          _count: { content: 12 },
        },
      ];

      (mockPrisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (mockPrisma.user.count as jest.Mock).mockResolvedValue(2);

      const result = await service.getUsers({
        page: 1,
        limit: 20,
      });

      expect(result.users).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.users[0].email).toBe('user1@example.com');
      expect(result.users[1].subscription?.plan).toBe('pro');
    });

    it('should filter users by role and status', async () => {
      (mockPrisma.user.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.user.count as jest.Mock).mockResolvedValue(0);

      await service.getUsers({
        role: 'admin',
        status: 'active',
        search: 'john',
      });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { email: { contains: 'john', mode: 'insensitive' } },
            { name: { contains: 'john', mode: 'insensitive' } },
          ],
          role: 'admin',
          status: 'active',
        },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          subscription: true,
          _count: { select: { content: true } },
        },
      });
    });
  });

  describe('getUser', () => {
    it('should return detailed user information', async () => {
      const mockUser = {
        id: 'user_123',
        email: 'user@example.com',
        name: 'Test User',
        role: 'user',
        status: 'active',
        createdAt: new Date(),
        lastActive: new Date(),
        metadata: {},
        subscription: {
          plan: 'pro',
          status: 'active',
          currentPeriodEnd: new Date(),
        },
        sessions: [{ id: 'session_1' }],
        apiKeys: [{ id: 'key_1' }],
        _count: { content: 10, aiJobs: 5 },
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.content.count as jest.Mock).mockResolvedValue(10);
      (mockPrisma.apiKey.aggregate as jest.Mock).mockResolvedValue({ _sum: { usageCount: 100 } });

      const result = await service.getUser('user_123');

      expect(result.id).toBe('user_123');
      expect(result.email).toBe('user@example.com');
      expect(result.subscription?.plan).toBe('pro');
      expect(result.usage.contentCount).toBe(10);
    });

    it('should throw error if user not found', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getUser('nonexistent')).rejects.toThrow(AdminError);
      await expect(service.getUser('nonexistent')).rejects.toThrow('User not found');
    });
  });

  describe('updateUser', () => {
    it('should update user information', async () => {
      const mockUser = {
        id: 'user_123',
        role: 'user',
        name: 'Old Name',
        email: 'old@example.com',
        status: 'active',
      };

      const mockUpdatedUser = {
        ...mockUser,
        name: 'New Name',
        email: 'new@example.com',
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser);
      (mockPrisma.auditLog.create as jest.Mock).mockResolvedValue({});

      // Mock getUser for return value
      jest.spyOn(service, 'getUser').mockResolvedValue({
        id: 'user_123',
        name: 'New Name',
        email: 'new@example.com',
        role: 'user',
        status: 'active',
        createdAt: new Date(),
        lastActive: new Date(),
        metadata: {},
        usage: { contentCount: 0, storageUsed: 0, apiCalls: 0 },
      });

      const result = await service.updateUser(
        'user_123',
        { name: 'New Name', email: 'new@example.com' },
        'admin_123'
      );

      expect(result.name).toBe('New Name');
      expect(result.email).toBe('new@example.com');
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });

    it('should prevent modifying super admin role', async () => {
      const mockSuperAdmin = {
        id: 'super_admin',
        role: 'super_admin',
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockSuperAdmin);

      await expect(
        service.updateUser('super_admin', { role: 'admin' }, 'admin_123')
      ).rejects.toThrow('Cannot modify super admin role');
    });
  });

  describe('performUserAction', () => {
    const mockUser = {
      id: 'user_123',
      email: 'user@example.com',
      status: 'active',
    };

    beforeEach(() => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.auditLog.create as jest.Mock).mockResolvedValue({});
    });

    it('should suspend user', async () => {
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({});

      const result = await service.performUserAction(
        'user_123',
        { action: 'suspend', reason: 'Policy violation' },
        'admin_123'
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('User suspended successfully');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user_123' },
        data: { status: 'suspended' },
      });
    });

    it('should activate user', async () => {
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({});

      const result = await service.performUserAction(
        'user_123',
        { action: 'activate' },
        'admin_123'
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('User activated successfully');
    });

    it('should revoke all user sessions', async () => {
      (mockPrisma.session.deleteMany as jest.Mock).mockResolvedValue({ count: 3 });

      const result = await service.performUserAction(
        'user_123',
        { action: 'revoke_sessions' },
        'admin_123'
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('All sessions revoked successfully');
      expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user_123' },
      });
    });
  });

  describe('getSystemStats', () => {
    it('should return comprehensive system statistics', async () => {
      // Mock all the count calls
      (mockPrisma.user.count as jest.Mock)
        .mockResolvedValueOnce(1000) // total users
        .mockResolvedValueOnce(300) // active users
        .mockResolvedValueOnce(25) // new users
        .mockResolvedValueOnce(5); // suspended users

      (mockPrisma.content.count as jest.Mock)
        .mockResolvedValueOnce(5000) // total content
        .mockResolvedValueOnce(4200) // published
        .mockResolvedValueOnce(150); // scheduled

      (mockPrisma.aiGenerationJob.count as jest.Mock).mockResolvedValue(15); // failed jobs

      (mockPrisma.subscription.count as jest.Mock)
        .mockResolvedValueOnce(800) // total subscriptions
        .mockResolvedValueOnce(750); // active subscriptions

      (mockPrisma.subscription.findMany as jest.Mock).mockResolvedValue([
        { plan: 'pro', amount: 29 },
        { plan: 'basic', amount: 9 },
      ]);

      (mockPrisma.apiKey.aggregate as jest.Mock).mockResolvedValue({
        _sum: { usageCount: 50000 },
      });

      (mockPrisma.aiGenerationJob.findMany as jest.Mock).mockResolvedValue([
        { processingTime: 120 },
        { processingTime: 180 },
      ]);

      const stats = await service.getSystemStats();

      expect(stats.users.total).toBe(1000);
      expect(stats.users.active).toBe(300);
      expect(stats.content.total).toBe(5000);
      expect(stats.content.published).toBe(4200);
      expect(stats.usage.apiCalls).toBe(50000);
      expect(stats.revenue).toBeDefined();
      expect(stats.health).toBeDefined();
    });
  });

  describe('createAPIKey', () => {
    it('should create admin API key', async () => {
      const mockApiKey = {
        id: 'key_123',
        name: 'Admin Key',
        description: 'For admin operations',
        key: 'hashed_key',
        keyPreview: 'sk_admin_abc...',
        scopes: ['admin:read', 'admin:write'],
        enabled: true,
        createdAt: new Date(),
        expiresAt: null,
      };

      (mockPrisma.apiKey.create as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.auditLog.create as jest.Mock).mockResolvedValue({});

      const result = await service.createAPIKey(
        {
          name: 'Admin Key',
          description: 'For admin operations',
          scopes: ['admin:read', 'admin:write'],
        },
        'admin_123'
      );

      expect(result.name).toBe('Admin Key');
      expect(result.scopes).toEqual(['admin:read', 'admin:write']);
      expect(result.key).toMatch(/^sk_admin_/);
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });
  });

  describe('getAuditLogs', () => {
    it('should return paginated audit logs', async () => {
      const mockLogs = [
        {
          id: 'log_1',
          timestamp: new Date(),
          userId: 'admin_123',
          action: 'user.update',
          resource: 'user',
          resourceId: 'user_456',
          details: {},
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          result: 'success',
          user: { email: 'admin@example.com' },
        },
      ];

      (mockPrisma.auditLog.findMany as jest.Mock).mockResolvedValue(mockLogs);
      (mockPrisma.auditLog.count as jest.Mock).mockResolvedValue(1);

      const result = await service.getAuditLogs({
        page: 1,
        limit: 50,
        userId: 'admin_123',
      });

      expect(result.logs).toHaveLength(1);
      expect(result.logs[0].action).toBe('user.update');
      expect(result.logs[0].userEmail).toBe('admin@example.com');
    });
  });
});