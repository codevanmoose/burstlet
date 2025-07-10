import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { Request } from 'express';
import {
  ApiKey,
  SecurityEvent,
  IpRule,
  AuditLog,
  CreateApiKeyRequest,
  UpdateApiKeyRequest,
  CreateIpRuleRequest,
  GetSecurityEventsRequest,
  GetAuditLogsRequest,
  ApiKeyResponse,
  SecurityEventsResponse,
  AuditLogsResponse,
  SecurityStatusResponse,
  IpAnalysisResponse,
  IpGeolocation,
  EncryptedData,
  SecurityError,
  ValidationError,
  SecurityEventType,
  SecuritySeverity,
  EncryptionConfig,
} from './types';

export class SecurityService {
  private encryptionConfig: EncryptionConfig;

  constructor(
    private prisma: PrismaClient,
    encryptionConfig: EncryptionConfig
  ) {
    this.encryptionConfig = encryptionConfig;
  }

  /**
   * Create API key
   */
  async createApiKey(
    userId: string,
    request: CreateApiKeyRequest
  ): Promise<ApiKeyResponse> {
    // Check user's API key limit
    const existingKeys = await this.prisma.apiKey.count({
      where: { userId, isActive: true },
    });

    if (existingKeys >= 10) { // Max 10 keys per user
      throw new SecurityError(
        'API key limit reached',
        'API_KEY_LIMIT_EXCEEDED',
        400
      );
    }

    // Generate secure API key
    const key = this.generateApiKey();
    const hashedKey = await bcrypt.hash(key, 10);

    // Calculate expiry
    const expiresAt = request.expiresIn
      ? new Date(Date.now() + request.expiresIn * 24 * 60 * 60 * 1000)
      : undefined;

    // Create API key
    const apiKey = await this.prisma.apiKey.create({
      data: {
        userId,
        name: request.name,
        key: key.substring(0, 8) + '...' + key.substring(key.length - 4), // Store partial for display
        hashedKey,
        permissions: request.permissions,
        rateLimit: request.rateLimit,
        expiresAt,
        isActive: true,
      },
    });

    // Log creation
    await this.createAuditLog({
      userId,
      action: 'API_KEY_CREATED',
      resource: 'api_key',
      resourceId: apiKey.id,
      ipAddress: 'system',
      metadata: { name: request.name },
    });

    return {
      apiKey: {
        ...apiKey,
        key, // Return full key only on creation
      },
    };
  }

