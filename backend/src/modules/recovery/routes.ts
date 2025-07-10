import { Router } from 'express';
import { RecoveryController } from './controller';
import { AuthMiddleware } from '../auth/middleware';

export function createRecoveryRoutes(
  controller: RecoveryController,
  authMiddleware: AuthMiddleware
): Router {
  const router = Router();

  // Public health endpoint
  router.get('/health', controller.getHealthStatus.bind(controller));

  // Protected endpoints - require authentication
  router.use(authMiddleware.authenticate.bind(authMiddleware));

  // Circuit breakers
  router.get('/circuit-breakers', controller.getCircuitBreakers.bind(controller));
  router.post('/circuit-breakers/:service/reset', authMiddleware.requireRole('admin'), controller.resetCircuitBreaker.bind(controller));

  // Recovery events and statistics
  router.get('/events', controller.getRecoveryEvents.bind(controller));
  router.get('/statistics', controller.getStatistics.bind(controller));

  // Admin only endpoints
  router.use(authMiddleware.requireRole('admin'));

  // Manual recovery actions
  router.post('/trigger', controller.triggerRecovery.bind(controller));
  router.post('/test', controller.testRecovery.bind(controller));

  // Configuration
  router.put('/configuration', controller.updateConfiguration.bind(controller));

  // Failure patterns
  router.get('/patterns', controller.getFailurePatterns.bind(controller));
  router.post('/patterns', controller.addFailurePattern.bind(controller));

  return router;
}