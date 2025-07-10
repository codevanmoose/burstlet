import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { SecurityService } from './service';
import {
  RateLimitConfig,
  RateLimitRule,
  SecurityContext,
  SecurityError,
  RateLimitError,
  CorsConfig,
  SecurityHeadersConfig,
} from './types';

export class SecurityMiddleware {
  private rateLimiters: Map<string, any> = new Map();

  constructor(
    private prisma: PrismaClient,
    private securityService: SecurityService
  ) {}

  /**
   * API Key authentication middleware
   */
  apiKeyAuth() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const apiKey = this.extractApiKey(req);
        
        if (!apiKey) {
          throw new SecurityError('API key required', 'API_KEY_MISSING', 401);
        }

        const validKey = await this.securityService.validateApiKey(apiKey);
        
        if (!validKey) {
          throw new SecurityError('Invalid API key', 'API_KEY_INVALID', 401);
        }

        // Check permissions
        const resource = this.getResourceFromPath(req.path);
        const action = this.getActionFromMethod(req.method);
        
        if (!this.hasPermission(validKey.permissions, resource, action)) {
          throw new SecurityError(
            'Insufficient permissions',
            'PERMISSION_DENIED',
            403
          );
        }

        // Add to request context
        (req as any).apiKey = validKey;
        (req as any).security = {
          ...((req as any).security || {}),
          apiKey: validKey,
        };

