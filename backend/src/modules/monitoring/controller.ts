import { Request, Response } from 'express';
import { MonitoringService } from './service';
import {
  GetMetricsSchema,
  CreateHealthCheckSchema,
  CreateAlertSchema,
  GetLogsSchema,
  CreateDashboardSchema,
  RecordCustomMetricSchema,
  MonitoringError,
} from './types';

export class MonitoringController {
  constructor(private monitoringService: MonitoringService) {}

  /**
   * Get metrics
   * GET /monitoring/metrics
   */
  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = GetMetricsSchema.parse(req.query);

      const metrics = await this.monitoringService.getMetrics(validatedData);

      res.json({
        success: true,
        data: metrics,
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
   * Collect current metrics
   * POST /monitoring/metrics/collect
   */
  async collectMetrics(req: Request, res: Response): Promise<void> {
    try {
      const [systemMetrics, applicationMetrics] = await Promise.all([
        this.monitoringService.collectSystemMetrics(),
        this.monitoringService.collectApplicationMetrics(),
      ]);

      res.json({
        success: true,
        data: {
          system: systemMetrics,
          application: applicationMetrics,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'COLLECTION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to collect metrics',
        },
      });
    }
  }

  /**
   * Record custom metric
   * POST /monitoring/metrics/custom
   */
  async recordCustomMetric(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = RecordCustomMetricSchema.parse(req.body);

      const metric = await this.monitoringService.recordCustomMetric(validatedData);

      res.status(201).json({
        success: true,
        data: { metric },
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
   * Get health status
   * GET /monitoring/health
   */
  async getHealthStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = await this.monitoringService.getHealthStatus();

      const httpStatus = status.overall === 'HEALTHY' ? 200 : 
                        status.overall === 'DEGRADED' ? 200 : 503;

      res.status(httpStatus).json({
        success: true,
        data: status,
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        error: {
          code: 'HEALTH_CHECK_ERROR',
          message: error instanceof Error ? error.message : 'Health check failed',
        },
      });
    }
  }

  /**
   * Create health check
   * POST /monitoring/health-checks
   */
  async createHealthCheck(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = CreateHealthCheckSchema.parse(req.body);

      const healthCheck = await this.monitoringService.createHealthCheck(validatedData);

      res.status(201).json({
        success: true,
        data: { healthCheck },
      });
    } catch (error) {
      if (error instanceof MonitoringError) {
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
   * List health checks
   * GET /monitoring/health-checks
   */
  async listHealthChecks(req: Request, res: Response): Promise<void> {
    try {
      const healthChecks = await this.monitoringService.listHealthChecks();

      res.json({
        success: true,
        data: { healthChecks },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to list health checks',
        },
      });
    }
  }

  /**
   * Delete health check
   * DELETE /monitoring/health-checks/:id
   */
  async deleteHealthCheck(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await this.monitoringService.deleteHealthCheck(id);

      res.json({
        success: true,
        message: 'Health check deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete health check',
        },
      });
    }
  }

  /**
   * Create alert
   * POST /monitoring/alerts
   */
  async createAlert(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = CreateAlertSchema.parse(req.body);

      const alert = await this.monitoringService.createAlert(validatedData);

      res.status(201).json({
        success: true,
        data: { alert },
      });
    } catch (error) {
      if (error instanceof MonitoringError) {
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
   * List alerts
   * GET /monitoring/alerts
   */
  async listAlerts(req: Request, res: Response): Promise<void> {
    try {
      const alerts = await this.monitoringService.listAlerts();

      res.json({
        success: true,
        data: alerts,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to list alerts',
        },
      });
    }
  }

  /**
   * Update alert
   * PUT /monitoring/alerts/:id
   */
  async updateAlert(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const update = CreateAlertSchema.partial().parse(req.body);

      const alert = await this.monitoringService.updateAlert(id, update);

      res.json({
        success: true,
        data: { alert },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update alert',
        },
      });
    }
  }

  /**
   * Delete alert
   * DELETE /monitoring/alerts/:id
   */
  async deleteAlert(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await this.monitoringService.deleteAlert(id);

      res.json({
        success: true,
        message: 'Alert deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete alert',
        },
      });
    }
  }

  /**
   * Acknowledge alert event
   * POST /monitoring/alerts/events/:id/acknowledge
   */
  async acknowledgeAlertEvent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      await this.monitoringService.acknowledgeAlertEvent(id, userId);

      res.json({
        success: true,
        message: 'Alert acknowledged',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to acknowledge alert',
        },
      });
    }
  }

  /**
   * Get logs
   * GET /monitoring/logs
   */
  async getLogs(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = GetLogsSchema.parse(req.query);

      const logs = await this.monitoringService.getLogs(validatedData);

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
   * Create dashboard
   * POST /monitoring/dashboards
   */
  async createDashboard(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = CreateDashboardSchema.parse(req.body);
      const userId = req.user!.id;

      const dashboard = await this.monitoringService.createDashboard(userId, validatedData);

      res.status(201).json({
        success: true,
        data: { dashboard },
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
   * List dashboards
   * GET /monitoring/dashboards
   */
  async listDashboards(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const isAdmin = req.user!.role === 'admin';

      const dashboards = await this.monitoringService.listDashboards(userId, isAdmin);

      res.json({
        success: true,
        data: { dashboards },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to list dashboards',
        },
      });
    }
  }

  /**
   * Get dashboard
   * GET /monitoring/dashboards/:id
   */
  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const dashboard = await this.monitoringService.getDashboard(id, userId);

      res.json({
        success: true,
        data: { dashboard },
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Dashboard not found',
        },
      });
    }
  }

  /**
   * Delete dashboard
   * DELETE /monitoring/dashboards/:id
   */
  async deleteDashboard(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      await this.monitoringService.deleteDashboard(id, userId);

      res.json({
        success: true,
        message: 'Dashboard deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete dashboard',
        },
      });
    }
  }

  /**
   * Get monitoring overview
   * GET /monitoring/overview
   */
  async getOverview(req: Request, res: Response): Promise<void> {
    try {
      const overview = await this.monitoringService.getOverview();

      res.json({
        success: true,
        data: overview,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get overview',
        },
      });
    }
  }
}

