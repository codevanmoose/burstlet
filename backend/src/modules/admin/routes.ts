import { Router } from 'express';
import { AdminController } from './controller';
import { AuthMiddleware } from '../auth/middleware';

export function createAdminRoutes(
  controller: AdminController,
  authMiddleware: AuthMiddleware
): Router {
  const router = Router();

  // All admin routes require authentication and admin role
  router.use(authMiddleware.authenticate.bind(authMiddleware));
  router.use(authMiddleware.requireRole('admin'));

  // Dashboard
  router.get('/dashboard', controller.getDashboard.bind(controller));

  // User Management
  router.get('/users', controller.getUsers.bind(controller));
  router.get('/users/:userId', controller.getUser.bind(controller));
  router.put('/users/:userId', controller.updateUser.bind(controller));
  router.post('/users/:userId/actions', controller.performUserAction.bind(controller));
  router.post('/users/:userId/impersonate', authMiddleware.requireRole('super_admin'), controller.impersonateUser.bind(controller));

  // System Management
  router.get('/system/stats', controller.getSystemStats.bind(controller));
  router.get('/system/config', controller.getSystemConfig.bind(controller));
  router.put('/system/config', authMiddleware.requireRole('super_admin'), controller.updateSystemConfig.bind(controller));
  router.post('/system/maintenance', authMiddleware.requireRole('super_admin'), controller.performMaintenanceAction.bind(controller));

  // Queue Management
  router.get('/queues/stats', controller.getQueueStats.bind(controller));

  // API Key Management
  router.post('/api-keys', controller.createAPIKey.bind(controller));

  // Audit Logs
  router.get('/audit-logs', controller.getAuditLogs.bind(controller));

  // Data Export
  router.get('/export', controller.exportData.bind(controller));

  // Feature Flags
  router.post('/features/:feature/toggle', authMiddleware.requireRole('super_admin'), controller.toggleFeatureFlag.bind(controller));

  return router;
}