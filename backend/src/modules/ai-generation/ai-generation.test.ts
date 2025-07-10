import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { AIGenerationService } from './service';
import { AuthService } from '../auth/service';
import { ProviderFactory } from './providers/factory';
import { GenerationError, QuotaError } from './types';

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
  contentGeneration: {
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn(),
    updateMany: jest.fn(),
  },
  videoGeneration: {
    create: jest.fn(),
  },
  blogGeneration: {
    create: jest.fn(),
  },
  usageRecord: {
    create: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  subscription: {
    findUnique: jest.fn(),
  },
} as unknown as PrismaClient;

// Mock AuthService
const mockAuthService = {
  getCurrentUser: jest.fn(),
} as unknown as AuthService;

// Mock Provider
const mockVideoProvider = {
  getName: jest.fn().mockReturnValue('HAILUOAI'),
  getType: jest.fn().mockReturnValue('VIDEO'),
  isHealthy: jest.fn().mockResolvedValue(true),
  generateVideo: jest.fn(),
  getSupportedAspectRatios: jest.fn().mockReturnValue(['16:9', '9:16']),
  getSupportedQualities: jest.fn().mockReturnValue(['standard', 'high']),
  getMaxDuration: jest.fn().mockReturnValue(60),
  estimateCost: jest.fn().mockReturnValue(0.5),
};

const mockTextProvider = {
  getName: jest.fn().mockReturnValue('OPENAI'),
  getType: jest.fn().mockReturnValue('TEXT'),
  isHealthy: jest.fn().mockResolvedValue(true),
  generateText: jest.fn(),
  generateBlog: jest.fn(),
  generateSocialPost: jest.fn(),
  generateScript: jest.fn(),
  getMaxTokens: jest.fn().mockReturnValue(4000),
  getSupportedModels: jest.fn().mockReturnValue(['gpt-4', 'gpt-3.5-turbo']),
  estimateTokens: jest.fn().mockReturnValue(100),
  estimateCost: jest.fn().mockReturnValue(0.01),
};

