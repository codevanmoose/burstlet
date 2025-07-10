import { Router } from 'express';
import { ContentManagementController } from './controller';
import { AuthMiddleware } from '../auth/middleware';
import {
  CreateContentSchema,
  UpdateContentSchema,
  CreateTemplateSchema,
  ScheduleContentSchema,
  BulkOperationSchema,
  SearchContentSchema,
  ExportContentSchema,
  ImportContentSchema,
} from './types';

export function createContentManagementRoutes(
  controller: ContentManagementController,
  authMiddleware: AuthMiddleware
): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware.authenticate);

  // Content CRUD operations
  router.post('/',
    authMiddleware.validateRequest(CreateContentSchema),
    controller.createContent
  );

  router.get('/',
    controller.listContent
  );

  router.get('/stats',
    controller.getContentStats
  );

  router.get('/tags',
    controller.getTags
  );

  router.get('/categories',
    controller.getCategories
  );

  router.get('/:contentId',
    controller.getContent
  );

  router.put('/:contentId',
    authMiddleware.validateRequest(UpdateContentSchema),
    controller.updateContent
  );

  router.delete('/:contentId',
    controller.deleteContent
  );

  router.get('/:contentId/versions',
    controller.getContentVersions
  );

  router.post('/:contentId/duplicate',
    controller.duplicateContent
  );

  // Search
  router.post('/search',
    authMiddleware.validateRequest(SearchContentSchema),
    controller.searchContent
  );

  // Preview
  router.post('/preview',
    controller.previewContent
  );

  // Bulk operations
  router.post('/bulk',
    authMiddleware.validateRequest(BulkOperationSchema),
    controller.bulkOperation
  );

  // Import/Export
  router.post('/export',
    authMiddleware.validateRequest(ExportContentSchema),
    controller.exportContent
  );

  router.post('/import',
    authMiddleware.validateRequest(ImportContentSchema),
    controller.importContent
  );

  // Templates
  router.post('/templates',
    authMiddleware.validateRequest(CreateTemplateSchema),
    controller.createTemplate
  );

  router.post('/templates/:templateId/apply',
    controller.applyTemplate
  );

  // Calendar/Scheduling
  router.get('/calendar',
    controller.getCalendar
  );

  router.post('/schedule',
    authMiddleware.validateRequest(ScheduleContentSchema),
    controller.scheduleContent
  );

  // Health check
  router.get('/health',
    controller.health
  );

  return router;
}