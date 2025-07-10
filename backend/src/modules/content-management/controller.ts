import { Request, Response } from 'express';
import { ContentManagementService } from './service';
import {
  CreateContentRequest,
  UpdateContentRequest,
  CreateTemplateRequest,
  ScheduleContentRequest,
  BulkOperationRequest,
  SearchContentRequest,
  ExportContentRequest,
  ImportContentRequest,
  ContentError,
  TemplateError,
  CalendarError,
} from './types';

export class ContentManagementController {
  private contentService: ContentManagementService;

  constructor(contentService: ContentManagementService) {
    this.contentService = contentService;
  }

  /**
   * Create new content
   * POST /api/v1/content
   */
  createContent = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const request = req.body as CreateContentRequest;
      const result = await this.contentService.createContent(req.user.id, request);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Update content
   * PUT /api/v1/content/:contentId
   */
  updateContent = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const { contentId } = req.params;
      const request = req.body as UpdateContentRequest;
      const result = await this.contentService.updateContent(
        req.user.id,
        contentId,
        request
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get content by ID
   * GET /api/v1/content/:contentId
   */
  getContent = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const { contentId } = req.params;
      const includeVersions = req.query.includeVersions === 'true';
      
      const result = await this.contentService.getContent(
        req.user.id,
        contentId,
        includeVersions
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * List user's content
   * GET /api/v1/content
   */
  listContent = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const filters = req.query as unknown as SearchContentRequest;
      const result = await this.contentService.listContent(req.user.id, filters);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Delete content
   * DELETE /api/v1/content/:contentId
   */
  deleteContent = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const { contentId } = req.params;
      await this.contentService.deleteContent(req.user.id, contentId);

      res.status(200).json({
        success: true,
        message: 'Content deleted successfully',
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Create template
   * POST /api/v1/content/templates
   */
  createTemplate = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const request = req.body as CreateTemplateRequest;
      const result = await this.contentService.createTemplate(req.user.id, request);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Apply template
   * POST /api/v1/content/templates/:templateId/apply
   */
  applyTemplate = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const { templateId } = req.params;
      const { variables } = req.body;
      
      const result = await this.contentService.applyTemplate(
        req.user.id,
        templateId,
        variables
      );

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Schedule content
   * POST /api/v1/content/schedule
   */
  scheduleContent = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const request = req.body as ScheduleContentRequest;
      const result = await this.contentService.scheduleContent(req.user.id, request);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get content calendar
   * GET /api/v1/content/calendar
   */
  getCalendar = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'Start date and end date are required',
        });
      }

      const result = await this.contentService.getCalendar(
        req.user.id,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Perform bulk operation
   * POST /api/v1/content/bulk
   */
  bulkOperation = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const request = req.body as BulkOperationRequest;
      const result = await this.contentService.performBulkOperation(
        req.user.id,
        request
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Export content
   * POST /api/v1/content/export
   */
  exportContent = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const request = req.body as ExportContentRequest;
      const result = await this.contentService.exportContent(req.user.id, request);

      // Set appropriate headers for download
      if (request.format === 'CSV') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=content-export.csv');
      } else if (request.format === 'MARKDOWN') {
        res.setHeader('Content-Type', 'text/markdown');
        res.setHeader('Content-Disposition', 'attachment; filename=content-export.md');
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=content-export.json');
      }

      res.status(200).send(result.data);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Import content
   * POST /api/v1/content/import
   */
  importContent = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const request = req.body as ImportContentRequest;
      const result = await this.contentService.importContent(req.user.id, request);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get content statistics
   * GET /api/v1/content/stats
   */
  getContentStats = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const result = await this.contentService.getContentStats(req.user.id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get user's tags
   * GET /api/v1/content/tags
   */
  getTags = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      // This would be implemented in the service
      const tags = []; // await this.contentService.getUserTags(req.user.id);

      res.status(200).json({
        success: true,
        data: tags,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get user's categories
   * GET /api/v1/content/categories
   */
  getCategories = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      // This would be implemented in the service
      const categories = []; // await this.contentService.getUserCategories(req.user.id);

      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Search content
   * POST /api/v1/content/search
   */
  searchContent = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const request = req.body as SearchContentRequest;
      const result = await this.contentService.listContent(req.user.id, request);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get content versions
   * GET /api/v1/content/:contentId/versions
   */
  getContentVersions = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const { contentId } = req.params;
      const result = await this.contentService.getContent(
        req.user.id,
        contentId,
        true
      );

      res.status(200).json({
        success: true,
        data: result.versions || [],
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Duplicate content
   * POST /api/v1/content/:contentId/duplicate
   */
  duplicateContent = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const { contentId } = req.params;
      
      // Get original content
      const original = await this.contentService.getContent(req.user.id, contentId);
      
      // Create duplicate
      const result = await this.contentService.createContent(req.user.id, {
        title: `${original.content.title} (Copy)`,
        description: original.content.description,
        type: original.content.type,
        content: original.content.content,
        tags: original.content.tags,
        category: original.content.category,
        metadata: {
          ...original.content.metadata,
          duplicatedFrom: contentId,
        },
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Preview content
   * POST /api/v1/content/preview
   */
  previewContent = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const { content, type, platform } = req.body;

      // Generate preview based on content type and platform
      const preview = {
        type,
        platform,
        content,
        // Add platform-specific preview formatting
      };

      res.status(200).json({
        success: true,
        data: preview,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Health check endpoint
   * GET /api/v1/content/health
   */
  health = async (req: Request, res: Response) => {
    try {
      res.status(200).json({
        success: true,
        message: 'Content management service is healthy',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Error handler
   */
  private handleError(error: any, res: Response) {
    console.error('Content management error:', error);

    if (error instanceof ContentError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
      });
    }

    if (error instanceof TemplateError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
      });
    }

    if (error instanceof CalendarError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
      });
    }

    // Default error response
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    });
  }
}