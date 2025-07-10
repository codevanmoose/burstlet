import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ToolSchema,
  TextContent,
  ImageContent,
  EmbeddedContent,
} from '@modelcontextprotocol/sdk/types.js';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';

// Initialize Prisma client
const prisma = new PrismaClient();

// Tool schemas
const GenerateVideoSchema = z.object({
  prompt: z.string().describe('The prompt for video generation'),
  aspectRatio: z.enum(['16:9', '9:16', '1:1']).optional(),
  duration: z.number().min(5).max(60).optional(),
  style: z.string().optional(),
});

const PublishContentSchema = z.object({
  contentId: z.string().describe('ID of the content to publish'),
  platforms: z.array(z.enum(['youtube', 'tiktok', 'instagram', 'twitter'])),
  scheduledAt: z.string().datetime().optional(),
});

const GetAnalyticsSchema = z.object({
  timeRange: z.enum(['day', 'week', 'month', 'year']).default('week'),
  platform: z.enum(['all', 'youtube', 'tiktok', 'instagram', 'twitter']).optional(),
});

const SearchContentSchema = z.object({
  query: z.string().describe('Search query'),
  type: z.enum(['video', 'blog', 'social']).optional(),
  status: z.enum(['draft', 'published', 'scheduled']).optional(),
});

// MCP Server implementation
class BurstletMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'burstlet-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'generate_video',
          description: 'Generate a video from a text prompt using AI',
          inputSchema: {
            type: 'object',
            properties: {
              prompt: { type: 'string', description: 'The prompt for video generation' },
              aspectRatio: { 
                type: 'string', 
                enum: ['16:9', '9:16', '1:1'],
                description: 'Video aspect ratio' 
              },
              duration: { 
                type: 'number', 
                minimum: 5, 
                maximum: 60,
                description: 'Video duration in seconds' 
              },
              style: { type: 'string', description: 'Visual style preference' },
            },
            required: ['prompt'],
          },
        },
        {
          name: 'publish_content',
          description: 'Publish content to social media platforms',
          inputSchema: {
            type: 'object',
            properties: {
              contentId: { type: 'string', description: 'ID of the content to publish' },
              platforms: {
                type: 'array',
                items: { type: 'string', enum: ['youtube', 'tiktok', 'instagram', 'twitter'] },
                description: 'Target platforms',
              },
              scheduledAt: { 
                type: 'string', 
                format: 'date-time',
                description: 'Schedule publication time' 
              },
            },
            required: ['contentId', 'platforms'],
          },
        },
        {
          name: 'get_analytics',
          description: 'Get analytics data for content performance',
          inputSchema: {
            type: 'object',
            properties: {
              timeRange: { 
                type: 'string', 
                enum: ['day', 'week', 'month', 'year'],
                default: 'week',
                description: 'Time range for analytics' 
              },
              platform: { 
                type: 'string', 
                enum: ['all', 'youtube', 'tiktok', 'instagram', 'twitter'],
                description: 'Filter by platform' 
              },
            },
          },
        },
        {
          name: 'search_content',
          description: 'Search through content library',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' },
              type: { 
                type: 'string', 
                enum: ['video', 'blog', 'social'],
                description: 'Content type filter' 
              },
              status: { 
                type: 'string', 
                enum: ['draft', 'published', 'scheduled'],
                description: 'Content status filter' 
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'list_templates',
          description: 'List available content templates',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'generate_video':
            return await this.handleGenerateVideo(GenerateVideoSchema.parse(args));

          case 'publish_content':
            return await this.handlePublishContent(PublishContentSchema.parse(args));

          case 'get_analytics':
            return await this.handleGetAnalytics(GetAnalyticsSchema.parse(args));

          case 'search_content':
            return await this.handleSearchContent(SearchContentSchema.parse(args));

          case 'list_templates':
            return await this.handleListTemplates();

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    });
  }

  private async handleGenerateVideo(params: z.infer<typeof GenerateVideoSchema>) {
    // In a real implementation, this would call the AI generation service
    const jobId = `job_${Date.now()}`;
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            jobId,
            status: 'processing',
            estimatedTime: 120,
            message: `Video generation started for prompt: "${params.prompt}"`,
            parameters: {
              aspectRatio: params.aspectRatio || '9:16',
              duration: params.duration || 30,
              style: params.style || 'modern',
            },
          }, null, 2),
        },
      ],
    };
  }

  private async handlePublishContent(params: z.infer<typeof PublishContentSchema>) {
    // Simulate content publishing
    const publishResults = params.platforms.map(platform => ({
      platform,
      status: 'queued',
      scheduledAt: params.scheduledAt || new Date().toISOString(),
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            contentId: params.contentId,
            publishResults,
            message: `Content scheduled for publishing to ${params.platforms.length} platforms`,
          }, null, 2),
        },
      ],
    };
  }

  private async handleGetAnalytics(params: z.infer<typeof GetAnalyticsSchema>) {
    // Simulate analytics data
    const analytics = {
      timeRange: params.timeRange,
      platform: params.platform || 'all',
      metrics: {
        totalViews: Math.floor(Math.random() * 100000),
        totalEngagement: Math.floor(Math.random() * 10000),
        averageWatchTime: Math.floor(Math.random() * 60),
        growthRate: (Math.random() * 20).toFixed(2),
      },
      topContent: [
        {
          id: 'content_1',
          title: 'AI Productivity Tips',
          views: Math.floor(Math.random() * 50000),
          engagement: Math.floor(Math.random() * 5000),
        },
        {
          id: 'content_2',
          title: '10 Tech Trends 2024',
          views: Math.floor(Math.random() * 30000),
          engagement: Math.floor(Math.random() * 3000),
        },
      ],
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(analytics, null, 2),
        },
      ],
    };
  }

  private async handleSearchContent(params: z.infer<typeof SearchContentSchema>) {
    // Simulate content search
    const results = [
      {
        id: 'content_123',
        title: 'Sample Video Content',
        type: params.type || 'video',
        status: params.status || 'published',
        createdAt: new Date().toISOString(),
        platforms: ['youtube', 'tiktok'],
      },
      {
        id: 'content_124',
        title: 'Another Content Item',
        type: params.type || 'blog',
        status: params.status || 'draft',
        createdAt: new Date().toISOString(),
        platforms: ['twitter'],
      },
    ];

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            query: params.query,
            results,
            total: results.length,
          }, null, 2),
        },
      ],
    };
  }

  private async handleListTemplates() {
    const templates = [
      {
        id: 'template_1',
        name: 'Weekly Update',
        type: 'video',
        variables: ['week_number', 'topic', 'highlights'],
        description: 'Weekly content update template',
      },
      {
        id: 'template_2',
        name: 'Product Review',
        type: 'video',
        variables: ['product_name', 'rating', 'pros', 'cons'],
        description: 'Product review video template',
      },
      {
        id: 'template_3',
        name: 'Tutorial',
        type: 'video',
        variables: ['skill_name', 'difficulty', 'steps'],
        description: 'Step-by-step tutorial template',
      },
    ];

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            templates,
            total: templates.length,
          }, null, 2),
        },
      ],
    };
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Burstlet MCP server started');
  }
}

// Start the server
const server = new BurstletMCPServer();
server.start().catch(console.error);

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});