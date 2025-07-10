import { Router } from 'express';
import { MonitoringController } from './controller';
import { AuthMiddleware } from '../auth/middleware';

export function createMonitoringRoutes(
  controller: MonitoringController,
  authMiddleware: AuthMiddleware
): Router {
  const router = Router();

  // Public endpoints
  router.get('/health', controller.getHealthStatus.bind(controller));

  // Protected endpoints - require authentication
  router.use(authMiddleware.authenticate.bind(authMiddleware));

  // Metrics
  router.get('/metrics', controller.getMetrics.bind(controller));
  router.post('/metrics/collect', controller.collectMetrics.bind(controller));
  router.post('/metrics/custom', controller.recordCustomMetric.bind(controller));

  // Health checks
  router.post('/health-checks', controller.createHealthCheck.bind(controller));
  router.get('/health-checks', controller.listHealthChecks.bind(controller));
  router.delete('/health-checks/:id', controller.deleteHealthCheck.bind(controller));

  // Alerts
  router.post('/alerts', controller.createAlert.bind(controller));
  router.get('/alerts', controller.listAlerts.bind(controller));
  router.put('/alerts/:id', controller.updateAlert.bind(controller));
  router.delete('/alerts/:id', controller.deleteAlert.bind(controller));
  router.post('/alerts/events/:id/acknowledge', controller.acknowledgeAlertEvent.bind(controller));

  // Logs
  router.get('/logs', controller.getLogs.bind(controller));

  // Dashboards
  router.post('/dashboards', controller.createDashboard.bind(controller));
  router.get('/dashboards', controller.listDashboards.bind(controller));
  router.get('/dashboards/:id', controller.getDashboard.bind(controller));
  router.delete('/dashboards/:id', controller.deleteDashboard.bind(controller));

  // Overview
  router.get('/overview', controller.getOverview.bind(controller));

  // Admin-only endpoints
  router.use(authMiddleware.requireRole('admin'));

  // No additional admin-only endpoints for now

  return router;
}