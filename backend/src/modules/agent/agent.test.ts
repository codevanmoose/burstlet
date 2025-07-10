import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { AgentService } from './service';
import { AIGenerationService } from '../ai-generation/service';
import { PlatformIntegrationsService } from '../platform-integrations/service';
import { ContentManagementService } from '../content-management/service';
import { AnalyticsService } from '../analytics/service';

// Mock Prisma
const mockPrisma = {} as PrismaClient;

// Mock services
const mockAIService = {
  generateVideo: jest.fn(),
  generateBlog: jest.fn(),
  generateSocialContent: jest.fn(),
  generateVideoScript: jest.fn(),
} as unknown as AIGenerationService;

const mockPlatformService = {
  publishContent: jest.fn(),
} as unknown as PlatformIntegrationsService;

const mockContentService = {
  createContent: jest.fn(),
  searchContent: jest.fn(),
} as unknown as ContentManagementService;

const mockAnalyticsService = {
  getOverview: jest.fn(),
  generateInsights: jest.fn(),
} as unknown as AnalyticsService;

describe('AgentService', () => {
  let service: AgentService;

  beforeEach(() => {
    service = new AgentService(
      mockPrisma,
      mockAIService,
      mockPlatformService,
      mockContentService,
      mockAnalyticsService
    );
    jest.clearAllMocks();
  });

  describe('getCapabilities', () => {
    it('should return agent capabilities', async () => {
      const capabilities = await service.getCapabilities();

      expect(capabilities).toHaveProperty('actions');
      expect(capabilities).toHaveProperty('platforms');
      expect(capabilities).toHaveProperty('limits');
      expect(capabilities.actions).toContain('generate');
      expect(capabilities.platforms).toContain('youtube');
    });
  });

  describe('handleGenerate', () => {
    it('should generate video content', async () => {
      const mockJob = { id: 'job_123', status: 'processing' };
      (mockAIService.generateVideo as jest.Mock).mockResolvedValue(mockJob);

      const result = await service.handleGenerate(
        {
          action: 'video',
          input: 'Create a tutorial',
          parameters: { duration: 60 },
        },
        'user_123'
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockJob);
      expect(result.metadata).toBeDefined();
      expect(mockAIService.generateVideo).toHaveBeenCalledWith({
        prompt: 'Create a tutorial',
        aspectRatio: '9:16',
        duration: 60,
        style: 'modern',
        userId: 'user_123',
      });
    });

    it('should handle generation errors', async () => {
      (mockAIService.generateVideo as jest.Mock).mockRejectedValue(
        new Error('Generation failed')
      );

      const result = await service.handleGenerate(
        {
          action: 'video',
          input: 'Create a tutorial',
        },
        'user_123'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('GENERATION_ERROR');
      expect(result.error?.recovery).toBeDefined();
    });
  });

  describe('handleAnalyze', () => {
    it('should analyze content with insights', async () => {
      const mockAnalytics = {
        views: 50000,
        engagement: 5.2,
        growth: 15,
      };
      const mockInsights = {
        insights: ['Peak engagement on weekends', 'Short videos perform better'],
      };

      (mockAnalyticsService.getOverview as jest.Mock).mockResolvedValue(mockAnalytics);
      (mockAnalyticsService.generateInsights as jest.Mock).mockResolvedValue(mockInsights);

      const result = await service.handleAnalyze(
        { insights: true },
        'user_123'
      );

      expect(result.success).toBe(true);
      expect(result.data?.metrics).toEqual(mockAnalytics);
      expect(result.data?.insights).toEqual(mockInsights.insights);
      expect(result.data?.recommendations).toBeDefined();
    });
  });

  describe('handlePublish', () => {
    it('should publish content to platforms', async () => {
      const mockContent = { id: 'content_123' };
      const mockPublishResult = { platform: 'youtube', status: 'published' };

      (mockContentService.createContent as jest.Mock).mockResolvedValue(mockContent);
      (mockPlatformService.publishContent as jest.Mock).mockResolvedValue(mockPublishResult);

      const result = await service.handlePublish(
        {
          content: {
            title: 'Test Video',
            type: 'video',
          },
          platforms: ['youtube'],
        },
        'user_123'
      );

      expect(result.success).toBe(true);
      expect(result.data?.contentId).toBe('content_123');
      expect(result.data?.publishResults).toHaveLength(1);
      expect(result.suggestions).toBeDefined();
    });
  });

  describe('handleSearch', () => {
    it('should search content', async () => {
      const mockResults = {
        items: [
          { id: 'content_1', title: 'Video 1' },
          { id: 'content_2', title: 'Video 2' },
        ],
        total: 2,
      };

      (mockContentService.searchContent as jest.Mock).mockResolvedValue(mockResults);

      const result = await service.handleSearch(
        {
          query: 'tutorial',
          limit: 10,
        },
        'user_123'
      );

      expect(result.success).toBe(true);
      expect(result.data?.results).toEqual(mockResults.items);
      expect(result.data?.total).toBe(2);
    });
  });

  describe('handleWorkflow', () => {
    it('should execute workflow steps', async () => {
      const mockJob = { id: 'job_123', status: 'processing' };
      (mockAIService.generateVideo as jest.Mock).mockResolvedValue(mockJob);

      const result = await service.handleWorkflow(
        {
          workflow: 'create_and_publish',
          steps: [
            {
              action: 'generate',
              parameters: { prompt: 'Create tutorial' },
            },
          ],
        },
        'user_123'
      );

      expect(result.success).toBe(true);
      expect(result.data?.workflow).toBe('create_and_publish');
      expect(result.data?.completed).toBe(1);
    });
  });
});