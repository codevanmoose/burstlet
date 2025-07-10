import { Request, Response } from 'express';
import { AIGenerationService } from './service';
import { ProviderFactory } from './providers/factory';
import {
  GenerationError,
  QuotaError,
  VideoGenerationRequest,
  BlogGenerationRequest,
  SocialPostGenerationRequest,
  ScriptGenerationRequest,
  BatchGenerationRequest,
} from './types';

export class AIGenerationController {
  private aiService: AIGenerationService;

  constructor(aiService: AIGenerationService) {
    this.aiService = aiService;
  }

  /**
   * Generate video content
   * POST /api/v1/ai/video/generate
   */
  generateVideo = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const request = req.body as VideoGenerationRequest;
      const providerName = req.body.provider;

      const result = await this.aiService.generateVideo(
        req.user.id,
        request,
        providerName
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
   * Generate blog content
   * POST /api/v1/ai/blog/generate
   */
  generateBlog = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const request = req.body as BlogGenerationRequest;
      const providerName = req.body.provider;

      const result = await this.aiService.generateBlog(
        req.user.id,
        request,
        providerName
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
   * Generate social media post
   * POST /api/v1/ai/social/generate
   */
  generateSocialPost = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const request = req.body as SocialPostGenerationRequest;
      const providerName = req.body.provider;

      const result = await this.aiService.generateSocialPost(
        req.user.id,
        request,
        providerName
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
   * Generate script content
   * POST /api/v1/ai/script/generate
   */
  generateScript = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const request = req.body as ScriptGenerationRequest;
      const providerName = req.body.provider;

      const result = await this.aiService.generateScript(
        req.user.id,
        request,
        providerName
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
   * Get generation status
   * GET /api/v1/ai/generation/:id
   */
  getGenerationStatus = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const { id } = req.params;
      const result = await this.aiService.getGenerationStatus(req.user.id, id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get user's generations
   * GET /api/v1/ai/generations
   */
  getUserGenerations = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const {
        type,
        status,
        limit = '50',
        offset = '0',
      } = req.query;

      const result = await this.aiService.getUserGenerations(req.user.id, {
        type: type as any,
        status: status as any,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get available providers
   * GET /api/v1/ai/providers
   */
  getProviders = async (req: Request, res: Response) => {
    try {
      const providers = ProviderFactory.getProviderStats();
      const healthyProviders = await ProviderFactory.getHealthyProviders();

      const result = {
        providers,
        healthy: healthyProviders.map(p => p.getName()),
        total: Object.keys(providers).length,
      };

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get provider capabilities
   * GET /api/v1/ai/providers/:name
   */
  getProviderCapabilities = async (req: Request, res: Response) => {
    try {
      const { name } = req.params;
      const provider = ProviderFactory.getProvider(name as any);

      let capabilities: any = {
        name: provider.getName(),
        type: provider.getType(),
        healthy: await provider.isHealthy(),
      };

      // Add type-specific capabilities
      if (ProviderFactory.isVideoProvider(provider)) {
        capabilities.video = {
          supportedAspectRatios: provider.getSupportedAspectRatios(),
          supportedQualities: provider.getSupportedQualities(),
          maxDuration: provider.getMaxDuration(),
        };
      }

      if (ProviderFactory.isTextProvider(provider)) {
        capabilities.text = {
          maxTokens: provider.getMaxTokens(),
          supportedModels: provider.getSupportedModels(),
        };
      }

      res.status(200).json({
        success: true,
        data: capabilities,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get user quota information
   * GET /api/v1/ai/quota
   */
  getUserQuota = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      // This would typically come from a quota service
      // For now, we'll return mock data
      const quota = {
        monthly: {
          limit: 50,
          used: 12,
          remaining: 38,
          resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        daily: {
          limit: 10,
          used: 3,
          remaining: 7,
          resetDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        hourly: {
          limit: 5,
          used: 1,
          remaining: 4,
          resetDate: new Date(Date.now() + 60 * 60 * 1000),
        },
      };

      res.status(200).json({
        success: true,
        data: quota,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get usage statistics
   * GET /api/v1/ai/usage
   */
  getUsageStatistics = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const { period = '7d' } = req.query;

      // This would typically come from a usage analytics service
      // For now, we'll return mock data
      const usage = {
        period,
        totalGenerations: 45,
        totalCost: 12.34,
        byType: {
          VIDEO: { count: 15, cost: 8.50 },
          BLOG: { count: 20, cost: 2.40 },
          SOCIAL_POST: { count: 8, cost: 0.80 },
          SCRIPT: { count: 2, cost: 0.64 },
        },
        byProvider: {
          HAILUOAI: { count: 15, cost: 8.50 },
          OPENAI: { count: 30, cost: 3.84 },
        },
        timeline: [], // Would contain daily/hourly usage data
      };

      res.status(200).json({
        success: true,
        data: usage,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Health check endpoint
   * GET /api/v1/ai/health
   */
  health = async (req: Request, res: Response) => {
    try {
      const providers = ProviderFactory.getAllProviders();
      const healthChecks = await Promise.all(
        providers.map(async (provider) => ({
          name: provider.getName(),
          healthy: await provider.isHealthy(),
        }))
      );

      const allHealthy = healthChecks.every(check => check.healthy);

      res.status(allHealthy ? 200 : 503).json({
        success: true,
        data: {
          status: allHealthy ? 'healthy' : 'degraded',
          providers: healthChecks,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Batch generation endpoint
   * POST /api/v1/ai/batch/generate
   */
  generateBatch = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const request = req.body as BatchGenerationRequest;

      // This would typically be handled by a queue system
      // For now, we'll return a mock response
      const batchId = `batch_${Date.now()}`;

      res.status(202).json({
        success: true,
        data: {
          batchId,
          status: 'PENDING',
          totalItems: request.prompts.length,
          estimatedTime: request.prompts.length * 30, // 30 seconds per item
        },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get batch status
   * GET /api/v1/ai/batch/:id
   */
  getBatchStatus = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const { id } = req.params;

      // This would typically come from a batch processing service
      // For now, we'll return mock data
      const batch = {
        batchId: id,
        status: 'PROCESSING',
        totalItems: 5,
        completedItems: 2,
        failedItems: 0,
        results: [],
      };

      res.status(200).json({
        success: true,
        data: batch,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Error handler
   */
  private handleError(error: any, res: Response) {
    console.error('AI Generation error:', error);

    if (error instanceof GenerationError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
        provider: error.provider,
      });
    }

    if (error instanceof QuotaError) {
      return res.status(429).json({
        success: false,
        error: error.message,
        code: 'QUOTA_EXCEEDED',
        details: {
          quotaType: error.quotaType,
          limit: error.limit,
          current: error.current,
        },
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