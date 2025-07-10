import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { createAuthRoutes } from './routes';

export interface AuthModuleConfig {
  prefix?: string;
  enableRateLimit?: boolean;
  enableLogging?: boolean;
}

export class AuthModule {
  private prisma: PrismaClient;
  private config: AuthModuleConfig;

  constructor(prisma: PrismaClient, config: AuthModuleConfig = {}) {
    this.prisma = prisma;
    this.config = {
      prefix: '/api/v1/auth',
      enableRateLimit: true,
      enableLogging: true,
      ...config
    };
  }

  /**
   * Initialize the authentication module
   */
  init(app: Express): void {
    const authRoutes = createAuthRoutes(this.prisma);
    
    // Mount auth routes
    app.use(this.config.prefix!, authRoutes);

    // Setup periodic cleanup of expired sessions
    this.startSessionCleanup();

    console.log(`[AUTH] Module initialized at ${this.config.prefix}`);
  }

  /**
   * Start periodic cleanup of expired sessions
   */
  private startSessionCleanup(): void {
    // Clean up expired sessions every hour
    setInterval(async () => {
      try {
        const result = await this.prisma.session.deleteMany({
          where: {
            expiresAt: {
              lt: new Date()
            }
          }
        });
        
        if (result.count > 0) {
          console.log(`[AUTH] Cleaned up ${result.count} expired sessions`);
        }
      } catch (error) {
        console.error('[AUTH] Error cleaning up expired sessions:', error);
      }
    }, 60 * 60 * 1000); // 1 hour
  }

  /**
   * Health check for the auth module
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: {
      database: boolean;
      sessionCount: number;
      userCount: number;
    };
  }> {
    try {
      // Test database connection
      const [sessionCount, userCount] = await Promise.all([
        this.prisma.session.count(),
        this.prisma.user.count()
      ]);

      return {
        status: 'healthy',
        details: {
          database: true,
          sessionCount,
          userCount
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          database: false,
          sessionCount: 0,
          userCount: 0
        }
      };
    }
  }

  /**
   * Get module statistics
   */
  async getStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalSessions: number;
    activeSessions: number;
    oauthConnections: number;
    twoFactorEnabled: number;
  }> {
    const [
      totalUsers,
      activeUsers,
      totalSessions,
      activeSessions,
      oauthConnections,
      twoFactorEnabled
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: {
          lastLoginAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      }),
      this.prisma.session.count(),
      this.prisma.session.count({
        where: {
          expiresAt: {
            gte: new Date()
          }
        }
      }),
      this.prisma.oAuthProvider.count(),
      this.prisma.user.count({
        where: {
          twoFactorEnabled: true
        }
      })
    ]);

    return {
      totalUsers,
      activeUsers,
      totalSessions,
      activeSessions,
      oauthConnections,
      twoFactorEnabled
    };
  }
}