import { Express, Application } from 'express';
import { PrismaClient } from '@prisma/client';
import { SecurityService } from './service';
import { SecurityController } from './controller';
import { SecurityMiddleware } from './middleware';
import { createSecurityRoutes } from './routes';
import { AuthMiddleware } from '../auth/middleware';
import {
  SecurityConfig,
  RateLimitRule,
  EncryptionConfig,
} from './types';

export interface SecurityModuleConfig extends SecurityConfig {
  prefix?: string;
}

export class SecurityModule {
  private prisma: PrismaClient;
  private service: SecurityService;
  private controller: SecurityController;
  private middleware: SecurityMiddleware;
  private config: SecurityModuleConfig;
  private cleanupTimer?: NodeJS.Timer;
  private monitoringTimer?: NodeJS.Timer;

  constructor(
    prisma: PrismaClient,
    config: Partial<SecurityModuleConfig> = {}
  ) {
    this.prisma = prisma;
    
    // Default configuration
    this.config = {
      prefix: '/api/v1/security',
      rateLimiting: {
        enabled: true,
        defaultRules: this.getDefaultRateLimitRules(),
        ...config.rateLimiting,
      },
      encryption: {
        algorithm: 'aes-256-gcm',
        keyLength: 32,
        ivLength: 16,
        saltRounds: 10,
        secret: process.env.ENCRYPTION_SECRET || this.generateEncryptionSecret(),
        ...config.encryption,
      },
      cors: {
        origin: process.env.NODE_ENV === 'production'
          ? ['https://app.burstlet.com', 'https://www.burstlet.com']
          : true,
        credentials: true,
        ...config.cors,
      },
      headers: {
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
          },
        },
        ...config.headers,
      },
      apiKeys: {
        enabled: true,
        maxPerUser: 10,
        defaultExpiry: 365,
        minLength: 32,
        ...config.apiKeys,
      },
      ipFiltering: {
        enabled: true,
        vpnBlocking: false,
        torBlocking: false,
        ...config.ipFiltering,
      },
      validation: {
        maxRequestSize: '10mb',
        maxUrlLength: 2048,
        maxHeaderSize: 8192,
        ...config.validation,
      },
      monitoring: {
        enabled: true,
        alertThresholds: {
          rateLimitViolations: 100,
          failedAuthentications: 50,
          suspiciousActivities: 20,
        },
        retentionDays: 90,
        ...config.monitoring,
      },
      ...config,
    };

    // Validate encryption secret
    if (this.config.encryption.secret.length < 32) {
      throw new Error('Encryption secret must be at least 32 characters');
    }

    // Initialize services
    this.service = new SecurityService(prisma, this.config.encryption);
    this.controller = new SecurityController(this.service);
    this.middleware = new SecurityMiddleware(prisma, this.service);
  }

  /**
   * Initialize the security module
   */
  async init(app: Express): Promise<void> {
    // Apply global security middleware
    this.applyGlobalMiddleware(app);

    // Create auth middleware for routes
    const authMiddleware = new AuthMiddleware(this.prisma);

    // Create and mount routes
    const routes = createSecurityRoutes(this.controller, authMiddleware);
    app.use(this.config.prefix!, routes);

    // Start background tasks
    this.startCleanupTasks();
    
    if (this.config.monitoring.enabled) {
      this.startMonitoring();
    }

    console.log(`[SECURITY] Module initialized`);
    console.log(`[SECURITY] Features: RateLimiting=${this.config.rateLimiting.enabled}, IPFiltering=${this.config.ipFiltering.enabled}, Monitoring=${this.config.monitoring.enabled}`);
  }

  /**
   * Apply global security middleware
   */
  private applyGlobalMiddleware(app: Application): void {
    // Security context (should be first)
    app.use(this.middleware.securityContext());

    // Security headers
    app.use(this.middleware.securityHeaders(this.config.headers));

    // CORS
    app.use(this.middleware.corsHandler(this.config.cors));

    // IP filtering
    if (this.config.ipFiltering.enabled) {
      app.use(this.middleware.ipFilter());
    }

    // Rate limiting
    if (this.config.rateLimiting.enabled) {
      app.use(this.middleware.applyRateLimiting(this.config.rateLimiting.defaultRules));
    }

    // Audit logging
    if (this.config.monitoring.enabled) {
      app.use(this.middleware.auditLog());
    }

    // Body parsing with size limits
    app.use(Express.json({ limit: this.config.validation.maxRequestSize }));
    app.use(Express.urlencoded({ 
      extended: true, 
      limit: this.config.validation.maxRequestSize 
    }));
  }

  /**
   * Get default rate limit rules
   */
  private getDefaultRateLimitRules(): RateLimitRule[] {
    return [
      // Authentication endpoints
      {
        id: 'auth-strict',
        name: 'Authentication endpoints',
        path: /^\/api\/v1\/auth\/(login|register)/,
        method: 'POST',
        config: {
          windowMs: 15 * 60 * 1000, // 15 minutes
          max: 5, // 5 requests per window
          message: 'Too many authentication attempts',
        },
      },
      // API endpoints by tier
      {
        id: 'api-free',
        name: 'API endpoints - Free tier',
        path: /^\/api\/v1/,
        tier: 'FREE',
        config: {
          windowMs: 60 * 1000, // 1 minute
          max: 30, // 30 requests per minute
        },
      },
      {
        id: 'api-pro',
        name: 'API endpoints - Pro tier',
        path: /^\/api\/v1/,
        tier: 'PRO',
        config: {
          windowMs: 60 * 1000,
          max: 100, // 100 requests per minute
        },
      },
      {
        id: 'api-business',
        name: 'API endpoints - Business tier',
        path: /^\/api\/v1/,
        tier: 'BUSINESS',
        config: {
          windowMs: 60 * 1000,
          max: 300, // 300 requests per minute
        },
      },
      {
        id: 'api-enterprise',
        name: 'API endpoints - Enterprise tier',
        path: /^\/api\/v1/,
        tier: 'ENTERPRISE',
        config: {
          windowMs: 60 * 1000,
          max: 1000, // 1000 requests per minute
        },
      },
      // AI generation endpoints
      {
        id: 'ai-generation',
        name: 'AI generation endpoints',
        path: /^\/api\/v1\/ai-generation\/generate/,
        method: 'POST',
        config: {
          windowMs: 60 * 60 * 1000, // 1 hour
          max: 10, // 10 generations per hour (enforced by quota)
        },
      },
      // File upload endpoints
      {
        id: 'file-upload',
        name: 'File upload endpoints',
        path: /upload/,
        method: 'POST',
        config: {
          windowMs: 5 * 60 * 1000, // 5 minutes
          max: 10, // 10 uploads per 5 minutes
        },
      },
    ];
  }

  /**
   * Start cleanup tasks
   */
  private startCleanupTasks(): void {
    // Clean up expired data daily
    this.cleanupTimer = setInterval(async () => {
      try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.config.monitoring.retentionDays);

        // Clean up old security events
        const deletedEvents = await this.prisma.securityEvent.deleteMany({
          where: {
            createdAt: { lt: cutoffDate },
            resolved: true,
          },
        });

        // Clean up old audit logs
        const deletedLogs = await this.prisma.auditLog.deleteMany({
          where: {
            createdAt: { lt: cutoffDate },
          },
        });

        // Clean up expired IP rules
        const deletedRules = await this.prisma.ipRule.deleteMany({
          where: {
            expiresAt: { lt: new Date() },
          },
        });

        // Clean up expired API keys
        const expiredKeys = await this.prisma.apiKey.updateMany({
          where: {
            expiresAt: { lt: new Date() },
            isActive: true,
          },
          data: { isActive: false },
        });

        console.log(`[SECURITY] Cleanup completed: ${deletedEvents.count} events, ${deletedLogs.count} logs, ${deletedRules.count} IP rules, ${expiredKeys.count} API keys`);
      } catch (error) {
        console.error('[SECURITY] Cleanup error:', error);
      }
    }, 24 * 60 * 60 * 1000); // Daily
  }

  /**
   * Start security monitoring
   */
  private startMonitoring(): void {
    this.monitoringTimer = setInterval(async () => {
      try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        // Check rate limit violations
        const rateLimitViolations = await this.prisma.securityEvent.count({
          where: {
            type: 'RATE_LIMIT_EXCEEDED',
            createdAt: { gte: oneHourAgo },
          },
        });

        if (rateLimitViolations > this.config.monitoring.alertThresholds.rateLimitViolations) {
          console.log(`[SECURITY] High rate limit violations: ${rateLimitViolations} in last hour`);
        }

        // Check failed authentications
        const failedAuths = await this.prisma.securityEvent.count({
          where: {
            type: 'AUTHENTICATION_FAILED',
            createdAt: { gte: oneHourAgo },
          },
        });

        if (failedAuths > this.config.monitoring.alertThresholds.failedAuthentications) {
          console.log(`[SECURITY] High failed authentication attempts: ${failedAuths} in last hour`);
        }

        // Check suspicious activities
        const suspiciousActivities = await this.prisma.securityEvent.count({
          where: {
            severity: { in: ['HIGH', 'CRITICAL'] },
            createdAt: { gte: oneHourAgo },
            resolved: false,
          },
        });

        if (suspiciousActivities > this.config.monitoring.alertThresholds.suspiciousActivities) {
          console.log(`[SECURITY] High suspicious activities: ${suspiciousActivities} unresolved`);
        }
      } catch (error) {
        console.error('[SECURITY] Monitoring error:', error);
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Generate encryption secret
   */
  private generateEncryptionSecret(): string {
    console.warn('[SECURITY] No encryption secret provided, generating random secret');
    console.warn('[SECURITY] Set ENCRYPTION_SECRET environment variable in production');
    
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Get security middleware for external use
   */
  getMiddleware(): SecurityMiddleware {
    return this.middleware;
  }

  /**
   * Get security service for external use
   */
  getService(): SecurityService {
    return this.service;
  }

  /**
   * Shutdown module
   */
  async shutdown(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
    }

    console.log('[SECURITY] Module shut down');
  }

  /**
   * Get module statistics
   */
  async getStats(): Promise<{
    totalApiKeys: number;
    activeApiKeys: number;
    totalIpRules: number;
    blockedIps: number;
    securityEvents: number;
    unresolvedEvents: number;
    auditLogSize: number;
  }> {
    const [
      totalApiKeys,
      activeApiKeys,
      totalIpRules,
      blockedIps,
      securityEvents,
      unresolvedEvents,
      auditLogSize,
    ] = await Promise.all([
      this.prisma.apiKey.count(),
      this.prisma.apiKey.count({ where: { isActive: true } }),
      this.prisma.ipRule.count(),
      this.prisma.ipRule.count({ where: { type: 'BLOCK' } }),
      this.prisma.securityEvent.count(),
      this.prisma.securityEvent.count({ where: { resolved: false } }),
      this.prisma.auditLog.count(),
    ]);

    return {
      totalApiKeys,
      activeApiKeys,
      totalIpRules,
      blockedIps,
      securityEvents,
      unresolvedEvents,
      auditLogSize,
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    database: boolean;
    encryption: boolean;
    monitoring: boolean;
    details: any;
  }> {
    try {
      // Check database
      await this.prisma.securityEvent.count();
      const databaseHealthy = true;

      // Check encryption
      let encryptionHealthy = false;
      try {
        const testData = 'test';
        const encrypted = this.service.encrypt(testData);
        const decrypted = this.service.decrypt(encrypted);
        encryptionHealthy = testData === decrypted;
      } catch (error) {
        encryptionHealthy = false;
      }

      // Check monitoring
      const monitoringHealthy = this.config.monitoring.enabled && !!this.monitoringTimer;

      const allHealthy = databaseHealthy && encryptionHealthy && monitoringHealthy;

      return {
        status: allHealthy ? 'healthy' : 'degraded',
        database: databaseHealthy,
        encryption: encryptionHealthy,
        monitoring: monitoringHealthy,
        details: {
          rateLimiting: this.config.rateLimiting.enabled,
          ipFiltering: this.config.ipFiltering.enabled,
          apiKeys: this.config.apiKeys.enabled,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        database: false,
        encryption: false,
        monitoring: false,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
}