import { Router } from 'express';
import { SecurityController } from './controller';
import { AuthMiddleware } from '../auth/middleware';

export function createSecurityRoutes(
  controller: SecurityController,
  authMiddleware: AuthMiddleware
): Router {
  const router = Router();

  // Public endpoints
  router.get('/health', controller.healthCheck.bind(controller));

  // Protected endpoints - require authentication
  router.use(authMiddleware.authenticate.bind(authMiddleware));

  // API Key management
  router.post('/api-keys', controller.createApiKey.bind(controller));
  router.get('/api-keys', controller.listApiKeys.bind(controller));
  router.put('/api-keys/:id', controller.updateApiKey.bind(controller));
  router.delete('/api-keys/:id', controller.revokeApiKey.bind(controller));

  // Admin-only endpoints
  router.use(authMiddleware.requireRole('admin'));

  // IP Rules management
  router.post('/ip-rules', controller.createIpRule.bind(controller));
  router.get('/ip-rules', controller.listIpRules.bind(controller));
  router.delete('/ip-rules/:id', controller.deleteIpRule.bind(controller));

  // IP Analysis
  router.get('/analyze-ip', controller.analyzeIp.bind(controller));

  // Security events
  router.get('/events', controller.getSecurityEvents.bind(controller));
  router.put('/events/:id/resolve', controller.resolveSecurityEvent.bind(controller));

  // Audit logs
  router.get('/audit-logs', controller.getAuditLogs.bind(controller));

  // Security status
  router.get('/status', controller.getSecurityStatus.bind(controller));

  // Testing endpoints (development only)
  if (process.env.NODE_ENV === 'development') {
    router.post('/test/encrypt', controller.testEncryption.bind(controller));
  }

  return router;
}