        next();
      } catch (error) {
        this.handleSecurityError(error, res);
      }
    };
  }

  /**
   * IP filtering middleware
   */
  ipFilter() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const ipAddress = this.getClientIp(req);
        const rule = await this.securityService.checkIpRules(ipAddress);

        if (rule === 'BLOCK') {
          await this.securityService.createSecurityEvent({
            type: 'BLOCKED_IP',
            severity: 'HIGH',
            ipAddress,
            userAgent: req.get('user-agent'),
            resource: req.path,
            action: req.method,
            details: { reason: 'IP blocked by rule' },
          });

          throw new SecurityError('Access denied', 'IP_BLOCKED', 403);
        }

        // Add IP info to context
        const ipInfo = await this.securityService.analyzeIp(ipAddress);
        (req as any).security = {
          ...((req as any).security || {}),
          ipInfo,
        };

        next();
      } catch (error) {
        this.handleSecurityError(error, res);
      }
    };
  }

  /**
   * Rate limiting middleware factory
   */
  createRateLimiter(rule: RateLimitRule) {
    const keyGenerator = rule.config.keyGenerator || ((req: Request) => {
      // Default: rate limit by user ID or IP
      return (req as any).user?.id || this.getClientIp(req);
    });

    const limiter = rateLimit({
      windowMs: rule.config.windowMs,
      max: rule.config.max,
      message: rule.config.message || 'Too many requests',
      standardHeaders: rule.config.standardHeaders !== false,
      legacyHeaders: rule.config.legacyHeaders !== false,
      skipSuccessfulRequests: rule.config.skipSuccessfulRequests || false,
      skipFailedRequests: rule.config.skipFailedRequests || false,
      keyGenerator,
      handler: async (req: Request, res: Response) => {
        const ipAddress = this.getClientIp(req);
        const userId = (req as any).user?.id;

        await this.securityService.createSecurityEvent({
          type: 'RATE_LIMIT_EXCEEDED',
          severity: 'MEDIUM',
          userId,
          ipAddress,
          userAgent: req.get('user-agent'),
          resource: req.path,
          action: req.method,
          details: {
            rule: rule.name,
            limit: rule.config.max,
            window: rule.config.windowMs,
          },
        });

        res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: rule.config.message || 'Too many requests',
            retryAfter: Math.ceil(rule.config.windowMs / 1000),
          },
        });
      },
    });

    return limiter;
  }

  /**
   * Apply rate limiting rules
   */
  applyRateLimiting(rules: RateLimitRule[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      // Find matching rule
      const rule = rules.find(r => {
        const pathMatch = typeof r.path === 'string'
          ? req.path.startsWith(r.path)
          : r.path.test(req.path);
        
        const methodMatch = !r.method || (
          Array.isArray(r.method)
            ? r.method.includes(req.method)
            : r.method === req.method
        );

        const tierMatch = !r.tier || (
          (req as any).user?.subscription?.tier === r.tier
        );

        return pathMatch && methodMatch && tierMatch;
      });

      if (!rule) {
        return next();
      }

      // Get or create rate limiter for this rule
      let limiter = this.rateLimiters.get(rule.id);
      if (!limiter) {
        limiter = this.createRateLimiter(rule);
        this.rateLimiters.set(rule.id, limiter);
      }

      limiter(req, res, next);
    };
  }

  /**
   * Security headers middleware
   */
  securityHeaders(config?: SecurityHeadersConfig) {
    return helmet({
      contentSecurityPolicy: config?.contentSecurityPolicy || {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'https://api.stripe.com'],
        },
      },
      crossOriginEmbedderPolicy: config?.crossOriginEmbedderPolicy !== false,
      crossOriginOpenerPolicy: config?.crossOriginOpenerPolicy || { policy: 'same-origin' },
      crossOriginResourcePolicy: config?.crossOriginResourcePolicy || { policy: 'cross-origin' },
      originAgentCluster: config?.originAgentCluster !== false,
      referrerPolicy: config?.referrerPolicy || { policy: 'no-referrer' },
      strictTransportSecurity: config?.strictTransportSecurity || {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      xContentTypeOptions: config?.xContentTypeOptions !== false,
      xDnsPrefetchControl: config?.xDnsPrefetchControl || { allow: false },
      xDownloadOptions: config?.xDownloadOptions !== false,
      xFrameOptions: config?.xFrameOptions || { action: 'deny' },
      xPermittedCrossDomainPolicies: config?.xPermittedCrossDomainPolicies || { permittedPolicies: 'none' },
      xPoweredBy: false,
      xXssProtection: config?.xXssProtection !== false,
    });
  }

  /**
   * CORS middleware
   */
  corsHandler(config?: CorsConfig) {
    const defaultConfig: CorsConfig = {
      origin: process.env.NODE_ENV === 'production'
        ? ['https://app.burstlet.com', 'https://www.burstlet.com']
        : true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
      exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
      credentials: true,
      maxAge: 86400, // 24 hours
    };

    return cors({ ...defaultConfig, ...config });
  }

  /**
   * Request validation middleware
   */
  validateRequest(schema: any) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = {
          ...req.body,
          ...req.query,
          ...req.params,
        };

        const validated = await schema.parseAsync(data);
        
        // Replace request data with validated data
        req.body = validated;

        next();
      } catch (error) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error,
          },
        });
      }
    };
  }

  /**
   * Audit logging middleware
   */
  auditLog() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const originalSend = res.send;
      let responseData: any;

      // Capture response
      res.send = function(data: any) {
        responseData = data;
        return originalSend.call(this, data);
      };

      res.on('finish', async () => {
        try {
          const duration = Date.now() - startTime;
          const userId = (req as any).user?.id || (req as any).apiKey?.userId;
          const ipAddress = this.getClientIp(req);

          // Skip certain endpoints
          if (this.shouldSkipAudit(req.path)) {
            return;
          }

          await this.securityService.createAuditLog({
            userId,
            action: `${req.method} ${req.path}`,
            resource: this.getResourceFromPath(req.path),
            ipAddress,
            userAgent: req.get('user-agent'),
            metadata: {
              method: req.method,
              path: req.path,
              statusCode: res.statusCode,
              duration,
              requestSize: req.get('content-length'),
              responseSize: res.get('content-length'),
            },
          });
        } catch (error) {
          console.error('[SECURITY] Audit log error:', error);
        }
      });

      next();
    };
  }

  /**
   * Security context middleware
   */
  securityContext() {
    return (req: Request, res: Response, next: NextFunction) => {
      const context: SecurityContext = {
        user: (req as any).user,
        apiKey: (req as any).apiKey,
        ipInfo: (req as any).security?.ipInfo,
        requestId: this.generateRequestId(),
        startTime: Date.now(),
      };

      (req as any).security = context;

      // Add security headers
      res.setHeader('X-Request-ID', context.requestId);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');

      next();
    };
  }

  // Helper methods

  private extractApiKey(req: Request): string | null {
    // Check header
    const headerKey = req.get('X-API-Key') || req.get('Authorization')?.replace('Bearer ', '');
    if (headerKey) return headerKey;

    // Check query parameter
    const queryKey = req.query.api_key as string;
    if (queryKey) return queryKey;

    return null;
  }

  private getClientIp(req: Request): string {
    const forwarded = req.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    return req.get('x-real-ip') || req.connection.remoteAddress || 'unknown';
  }

  private getResourceFromPath(path: string): string {
    const parts = path.split('/').filter(Boolean);
    return parts[2] || 'unknown'; // Assuming /api/v1/resource format
  }

  private getActionFromMethod(method: string): string {
    const methodMap: Record<string, string> = {
      GET: 'read',
      POST: 'create',
      PUT: 'update',
      PATCH: 'update',
      DELETE: 'delete',
    };
    
    return methodMap[method] || 'unknown';
  }

  private hasPermission(
    permissions: any[],
    resource: string,
    action: string
  ): boolean {
    return permissions.some(p =>
      p.resource === resource && p.actions.includes(action)
    );
  }

  private shouldSkipAudit(path: string): boolean {
    const skipPaths = ['/health', '/metrics', '/favicon.ico'];
    return skipPaths.some(p => path.startsWith(p));
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleSecurityError(error: any, res: Response): void {
    if (error instanceof SecurityError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    } else if (error instanceof RateLimitError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          retryAfter: error.retryAfter,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred',
        },
      });
    }
  }
}