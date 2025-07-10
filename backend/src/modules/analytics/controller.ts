import { Request, Response } from 'express';
import { AnalyticsService } from './service';
import {
  GetAnalyticsSchema,
  GetContentAnalyticsSchema,
  GetAudienceAnalyticsSchema,
  GetRevenueAnalyticsSchema,
  CreateReportSchema,
  CreateAlertSchema,
  CompareContentSchema,
  GetInsightsSchema,
  AnalyticsError,
} from './types';

export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  /**
   * Get analytics metrics
   * GET /analytics
   */
  async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = GetAnalyticsSchema.parse(req.query);
      const userId = req.user!.id;

      const analytics = await this.analyticsService.getAnalytics(userId, validatedData);

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      if (error instanceof AnalyticsError) {
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
   * Get content analytics
   * GET /analytics/content
   */
  async getContentAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = GetContentAnalyticsSchema.parse(req.query);
      const userId = req.user!.id;

      const analytics = await this.analyticsService.getContentAnalytics(userId, validatedData);

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      if (error instanceof AnalyticsError) {
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
   * Get audience analytics
   * GET /analytics/audience
   */
  async getAudienceAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = GetAudienceAnalyticsSchema.parse(req.query);
      const userId = req.user!.id;

      const analytics = await this.analyticsService.getAudienceAnalytics(userId, validatedData);

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      if (error instanceof AnalyticsError) {
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
   * Get revenue analytics
   * GET /analytics/revenue
   */
  async getRevenueAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = GetRevenueAnalyticsSchema.parse(req.query);
      const userId = req.user!.id;

      const analytics = await this.analyticsService.getRevenueAnalytics(userId, validatedData);

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      if (error instanceof AnalyticsError) {
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
   * Get analytics dashboard
   * GET /analytics/dashboard
   */
  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const dashboard = await this.analyticsService.getDashboard(userId);

      res.json({
        success: true,
        data: dashboard,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get dashboard',
        },
      });
    }
  }

  /**
   * Create analytics report
   * POST /analytics/reports
   */
  async createReport(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = CreateReportSchema.parse(req.body);
      const userId = req.user!.id;

      const report = await this.analyticsService.createReport(userId, validatedData);

      res.status(201).json({
        success: true,
        data: { report },
      });
    } catch (error) {
      if (error instanceof AnalyticsError) {
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
   * List reports
   * GET /analytics/reports
   */
  async listReports(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const reports = await this.analyticsService.listReports(userId);

      res.json({
        success: true,
        data: { reports },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to list reports',
        },
      });
    }
  }

  /**
   * Create analytics alert
   * POST /analytics/alerts
   */
  async createAlert(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = CreateAlertSchema.parse(req.body);
      const userId = req.user!.id;

      const alert = await this.analyticsService.createAlert(userId, validatedData);

      res.status(201).json({
        success: true,
        data: { alert },
      });
    } catch (error) {
      if (error instanceof AnalyticsError) {
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
   * GET /analytics/alerts
   */
  async listAlerts(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const alerts = await this.analyticsService.listAlerts(userId);

      res.json({
        success: true,
        data: { alerts },
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
   * PUT /analytics/alerts/:id
   */
  async updateAlert(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validatedData = CreateAlertSchema.partial().parse(req.body);
      const userId = req.user!.id;

      const alert = await this.analyticsService.updateAlert(userId, id, validatedData);

      res.json({
        success: true,
        data: { alert },
      });
    } catch (error) {
      if (error instanceof AnalyticsError) {
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
   * Delete alert
   * DELETE /analytics/alerts/:id
   */
  async deleteAlert(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      await this.analyticsService.deleteAlert(userId, id);

      res.json({
        success: true,
        message: 'Alert deleted successfully',
      });
    } catch (error) {
      if (error instanceof AnalyticsError) {
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
            message: error instanceof Error ? error.message : 'Failed to delete alert',
          },
        });
      }
    }
  }

  /**
   * Compare content performance
   * POST /analytics/compare
   */
  async compareContent(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = CompareContentSchema.parse(req.body);
      const userId = req.user!.id;

      const comparison = await this.analyticsService.compareContent(userId, validatedData);

      res.json({
        success: true,
        data: comparison,
      });
    } catch (error) {
      if (error instanceof AnalyticsError) {
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
   * Get analytics insights
   * GET /analytics/insights
   */
  async getInsights(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = GetInsightsSchema.parse(req.query);
      const userId = req.user!.id;

      const insights = await this.analyticsService.getInsights(userId, validatedData);

      res.json({
        success: true,
        data: insights,
      });
    } catch (error) {
      if (error instanceof AnalyticsError) {
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
   * Export analytics data
   * POST /analytics/export
   */
  async exportAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { format = 'CSV', ...options } = req.body;
      const userId = req.user!.id;

      if (!['CSV', 'JSON', 'EXCEL'].includes(format)) {
        throw new Error('Invalid export format');
      }

      const result = await this.analyticsService.exportAnalytics(
        userId,
        format as 'CSV' | 'JSON' | 'EXCEL',
        options
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'EXPORT_ERROR',
          message: error instanceof Error ? error.message : 'Failed to export analytics',
        },
      });
    }
  }

  /**
   * Collect metrics (internal use)
   * POST /analytics/collect
   */
  async collectMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { contentId, platform, metrics } = req.body;
      const userId = req.user!.id;

      if (!contentId || !platform || !metrics) {
        throw new Error('Missing required fields');
      }

      await this.analyticsService.collectMetrics(userId, contentId, platform, metrics);

      res.json({
        success: true,
        message: 'Metrics collected successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'COLLECTION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to collect metrics',
        },
      });
    }
  }

  /**
   * Get realtime analytics
   * GET /analytics/realtime
   */
  async getRealtimeAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      // This would connect to a real-time data source
      res.json({
        success: true,
        data: {
          activeViewers: 0,
          recentEvents: [],
          lastUpdated: new Date(),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'REALTIME_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get realtime analytics',
        },
      });
    }
  }

  /**
   * Health check
   * GET /analytics/health
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      // Check service health
      const health = {
        status: 'healthy',
        timestamp: new Date(),
        version: '1.0.0',
      };

      res.json({
        success: true,
        data: health,
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        error: {
          code: 'UNHEALTHY',
          message: 'Analytics service is unhealthy',
        },
      });
    }
  }
}