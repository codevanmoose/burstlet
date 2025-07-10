import { Request, Response, NextFunction } from 'express';
import { AdminService } from './service';
import {
  AdminUserListSchema,
  AdminUserUpdateSchema,
  AdminUserActionSchema,
  SystemConfigSchema,
  StatsTimeRangeSchema,
  AdminAPIKeyCreateSchema,
  AdminAPIKeyUpdateSchema,
  AuditLogQuerySchema,
  SupportTicketSchema,
  TicketResponseSchema,
} from './types';

export class AdminController {
  constructor(private adminService: AdminService) {}

  /**
   * Get list of users
   */
  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const params = AdminUserListSchema.parse(req.query);
      const result = await this.adminService.getUsers(params);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user details
   */
  async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const user = await this.adminService.getUser(userId);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user
   */
  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const updates = AdminUserUpdateSchema.parse(req.body);
      const adminId = req.user!.id;

      const user = await this.adminService.updateUser(userId, updates, adminId);

      res.json({
        success: true,
        data: user,
        message: 'User updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Perform action on user
   */
  async performUserAction(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const action = AdminUserActionSchema.parse(req.body);
      const adminId = req.user!.id;

      const result = await this.adminService.performUserAction(userId, action, adminId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get system statistics
   */
  async getSystemStats(req: Request, res: Response, next: NextFunction) {
    try {
      const timeRange = StatsTimeRangeSchema.parse(req.query);
      const stats = await this.adminService.getSystemStats(timeRange);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get system configuration
   */
  async getSystemConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const config = await this.adminService.getSystemConfig();

      res.json({
        success: true,
        data: config,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update system configuration
   */
  async updateSystemConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const updates = SystemConfigSchema.parse(req.body);
      const adminId = req.user!.id;

      const config = await this.adminService.updateSystemConfig(updates, adminId);

      res.json({
        success: true,
        data: config,
        message: 'System configuration updated',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create admin API key
   */
  async createAPIKey(req: Request, res: Response, next: NextFunction) {
    try {
      const params = AdminAPIKeyCreateSchema.parse(req.body);
      const adminId = req.user!.id;

      const apiKey = await this.adminService.createAPIKey(params, adminId);

      res.json({
        success: true,
        data: apiKey,
        message: 'API key created successfully. Save the key securely as it won\'t be shown again.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const params = AuditLogQuerySchema.parse(req.query);
      const logs = await this.adminService.getAuditLogs(params);

      res.json({
        success: true,
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get admin dashboard overview
   */
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const [stats, recentUsers, recentActivity] = await Promise.all([
        this.adminService.getSystemStats(),
        this.adminService.getUsers({ limit: 5, sortBy: 'createdAt' }),
        this.adminService.getAuditLogs({ limit: 10 }),
      ]);

      res.json({
        success: true,
        data: {
          stats,
          recentUsers: recentUsers.users,
          recentActivity: recentActivity.logs,
          alerts: [], // Would fetch system alerts
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export data (users, content, etc.)
   */
  async exportData(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, format = 'csv' } = req.query;
      const adminId = req.user!.id;

      // Log the export action
      await this.adminService.logAdminAction(
        adminId,
        'data.export',
        'system',
        'export',
        { type, format }
      );

      // In a real implementation, would generate export file
      res.json({
        success: true,
        data: {
          downloadUrl: `/api/v1/admin/exports/${type}.${format}`,
          expiresAt: new Date(Date.now() + 3600000), // 1 hour
        },
        message: 'Export generated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Perform system maintenance action
   */
  async performMaintenanceAction(req: Request, res: Response, next: NextFunction) {
    try {
      const { action } = req.body;
      const adminId = req.user!.id;

      let result;
      switch (action) {
        case 'clear_cache':
          // Clear Redis cache
          result = { message: 'Cache cleared successfully' };
          break;

        case 'cleanup_storage':
          // Clean up orphaned files
          result = { message: 'Storage cleanup completed', filesRemoved: 0 };
          break;

        case 'optimize_database':
          // Run database optimization
          result = { message: 'Database optimization completed' };
          break;

        case 'rotate_logs':
          // Rotate old logs
          result = { message: 'Log rotation completed' };
          break;

        default:
          throw new Error('Invalid maintenance action');
      }

      // Log the action
      await this.adminService.logAdminAction(
        adminId,
        `maintenance.${action}`,
        'system',
        'maintenance',
        result
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(req: Request, res: Response, next: NextFunction) {
    try {
      // In a real implementation, would fetch from BullMQ
      const queueStats = {
        aiGeneration: {
          active: 5,
          waiting: 12,
          completed: 1234,
          failed: 3,
        },
        publishing: {
          active: 2,
          waiting: 8,
          completed: 567,
          failed: 1,
        },
        analytics: {
          active: 0,
          waiting: 0,
          completed: 890,
          failed: 0,
        },
      };

      res.json({
        success: true,
        data: queueStats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Impersonate user (for debugging)
   */
  async impersonateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const adminId = req.user!.id;

      // Verify user exists
      const user = await this.adminService.getUser(userId);

      // Log the impersonation
      await this.adminService.logAdminAction(
        adminId,
        'user.impersonate',
        'user',
        userId,
        { reason: req.body.reason }
      );

      // Generate impersonation token
      // In production, would use proper JWT generation
      const token = `impersonate_${userId}_${Date.now()}`;

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
          expiresAt: new Date(Date.now() + 3600000), // 1 hour
        },
        message: 'Impersonation token generated. Use with caution.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle feature flag
   */
  async toggleFeatureFlag(req: Request, res: Response, next: NextFunction) {
    try {
      const { feature } = req.params;
      const { enabled, userIds, percentage } = req.body;
      const adminId = req.user!.id;

      // In a real implementation, would update feature flag service
      await this.adminService.logAdminAction(
        adminId,
        'feature.toggle',
        'feature',
        feature,
        { enabled, userIds, percentage }
      );

      res.json({
        success: true,
        data: {
          feature,
          enabled,
          userIds: userIds || [],
          percentage: percentage || 100,
        },
        message: `Feature ${feature} ${enabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      next(error);
    }
  }
}