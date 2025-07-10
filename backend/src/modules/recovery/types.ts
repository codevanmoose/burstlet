import { z } from 'zod';

// Recovery Configuration Schemas
export const RecoveryConfigSchema = z.object({
  enabled: z.boolean().default(true),
  retryAttempts: z.number().min(1).max(10).default(3),
  retryDelay: z.number().min(1000).default(5000), // milliseconds
  backoffMultiplier: z.number().min(1).max(5).default(2),
  maxRetryDelay: z.number().default(60000), // 1 minute
  circuitBreaker: z.object({
    enabled: z.boolean().default(true),
    failureThreshold: z.number().default(5),
    resetTimeout: z.number().default(60000), // 1 minute
    halfOpenRequests: z.number().default(3),
  }).default({}),
});

// Health Check Schemas
export const HealthCheckResultSchema = z.object({
  service: z.string(),
  status: z.enum(['healthy', 'degraded', 'unhealthy', 'unknown']),
  message: z.string().optional(),
  lastCheck: z.date(),
  consecutiveFailures: z.number().default(0),
  metadata: z.record(z.any()).optional(),
});

// Recovery Action Schemas
export const RecoveryActionSchema = z.object({
  type: z.enum([
    'restart_service',
    'clear_cache',
    'reset_connection',
    'scale_up',
    'scale_down',
    'failover',
    'notify_admin',
    'quarantine',
  ]),
  target: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  metadata: z.record(z.any()).optional(),
});

// Types
export interface RecoveryService {
  name: string;
  type: 'database' | 'cache' | 'queue' | 'external' | 'internal';
  healthCheck: () => Promise<HealthCheckResult>;
  recover: (error: Error) => Promise<RecoveryResult>;
  config: RecoveryConfig;
}

export interface RecoveryResult {
  success: boolean;
  action: string;
  service: string;
  error?: Error;
  attempts: number;
  duration: number;
  metadata?: Record<string, any>;
}

export interface CircuitBreakerState {
  service: string;
  state: 'closed' | 'open' | 'half-open';
  failures: number;
  lastFailure?: Date;
  lastSuccess?: Date;
  nextRetry?: Date;
}

export interface MemorySnapshot {
  timestamp: Date;
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  arrayBuffers: number;
}

export interface DiskUsage {
  path: string;
  total: number;
  used: number;
  available: number;
  percentage: number;
}

export interface QueueHealth {
  name: string;
  active: number;
  waiting: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
  health: 'healthy' | 'degraded' | 'unhealthy';
}

export interface ServiceDependency {
  name: string;
  type: 'critical' | 'important' | 'optional';
  healthCheck: () => Promise<boolean>;
  fallback?: () => Promise<void>;
}

export interface RecoveryStrategy {
  name: string;
  condition: (error: Error, context: RecoveryContext) => boolean;
  execute: (error: Error, context: RecoveryContext) => Promise<RecoveryResult>;
  priority: number;
}

export interface RecoveryContext {
  service: string;
  error: Error;
  attempts: number;
  lastAttempt?: Date;
  metadata?: Record<string, any>;
}

export interface SelfHealingConfig {
  memoryThreshold: number; // percentage
  diskThreshold: number; // percentage
  cpuThreshold: number; // percentage
  responseTimeThreshold: number; // milliseconds
  errorRateThreshold: number; // percentage
  checkInterval: number; // milliseconds
  recoveryActions: {
    highMemory: RecoveryAction[];
    highDisk: RecoveryAction[];
    highCpu: RecoveryAction[];
    slowResponse: RecoveryAction[];
    highErrorRate: RecoveryAction[];
  };
}

export interface FailurePattern {
  id: string;
  pattern: string | RegExp;
  category: 'network' | 'database' | 'memory' | 'disk' | 'api' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  recovery: RecoveryAction[];
  cooldown: number; // milliseconds
}

// Request/Response types
export type RecoveryConfig = z.infer<typeof RecoveryConfigSchema>;
export type HealthCheckResult = z.infer<typeof HealthCheckResultSchema>;
export type RecoveryAction = z.infer<typeof RecoveryActionSchema>;

// Error types
export class RecoveryError extends Error {
  constructor(
    message: string,
    public code: string,
    public service: string,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'RecoveryError';
  }
}

export class CircuitBreakerError extends Error {
  constructor(
    public service: string,
    public state: 'open' | 'half-open',
    public nextRetry: Date
  ) {
    super(`Circuit breaker is ${state} for service ${service}`);
    this.name = 'CircuitBreakerError';
  }
}

// Event types
export interface RecoveryEvent {
  id: string;
  timestamp: Date;
  service: string;
  type: 'failure' | 'recovery' | 'degradation' | 'escalation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  error?: Error;
  action?: RecoveryAction;
  result?: RecoveryResult;
  metadata?: Record<string, any>;
}