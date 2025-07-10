import { Request, Response } from 'express';
import { PlatformIntegrationsService } from './service';
import { PlatformProviderFactory } from './providers/factory';
import {
  ConnectPlatformRequest,
  DisconnectPlatformRequest,
  PublishContentRequest,
  BatchPublishRequest,
  UpdatePostRequest,
  PlatformAnalyticsRequest,
  PlatformError,
  OAuthError,
  RateLimitError,
} from './types';

export class PlatformIntegrationsController {
  private platformService: PlatformIntegrationsService;

  constructor(platformService: PlatformIntegrationsService) {
    this.platformService = platformService;
  }

  /**
   * Initiate platform connection
   * POST /api/v1/platforms/connect
   */
  connectPlatform = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const request = req.body as ConnectPlatformRequest;
      const result = await this.platformService.connectPlatform(req.user.id, request);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * OAuth callback handler
   * GET /api/v1/platforms/oauth/callback/:platform
   */
  oauthCallback = async (req: Request, res: Response) => {
    try {
      const { platform } = req.params;
      const { code, state, error: oauthError } = req.query;

      if (oauthError) {
        return res.redirect(`${process.env.FRONTEND_URL}/platforms?error=${oauthError}`);
      }

      if (!code || !state) {
        return res.redirect(`${process.env.FRONTEND_URL}/platforms?error=missing_params`);
      }

      const connection = await this.platformService.completeOAuthConnection(
        state as string,
        code as string,
        req.query.code_verifier as string | undefined
      );

      res.redirect(`${process.env.FRONTEND_URL}/platforms?connected=${platform}&id=${connection.id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      res.redirect(`${process.env.FRONTEND_URL}/platforms?error=${encodeURIComponent(errorMessage)}`);
    }
  };

  /**
   * Disconnect platform
   * POST /api/v1/platforms/disconnect
   */
  disconnectPlatform = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const request = req.body as DisconnectPlatformRequest;
      await this.platformService.disconnectPlatform(req.user.id, request);

      res.status(200).json({
        success: true,
        message: 'Platform disconnected successfully',
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Publish content to platform
   * POST /api/v1/platforms/publish
   */
  publishContent = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const request = req.body as PublishContentRequest;
      const result = await this.platformService.publishContent(req.user.id, request);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Batch publish content
   * POST /api/v1/platforms/batch-publish
   */
  batchPublish = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const request = req.body as BatchPublishRequest;
      const results = await this.platformService.batchPublish(req.user.id, request);

      res.status(200).json({
        success: true,
        data: results,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Update published post
   * PUT /api/v1/platforms/posts/:postId
   */
  updatePost = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const { postId } = req.params;
      const updates = req.body as UpdatePostRequest;
      
      await this.platformService.updatePost(req.user.id, postId, updates);

      res.status(200).json({
        success: true,
        message: 'Post updated successfully',
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Delete post
   * DELETE /api/v1/platforms/posts/:postId
   */
  deletePost = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const { postId } = req.params;
      await this.platformService.deletePost(req.user.id, postId);

      res.status(200).json({
        success: true,
        message: 'Post deleted successfully',
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get post analytics
   * GET /api/v1/platforms/posts/:postId/analytics
   */
  getPostAnalytics = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const { postId } = req.params;
      const request = req.query as PlatformAnalyticsRequest;
      
      const analytics = await this.platformService.getPostAnalytics(
        req.user.id,
        postId,
        request
      );

      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get account analytics
   * GET /api/v1/platforms/connections/:connectionId/analytics
   */
  getAccountAnalytics = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const { connectionId } = req.params;
      const request = req.query as PlatformAnalyticsRequest;
      
      const analytics = await this.platformService.getAccountAnalytics(
        req.user.id,
        connectionId,
        request
      );

      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get user's platform connections
   * GET /api/v1/platforms/connections
   */
  getUserConnections = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const connections = await this.platformService.getUserConnections(req.user.id);

      res.status(200).json({
        success: true,
        data: connections,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get user's posts
   * GET /api/v1/platforms/posts
   */
  getUserPosts = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const {
        platform,
        status,
        limit = '50',
        offset = '0',
      } = req.query;

      const result = await this.platformService.getUserPosts(req.user.id, {
        platform: platform as any,
        status: status as string,
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
   * Sync analytics for all posts
   * POST /api/v1/platforms/sync-analytics
   */
  syncAnalytics = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      await this.platformService.syncAnalytics(req.user.id);

      res.status(200).json({
        success: true,
        message: 'Analytics sync initiated',
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get platform information
   * GET /api/v1/platforms/info
   */
  getPlatformInfo = async (req: Request, res: Response) => {
    try {
      const platforms = PlatformProviderFactory.getSupportedPlatforms();
      const healthStatus = await PlatformProviderFactory.getHealthStatus();
      
      const info = platforms.map(platform => ({
        platform,
        healthy: healthStatus[platform],
        features: PlatformProviderFactory.getPlatformFeatures(platform),
        limits: PlatformProviderFactory.getPlatformLimits(platform),
      }));

      res.status(200).json({
        success: true,
        data: info,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get specific platform information
   * GET /api/v1/platforms/:platform/info
   */
  getPlatformDetails = async (req: Request, res: Response) => {
    try {
      const { platform } = req.params;
      const provider = PlatformProviderFactory.getProvider(platform as any);
      const config = provider.getConfig();

      res.status(200).json({
        success: true,
        data: {
          platform,
          healthy: await provider.isHealthy(),
          features: config.features,
          limits: config.limits,
          oauth: {
            scope: config.oauth.scope,
            authorizationUrl: config.oauth.authorizationUrl,
          },
        },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Health check endpoint
   * GET /api/v1/platforms/health
   */
  health = async (req: Request, res: Response) => {
    try {
      const healthStatus = await PlatformProviderFactory.getHealthStatus();
      const allHealthy = Object.values(healthStatus).every(status => status);

      res.status(allHealthy ? 200 : 503).json({
        success: true,
        data: {
          status: allHealthy ? 'healthy' : 'degraded',
          platforms: healthStatus,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Error handler
   */
  private handleError(error: any, res: Response) {
    console.error('Platform integration error:', error);

    if (error instanceof PlatformError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
        platform: error.platform,
        details: error.details,
      });
    }

    if (error instanceof OAuthError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
        platform: error.platform,
      });
    }

    if (error instanceof RateLimitError) {
      return res.status(429).json({
        success: false,
        error: error.message,
        code: 'RATE_LIMIT_EXCEEDED',
        platform: error.platform,
        retryAfter: error.retryAfter,
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