import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { AgentService } from './service';
import { AgentController } from './controller';
import { createAgentRoutes } from './routes';
import { AuthMiddleware } from '../auth/middleware';
import { AIGenerationService } from '../ai-generation/service';
import { PlatformIntegrationsService } from '../platform-integrations/service';
import { ContentManagementService } from '../content-management/service';
import { AnalyticsService } from '../analytics/service';

export interface AgentModuleConfig {
  prefix?: string;
  enableChat?: boolean;
  enableMCP?: boolean;
}

export class AgentModule {
  private service: AgentService;
  private controller: AgentController;
  private config: AgentModuleConfig;

  constructor(
    private prisma: PrismaClient,
    private aiService: AIGenerationService,
    private platformService: PlatformIntegrationsService,
    private contentService: ContentManagementService,
    private analyticsService: AnalyticsService,
    config: AgentModuleConfig = {}
  ) {
    this.config = {
      prefix: '/api/v1/agent',
      enableChat: true,
      enableMCP: true,
      ...config,
    };

    // Initialize service and controller
    this.service = new AgentService(
      prisma,
      aiService,
      platformService,
      contentService,
      analyticsService
    );
    this.controller = new AgentController(this.service);
  }

  /**
   * Initialize the agent module
   */
  async init(app: Express): Promise<void> {
    // Create auth middleware
    const authMiddleware = new AuthMiddleware(this.prisma);

    // Create and mount routes
    const routes = createAgentRoutes(this.controller, authMiddleware);
    app.use(this.config.prefix!, routes);

    console.log(`[AGENT] Module initialized at ${this.config.prefix}`);
    console.log(`[AGENT] Chat interface: ${this.config.enableChat ? 'enabled' : 'disabled'}`);
    console.log(`[AGENT] MCP server: ${this.config.enableMCP ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get agent service for external use
   */
  getService(): AgentService {
    return this.service;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    endpoints: number;
    capabilities: string[];
    details: any;
  }> {
    try {
      const capabilities = await this.service.getCapabilities();

      return {
        status: 'healthy',
        endpoints: 8, // Number of agent endpoints
        capabilities: capabilities.actions,
        details: {
          chat: this.config.enableChat,
          mcp: this.config.enableMCP,
          limits: capabilities.limits,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        endpoints: 0,
        capabilities: [],
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Get module statistics
   */
  async getStats(): Promise<{
    totalRequests: number;
    requestsByType: Record<string, number>;
    averageResponseTime: number;
    successRate: number;
  }> {
    // In a real implementation, these would be tracked
    return {
      totalRequests: 0,
      requestsByType: {
        generate: 0,
        analyze: 0,
        publish: 0,
        search: 0,
        workflow: 0,
      },
      averageResponseTime: 0,
      successRate: 100,
    };
  }
}