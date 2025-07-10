import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { AdminService } from './service';
import { AdminController } from './controller';
import { createAdminRoutes } from './routes';
import { AuthMiddleware } from '../auth/middleware';

export interface AdminModuleConfig {
  prefix?: string;
  enableImpersonation?: boolean;
  enableDataExport?: boolean;
  enableMaintenanceActions?: boolean;
}

export class AdminModule {
  private service: AdminService;
  private controller: AdminController;
  private config: AdminModuleConfig;

  constructor(
    private prisma: PrismaClient,
    config: AdminModuleConfig = {}
  ) {
    this.config = {
      prefix: '/api/v1/admin',
      enableImpersonation: true,
      enableDataExport: true,
      enableMaintenanceActions: true,
      ...config,
    };

    // Initialize service and controller
    this.service = new AdminService(prisma);
    this.controller = new AdminController(this.service);
  }

  /**
   * Initialize the admin module
   */
  async init(app: Express): Promise<void> {
    // Create auth middleware
    const authMiddleware = new AuthMiddleware(this.prisma);

    // Create and mount routes
    const routes = createAdminRoutes(this.controller, authMiddleware);
    app.use(this.config.prefix!, routes);

    // Ensure super admin exists
    await this.ensureSuperAdmin();

    console.log(`[ADMIN] Module initialized at ${this.config.prefix}`);
    console.log(`[ADMIN] Features: Impersonation=${this.config.enableImpersonation}, Export=${this.config.enableDataExport}`);
  }

  /**
   * Ensure super admin account exists
   */
  private async ensureSuperAdmin(): Promise<void> {
    const superAdmin = await this.prisma.user.findFirst({
      where: { role: 'super_admin' },
    });

    if (!superAdmin) {
      console.log('[ADMIN] Creating default super admin account');
      
      // In production, use secure password from environment
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash('Admin123!@#', 12);

      await this.prisma.user.create({
        data: {
          email: 'admin@burstlet.com',
          password: hashedPassword,
          name: 'Super Admin',
          role: 'super_admin',
          status: 'active',
          emailVerified: true,
          metadata: {
            isSystemAccount: true,
            createdBy: 'system',
          },
        },
      });

      console.log('[ADMIN] Super admin created: admin@burstlet.com');
    }
  }

  /**
   * Get admin service for external use
   */
  getService(): AdminService {
    return this.service;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    adminCount: number;
    superAdminExists: boolean;
    details: any;
  }> {
    try {
      const [adminCount, superAdminExists] = await Promise.all([
        this.prisma.user.count({ where: { role: { in: ['admin', 'super_admin'] } } }),
        this.prisma.user.count({ where: { role: 'super_admin' } }).then(count => count > 0),
      ]);

      return {
        status: 'healthy',
        adminCount,
        superAdminExists,
        details: {
          features: {
            impersonation: this.config.enableImpersonation,
            dataExport: this.config.enableDataExport,
            maintenance: this.config.enableMaintenanceActions,
          },
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        adminCount: 0,
        superAdminExists: false,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Get module statistics
   */
  async getStats(): Promise<{
    totalAdmins: number;
    totalSuperAdmins: number;
    recentActions: number;
    activeAdmins: number;
  }> {
    const [totalAdmins, totalSuperAdmins, recentActions, activeAdmins] = await Promise.all([
      this.prisma.user.count({ where: { role: 'admin' } }),
      this.prisma.user.count({ where: { role: 'super_admin' } }),
      this.prisma.auditLog.count({
        where: {
          timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          action: { startsWith: 'admin.' },
        },
      }),
      this.prisma.user.count({
        where: {
          role: { in: ['admin', 'super_admin'] },
          lastActive: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return {
      totalAdmins,
      totalSuperAdmins,
      recentActions,
      activeAdmins,
    };
  }

  /**
   * Run scheduled maintenance tasks
   */
  async runMaintenanceTasks(): Promise<void> {
    if (!this.config.enableMaintenanceActions) {
      return;
    }

    try {
      // Clean up old audit logs (keep 90 days)
      const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      await this.prisma.auditLog.deleteMany({
        where: { timestamp: { lt: cutoffDate } },
      });

      // Clean up expired sessions
      await this.prisma.session.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });

      // Clean up deleted users data (after 30 days)
      const deletionCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      await this.prisma.user.deleteMany({
        where: {
          status: 'deleted',
          deletedAt: { lt: deletionCutoff },
        },
      });

      console.log('[ADMIN] Maintenance tasks completed');
    } catch (error) {
      console.error('[ADMIN] Maintenance tasks failed:', error);
    }
  }
}