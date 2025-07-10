import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import {
  AdminUser,
  AdminUserListRequest,
  AdminUserUpdateRequest,
  AdminUserActionRequest,
  SystemStats,
  SystemConfigRequest,
  StatsTimeRangeRequest,
  AdminAPIKey,
  AdminAPIKeyCreateRequest,
  AdminAPIKeyUpdateRequest,
  AuditLogEntry,
  AuditLogQueryRequest,
  SupportTicket,
  SupportTicketRequest,
  TicketResponseRequest,
  AdminError,
} from './types';
import { generateSecureToken } from '../auth/utils';

export class AdminService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get list of users with filtering and pagination
   */
  async getUsers(params: AdminUserListRequest): Promise<{
    users: AdminUser[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20, search, role, status, sortBy, sortOrder } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (role) where.role = role;
    if (status) where.status = status;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          subscription: true,
          _count: {
            select: { content: true },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Get usage data for each user
    const userIds = users.map(u => u.id);
    const usageData = await this.getUsersUsage(userIds);

    const adminUsers: AdminUser[] = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      status: user.status as any,
      createdAt: user.createdAt,
      lastActive: user.lastActive || user.createdAt,
      metadata: user.metadata as any,
      subscription: user.subscription ? {
        plan: user.subscription.plan,
        status: user.subscription.status,
        currentPeriodEnd: user.subscription.currentPeriodEnd,
      } : undefined,
      usage: usageData[user.id] || {
        contentCount: 0,
        storageUsed: 0,
        apiCalls: 0,
      },
    }));

    return {
      users: adminUsers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get detailed user information
   */
  async getUser(userId: string): Promise<AdminUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
        sessions: {
          where: { expiresAt: { gt: new Date() } },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        apiKeys: {
          where: { deletedAt: null },
        },
        _count: {
          select: {
            content: true,
            aiJobs: true,
          },
        },
      },
    });

    if (!user) {
      throw new AdminError('User not found', 'USER_NOT_FOUND');
    }

    const usage = await this.getUserUsage(userId);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      status: user.status as any,
      createdAt: user.createdAt,
      lastActive: user.lastActive || user.createdAt,
      metadata: {
        ...user.metadata,
        activeSessions: user.sessions.length,
        apiKeys: user.apiKeys.length,
        contentCount: user._count.content,
        aiJobsCount: user._count.aiJobs,
      },
      subscription: user.subscription ? {
        plan: user.subscription.plan,
        status: user.subscription.status,
        currentPeriodEnd: user.subscription.currentPeriodEnd,
      } : undefined,
      usage,
    };
  }

  /**
   * Update user information
   */
  async updateUser(
    userId: string,
    updates: AdminUserUpdateRequest,
    adminId: string
  ): Promise<AdminUser> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AdminError('User not found', 'USER_NOT_FOUND');
    }

    // Prevent demoting super_admin
    if (user.role === 'super_admin' && updates.role) {
      throw new AdminError('Cannot modify super admin role', 'FORBIDDEN');
    }

    // Update user
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    // Log the action
    await this.logAdminAction(adminId, 'user.update', 'user', userId, {
      updates,
      previousValues: {
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });

    return this.getUser(userId);
  }

  /**
   * Perform admin action on user
   */
  async performUserAction(
    userId: string,
    action: AdminUserActionRequest,
    adminId: string
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AdminError('User not found', 'USER_NOT_FOUND');
    }

    let message = '';

    switch (action.action) {
      case 'suspend':
        await this.prisma.user.update({
          where: { id: userId },
          data: { status: 'suspended' },
        });
        message = 'User suspended successfully';
        break;

      case 'activate':
        await this.prisma.user.update({
          where: { id: userId },
          data: { status: 'active' },
        });
        message = 'User activated successfully';
        break;

      case 'delete':
        await this.prisma.user.update({
          where: { id: userId },
          data: { 
            status: 'deleted',
            deletedAt: new Date(),
          },
        });
        message = 'User deleted successfully';
        break;

      case 'reset_password':
        const tempPassword = generateSecureToken(12);
        const hashedPassword = await bcrypt.hash(tempPassword, 12);
        
        await this.prisma.user.update({
          where: { id: userId },
          data: { 
            password: hashedPassword,
            passwordResetRequired: true,
          },
        });
        
        // In production, send email with temp password
        message = `Password reset. Temporary password: ${tempPassword}`;
        break;

      case 'revoke_sessions':
        await this.prisma.session.deleteMany({
          where: { userId },
        });
        message = 'All sessions revoked successfully';
        break;
    }

    // Log the action
    await this.logAdminAction(adminId, `user.${action.action}`, 'user', userId, {
      reason: action.reason,
      notifyUser: action.notifyUser,
    });

    return { success: true, message };
  }

  /**
   * Get system statistics
   */
  async getSystemStats(timeRange?: StatsTimeRangeRequest): Promise<SystemStats> {
    const startDate = timeRange?.startDate ? new Date(timeRange.startDate) : 
                     new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const endDate = timeRange?.endDate ? new Date(timeRange.endDate) : new Date();

    const [
      totalUsers,
      activeUsers,
      newUsers,
      suspendedUsers,
      totalContent,
      publishedContent,
      scheduledContent,
      failedJobs,
      totalSubscriptions,
      activeSubscriptions,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: {
          lastActive: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      this.prisma.user.count({ where: { status: 'suspended' } }),
      this.prisma.content.count(),
      this.prisma.content.count({ where: { status: 'published' } }),
      this.prisma.content.count({ where: { status: 'scheduled' } }),
      this.prisma.aiGenerationJob.count({ where: { status: 'failed' } }),
      this.prisma.subscription.count(),
      this.prisma.subscription.count({ where: { status: 'active' } }),
    ]);

    // Calculate revenue metrics
    const revenueData = await this.calculateRevenue(startDate, endDate);

    // Get system health metrics
    const healthMetrics = await this.getHealthMetrics();

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        new: newUsers,
        suspended: suspendedUsers,
      },
      content: {
        total: totalContent,
        published: publishedContent,
        scheduled: scheduledContent,
        failed: failedJobs,
      },
      usage: {
        apiCalls: await this.getAPICallCount(startDate, endDate),
        storageUsed: await this.getTotalStorageUsed(),
        bandwidthUsed: 0, // Would need to track this
        generationMinutes: await this.getGenerationMinutes(startDate, endDate),
      },
      revenue: revenueData,
      health: healthMetrics,
    };
  }

  /**
   * Get system configuration
   */
  async getSystemConfig(): Promise<any> {
    // In a real implementation, this would fetch from a config table
    return {
      maintenance: {
        enabled: false,
        message: '',
        allowedIPs: [],
      },
      features: {
        registration: true,
        socialLogin: true,
        aiGeneration: true,
        billing: true,
      },
      limits: {
        maxUsersPerWorkspace: 50,
        maxContentPerUser: 1000,
        maxStoragePerUser: 5120, // 5GB in MB
      },
      security: {
        passwordMinLength: 8,
        sessionTimeout: 10080, // 7 days in minutes
        maxLoginAttempts: 5,
        requireMFA: false,
      },
    };
  }

  /**
   * Update system configuration
   */
  async updateSystemConfig(
    config: SystemConfigRequest,
    adminId: string
  ): Promise<any> {
    // In a real implementation, this would update a config table
    
    // Log the action
    await this.logAdminAction(adminId, 'system.config.update', 'system', 'config', {
      updates: config,
    });

    return this.getSystemConfig();
  }

  /**
   * Create admin API key
   */
  async createAPIKey(
    params: AdminAPIKeyCreateRequest,
    adminId: string
  ): Promise<AdminAPIKey> {
    const key = `sk_admin_${generateSecureToken(32)}`;
    const hashedKey = await bcrypt.hash(key, 10);

    const apiKey = await this.prisma.apiKey.create({
      data: {
        userId: adminId,
        name: params.name,
        description: params.description,
        key: hashedKey,
        keyPreview: key.substring(0, 12) + '...',
        scopes: params.scopes,
        expiresAt: params.expiresAt ? new Date(params.expiresAt) : null,
        metadata: {
          isAdminKey: true,
          rateLimit: params.rateLimit,
        },
      },
    });

    await this.logAdminAction(adminId, 'apikey.create', 'apikey', apiKey.id, {
      name: params.name,
      scopes: params.scopes,
    });

    return {
      id: apiKey.id,
      name: apiKey.name,
      description: apiKey.description || undefined,
      key: key, // Return full key only on creation
      scopes: apiKey.scopes,
      enabled: apiKey.enabled,
      createdAt: apiKey.createdAt,
      expiresAt: apiKey.expiresAt || undefined,
      usage: {
        requests: 0,
      },
    };
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(params: AuditLogQueryRequest): Promise<{
    logs: AuditLogEntry[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 50, userId, action, resource, startDate, endDate } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (resource) where.resource = resource;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          user: {
            select: { email: true },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    const auditLogs: AuditLogEntry[] = logs.map(log => ({
      id: log.id,
      timestamp: log.timestamp,
      userId: log.userId,
      userEmail: log.user.email,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId || undefined,
      details: log.details as any,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      result: log.result as any,
    }));

    return {
      logs: auditLogs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Helper: Get users usage data
   */
  private async getUsersUsage(userIds: string[]): Promise<Record<string, any>> {
    // Simplified implementation - in production would aggregate from multiple tables
    const usage: Record<string, any> = {};
    
    for (const userId of userIds) {
      usage[userId] = await this.getUserUsage(userId);
    }
    
    return usage;
  }

  /**
   * Helper: Get single user usage
   */
  private async getUserUsage(userId: string): Promise<any> {
    const [contentCount, apiCalls] = await Promise.all([
      this.prisma.content.count({ where: { userId } }),
      this.prisma.apiKey.aggregate({
        where: { userId },
        _sum: { usageCount: true },
      }),
    ]);

    return {
      contentCount,
      storageUsed: 0, // Would calculate from actual storage
      apiCalls: apiCalls._sum.usageCount || 0,
    };
  }

  /**
   * Helper: Calculate revenue metrics
   */
  private async calculateRevenue(startDate: Date, endDate: Date): Promise<any> {
    const activeSubscriptions = await this.prisma.subscription.findMany({
      where: { status: 'active' },
      select: { plan: true, amount: true },
    });

    const mrr = activeSubscriptions.reduce((sum, sub) => sum + sub.amount, 0);
    const arr = mrr * 12;

    const newSubscriptions = await this.prisma.subscription.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    const cancelledSubscriptions = await this.prisma.subscription.count({
      where: {
        status: 'cancelled',
        updatedAt: { gte: startDate, lte: endDate },
      },
    });

    const churn = activeSubscriptions.length > 0 
      ? (cancelledSubscriptions / activeSubscriptions.length) * 100 
      : 0;

    return { mrr, arr, newSubscriptions, churn };
  }

  /**
   * Helper: Get health metrics
   */
  private async getHealthMetrics(): Promise<any> {
    // Simplified implementation
    return {
      uptime: 99.9,
      errorRate: 0.1,
      avgResponseTime: 150,
      queueSize: 0,
    };
  }

  /**
   * Helper: Get API call count
   */
  private async getAPICallCount(startDate: Date, endDate: Date): Promise<number> {
    const result = await this.prisma.apiKey.aggregate({
      _sum: { usageCount: true },
    });
    
    return result._sum.usageCount || 0;
  }

  /**
   * Helper: Get total storage used
   */
  private async getTotalStorageUsed(): Promise<number> {
    // In production, would calculate from actual storage
    return 0;
  }

  /**
   * Helper: Get generation minutes
   */
  private async getGenerationMinutes(startDate: Date, endDate: Date): Promise<number> {
    const jobs = await this.prisma.aiGenerationJob.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: 'completed',
      },
      select: { processingTime: true },
    });

    return jobs.reduce((sum, job) => sum + (job.processingTime || 0), 0) / 60;
  }

  /**
   * Helper: Log admin action
   */
  private async logAdminAction(
    userId: string,
    action: string,
    resource: string,
    resourceId: string,
    details: any
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId,
        details,
        ipAddress: '0.0.0.0', // Would get from request
        userAgent: 'Admin Panel', // Would get from request
        result: 'success',
      },
    });
  }
}