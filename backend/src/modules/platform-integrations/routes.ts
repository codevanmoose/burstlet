import { Router } from 'express';
import { PlatformIntegrationsController } from './controller';
import { AuthMiddleware } from '../auth/middleware';
import {
  ConnectPlatformSchema,
  DisconnectPlatformSchema,
  PublishContentSchema,
  BatchPublishSchema,
  UpdatePostSchema,
} from './types';

export function createPlatformIntegrationsRoutes(
  controller: PlatformIntegrationsController,
  authMiddleware: AuthMiddleware
): Router {
  const router = Router();

  // OAuth routes (public)
  router.get('/oauth/callback/:platform',
    controller.oauthCallback
  );

  // Platform information routes (public)
  router.get('/info',
    controller.getPlatformInfo
  );

  router.get('/:platform/info',
    controller.getPlatformDetails
  );

  // Health check route (public)
  router.get('/health',
    controller.health
  );

  // Protected routes - require authentication
  // Connection management
  router.post('/connect',
    authMiddleware.authenticate,
    authMiddleware.validateRequest(ConnectPlatformSchema),
    controller.connectPlatform
  );

  router.post('/disconnect',
    authMiddleware.authenticate,
    authMiddleware.validateRequest(DisconnectPlatformSchema),
    controller.disconnectPlatform
  );

  router.get('/connections',
    authMiddleware.authenticate,
    controller.getUserConnections
  );

  router.get('/connections/:connectionId/analytics',
    authMiddleware.authenticate,
    controller.getAccountAnalytics
  );

  // Content publishing
  router.post('/publish',
    authMiddleware.authenticate,
    authMiddleware.validateRequest(PublishContentSchema),
    controller.publishContent
  );

  router.post('/batch-publish',
    authMiddleware.authenticate,
    authMiddleware.validateRequest(BatchPublishSchema),
    controller.batchPublish
  );

  // Post management
  router.get('/posts',
    authMiddleware.authenticate,
    controller.getUserPosts
  );

  router.put('/posts/:postId',
    authMiddleware.authenticate,
    authMiddleware.validateRequest(UpdatePostSchema),
    controller.updatePost
  );

  router.delete('/posts/:postId',
    authMiddleware.authenticate,
    controller.deletePost
  );

  router.get('/posts/:postId/analytics',
    authMiddleware.authenticate,
    controller.getPostAnalytics
  );

  // Analytics
  router.post('/sync-analytics',
    authMiddleware.authenticate,
    controller.syncAnalytics
  );

  return router;
}