  /**
   * Validate API key
   */
  async validateApiKey(key: string): Promise<ApiKey | null> {
    // Get all active API keys (this could be optimized with caching)
    const apiKeys = await this.prisma.apiKey.findMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } },
        ],
      },
    });

    // Find matching key
    for (const apiKey of apiKeys) {
      const isValid = await bcrypt.compare(key, apiKey.hashedKey);
      if (isValid) {
        // Update last used
        await this.prisma.apiKey.update({
          where: { id: apiKey.id },
          data: { lastUsedAt: new Date() },
        });

        return apiKey;
      }
    }

    // Log failed attempt
    await this.createSecurityEvent({
      type: 'INVALID_API_KEY',
      severity: 'MEDIUM',
      ipAddress: 'unknown',
      details: { keyPrefix: key.substring(0, 8) },
    });

    return null;
  }

  /**
   * Update API key
   */
  async updateApiKey(
    userId: string,
    keyId: string,
    request: UpdateApiKeyRequest
  ): Promise<ApiKeyResponse> {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: { id: keyId, userId },
    });

    if (!apiKey) {
      throw new SecurityError('API key not found', 'API_KEY_NOT_FOUND', 404);
    }

    const updated = await this.prisma.apiKey.update({
      where: { id: keyId },
      data: {
        name: request.name,
        permissions: request.permissions,
        isActive: request.isActive,
      },
    });

    // Log update
    await this.createAuditLog({
      userId,
      action: 'API_KEY_UPDATED',
      resource: 'api_key',
      resourceId: keyId,
      ipAddress: 'system',
      before: apiKey,
      after: updated,
    });

    return { apiKey: updated };
  }

  /**
   * Revoke API key
   */
  async revokeApiKey(userId: string, keyId: string): Promise<void> {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: { id: keyId, userId },
    });

    if (!apiKey) {
      throw new SecurityError('API key not found', 'API_KEY_NOT_FOUND', 404);
    }

    await this.prisma.apiKey.update({
      where: { id: keyId },
      data: { isActive: false },
    });

    // Log revocation
    await this.createAuditLog({
      userId,
      action: 'API_KEY_REVOKED',
      resource: 'api_key',
      resourceId: keyId,
      ipAddress: 'system',
    });
  }

  /**
   * List API keys
   */
  async listApiKeys(userId: string): Promise<ApiKey[]> {
    return this.prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create IP rule
   */
  async createIpRule(
    request: CreateIpRuleRequest & { createdBy: string }
  ): Promise<IpRule> {
    // Check if rule already exists
    const existing = await this.prisma.ipRule.findFirst({
      where: { ipAddress: request.ipAddress },
    });

    if (existing) {
      throw new SecurityError('IP rule already exists', 'IP_RULE_EXISTS', 400);
    }

    // Calculate expiry
    const expiresAt = request.expiresIn
      ? new Date(Date.now() + request.expiresIn * 60 * 60 * 1000)
      : undefined;

    const rule = await this.prisma.ipRule.create({
      data: {
        ipAddress: request.ipAddress,
        type: request.type,
        reason: request.reason,
        expiresAt,
        createdBy: request.createdBy,
      },
    });

    // Log creation
    await this.createAuditLog({
      userId: request.createdBy,
      action: `IP_${request.type}_RULE_CREATED`,
      resource: 'ip_rule',
      resourceId: rule.id,
      ipAddress: 'system',
      metadata: { ipAddress: request.ipAddress, reason: request.reason },
    });

    return rule;
  }

  /**
   * Check IP rules
   */
  async checkIpRules(ipAddress: string): Promise<'ALLOW' | 'BLOCK' | 'NONE'> {
    const rule = await this.prisma.ipRule.findFirst({
      where: {
        ipAddress,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } },
        ],
      },
    });

    return rule ? rule.type : 'NONE';
  }

  /**
   * Analyze IP address
   */
  async analyzeIp(ipAddress: string): Promise<IpAnalysisResponse> {
    // Get geolocation (mock implementation - would use real service)
    const geolocation = await this.getIpGeolocation(ipAddress);

    // Get request history
    const [totalRequests, blockedEvents] = await Promise.all([
      this.prisma.auditLog.count({
        where: { ipAddress },
      }),
      this.prisma.securityEvent.count({
        where: {
          ipAddress,
          type: { in: ['RATE_LIMIT_EXCEEDED', 'BLOCKED_IP', 'SUSPICIOUS_ACTIVITY'] },
        },
      }),
    ]);

    // Calculate reputation score
    const reputationScore = this.calculateReputationScore({
      geolocation,
      totalRequests,
      blockedEvents,
    });

    // Get last activity
    const lastActivity = await this.prisma.auditLog.findFirst({
      where: { ipAddress },
      orderBy: { createdAt: 'desc' },
    });

    // Determine recommendation
    let recommendation: 'ALLOW' | 'BLOCK' | 'MONITOR' = 'ALLOW';
    if (reputationScore < 30) {
      recommendation = 'BLOCK';
    } else if (reputationScore < 70) {
      recommendation = 'MONITOR';
    }

    return {
      ipAddress,
      geolocation,
      reputation: {
        score: reputationScore,
        threats: this.identifyThreats(geolocation, blockedEvents),
        blacklisted: reputationScore < 30,
      },
      history: {
        requests: totalRequests,
        blockedAttempts: blockedEvents,
        lastSeen: lastActivity?.createdAt || new Date(),
      },
      recommendation,
    };
  }

  /**
   * Create security event
   */
  async createSecurityEvent(
    data: Omit<SecurityEvent, 'id' | 'resolved' | 'createdAt'>
  ): Promise<SecurityEvent> {
    const event = await this.prisma.securityEvent.create({
      data: {
        ...data,
        resolved: false,
      },
    });

    // Check if we need to trigger alerts
    await this.checkSecurityAlerts(event);

    return event;
  }

  /**
   * Get security events
   */
  async getSecurityEvents(
    request: GetSecurityEventsRequest
  ): Promise<SecurityEventsResponse> {
    const where: any = {};

    if (request.type) where.type = request.type;
    if (request.severity) where.severity = request.severity;
    if (request.userId) where.userId = request.userId;
    if (request.resolved !== undefined) where.resolved = request.resolved;
    
    if (request.startDate || request.endDate) {
      where.createdAt = {};
      if (request.startDate) where.createdAt.gte = new Date(request.startDate);
      if (request.endDate) where.createdAt.lte = new Date(request.endDate);
    }

    const [events, total] = await Promise.all([
      this.prisma.securityEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: request.limit,
        skip: request.offset,
      }),
      this.prisma.securityEvent.count({ where }),
    ]);

    // Get summary
    const [byType, bySeverity, unresolved] = await Promise.all([
      this.prisma.securityEvent.groupBy({
        by: ['type'],
        _count: true,
        where: { resolved: false },
      }),
      this.prisma.securityEvent.groupBy({
        by: ['severity'],
        _count: true,
        where: { resolved: false },
      }),
      this.prisma.securityEvent.count({
        where: { resolved: false },
      }),
    ]);

    const summary = {
      byType: byType.reduce((acc, item) => ({
        ...acc,
        [item.type]: item._count,
      }), {} as Record<SecurityEventType, number>),
      bySeverity: bySeverity.reduce((acc, item) => ({
        ...acc,
        [item.severity]: item._count,
      }), {} as Record<SecuritySeverity, number>),
      unresolved,
    };

    return {
      events,
      total,
      hasMore: total > request.offset + request.limit,
      summary,
    };
  }

  /**
   * Resolve security event
   */
  async resolveSecurityEvent(eventId: string): Promise<void> {
    await this.prisma.securityEvent.update({
      where: { id: eventId },
      data: {
        resolved: true,
        resolvedAt: new Date(),
      },
    });
  }

  /**
   * Create audit log
   */
  async createAuditLog(
    data: Omit<AuditLog, 'id' | 'createdAt'>
  ): Promise<AuditLog> {
    return this.prisma.auditLog.create({ data });
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(
    request: GetAuditLogsRequest
  ): Promise<AuditLogsResponse> {
    const where: any = {};

    if (request.userId) where.userId = request.userId;
    if (request.action) where.action = request.action;
    if (request.resource) where.resource = request.resource;
    
    if (request.startDate || request.endDate) {
      where.createdAt = {};
      if (request.startDate) where.createdAt.gte = new Date(request.startDate);
      if (request.endDate) where.createdAt.lte = new Date(request.endDate);
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: request.limit,
        skip: request.offset,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      hasMore: total > request.offset + request.limit,
    };
  }

  /**
   * Get security status
   */
  async getSecurityStatus(): Promise<SecurityStatusResponse> {
    const [
      activeThreats,
      resolvedThreats,
      criticalThreats,
      activeBlocks,
      totalApiKeys,
      activeApiKeys,
      allowedIps,
      blockedIps,
      recentEvents,
    ] = await Promise.all([
      this.prisma.securityEvent.count({
        where: { resolved: false },
      }),
      this.prisma.securityEvent.count({
        where: { resolved: true },
      }),
      this.prisma.securityEvent.count({
        where: { resolved: false, severity: 'CRITICAL' },
      }),
      this.prisma.rateLimitRecord.count({
        where: { blocked: true, windowEnd: { gte: new Date() } },
      }),
      this.prisma.apiKey.count(),
      this.prisma.apiKey.count({ where: { isActive: true } }),
      this.prisma.ipRule.count({ where: { type: 'ALLOW' } }),
      this.prisma.ipRule.count({ where: { type: 'BLOCK' } }),
      this.prisma.securityEvent.findMany({
        where: { resolved: false },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    // Calculate expiring API keys
    const expiringApiKeys = await this.prisma.apiKey.count({
      where: {
        isActive: true,
        expiresAt: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      },
    });

    // Determine overall status
    let status: 'SECURE' | 'WARNING' | 'CRITICAL' = 'SECURE';
    if (criticalThreats > 0) {
      status = 'CRITICAL';
    } else if (activeThreats > 10 || activeBlocks > 50) {
      status = 'WARNING';
    }

    return {
      status,
      threats: {
        active: activeThreats,
        resolved: resolvedThreats,
        critical: criticalThreats,
      },
      rateLimits: {
        enabled: true,
        activeBlocks,
      },
      apiKeys: {
        total: totalApiKeys,
        active: activeApiKeys,
        expiringSoon: expiringApiKeys,
      },
      ipRules: {
        allowed: allowedIps,
        blocked: blockedIps,
      },
      recentEvents,
    };
  }

  /**
   * Encrypt data
   */
  encrypt(text: string): EncryptedData {
    const iv = crypto.randomBytes(this.encryptionConfig.ivLength);
    const cipher = crypto.createCipheriv(
      this.encryptionConfig.algorithm,
      Buffer.from(this.encryptionConfig.secret, 'hex'),
      iv
    );

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      data: encrypted,
      iv: iv.toString('hex'),
      authTag: (cipher as any).getAuthTag?.()?.toString('hex'),
    };
  }

  /**
   * Decrypt data
   */
  decrypt(encryptedData: EncryptedData): string {
    const decipher = crypto.createDecipheriv(
      this.encryptionConfig.algorithm,
      Buffer.from(this.encryptionConfig.secret, 'hex'),
      Buffer.from(encryptedData.iv, 'hex')
    );

    if (encryptedData.authTag) {
      (decipher as any).setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    }

    let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Validate request data
   */
  validateRequest(data: any, rules: Record<string, any>): void {
    // Simple validation implementation
    for (const [field, rule] of Object.entries(rules)) {
      const value = data[field];
      
      if (rule.required && !value) {
        throw new ValidationError(
          `${field} is required`,
          'MISSING_FIELD',
          field
        );
      }

      if (rule.type && value && typeof value !== rule.type) {
        throw new ValidationError(
          `${field} must be of type ${rule.type}`,
          'INVALID_TYPE',
          field
        );
      }

      if (rule.pattern && value && !rule.pattern.test(value)) {
        throw new ValidationError(
          `${field} format is invalid`,
          'INVALID_FORMAT',
          field
        );
      }
    }
  }

  /**
   * Sanitize input
   */
  sanitizeInput(input: string): string {
    // Remove potential XSS vectors
    let sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');

    // Escape HTML entities
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');

    return sanitized.trim();
  }

  // Private helper methods

  private generateApiKey(): string {
    return `bst_${crypto.randomBytes(32).toString('hex')}`;
  }

  private async getIpGeolocation(ipAddress: string): Promise<IpGeolocation> {
    // Mock implementation - would use real geolocation service
    return {
      ip: ipAddress,
      country: 'US',
      region: 'California',
      city: 'San Francisco',
      timezone: 'America/Los_Angeles',
      isp: 'Example ISP',
      isVpn: false,
      isTor: false,
      isProxy: false,
      riskScore: 10,
    };
  }

  private calculateReputationScore(data: {
    geolocation: IpGeolocation;
    totalRequests: number;
    blockedEvents: number;
  }): number {
    let score = 100;

    // Deduct for suspicious characteristics
    if (data.geolocation.isVpn) score -= 20;
    if (data.geolocation.isTor) score -= 30;
    if (data.geolocation.isProxy) score -= 15;

    // Deduct for blocked events
    const blockRatio = data.totalRequests > 0
      ? data.blockedEvents / data.totalRequests
      : 0;
    score -= Math.min(blockRatio * 100, 50);

    // Apply geolocation risk score
    score -= data.geolocation.riskScore || 0;

    return Math.max(0, Math.min(100, score));
  }

  private identifyThreats(
    geolocation: IpGeolocation,
    blockedEvents: number
  ): string[] {
    const threats: string[] = [];

    if (geolocation.isVpn) threats.push('VPN_DETECTED');
    if (geolocation.isTor) threats.push('TOR_DETECTED');
    if (geolocation.isProxy) threats.push('PROXY_DETECTED');
    if (blockedEvents > 10) threats.push('HIGH_BLOCK_RATE');
    if (geolocation.riskScore && geolocation.riskScore > 70) {
      threats.push('HIGH_RISK_LOCATION');
    }

    return threats;
  }

  private async checkSecurityAlerts(event: SecurityEvent): Promise<void> {
    // Check if we need to send alerts based on thresholds
    if (event.severity === 'CRITICAL') {
      // Send immediate alert (implementation would send actual notifications)
      console.log(`[SECURITY] Critical security event: ${event.type}`);
    }

    // Check threshold alerts
    const recentEvents = await this.prisma.securityEvent.count({
      where: {
        type: event.type,
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        },
      },
    });

    if (recentEvents > 100) {
      console.log(`[SECURITY] High frequency of ${event.type} events: ${recentEvents} in last hour`);
    }
  }
}