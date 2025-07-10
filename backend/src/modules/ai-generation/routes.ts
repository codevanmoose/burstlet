import { Router } from 'express';
import { AIGenerationController } from './controller';
import { AuthMiddleware } from '../auth/middleware';
import {
  VideoGenerationSchema,
  BlogGenerationSchema,
  SocialPostGenerationSchema,
  ScriptGenerationSchema,
  BatchGenerationSchema,
} from './types';

export function createAIGenerationRoutes(
  controller: AIGenerationController,
  authMiddleware: AuthMiddleware
): Router {
  const router = Router();

  // Apply authentication middleware to all routes
  router.use(authMiddleware.authenticate);

  // Video generation routes
  router.post('/video/generate',
    authMiddleware.validateRequest(VideoGenerationSchema),
    controller.generateVideo
  );

  // Blog generation routes
  router.post('/blog/generate',
    authMiddleware.validateRequest(BlogGenerationSchema),
    controller.generateBlog
  );

  // Social media post generation routes
  router.post('/social/generate',
    authMiddleware.validateRequest(SocialPostGenerationSchema),
    controller.generateSocialPost
  );

  // Script generation routes
  router.post('/script/generate',
    authMiddleware.validateRequest(ScriptGenerationSchema),
    controller.generateScript
  );

  // Batch generation routes
  router.post('/batch/generate',
    authMiddleware.validateRequest(BatchGenerationSchema),
    controller.generateBatch
  );

  router.get('/batch/:id',
    controller.getBatchStatus
  );

  // Generation management routes
  router.get('/generation/:id',
    controller.getGenerationStatus
  );

  router.get('/generations',
    controller.getUserGenerations
  );

  // Provider information routes
  router.get('/providers',
    controller.getProviders
  );

  router.get('/providers/:name',
    controller.getProviderCapabilities
  );

  // User quota and usage routes
  router.get('/quota',
    controller.getUserQuota
  );

  router.get('/usage',
    controller.getUsageStatistics
  );

  // Health check route
  router.get('/health',
    controller.health
  );

  return router;
}