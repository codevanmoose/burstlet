import { z } from 'zod';

// User Management Schemas
export const AdminUserListSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(20),
  search: z.string().optional(),
  role: z.enum(['user', 'admin', 'super_admin']).optional(),
  status: z.enum(['active', 'suspended', 'deleted']).optional(),
  sortBy: z.enum(['createdAt', 'lastActive', 'email', 'name']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const AdminUserUpdateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  role: z.enum(['user', 'admin']).optional(),
  status: z.enum(['active', 'suspended']).optional(),
  metadata: z.record(z.any()).optional(),
});

export const AdminUserActionSchema = z.object({
  action: z.enum(['suspend', 'activate', 'delete', 'reset_password', 'revoke_sessions']),
  reason: z.string().optional(),
  notifyUser: z.boolean().default(true),
});

// System Configuration Schemas
export const SystemConfigSchema = z.object({
  maintenance: z.object({
    enabled: z.boolean(),
    message: z.string().optional(),
    allowedIPs: z.array(z.string()).optional(),
  }).optional(),
  features: z.object({
    registration: z.boolean(),
    socialLogin: z.boolean(),
    aiGeneration: z.boolean(),
    billing: z.boolean(),
  }).optional(),
  limits: z.object({
    maxUsersPerWorkspace: z.number(),
    maxContentPerUser: z.number(),
    maxStoragePerUser: z.number(), // in MB
  }).optional(),
  security: z.object({
    passwordMinLength: z.number(),
    sessionTimeout: z.number(), // in minutes
    maxLoginAttempts: z.number(),
    requireMFA: z.boolean(),
  }).optional(),
});

// Statistics Schemas
export const StatsTimeRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  interval: z.enum(['hour', 'day', 'week', 'month']).default('day'),
});

// API Key Management Schemas
export const AdminAPIKeyCreateSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  scopes: z.array(z.string()),
  expiresAt: z.string().datetime().optional(),
  rateLimit: z.number().optional(),
});

export const AdminAPIKeyUpdateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  scopes: z.array(z.string()).optional(),
  enabled: z.boolean().optional(),
});

// Audit Log Schemas
export const AuditLogQuerySchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(50),
  userId: z.string().optional(),
  action: z.string().optional(),
  resource: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Support Ticket Schemas
export const SupportTicketSchema = z.object({
  userId: z.string(),
  subject: z.string(),
  description: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  category: z.enum(['technical', 'billing', 'account', 'feature_request', 'other']),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).default('open'),
});

export const TicketResponseSchema = z.object({
  message: z.string(),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  internal: z.boolean().default(false),
});

// Types
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'super_admin';
  status: 'active' | 'suspended' | 'deleted';
  createdAt: Date;
  lastActive: Date;
  metadata: Record<string, any>;
  subscription?: {
    plan: string;
    status: string;
    currentPeriodEnd: Date;
  };
  usage: {
    contentCount: number;
    storageUsed: number;
    apiCalls: number;
  };
}

export interface SystemStats {
  users: {
    total: number;
    active: number;
    new: number;
    suspended: number;
  };
  content: {
    total: number;
    published: number;
    scheduled: number;
    failed: number;
  };
  usage: {
    apiCalls: number;
    storageUsed: number;
    bandwidthUsed: number;
    generationMinutes: number;
  };
  revenue: {
    mrr: number;
    arr: number;
    newSubscriptions: number;
    churn: number;
  };
  health: {
    uptime: number;
    errorRate: number;
    avgResponseTime: number;
    queueSize: number;
  };
}

export interface AdminAPIKey {
  id: string;
  name: string;
  description?: string;
  key: string;
  scopes: string[];
  enabled: boolean;
  createdAt: Date;
  lastUsed?: Date;
  expiresAt?: Date;
  usage: {
    requests: number;
    lastRequest?: Date;
  };
}

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  result: 'success' | 'failure';
}

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  responses: TicketResponse[];
}

export interface TicketResponse {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  message: string;
  internal: boolean;
  createdAt: Date;
}

// Request/Response types
export type AdminUserListRequest = z.infer<typeof AdminUserListSchema>;
export type AdminUserUpdateRequest = z.infer<typeof AdminUserUpdateSchema>;
export type AdminUserActionRequest = z.infer<typeof AdminUserActionSchema>;
export type SystemConfigRequest = z.infer<typeof SystemConfigSchema>;
export type StatsTimeRangeRequest = z.infer<typeof StatsTimeRangeSchema>;
export type AdminAPIKeyCreateRequest = z.infer<typeof AdminAPIKeyCreateSchema>;
export type AdminAPIKeyUpdateRequest = z.infer<typeof AdminAPIKeyUpdateSchema>;
export type AuditLogQueryRequest = z.infer<typeof AuditLogQuerySchema>;
export type SupportTicketRequest = z.infer<typeof SupportTicketSchema>;
export type TicketResponseRequest = z.infer<typeof TicketResponseSchema>;

// Error types
export class AdminError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AdminError';
  }
}