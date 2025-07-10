import { Router } from 'express';
import { AgentController } from './controller';
import { AuthMiddleware } from '../auth/middleware';

export function createAgentRoutes(
  controller: AgentController,
  authMiddleware: AuthMiddleware
): Router {
  const router = Router();

  // Public endpoints - no authentication required
  router.get('/capabilities', controller.getCapabilities.bind(controller));
  router.get('/docs', controller.getDocumentation.bind(controller));
  router.get('/describe/:endpoint', controller.describe.bind(controller));

  // Protected endpoints - require authentication
  router.use(authMiddleware.authenticate.bind(authMiddleware));

  // Core agent endpoints
  router.post('/generate', controller.generate.bind(controller));
  router.post('/analyze', controller.analyze.bind(controller));
  router.post('/publish', controller.publish.bind(controller));
  router.post('/search', controller.search.bind(controller));
  router.post('/workflow', controller.workflow.bind(controller));

  // Natural language interface
  router.post('/chat', controller.chat.bind(controller));

  return router;
}