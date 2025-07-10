import { Request, Response, NextFunction } from 'express';
import { AgentService } from './service';
import {
  AgentGenerateRequestSchema,
  AgentAnalyzeRequestSchema,
  AgentPublishRequestSchema,
  AgentSearchRequestSchema,
  AgentWorkflowRequestSchema,
} from './types';

export class AgentController {
  constructor(private agentService: AgentService) {}

  /**
   * Get agent capabilities
   */
  async getCapabilities(req: Request, res: Response, next: NextFunction) {
    try {
      const capabilities = await this.agentService.getCapabilities();

      res.json({
        success: true,
        data: capabilities,
        metadata: {
          documentation: '/api/v1/agent/docs',
          version: '1.0.0',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get API documentation
   */
  async getDocumentation(req: Request, res: Response, next: NextFunction) {
    try {
      const docs = await this.agentService.getApiDocumentation();

      res.json({
        success: true,
        data: {
          endpoints: docs,
          capabilities: await this.agentService.getCapabilities(),
          examples: {
            generateVideo: {
              request: {
                action: 'video',
                input: 'Create a tutorial about TypeScript',
                parameters: { duration: 60, style: 'educational' },
              },
              response: {
                success: true,
                data: { jobId: 'job_123', status: 'processing' },
              },
            },
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle generation requests
   */
  async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = AgentGenerateRequestSchema.parse(req.body);
      const userId = req.user!.id;

      const result = await this.agentService.handleGenerate(validatedData, userId);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle analytics requests
   */
  async analyze(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = AgentAnalyzeRequestSchema.parse(req.body);
      const userId = req.user!.id;

      const result = await this.agentService.handleAnalyze(validatedData, userId);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle publishing requests
   */
  async publish(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = AgentPublishRequestSchema.parse(req.body);
      const userId = req.user!.id;

      const result = await this.agentService.handlePublish(validatedData, userId);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle search requests
   */
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = AgentSearchRequestSchema.parse(req.body);
      const userId = req.user!.id;

      const result = await this.agentService.handleSearch(validatedData, userId);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle workflow requests
   */
  async workflow(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = AgentWorkflowRequestSchema.parse(req.body);
      const userId = req.user!.id;

      const result = await this.agentService.handleWorkflow(validatedData, userId);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get semantic endpoint description
   */
  async describe(req: Request, res: Response, next: NextFunction) {
    try {
      const { endpoint } = req.params;

      const descriptions: Record<string, any> = {
        generate: {
          purpose: 'Generate content using AI',
          input: 'Text prompt describing desired content',
          output: 'Job ID for tracking generation progress',
          examples: ['Generate a video about AI', 'Create a blog post on productivity'],
        },
        analyze: {
          purpose: 'Analyze content performance and get insights',
          input: 'Optional content ID or timeframe',
          output: 'Metrics, insights, and recommendations',
          examples: ['Analyze last week performance', 'Get insights for content_123'],
        },
        publish: {
          purpose: 'Publish content to social media platforms',
          input: 'Content details and target platforms',
          output: 'Publishing status and platform responses',
          examples: ['Publish video to YouTube and TikTok', 'Schedule post for tomorrow'],
        },
        search: {
          purpose: 'Search through content library',
          input: 'Search query and optional filters',
          output: 'Matching content items',
          examples: ['Search for AI videos', 'Find scheduled content'],
        },
        workflow: {
          purpose: 'Execute multi-step workflows',
          input: 'Workflow type and step parameters',
          output: 'Results for each workflow step',
          examples: ['Create and publish content', 'Bulk generate videos'],
        },
      };

      const description = descriptions[endpoint];
      if (!description) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ENDPOINT_NOT_FOUND',
            message: 'Endpoint description not found',
          },
        });
      }

      res.json({
        success: true,
        data: {
          endpoint: `/api/v1/agent/${endpoint}`,
          ...description,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle natural language requests
   */
  async chat(req: Request, res: Response, next: NextFunction) {
    try {
      const { message, context } = req.body;
      const userId = req.user!.id;

      // Parse natural language to determine intent
      const intent = this.parseIntent(message);

      let result;
      switch (intent.action) {
        case 'generate':
          result = await this.agentService.handleGenerate(
            {
              action: intent.type as any,
              input: intent.input,
              parameters: intent.parameters,
            },
            userId
          );
          break;

        case 'analyze':
          result = await this.agentService.handleAnalyze(
            { insights: true },
            userId
          );
          break;

        case 'search':
          result = await this.agentService.handleSearch(
            {
              query: intent.input,
              limit: 5,
            },
            userId
          );
          break;

        default:
          result = {
            success: false,
            error: {
              code: 'INTENT_NOT_RECOGNIZED',
              message: 'Could not understand your request',
              recovery: 'Try being more specific or use structured endpoints',
            },
            metadata: {
              requestId: `req_${Date.now()}`,
              timestamp: new Date().toISOString(),
              processingTime: 0,
              apiVersion: '1.0.0',
              rateLimit: { remaining: 59, reset: new Date().toISOString() },
            },
          };
      }

      res.json({
        ...result,
        context: {
          originalMessage: message,
          interpretedIntent: intent,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Parse natural language intent
   */
  private parseIntent(message: string) {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('generate') || lowerMessage.includes('create')) {
      if (lowerMessage.includes('video')) {
        return {
          action: 'generate',
          type: 'video',
          input: message,
          parameters: {},
        };
      } else if (lowerMessage.includes('blog') || lowerMessage.includes('article')) {
        return {
          action: 'generate',
          type: 'blog',
          input: message,
          parameters: {},
        };
      }
    }

    if (lowerMessage.includes('analyze') || lowerMessage.includes('performance')) {
      return {
        action: 'analyze',
        input: message,
        parameters: {},
      };
    }

    if (lowerMessage.includes('search') || lowerMessage.includes('find')) {
      return {
        action: 'search',
        input: message.replace(/search|find/gi, '').trim(),
        parameters: {},
      };
    }

    return {
      action: 'unknown',
      input: message,
      parameters: {},
    };
  }
}