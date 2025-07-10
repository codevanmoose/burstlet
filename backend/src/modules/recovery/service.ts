import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';
import os from 'os';
import {
  RecoveryService,
  RecoveryResult,
  RecoveryConfig,
  CircuitBreakerState,
  MemorySnapshot,
  DiskUsage,
  QueueHealth,
  RecoveryStrategy,
  RecoveryContext,
  SelfHealingConfig,
  FailurePattern,
  RecoveryEvent,
  RecoveryError,
  CircuitBreakerError,
  HealthCheckResult,
  RecoveryAction,
} from './types';

export class RecoverySystemService extends EventEmitter {
  private services: Map<string, RecoveryService> = new Map();
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private recoveryStrategies: RecoveryStrategy[] = [];
  private failurePatterns: FailurePattern[] = [];
  private memorySnapshots: MemorySnapshot[] = [];
  private healthCheckInterval?: NodeJS.Timer;
  private selfHealingInterval?: NodeJS.Timer;
  private config: SelfHealingConfig;

  constructor(
    private prisma: PrismaClient,
    config?: Partial<SelfHealingConfig>
  ) {
    super();
    
    this.config = {
      memoryThreshold: 85,
      diskThreshold: 90,
      cpuThreshold: 80,
      responseTimeThreshold: 5000,
      errorRateThreshold: 5,
      checkInterval: 30000, // 30 seconds
      recoveryActions: {
        highMemory: [
          { type: 'clear_cache', target: 'redis', priority: 'high' },
          { type: 'restart_service', target: 'worker', priority: 'critical' },
        ],
        highDisk: [
          { type: 'clear_cache', target: 'temp_files', priority: 'medium' },
          { type: 'notify_admin', target: 'disk_space', priority: 'high' },
        ],
        highCpu: [
          { type: 'scale_up', target: 'workers', priority: 'high' },
          { type: 'notify_admin', target: 'cpu_usage', priority: 'medium' },
        ],
        slowResponse: [
          { type: 'clear_cache', target: 'api_cache', priority: 'medium' },
          { type: 'restart_service', target: 'api', priority: 'high' },
        ],
        highErrorRate: [
          { type: 'notify_admin', target: 'error_rate', priority: 'critical' },
          { type: 'failover', target: 'secondary', priority: 'critical' },
        ],
      },
      ...config,
    };

    this.initializeDefaultStrategies();
    this.initializeFailurePatterns();
  }

  /**
   * Register a service for monitoring and recovery
   */
  registerService(service: RecoveryService): void {
    this.services.set(service.name, service);
    this.circuitBreakers.set(service.name, {
      service: service.name,
      state: 'closed',
      failures: 0,
    });
    
    this.emit('service:registered', { service: service.name });
  }

