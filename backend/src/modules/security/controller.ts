import { Request, Response } from 'express';
import { SecurityService } from './service';
import {
  CreateApiKeySchema,
  UpdateApiKeySchema,
  CreateIpRuleSchema,
  GetSecurityEventsSchema,
  GetAuditLogsSchema,
  SecurityError,
} from './types';

export class SecurityController {
  constructor(private securityService: SecurityService) {}

  /**
   * Create API key
   * POST /security/api-keys
   */
  async createApiKey(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = CreateApiKeySchema.parse(req.body);
      const userId = req.user!.id;

      const result = await this.securityService.createApiKey(userId, validatedData);

      res.status(201).json({
        success: true,
        data: result,
        warning: 'Please save this API key securely. It will not be shown again.',
      });
    } catch (error) {
      if (error instanceof SecurityError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
      } else {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error instanceof Error ? error.message : 'Invalid request',
          },
        });
      }
    }
  }

  /**
   * List API keys
   * GET /security/api-keys
   */
  async listApiKeys(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const apiKeys = await this.securityService.listApiKeys(userId);

      res.json({
        success: true,
        data: {
          apiKeys: apiKeys.map(key => ({
            ...key,
            hashedKey: undefined, // Never expose hashed keys
          })),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to list API keys',
        },
      });
    }
  }

  /**
   * Update API key
   * PUT /security/api-keys/:id
   */
  async updateApiKey(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validatedData = UpdateApiKeySchema.parse(req.body);
      const userId = req.user!.id;

      const result = await this.securityService.updateApiKey(userId, id, validatedData);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof SecurityError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
      } else {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error instanceof Error ? error.message : 'Invalid request',
          },
        });
      }
    }
  }

  /**
   * Revoke API key
   * DELETE /security/api-keys/:id
   */
  async revokeApiKey(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      await this.securityService.revokeApiKey(userId, id);

      res.json({
        success: true,
        message: 'API key revoked successfully',
      });
    } catch (error) {
      if (error instanceof SecurityError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Failed to revoke API key',
          },
        });
      }
    }
  }

  /**
   * Create IP rule (admin only)
   * POST /security/ip-rules
   */
  async createIpRule(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = CreateIpRuleSchema.parse(req.body);
      const createdBy = req.user!.id;

      const rule = await this.securityService.createIpRule({
        ...validatedData,
        createdBy,
      });

      res.status(201).json({
        success: true,
        data: { rule },
      });
    } catch (error) {
      if (error instanceof SecurityError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
      } else {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error instanceof Error ? error.message : 'Invalid request',
          },
        });
      }
    }
  }

  /**
   * List IP rules (admin only)
   * GET /security/ip-rules
   */
  async listIpRules(req: Request, res: Response): Promise<void> {
    try {
      const rules = await this.securityService.listIpRules();

      res.json({
        success: true,
        data: { rules },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to list IP rules',
        },
      });
    }
  }

  /**
   * Delete IP rule (admin only)
   * DELETE /security/ip-rules/:id
   */
  async deleteIpRule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await this.securityService.deleteIpRule(id);

      res.json({
        success: true,
        message: 'IP rule deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete IP rule',
        },
      });
    }
  }

  /**
   * Analyze IP address
   * GET /security/analyze-ip
   */
  async analyzeIp(req: Request, res: Response): Promise<void> {
    try {
      const { ip } = req.query;

      if (!ip || typeof ip !== 'string') {
        throw new Error('IP address is required');
      }

      const analysis = await this.securityService.analyzeIp(ip);

      res.json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: error instanceof Error ? error.message : 'Invalid request',
        },
      });
    }
  }

  /**
   * Get security events
   * GET /security/events
   */
  async getSecurityEvents(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = GetSecurityEventsSchema.parse(req.query);

      const events = await this.securityService.getSecurityEvents(validatedData);

      res.json({
        success: true,
        data: events,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error instanceof Error ? error.message : 'Invalid request',
        },
      });
    }
  }

  /**
   * Resolve security event
   * PUT /security/events/:id/resolve
   */
  async resolveSecurityEvent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await this.securityService.resolveSecurityEvent(id);

      res.json({
        success: true,
        message: 'Security event resolved',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to resolve event',
        },
      });
    }
  }

  /**
   * Get audit logs
   * GET /security/audit-logs
   */
  async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = GetAuditLogsSchema.parse(req.query);

      const logs = await this.securityService.getAuditLogs(validatedData);

      res.json({
        success: true,
        data: logs,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error instanceof Error ? error.message : 'Invalid request',
        },
      });
    }
  }

  /**
   * Get security status
   * GET /security/status
   */
  async getSecurityStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = await this.securityService.getSecurityStatus();

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get security status',
        },
      });
    }
  }

  /**
   * Test encryption
   * POST /security/test/encrypt
   */
  async testEncryption(req: Request, res: Response): Promise<void> {
    try {
      const { text } = req.body;

      if (!text) {
        throw new Error('Text is required');
      }

      const encrypted = this.securityService.encrypt(text);
      const decrypted = this.securityService.decrypt(encrypted);

      res.json({
        success: true,
        data: {
          original: text,
          encrypted,
          decrypted,
          match: text === decrypted,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'ENCRYPTION_ERROR',
          message: error instanceof Error ? error.message : 'Encryption test failed',
        },
      });
    }
  }

  /**
   * Health check
   * GET /security/health
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      // Verify security services are operational
      const status = await this.securityService.getSecurityStatus();

      res.json({
        success: true,
        data: {
          status: 'healthy',
          securityStatus: status.status,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        error: {
          code: 'UNHEALTHY',
          message: 'Security service is unhealthy',
        },
      });
    }
  }
}

// Add missing methods to SecurityService
declare module './service' {
  interface SecurityService {
    listIpRules(): Promise<any[]>;
    deleteIpRule(id: string): Promise<void>;
  }
}

// Implementation of missing methods (would be in service.ts)
SecurityService.prototype.listIpRules = async function() {
  return this.prisma.ipRule.findMany({
    orderBy: { createdAt: 'desc' },
  });
};

SecurityService.prototype.deleteIpRule = async function(id: string) {
  await this.prisma.ipRule.delete({
    where: { id },
  });
};