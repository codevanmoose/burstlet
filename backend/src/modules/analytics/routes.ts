import { Router } from 'express';
import { AnalyticsController } from './controller';
import { AuthMiddleware } from '../auth/middleware';

export function createAnalyticsRoutes(
  controller: AnalyticsController,
  authMiddleware: AuthMiddleware
): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware.authenticate.bind(authMiddleware));

  // Analytics data endpoints
  router.get('/', controller.getAnalytics.bind(controller));
  router.get('/content', controller.getContentAnalytics.bind(controller));
  router.get('/audience', controller.getAudienceAnalytics.bind(controller));
  router.get('/revenue', controller.getRevenueAnalytics.bind(controller));
  router.get('/dashboard', controller.getDashboard.bind(controller));

  // Reports endpoints
  router.post('/reports', controller.createReport.bind(controller));
  router.get('/reports', controller.listReports.bind(controller));

  // Alerts endpoints
  router.post('/alerts', controller.createAlert.bind(controller));
  router.get('/alerts', controller.listAlerts.bind(controller));
  router.put('/alerts/:id', controller.updateAlert.bind(controller));
  router.delete('/alerts/:id', controller.deleteAlert.bind(controller));

  // Comparison and insights
  router.post('/compare', controller.compareContent.bind(controller));
  router.get('/insights', controller.getInsights.bind(controller));

  // Export functionality
  router.post('/export', controller.exportAnalytics.bind(controller));

  // Real-time analytics
  router.get('/realtime', controller.getRealtimeAnalytics.bind(controller));

  // Internal endpoints (would be protected differently in production)
  router.post('/collect', controller.collectMetrics.bind(controller));

  // Health check
  router.get('/health', controller.healthCheck.bind(controller));

  return router;
}