import { Request, Response, NextFunction } from 'express';
import { RecoverySystemService } from './service';

export class RecoveryController {
  constructor(private recoveryService: RecoverySystemService) {}

  /**
   * Get system health status
   */
  async getHealthStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const services = await this.recoveryService.getServicesHealth();
      const systemHealth = await this.recoveryService.getSystemHealth();

      res.json({
        success: true,
        data: {
          overall: systemHealth.status,
          services,
          system: {
            memory: systemHealth.memory,
            cpu: systemHealth.cpu,
            disk: systemHealth.disk,
          },
          uptime: process.uptime(),
          timestamp: new Date(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get circuit breaker status
   */
  async getCircuitBreakers(req: Request, res: Response, next: NextFunction) {
    try {
      const breakers = this.recoveryService.getCircuitBreakerStates();

      res.json({
        success: true,
        data: breakers,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recovery events
   */
  async getRecoveryEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit = 50, offset = 0, service, type, severity } = req.query;

      const events = await this.recoveryService.getRecoveryEvents({
        limit: Number(limit),
        offset: Number(offset),
        service: service as string,
        type: type as any,
        severity: severity as any,
      });

      res.json({
        success: true,
        data: events,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Trigger manual recovery action
   */
  async triggerRecovery(req: Request, res: Response, next: NextFunction) {
    try {
      const { service, action } = req.body;
      const adminId = req.user!.id;

      const result = await this.recoveryService.triggerManualRecovery(
        service,
        action,
        adminId
      );

      res.json({
        success: true,
        data: result,
        message: result.success
          ? 'Recovery action executed successfully'
          : 'Recovery action failed',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update recovery configuration
   */
  async updateConfiguration(req: Request, res: Response, next: NextFunction) {
    try {
      const updates = req.body;
      const adminId = req.user!.id;

      await this.recoveryService.updateConfiguration(updates, adminId);

      res.json({
        success: true,
        message: 'Recovery configuration updated',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recovery statistics
   */
  async getStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;

      const stats = await this.recoveryService.getRecoveryStatistics({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset circuit breaker
   */
  async resetCircuitBreaker(req: Request, res: Response, next: NextFunction) {
    try {
      const { service } = req.params;
      const adminId = req.user!.id;

      await this.recoveryService.resetCircuitBreaker(service, adminId);

      res.json({
        success: true,
        message: `Circuit breaker for ${service} has been reset`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get failure patterns
   */
  async getFailurePatterns(req: Request, res: Response, next: NextFunction) {
    try {
      const patterns = this.recoveryService.getFailurePatterns();

      res.json({
        success: true,
        data: patterns,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add custom failure pattern
   */
  async addFailurePattern(req: Request, res: Response, next: NextFunction) {
    try {
      const pattern = req.body;
      const adminId = req.user!.id;

      await this.recoveryService.addFailurePattern(pattern, adminId);

      res.json({
        success: true,
        message: 'Failure pattern added successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Test recovery action
   */
  async testRecovery(req: Request, res: Response, next: NextFunction) {
    try {
      const { service, error } = req.body;
      const adminId = req.user!.id;

      const result = await this.recoveryService.testRecoveryAction(
        service,
        new Error(error),
        adminId
      );

      res.json({
        success: true,
        data: result,
        message: 'Recovery test completed',
      });
    } catch (error) {
      next(error);
    }
  }
}