describe('AIGenerationService', () => {
  let aiService: AIGenerationService;

  beforeEach(() => {
    aiService = new AIGenerationService(mockPrisma, mockAuthService);
    jest.clearAllMocks();

    // Mock ProviderFactory
    jest.spyOn(ProviderFactory, 'getVideoProvider').mockReturnValue(mockVideoProvider as any);
    jest.spyOn(ProviderFactory, 'getTextProvider').mockReturnValue(mockTextProvider as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('generateVideo', () => {
    const videoRequest = {
      prompt: 'Create a video about cats',
      style: 'realistic',
      duration: 15,
      aspectRatio: '16:9' as const,
      quality: 'STANDARD' as const,
    };

    const mockUser = {
      id: 'user-123',
      subscription: { plan: 'PRO' },
    };

    const mockContentGeneration = {
      id: 'gen-123',
      userId: 'user-123',
      type: 'VIDEO',
      status: 'PENDING',
      prompt: 'Create a video about cats',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should generate video successfully', async () => {
      // Mock database responses
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.usageRecord.count as jest.Mock).mockResolvedValue(5); // Under quota
      (mockPrisma.contentGeneration.create as jest.Mock).mockResolvedValue(mockContentGeneration);
      (mockPrisma.contentGeneration.update as jest.Mock).mockResolvedValue(mockContentGeneration);
      (mockPrisma.videoGeneration.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.usageRecord.create as jest.Mock).mockResolvedValue({});

      // Mock provider response
      mockVideoProvider.generateVideo.mockResolvedValue({
        success: true,
        data: {
          videoUrl: 'https://example.com/video.mp4',
          thumbnailUrl: 'https://example.com/thumb.jpg',
          duration: 15,
          aspectRatio: '16:9',
          quality: 'STANDARD',
        },
        metadata: {
          processingTime: 5000,
          cost: 0.5,
          provider: 'HAILUOAI',
        },
      });

      const result = await aiService.generateVideo('user-123', videoRequest);

      expect(result).toHaveProperty('id');
      expect(result.type).toBe('VIDEO');
      expect(result.status).toBe('COMPLETED');
      expect(result.result).toHaveProperty('videoUrl');
      expect(mockVideoProvider.generateVideo).toHaveBeenCalledWith(videoRequest);
      expect(mockPrisma.contentGeneration.create).toHaveBeenCalled();
      expect(mockPrisma.videoGeneration.create).toHaveBeenCalled();
      expect(mockPrisma.usageRecord.create).toHaveBeenCalled();
    });

    it('should throw quota error when monthly limit exceeded', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.usageRecord.count as jest.Mock).mockResolvedValue(500); // Over quota

      await expect(aiService.generateVideo('user-123', videoRequest))
        .rejects.toThrow(QuotaError);
    });

    it('should handle provider errors', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.usageRecord.count as jest.Mock).mockResolvedValue(5);
      (mockPrisma.contentGeneration.create as jest.Mock).mockResolvedValue(mockContentGeneration);
      (mockPrisma.contentGeneration.update as jest.Mock).mockResolvedValue(mockContentGeneration);

      mockVideoProvider.generateVideo.mockResolvedValue({
        success: false,
        error: 'Provider error',
      });

      await expect(aiService.generateVideo('user-123', videoRequest))
        .rejects.toThrow(GenerationError);

      expect(mockPrisma.contentGeneration.update).toHaveBeenCalledWith({
        where: { id: 'gen-123' },
        data: {
          status: 'FAILED',
          error: 'Provider error',
        },
      });
    });
  });

  describe('generateBlog', () => {
    const blogRequest = {
      prompt: 'Write about sustainable technology',
      tone: 'PROFESSIONAL' as const,
      wordCount: 1000,
      seoKeywords: ['sustainability', 'technology'],
    };

    const mockUser = {
      id: 'user-123',
      subscription: { plan: 'PRO' },
    };

    const mockContentGeneration = {
      id: 'gen-456',
      userId: 'user-123',
      type: 'BLOG',
      status: 'PENDING',
      prompt: 'Write about sustainable technology',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should generate blog successfully', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.usageRecord.count as jest.Mock).mockResolvedValue(10);
      (mockPrisma.contentGeneration.create as jest.Mock).mockResolvedValue(mockContentGeneration);
      (mockPrisma.contentGeneration.update as jest.Mock).mockResolvedValue(mockContentGeneration);
      (mockPrisma.blogGeneration.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.usageRecord.create as jest.Mock).mockResolvedValue({});

      const blogContent = {
        title: 'Sustainable Technology: The Future is Green',
        content: 'Lorem ipsum dolor sit amet...',
        excerpt: 'This blog explores sustainable technology...',
        wordCount: 1000,
        seoKeywords: ['sustainability', 'technology'],
      };

      mockTextProvider.generateBlog.mockResolvedValue({
        success: true,
        data: {
          content: JSON.stringify(blogContent),
        },
        metadata: {
          processingTime: 3000,
          cost: 0.02,
          provider: 'OPENAI',
        },
      });

      const result = await aiService.generateBlog('user-123', blogRequest);

      expect(result).toHaveProperty('id');
      expect(result.type).toBe('BLOG');
      expect(result.status).toBe('COMPLETED');
      expect(result.result).toHaveProperty('title');
      expect(result.result).toHaveProperty('content');
      expect(mockTextProvider.generateBlog).toHaveBeenCalledWith(blogRequest);
    });

    it('should handle non-JSON blog response', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.usageRecord.count as jest.Mock).mockResolvedValue(10);
      (mockPrisma.contentGeneration.create as jest.Mock).mockResolvedValue(mockContentGeneration);
      (mockPrisma.contentGeneration.update as jest.Mock).mockResolvedValue(mockContentGeneration);
      (mockPrisma.blogGeneration.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.usageRecord.create as jest.Mock).mockResolvedValue({});

      mockTextProvider.generateBlog.mockResolvedValue({
        success: true,
        data: {
          content: 'This is a plain text blog post without JSON structure.',
        },
        metadata: {
          processingTime: 3000,
          cost: 0.02,
          provider: 'OPENAI',
        },
      });

      const result = await aiService.generateBlog('user-123', blogRequest);

      expect(result.result).toHaveProperty('title', 'Generated Blog Post');
      expect(result.result).toHaveProperty('content');
      expect(result.result).toHaveProperty('excerpt');
      expect(result.result).toHaveProperty('wordCount');
    });
  });

  describe('getGenerationStatus', () => {
    it('should return generation status', async () => {
      const mockGeneration = {
        id: 'gen-123',
        userId: 'user-123',
        type: 'VIDEO',
        status: 'COMPLETED',
        result: { videoUrl: 'https://example.com/video.mp4' },
        error: null,
      };

      (mockPrisma.contentGeneration.findUnique as jest.Mock).mockResolvedValue(mockGeneration);

      const result = await aiService.getGenerationStatus('user-123', 'gen-123');

      expect(result).toEqual({
        id: 'gen-123',
        type: 'VIDEO',
        status: 'COMPLETED',
        result: { videoUrl: 'https://example.com/video.mp4' },
        error: null,
      });
    });

    it('should throw error for non-existent generation', async () => {
      (mockPrisma.contentGeneration.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(aiService.getGenerationStatus('user-123', 'non-existent'))
        .rejects.toThrow(GenerationError);
    });
  });

  describe('getUserGenerations', () => {
    it('should return user generations with pagination', async () => {
      const mockGenerations = [
        {
          id: 'gen-1',
          type: 'VIDEO',
          status: 'COMPLETED',
          result: {},
          error: null,
        },
        {
          id: 'gen-2',
          type: 'BLOG',
          status: 'PENDING',
          result: null,
          error: null,
        },
      ];

      (mockPrisma.contentGeneration.findMany as jest.Mock).mockResolvedValue(mockGenerations);
      (mockPrisma.contentGeneration.count as jest.Mock).mockResolvedValue(25);

      const result = await aiService.getUserGenerations('user-123', {
        type: 'VIDEO',
        limit: 10,
        offset: 0,
      });

      expect(result.generations).toHaveLength(2);
      expect(result.total).toBe(25);
      expect(mockPrisma.contentGeneration.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123', type: 'VIDEO' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 0,
      });
    });
  });
});