// Add missing methods to MonitoringService
declare module './service' {
  interface MonitoringService {
    listHealthChecks(): Promise<any[]>;
    deleteHealthCheck(id: string): Promise<void>;
    listAlerts(): Promise<any>;
    updateAlert(id: string, update: any): Promise<any>;
    deleteAlert(id: string): Promise<void>;
    acknowledgeAlertEvent(id: string, userId: string): Promise<void>;
    listDashboards(userId: string, isAdmin: boolean): Promise<any[]>;
    getDashboard(id: string, userId: string): Promise<any>;
    deleteDashboard(id: string, userId: string): Promise<void>;
  }
}

// Implementation of missing methods (would be in service.ts)
MonitoringService.prototype.listHealthChecks = async function() {
  return this.prisma.healthCheck.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      results: {
        orderBy: { timestamp: 'desc' },
        take: 1,
      },
    },
  });
};

MonitoringService.prototype.deleteHealthCheck = async function(id: string) {
  await this.prisma.healthCheck.delete({ where: { id } });
};

MonitoringService.prototype.listAlerts = async function() {
  const alerts = await this.prisma.monitoringAlert.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const activeEvents = await this.prisma.alertEvent.findMany({
    where: { status: 'TRIGGERED', acknowledgedAt: null },
    orderBy: { timestamp: 'desc' },
    take: 20,
  });

  return {
    alerts,
    activeAlerts: activeEvents.length,
    recentEvents: activeEvents,
  };
};

MonitoringService.prototype.updateAlert = async function(id: string, update: any) {
  return this.prisma.monitoringAlert.update({
    where: { id },
    data: update,
  });
};

MonitoringService.prototype.deleteAlert = async function(id: string) {
  await this.prisma.monitoringAlert.delete({ where: { id } });
};

MonitoringService.prototype.acknowledgeAlertEvent = async function(id: string, userId: string) {
  await this.prisma.alertEvent.update({
    where: { id },
    data: {
      acknowledgedAt: new Date(),
      acknowledgedBy: userId,
    },
  });
};

MonitoringService.prototype.listDashboards = async function(userId: string, isAdmin: boolean) {
  const where = isAdmin ? {} : { OR: [{ createdBy: userId }, { isPublic: true }] };
  
  return this.prisma.dashboard.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
};

MonitoringService.prototype.getDashboard = async function(id: string, userId: string) {
  const dashboard = await this.prisma.dashboard.findFirst({
    where: {
      id,
      OR: [{ createdBy: userId }, { isPublic: true }],
    },
  });

  if (!dashboard) {
    throw new MonitoringError('Dashboard not found', 'NOT_FOUND', 404);
  }

  return dashboard;
};

MonitoringService.prototype.deleteDashboard = async function(id: string, userId: string) {
  await this.prisma.dashboard.deleteMany({
    where: { id, createdBy: userId },
  });
};