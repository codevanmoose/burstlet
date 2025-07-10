import { z } from 'zod';
import { Request } from 'express';

// Rate Limiting
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

export interface RateLimitRule {
  id: string;
  name: string;
  path: string | RegExp;
  method?: string | string[];
  config: RateLimitConfig;
  tier?: 'FREE' | 'PRO' | 'BUSINESS' | 'ENTERPRISE';
}

export interface RateLimitRecord {
  id: string;
  key: string;
  endpoint: string;
  count: number;
  windowStart: Date;
  windowEnd: Date;
  blocked: boolean;
}

// API Keys
export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  key: string;
  hashedKey: string;
  permissions: ApiKeyPermission[];
  rateLimit?: number;
  expiresAt?: Date;
  lastUsedAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKeyPermission {
  resource: string;
  actions: string[];
}

// Security Events
export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  userId?: string;
  ipAddress: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  details: any;
  resolved: boolean;
  resolvedAt?: Date;
  createdAt: Date;
}

export type SecurityEventType = 
  | 'RATE_LIMIT_EXCEEDED'
  | 'INVALID_API_KEY'
  | 'SUSPICIOUS_ACTIVITY'
  | 'BRUTE_FORCE_ATTEMPT'
  | 'SQL_INJECTION_ATTEMPT'
  | 'XSS_ATTEMPT'
  | 'CSRF_ATTEMPT'
  | 'UNAUTHORIZED_ACCESS'
  | 'BLOCKED_IP'
  | 'UNUSUAL_TRAFFIC'
  | 'API_KEY_EXPIRED'
  | 'AUTHENTICATION_FAILED';

export type SecuritySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// IP Management
export interface IpRule {
  id: string;
  ipAddress: string;
  type: 'ALLOW' | 'BLOCK';
  reason?: string;
  expiresAt?: Date;
  createdBy: string;
  createdAt: Date;
}

export interface IpGeolocation {
  ip: string;
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
  isp?: string;
  isVpn?: boolean;
  isTor?: boolean;
  isProxy?: boolean;
  riskScore?: number;
}

// Encryption
export interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  ivLength: number;
  saltRounds: number;
  secret: string;
}

export interface EncryptedData {
  data: string;
  iv: string;
  authTag?: string;
}

// CORS Configuration
export interface CorsConfig {
  origin: string | string[] | boolean | ((origin: string, callback: (err: Error | null, allow?: boolean) => void) => void);
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}

// Security Headers
export interface SecurityHeadersConfig {
  contentSecurityPolicy?: {
    directives: Record<string, string[]>;
  };
  crossOriginEmbedderPolicy?: boolean;
  crossOriginOpenerPolicy?: { policy: string };
  crossOriginResourcePolicy?: { policy: string };
  originAgentCluster?: boolean;
  referrerPolicy?: { policy: string | string[] };
  strictTransportSecurity?: {
    maxAge: number;
    includeSubDomains?: boolean;
    preload?: boolean;
  };
  xContentTypeOptions?: boolean;
  xDnsPrefetchControl?: { allow: boolean };
  xDownloadOptions?: boolean;
  xFrameOptions?: { action: string };
  xPermittedCrossDomainPolicies?: { permittedPolicies: string };
  xPoweredBy?: boolean;
  xXssProtection?: boolean;
}

// Request Validation
export interface ValidationRule {
  field: string;
  rules: string[];
  sanitize?: boolean;
}

export interface SanitizationOptions {
  stripHtml: boolean;
  escapeHtml: boolean;
  trimWhitespace: boolean;
  normalizeEmail: boolean;
  removeScripts: boolean;
}

// Audit Log
export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress: string;
  userAgent?: string;
  before?: any;
  after?: any;
  metadata?: any;
  createdAt: Date;
}

// Request/Response Schemas
export const CreateApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z.array(z.object({
    resource: z.string(),
    actions: z.array(z.string()),
  })),
  expiresIn: z.number().optional(), // days
  rateLimit: z.number().optional(),
});

