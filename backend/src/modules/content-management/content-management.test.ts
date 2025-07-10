import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { ContentManagementService } from './service';
import { ContentError, TemplateError, CalendarError } from './types';

// Mock Prisma
const mockPrisma = {
  content: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  contentVersion: {
    create: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  contentTemplate: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  contentCalendar: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  contentTag: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  contentGeneration: {
    findUnique: jest.fn(),
  },
  platformPost: {
    findMany: jest.fn(),
  },
  $transaction: jest.fn((ops) => Promise.all(ops)),
} as unknown as PrismaClient;

describe('ContentManagementService', () => {
  let service: ContentManagementService;

  beforeEach(() => {
    service = new ContentManagementService(mockPrisma);
    jest.clearAllMocks();
  });

  describe('createContent', () => {
    const createRequest = {
      title: 'Test Content',
      description: 'Test description',
      type: 'VIDEO' as const,
      tags: ['test', 'video'],
      content: { script: 'Test script' },
    };

    const mockContent = {
      id: 'content-123',
      userId: 'user-123',
      title: 'Test Content',
      description: 'Test description',
      type: 'VIDEO',
      status: 'DRAFT',
      tags: ['test', 'video'],
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create content successfully', async () => {
      (mockPrisma.contentTag.findFirst as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      
      (mockPrisma.contentTag.create as jest.Mock)
        .mockResolvedValueOnce({ id: 'tag-1', name: 'test', slug: 'test' })
        .mockResolvedValueOnce({ id: 'tag-2', name: 'video', slug: 'video' });

      (mockPrisma.content.create as jest.Mock).mockResolvedValue(mockContent);
      (mockPrisma.contentVersion.create as jest.Mock).mockResolvedValue({});

      const result = await service.createContent('user-123', createRequest);

      expect(result.content).toHaveProperty('id');
      expect(result.content.title).toBe('Test Content');
      expect(result.content.type).toBe('VIDEO');
      expect(mockPrisma.content.create).toHaveBeenCalled();
      expect(mockPrisma.contentVersion.create).toHaveBeenCalled();
    });

    it('should validate generation ID if provided', async () => {
      const requestWithGeneration = {
        ...createRequest,
        generationId: 'gen-123',
      };

      (mockPrisma.contentGeneration.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.createContent('user-123', requestWithGeneration)
      ).rejects.toThrow(ContentError);
    });
  });

  describe('updateContent', () => {
    const updateRequest = {
      title: 'Updated Title',
      status: 'REVIEW' as const,
      changeNote: 'Updated title and status',
    };

    const existingContent = {
      id: 'content-123',
      userId: 'user-123',
      title: 'Original Title',
      status: 'DRAFT',
      tags: ['test'],
      metadata: { views: 0 },
      version: 1,
    };

    it('should update content successfully', async () => {
      (mockPrisma.content.findUnique as jest.Mock).mockResolvedValue(existingContent);
      (mockPrisma.content.update as jest.Mock).mockResolvedValue({
        ...existingContent,
        ...updateRequest,
        version: 2,
      });
      (mockPrisma.contentVersion.create as jest.Mock).mockResolvedValue({});

      const result = await service.updateContent('user-123', 'content-123', updateRequest);

      expect(result.content.title).toBe('Updated Title');
      expect(result.content.status).toBe('REVIEW');
      expect(mockPrisma.content.update).toHaveBeenCalledWith({
        where: { id: 'content-123' },
        data: expect.objectContaining({
          title: 'Updated Title',
          status: 'REVIEW',
          version: { increment: 1 },
        }),
      });
    });

    it('should throw error if content not found', async () => {
      (mockPrisma.content.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateContent('user-123', 'non-existent', updateRequest)
      ).rejects.toThrow(ContentError);
    });
  });

  describe('deleteContent', () => {
    it('should delete draft content', async () => {
      const mockContent = {
        id: 'content-123',
        userId: 'user-123',
        status: 'DRAFT',
      };

      (mockPrisma.content.findUnique as jest.Mock).mockResolvedValue(mockContent);
      (mockPrisma.$transaction as jest.Mock).mockResolvedValue([]);

      await service.deleteContent('user-123', 'content-123');

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should not delete published content', async () => {
      const mockContent = {
        id: 'content-123',
        userId: 'user-123',
        status: 'PUBLISHED',
      };

      (mockPrisma.content.findUnique as jest.Mock).mockResolvedValue(mockContent);

      await expect(
        service.deleteContent('user-123', 'content-123')
      ).rejects.toThrow(ContentError);
    });
  });

  describe('createTemplate', () => {
    const templateRequest = {
      name: 'Video Template',
      type: 'VIDEO' as const,
      template: {
        title: '{{title}}',
        description: '{{description}}',
        script: 'Standard intro...',
      },
      tags: ['template', 'video'],
    };

    it('should create template successfully', async () => {
      const mockTemplate = {
        id: 'template-123',
        userId: 'user-123',
        name: 'Video Template',
        type: 'VIDEO',
        template: templateRequest.template,
        tags: ['template', 'video'],
        isPublic: false,
        usageCount: 0,
      };

      (mockPrisma.contentTag.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.contentTag.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.contentTemplate.create as jest.Mock).mockResolvedValue(mockTemplate);

      const result = await service.createTemplate('user-123', templateRequest);

      expect(result.template).toHaveProperty('id');
      expect(result.template.name).toBe('Video Template');
      expect(mockPrisma.contentTemplate.create).toHaveBeenCalled();
    });
  });

  describe('scheduleContent', () => {
    const scheduleRequest = {
      contentId: 'content-123',
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      platforms: ['YOUTUBE', 'TWITTER'],
    };

    it('should schedule approved content', async () => {
      const mockContent = {
        id: 'content-123',
        userId: 'user-123',
        status: 'APPROVED',
      };

      const mockCalendar = {
        id: 'calendar-123',
        userId: 'user-123',
        contentId: 'content-123',
        scheduledDate: new Date(scheduleRequest.scheduledDate),
        platforms: scheduleRequest.platforms,
        status: 'SCHEDULED',
      };

      (mockPrisma.content.findUnique as jest.Mock).mockResolvedValue(mockContent);
      (mockPrisma.contentCalendar.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.contentCalendar.create as jest.Mock).mockResolvedValue(mockCalendar);
      (mockPrisma.content.update as jest.Mock).mockResolvedValue({});

      const result = await service.scheduleContent('user-123', scheduleRequest);

      expect(result).toHaveProperty('id');
      expect(result.platforms).toEqual(['YOUTUBE', 'TWITTER']);
      expect(result.status).toBe('SCHEDULED');
    });

    it('should not schedule unapproved content', async () => {
      const mockContent = {
        id: 'content-123',
        userId: 'user-123',
        status: 'DRAFT',
      };

      (mockPrisma.content.findUnique as jest.Mock).mockResolvedValue(mockContent);

      await expect(
        service.scheduleContent('user-123', scheduleRequest)
      ).rejects.toThrow(ContentError);
    });

    it('should not schedule already scheduled content', async () => {
      const mockContent = {
        id: 'content-123',
        userId: 'user-123',
        status: 'APPROVED',
      };

      (mockPrisma.content.findUnique as jest.Mock).mockResolvedValue(mockContent);
      (mockPrisma.contentCalendar.findFirst as jest.Mock).mockResolvedValue({
        id: 'existing-schedule',
        status: 'SCHEDULED',
      });

      await expect(
        service.scheduleContent('user-123', scheduleRequest)
      ).rejects.toThrow(CalendarError);
    });
  });

  describe('listContent', () => {
    it('should list content with filters', async () => {
      const mockContents = [
        { id: 'content-1', title: 'Video 1', type: 'VIDEO', status: 'DRAFT' },
        { id: 'content-2', title: 'Blog 1', type: 'BLOG', status: 'PUBLISHED' },
      ];

      (mockPrisma.content.findMany as jest.Mock).mockResolvedValue(mockContents);
      (mockPrisma.content.count as jest.Mock).mockResolvedValue(2);

      const result = await service.listContent('user-123', {
        type: 'VIDEO',
        limit: 10,
        offset: 0,
      });

      expect(result.contents).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('getContentStats', () => {
    it('should return content statistics', async () => {
      (mockPrisma.content.count as jest.Mock)
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(10)  // recently updated
        .mockResolvedValueOnce(25); // published

      (mockPrisma.content.groupBy as jest.Mock)
        .mockResolvedValueOnce([
          { type: 'VIDEO', _count: 40 },
          { type: 'BLOG', _count: 60 },
        ])
        .mockResolvedValueOnce([
          { status: 'DRAFT', _count: 50 },
          { status: 'PUBLISHED', _count: 25 },
          { status: 'REVIEW', _count: 25 },
        ]);

      (mockPrisma.contentCalendar.count as jest.Mock).mockResolvedValue(5);

      const stats = await service.getContentStats('user-123');

      expect(stats.total).toBe(100);
      expect(stats.byType.VIDEO).toBe(40);
      expect(stats.byType.BLOG).toBe(60);
      expect(stats.byStatus.DRAFT).toBe(50);
      expect(stats.scheduled).toBe(5);
      expect(stats.published).toBe(25);
    });
  });
});