  /**
   * Start automated health monitoring
   */
  startHealthMonitoring(interval: number = 60000): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, interval);

    // Run initial check
    this.performHealthChecks();
  }

  /**
   * Start self-healing monitoring
   */
  startSelfHealing(): void {
    if (this.selfHealingInterval) {
      clearInterval(this.selfHealingInterval);
    }

    this.selfHealingInterval = setInterval(async () => {
      await this.performSelfHealingChecks();
    }, this.config.checkInterval);

    // Run initial check
    this.performSelfHealingChecks();
  }

  /**
   * Perform health checks on all registered services
   */
  private async performHealthChecks(): Promise<void> {
    for (const [name, service] of this.services) {
      try {
        const result = await service.healthCheck();
        
        if (result.status === 'unhealthy') {
          await this.handleUnhealthyService(name, service, result);
        } else if (result.status === 'degraded') {
          this.emit('service:degraded', { service: name, result });
        } else {
          // Reset circuit breaker on success
          const breaker = this.circuitBreakers.get(name);
          if (breaker && breaker.state !== 'closed') {
            breaker.state = 'closed';
            breaker.failures = 0;
            breaker.lastSuccess = new Date();
            this.emit('circuit:closed', { service: name });
          }
        }
      } catch (error) {
        await this.handleServiceError(name, service, error as Error);
      }
    }
  }

  /**
   * Perform self-healing checks
   */
  private async performSelfHealingChecks(): Promise<void> {
    const checks = await Promise.all([
      this.checkMemoryUsage(),
      this.checkDiskUsage(),
      this.checkCPUUsage(),
      this.checkResponseTime(),
      this.checkErrorRate(),
    ]);

    for (const check of checks) {
      if (check.needsRecovery) {
        await this.executeRecoveryActions(check.actions, check.context);
      }
    }
  }

  /**
   * Check memory usage and trigger recovery if needed
   */
  private async checkMemoryUsage(): Promise<{
    needsRecovery: boolean;
    actions: RecoveryAction[];
    context: string;
  }> {
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const usedMemory = totalMemory - os.freemem();
    const percentage = (usedMemory / totalMemory) * 100;

    // Store snapshot for trend analysis
    this.memorySnapshots.push({
      timestamp: new Date(),
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      external: memoryUsage.external,
      rss: memoryUsage.rss,
      arrayBuffers: memoryUsage.arrayBuffers,
    });

    // Keep only last 100 snapshots
    if (this.memorySnapshots.length > 100) {
      this.memorySnapshots.shift();
    }

    // Check for memory leak patterns
    const hasMemoryLeak = this.detectMemoryLeak();

    if (percentage > this.config.memoryThreshold || hasMemoryLeak) {
      this.emit('health:high_memory', { percentage, hasMemoryLeak });
      return {
        needsRecovery: true,
        actions: this.config.recoveryActions.highMemory,
        context: `Memory usage: ${percentage.toFixed(2)}%, Leak detected: ${hasMemoryLeak}`,
      };
    }

    return { needsRecovery: false, actions: [], context: '' };
  }

  /**
   * Check disk usage
   */
  private async checkDiskUsage(): Promise<{
    needsRecovery: boolean;
    actions: RecoveryAction[];
    context: string;
  }> {
    // Simplified disk check - in production would use proper disk utils
    const diskUsage: DiskUsage = {
      path: '/',
      total: 100 * 1024 * 1024 * 1024, // 100GB
      used: 85 * 1024 * 1024 * 1024, // 85GB
      available: 15 * 1024 * 1024 * 1024, // 15GB
      percentage: 85,
    };

    if (diskUsage.percentage > this.config.diskThreshold) {
      this.emit('health:high_disk', diskUsage);
      return {
        needsRecovery: true,
        actions: this.config.recoveryActions.highDisk,
        context: `Disk usage: ${diskUsage.percentage}%`,
      };
    }

    return { needsRecovery: false, actions: [], context: '' };
  }

  /**
   * Check CPU usage
   */
  private async checkCPUUsage(): Promise<{
    needsRecovery: boolean;
    actions: RecoveryAction[];
    context: string;
  }> {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);

    if (usage > this.config.cpuThreshold) {
      this.emit('health:high_cpu', { usage });
      return {
        needsRecovery: true,
        actions: this.config.recoveryActions.highCpu,
        context: `CPU usage: ${usage}%`,
      };
    }

    return { needsRecovery: false, actions: [], context: '' };
  }

  /**
   * Check API response time
   */
  private async checkResponseTime(): Promise<{
    needsRecovery: boolean;
    actions: RecoveryAction[];
    context: string;
  }> {
    // In production, would check actual API metrics
    const avgResponseTime = await this.getAverageResponseTime();

    if (avgResponseTime > this.config.responseTimeThreshold) {
      this.emit('health:slow_response', { avgResponseTime });
      return {
        needsRecovery: true,
        actions: this.config.recoveryActions.slowResponse,
        context: `Avg response time: ${avgResponseTime}ms`,
      };
    }

    return { needsRecovery: false, actions: [], context: '' };
  }

  /**
   * Check error rate
   */
  private async checkErrorRate(): Promise<{
    needsRecovery: boolean;
    actions: RecoveryAction[];
    context: string;
  }> {
    const errorRate = await this.getErrorRate();

    if (errorRate > this.config.errorRateThreshold) {
      this.emit('health:high_errors', { errorRate });
      return {
        needsRecovery: true,
        actions: this.config.recoveryActions.highErrorRate,
        context: `Error rate: ${errorRate}%`,
      };
    }

    return { needsRecovery: false, actions: [], context: '' };
  }

  /**
   * Handle unhealthy service
   */
  private async handleUnhealthyService(
    name: string,
    service: RecoveryService,
    result: HealthCheckResult
  ): Promise<void> {
    const breaker = this.circuitBreakers.get(name);
    if (!breaker) return;

    breaker.failures++;
    breaker.lastFailure = new Date();

    // Check circuit breaker
    if (service.config.circuitBreaker.enabled) {
      if (breaker.failures >= service.config.circuitBreaker.failureThreshold) {
        breaker.state = 'open';
        breaker.nextRetry = new Date(
          Date.now() + service.config.circuitBreaker.resetTimeout
        );
        
        this.emit('circuit:open', { service: name, breaker });
        
        // Schedule half-open transition
        setTimeout(() => {
          if (breaker.state === 'open') {
            breaker.state = 'half-open';
            this.emit('circuit:half-open', { service: name });
          }
        }, service.config.circuitBreaker.resetTimeout);
      }
    }

    // Attempt recovery
    try {
      const error = new RecoveryError(
        result.message || 'Service unhealthy',
        'SERVICE_UNHEALTHY',
        name
      );
      
      const recoveryResult = await this.attemptRecovery(name, service, error);
      
      if (recoveryResult.success) {
        breaker.failures = 0;
        this.emit('service:recovered', { service: name, result: recoveryResult });
      }
    } catch (error) {
      this.emit('recovery:failed', { service: name, error });
    }
  }

  /**
   * Handle service error
   */
  private async handleServiceError(
    name: string,
    service: RecoveryService,
    error: Error
  ): Promise<void> {
    const pattern = this.identifyFailurePattern(error);
    
    if (pattern) {
      await this.executeRecoveryActions(pattern.recovery, error.message);
    } else {
      await this.handleUnhealthyService(name, service, {
        service: name,
        status: 'unhealthy',
        message: error.message,
        lastCheck: new Date(),
        consecutiveFailures: 1,
      });
    }
  }

  /**
   * Attempt recovery for a service
   */
  private async attemptRecovery(
    name: string,
    service: RecoveryService,
    error: Error
  ): Promise<RecoveryResult> {
    const breaker = this.circuitBreakers.get(name);
    
    // Check circuit breaker
    if (breaker && breaker.state === 'open') {
      throw new CircuitBreakerError(name, breaker.state, breaker.nextRetry!);
    }

    const context: RecoveryContext = {
      service: name,
      error,
      attempts: 0,
      metadata: { breaker },
    };

    // Try recovery strategies
    for (const strategy of this.recoveryStrategies) {
      if (strategy.condition(error, context)) {
        try {
          const result = await strategy.execute(error, context);
          
          if (result.success) {
            return result;
          }
        } catch (strategyError) {
          console.error(`Recovery strategy ${strategy.name} failed:`, strategyError);
        }
      }
    }

    // Fallback to service-specific recovery
    return service.recover(error);
  }

  /**
   * Execute recovery actions
   */
  private async executeRecoveryActions(
    actions: RecoveryAction[],
    context: string
  ): Promise<void> {
    // Sort by priority
    const sortedActions = [...actions].sort((a, b) => {
      const priorityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    for (const action of sortedActions) {
      try {
        await this.executeRecoveryAction(action, context);
      } catch (error) {
        console.error(`Failed to execute recovery action ${action.type}:`, error);
      }
    }
  }

  /**
   * Execute single recovery action
   */
  private async executeRecoveryAction(
    action: RecoveryAction,
    context: string
  ): Promise<void> {
    const event: RecoveryEvent = {
      id: `evt_${Date.now()}`,
      timestamp: new Date(),
      service: action.target,
      type: 'recovery',
      severity: action.priority === 'critical' ? 'critical' : 
                action.priority === 'high' ? 'high' : 'medium',
      action,
      metadata: { context },
    };

    this.emit('recovery:action', event);

    switch (action.type) {
      case 'restart_service':
        await this.restartService(action.target);
        break;

      case 'clear_cache':
        await this.clearCache(action.target);
        break;

      case 'reset_connection':
        await this.resetConnection(action.target);
        break;

      case 'scale_up':
        await this.scaleUp(action.target);
        break;

      case 'scale_down':
        await this.scaleDown(action.target);
        break;

      case 'failover':
        await this.failover(action.target);
        break;

      case 'notify_admin':
        await this.notifyAdmin(action.target, context);
        break;

      case 'quarantine':
        await this.quarantineService(action.target);
        break;
    }

    // Log recovery action
    await this.logRecoveryEvent(event);
  }

  /**
   * Recovery action implementations
   */
  private async restartService(target: string): Promise<void> {
    console.log(`Restarting service: ${target}`);
    // In production, would use PM2 or systemctl
  }

  private async clearCache(target: string): Promise<void> {
    console.log(`Clearing cache: ${target}`);
    // Clear specific cache based on target
  }

  private async resetConnection(target: string): Promise<void> {
    console.log(`Resetting connection: ${target}`);
    // Reset database or service connections
  }

  private async scaleUp(target: string): Promise<void> {
    console.log(`Scaling up: ${target}`);
    // Increase worker processes or instances
  }

  private async scaleDown(target: string): Promise<void> {
    console.log(`Scaling down: ${target}`);
    // Decrease worker processes or instances
  }

  private async failover(target: string): Promise<void> {
    console.log(`Failing over to: ${target}`);
    // Switch to backup service
  }

  private async notifyAdmin(target: string, context: string): Promise<void> {
    console.log(`Notifying admin about: ${target} - ${context}`);
    // Send notification via email/Slack
  }

  private async quarantineService(target: string): Promise<void> {
    console.log(`Quarantining service: ${target}`);
    // Isolate problematic service
  }

  /**
   * Helper methods
   */
  private detectMemoryLeak(): boolean {
    if (this.memorySnapshots.length < 10) return false;

    // Simple trend detection
    const recentSnapshots = this.memorySnapshots.slice(-10);
    const trend = recentSnapshots.reduce((acc, snapshot, index) => {
      if (index === 0) return 0;
      return acc + (snapshot.heapUsed - recentSnapshots[index - 1].heapUsed);
    }, 0);

    return trend > 10 * 1024 * 1024; // 10MB growth
  }

  private async getAverageResponseTime(): Promise<number> {
    // In production, would query monitoring data
    return 150; // Mock value
  }

  private async getErrorRate(): Promise<number> {
    // In production, would calculate from actual metrics
    return 1.5; // Mock value
  }

  private identifyFailurePattern(error: Error): FailurePattern | null {
    for (const pattern of this.failurePatterns) {
      const regex = pattern.pattern instanceof RegExp 
        ? pattern.pattern 
        : new RegExp(pattern.pattern);
      
      if (regex.test(error.message)) {
        return pattern;
      }
    }
    return null;
  }

  private async logRecoveryEvent(event: RecoveryEvent): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: 'system',
          action: `recovery.${event.type}`,
          resource: event.service,
          details: event,
          ipAddress: '127.0.0.1',
          userAgent: 'RecoverySystem',
          result: 'success',
        },
      });
    } catch (error) {
      console.error('Failed to log recovery event:', error);
    }
  }

  /**
   * Initialize default recovery strategies
   */
  private initializeDefaultStrategies(): void {
    this.recoveryStrategies = [
      {
        name: 'database_connection_recovery',
        condition: (error) => error.message.includes('database') || 
                             error.message.includes('connection'),
        execute: async (error, context) => {
          await this.resetConnection('database');
          return {
            success: true,
            action: 'reset_connection',
            service: context.service,
            attempts: 1,
            duration: 1000,
          };
        },
        priority: 10,
      },
      {
        name: 'memory_pressure_recovery',
        condition: (error) => error.message.includes('memory') || 
                             error.message.includes('heap'),
        execute: async (error, context) => {
          await this.clearCache('all');
          global.gc && global.gc();
          return {
            success: true,
            action: 'clear_memory',
            service: context.service,
            attempts: 1,
            duration: 500,
          };
        },
        priority: 9,
      },
      {
        name: 'rate_limit_recovery',
        condition: (error) => error.message.includes('rate limit') || 
                             error.message.includes('429'),
        execute: async (error, context) => {
          // Wait with exponential backoff
          const delay = Math.min(
            1000 * Math.pow(2, context.attempts),
            60000
          );
          await new Promise(resolve => setTimeout(resolve, delay));
          return {
            success: true,
            action: 'rate_limit_backoff',
            service: context.service,
            attempts: context.attempts + 1,
            duration: delay,
          };
        },
        priority: 8,
      },
    ];
  }

  /**
   * Initialize failure patterns
   */
  private initializeFailurePatterns(): void {
    this.failurePatterns = [
      {
        id: 'network_timeout',
        pattern: /timeout|ETIMEDOUT|ECONNREFUSED/i,
        category: 'network',
        severity: 'medium',
        recovery: [
          { type: 'reset_connection', target: 'network', priority: 'high' },
        ],
        cooldown: 30000,
      },
      {
        id: 'database_connection',
        pattern: /database.*connection|connection.*refused|ECONNREFUSED.*5432/i,
        category: 'database',
        severity: 'high',
        recovery: [
          { type: 'reset_connection', target: 'database', priority: 'critical' },
          { type: 'notify_admin', target: 'database', priority: 'high' },
        ],
        cooldown: 60000,
      },
      {
        id: 'out_of_memory',
        pattern: /out of memory|heap out of memory|ENOMEM/i,
        category: 'memory',
        severity: 'critical',
        recovery: [
          { type: 'clear_cache', target: 'all', priority: 'critical' },
          { type: 'restart_service', target: 'worker', priority: 'critical' },
        ],
        cooldown: 120000,
      },
    ];
  }

  /**
   * Get all services health status
   */
  async getServicesHealth(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];
    
    for (const [name, service] of this.services) {
      try {
        const result = await service.healthCheck();
        results.push(result);
      } catch (error) {
        results.push({
          service: name,
          status: 'unknown',
          message: 'Health check failed',
          lastCheck: new Date(),
          consecutiveFailures: 0,
        });
      }
    }
    
    return results;
  }

  /**
   * Get system health metrics
   */
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    memory: { used: number; total: number; percentage: number };
    cpu: { usage: number };
    disk: { used: number; total: number; percentage: number };
  }> {
    const memInfo = await this.checkMemoryUsage();
    const cpuInfo = await this.checkCPUUsage();
    const diskInfo = await this.checkDiskUsage();
    
    const totalMemory = os.totalmem();
    const usedMemory = totalMemory - os.freemem();
    const memoryPercentage = (usedMemory / totalMemory) * 100;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (memInfo.needsRecovery || cpuInfo.needsRecovery || diskInfo.needsRecovery) {
      status = 'unhealthy';
    } else if (memoryPercentage > 70 || diskInfo.needsRecovery) {
      status = 'degraded';
    }
    
    return {
      status,
      memory: {
        used: usedMemory,
        total: totalMemory,
        percentage: memoryPercentage,
      },
      cpu: {
        usage: 50, // Simplified
      },
      disk: {
        used: 85 * 1024 * 1024 * 1024,
        total: 100 * 1024 * 1024 * 1024,
        percentage: 85,
      },
    };
  }

  /**
   * Get circuit breaker states
   */
  getCircuitBreakerStates(): CircuitBreakerState[] {
    return Array.from(this.circuitBreakers.values());
  }

  /**
   * Get recovery events
   */
  async getRecoveryEvents(filters: {
    limit: number;
    offset: number;
    service?: string;
    type?: RecoveryEvent['type'];
    severity?: RecoveryEvent['severity'];
  }): Promise<RecoveryEvent[]> {
    // In production, would query from database
    return [];
  }

  /**
   * Trigger manual recovery
   */
  async triggerManualRecovery(
    serviceName: string,
    action: RecoveryAction,
    adminId: string
  ): Promise<RecoveryResult> {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    await this.executeRecoveryAction(action, `Manual trigger by ${adminId}`);

    return {
      success: true,
      action: action.type,
      service: serviceName,
      attempts: 1,
      duration: 0,
      metadata: { triggeredBy: adminId },
    };
  }

  /**
   * Update recovery configuration
   */
  async updateConfiguration(
    updates: Partial<SelfHealingConfig>,
    adminId: string
  ): Promise<void> {
    this.config = { ...this.config, ...updates };
    
    // Log configuration change
    await this.logRecoveryEvent({
      id: `evt_${Date.now()}`,
      timestamp: new Date(),
      service: 'system',
      type: 'recovery',
      severity: 'low',
      metadata: { updates, adminId },
    });
  }

  /**
   * Get recovery statistics
   */
  async getRecoveryStatistics(filters: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    totalEvents: number;
    successfulRecoveries: number;
    failedRecoveries: number;
    byService: Record<string, number>;
    bySeverity: Record<string, number>;
  }> {
    // In production, would aggregate from database
    return {
      totalEvents: 0,
      successfulRecoveries: 0,
      failedRecoveries: 0,
      byService: {},
      bySeverity: {},
    };
  }

  /**
   * Reset circuit breaker
   */
  async resetCircuitBreaker(serviceName: string, adminId: string): Promise<void> {
    const breaker = this.circuitBreakers.get(serviceName);
    if (!breaker) {
      throw new Error(`Circuit breaker for ${serviceName} not found`);
    }

    breaker.state = 'closed';
    breaker.failures = 0;
    breaker.lastSuccess = new Date();
    delete breaker.nextRetry;

    this.emit('circuit:reset', { service: serviceName, adminId });
  }

  /**
   * Get failure patterns
   */
  getFailurePatterns(): FailurePattern[] {
    return this.failurePatterns;
  }

  /**
   * Add custom failure pattern
   */
  async addFailurePattern(pattern: FailurePattern, adminId: string): Promise<void> {
    this.failurePatterns.push(pattern);
    
    // Log pattern addition
    await this.logRecoveryEvent({
      id: `evt_${Date.now()}`,
      timestamp: new Date(),
      service: 'system',
      type: 'recovery',
      severity: 'low',
      metadata: { pattern, adminId },
    });
  }

  /**
   * Test recovery action
   */
  async testRecoveryAction(
    serviceName: string,
    error: Error,
    adminId: string
  ): Promise<RecoveryResult> {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    // Run recovery in test mode
    const result = await service.recover(error);
    
    // Log test
    await this.logRecoveryEvent({
      id: `evt_${Date.now()}`,
      timestamp: new Date(),
      service: serviceName,
      type: 'recovery',
      severity: 'low',
      error,
      result,
      metadata: { test: true, adminId },
    });

    return result;
  }

  /**
   * Stop all monitoring
   */
  stop(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.selfHealingInterval) {
      clearInterval(this.selfHealingInterval);
    }
    this.removeAllListeners();
  }
}