export const UpdateApiKeySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  permissions: z.array(z.object({
    resource: z.string(),
    actions: z.array(z.string()),
  })).optional(),
  isActive: z.boolean().optional(),
});

export const CreateIpRuleSchema = z.object({
  ipAddress: z.string().ip(),
  type: z.enum(['ALLOW', 'BLOCK']),
  reason: z.string().optional(),
  expiresIn: z.number().optional(), // hours
});

export const GetSecurityEventsSchema = z.object({
  type: z.string().optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  userId: z.string().optional(),
  resolved: z.boolean().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
});

export const GetAuditLogsSchema = z.object({
  userId: z.string().optional(),
  action: z.string().optional(),
  resource: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
});

// API Response Types
export interface ApiKeyResponse {
  apiKey: Omit<ApiKey, 'hashedKey'> & { key?: string };
}

export interface SecurityEventsResponse {
  events: SecurityEvent[];
  total: number;
  hasMore: boolean;
  summary: {
    byType: Record<SecurityEventType, number>;
    bySeverity: Record<SecuritySeverity, number>;
    unresolved: number;
  };
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
  hasMore: boolean;
}

export interface SecurityStatusResponse {
  status: 'SECURE' | 'WARNING' | 'CRITICAL';
  threats: {
    active: number;
    resolved: number;
    critical: number;
  };
  rateLimits: {
    enabled: boolean;
    activeBlocks: number;
  };
  apiKeys: {
    total: number;
    active: number;
    expiringSoon: number;
  };
  ipRules: {
    allowed: number;
    blocked: number;
  };
  recentEvents: SecurityEvent[];
}

export interface IpAnalysisResponse {
  ipAddress: string;
  geolocation: IpGeolocation;
  reputation: {
    score: number;
    threats: string[];
    blacklisted: boolean;
  };
  history: {
    requests: number;
    blockedAttempts: number;
    lastSeen: Date;
  };
  recommendation: 'ALLOW' | 'BLOCK' | 'MONITOR';
}

// Error Types
export class SecurityError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 403
  ) {
    super(message);
    this.name = 'SecurityError';
  }
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryAfter: number,
    public statusCode: number = 429
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public code: string,
    public field?: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Security Configuration
export interface SecurityConfig {
  rateLimiting: {
    enabled: boolean;
    redis?: {
      host: string;
      port: number;
      password?: string;
    };
    defaultRules: RateLimitRule[];
  };
  encryption: EncryptionConfig;
  cors: CorsConfig;
  headers: SecurityHeadersConfig;
  apiKeys: {
    enabled: boolean;
    maxPerUser: number;
    defaultExpiry: number; // days
    minLength: number;
  };
  ipFiltering: {
    enabled: boolean;
    geoBlocking?: {
      enabled: boolean;
      blockedCountries: string[];
    };
    vpnBlocking?: boolean;
    torBlocking?: boolean;
  };
  validation: {
    maxRequestSize: string;
    maxUrlLength: number;
    maxHeaderSize: number;
  };
  monitoring: {
    enabled: boolean;
    alertThresholds: {
      rateLimitViolations: number;
      failedAuthentications: number;
      suspiciousActivities: number;
    };
    retentionDays: number;
  };
}

// Middleware Context
export interface SecurityContext {
  user?: any;
  apiKey?: ApiKey;
  ipInfo?: IpGeolocation;
  rateLimit?: {
    limit: number;
    remaining: number;
    reset: Date;
  };
  requestId: string;
  startTime: number;
}

// Type exports
export type CreateApiKeyRequest = z.infer<typeof CreateApiKeySchema>;
export type UpdateApiKeyRequest = z.infer<typeof UpdateApiKeySchema>;
export type CreateIpRuleRequest = z.infer<typeof CreateIpRuleSchema>;
export type GetSecurityEventsRequest = z.infer<typeof GetSecurityEventsSchema>;
export type GetAuditLogsRequest = z.infer<typeof GetAuditLogsSchema>;