import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { AnalyticsService } from './service';
import { AnalyticsError } from './types';

// Mock Prisma
const mockPrisma = {
  analyticsMetric: {
    createMany: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn(),
  },
  analyticsReport: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
  analyticsAlert: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  content: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
  },
  platformIntegration: {
    findMany: jest.fn(),
  },
  notification: {
    create: jest.fn(),
  },
  $transaction: jest.fn((ops) => Promise.all(ops)),
} as unknown as PrismaClient;

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    service = new AnalyticsService(mockPrisma);
    jest.clearAllMocks();
  });

  describe('collectMetrics', () => {
    it('should collect metrics successfully', async () => {
      const userId = 'user-123';
      const contentId = 'content-123';
      const platform = 'YOUTUBE';
      const metrics = {
        views: 1000,
        likes: 50,
        comments: 10,
      };

      (mockPrisma.analyticsMetric.createMany as jest.Mock).mockResolvedValue({ count: 3 });

      await service.collectMetrics(userId, contentId, platform, metrics);

      expect(mockPrisma.analyticsMetric.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            userId,
            contentId,
            platform,
            metricType: 'VIEWS',
            value: 1000,
          }),
          expect.objectContaining({
            userId,
            contentId,
            platform,
            metricType: 'LIKES',
            value: 50,
          }),
          expect.objectContaining({
            userId,
            contentId,
            platform,
            metricType: 'COMMENTS',
            value: 10,
          }),
        ]),
      });
    });
  });

  describe('getAnalytics', () => {
    it('should return analytics metrics', async () => {
      const request = {
        dateFrom: '2024-01-01T00:00:00Z',
        dateTo: '2024-01-31T23:59:59Z',
        platform: 'YOUTUBE' as const,
      };

      const mockMetrics = [
        {
          id: 'metric-1',
          userId: 'user-123',
          metricType: 'VIEWS',
          value: 1000,
          timestamp: new Date('2024-01-15'),
        },
        {
          id: 'metric-2',
          userId: 'user-123',
          metricType: 'LIKES',
          value: 50,
          timestamp: new Date('2024-01-15'),
        },
      ];

      (mockPrisma.analyticsMetric.findMany as jest.Mock).mockResolvedValue(mockMetrics);

      const result = await service.getAnalytics('user-123', request);

      expect(result.metrics).toEqual(mockMetrics);
      expect(result.period.start).toEqual(new Date(request.dateFrom));
      expect(result.period.end).toEqual(new Date(request.dateTo));
      expect(result.aggregated).toBeDefined();
    });

    it('should aggregate metrics by day', async () => {
      const request = {
        dateFrom: '2024-01-01T00:00:00Z',
        dateTo: '2024-01-02T23:59:59Z',
        groupBy: 'day' as const,
      };

      const mockMetrics = [
        {
          metricType: 'VIEWS',
          value: 500,
          timestamp: new Date('2024-01-01T10:00:00'),
        },
        {
          metricType: 'VIEWS',
          value: 300,
          timestamp: new Date('2024-01-01T15:00:00'),
        },
        {
          metricType: 'VIEWS',
          value: 700,
          timestamp: new Date('2024-01-02T10:00:00'),
        },
      ];

      (mockPrisma.analyticsMetric.findMany as jest.Mock).mockResolvedValue(mockMetrics);

      const result = await service.getAnalytics('user-123', request);

      expect(result.aggregated['2024-01-01'].VIEWS).toBe(800);
      expect(result.aggregated['2024-01-02'].VIEWS).toBe(700);
    });
  });

  describe('getContentAnalytics', () => {
    it('should return content analytics', async () => {
      const mockContent = {
        id: 'content-123',
        title: 'Test Video',
        type: 'VIDEO',
        analyticsMetrics: [
          { metricType: 'VIEWS', value: 1000 },
          { metricType: 'LIKES', value: 100 },
          { metricType: 'COMMENTS', value: 20 },
          { metricType: 'SHARES', value: 5 },
        ],
        platformPosts: [
          {
            id: 'post-123',
            platformPostId: 'yt-123',
            platform: { name: 'YouTube' },
          },
        ],
      };

      (mockPrisma.content.findMany as jest.Mock).mockResolvedValue([mockContent]);

      const result = await service.getContentAnalytics('user-123', {});

      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].totalViews).toBe(1000);
      expect(result.contents[0].totalLikes).toBe(100);
      expect(result.contents[0].engagementRate).toBeGreaterThan(0);
      expect(result.summary.totalViews).toBe(1000);
      expect(result.summary.totalEngagement).toBe(125); // likes + comments + shares
    });
  });

  describe('createAlert', () => {
    it('should create an alert', async () => {
      const request = {
        name: 'High Views Alert',
        type: 'THRESHOLD' as const,
        condition: {
          metric: 'VIEWS',
          operator: 'GREATER_THAN' as const,
          value: 10000,
          timeWindow: '24h',
        },
        notifications: {
          email: true,
          inApp: true,
        },
      };

      const mockAlert = {
        id: 'alert-123',
        userId: 'user-123',
        ...request,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.analyticsAlert.create as jest.Mock).mockResolvedValue(mockAlert);

      const result = await service.createAlert('user-123', request);

      expect(result.id).toBe('alert-123');
      expect(result.name).toBe('High Views Alert');
      expect(result.isActive).toBe(true);
    });
  });

  describe('compareContent', () => {
    it('should compare content performance', async () => {
      const mockContents = [
        {
          id: 'content-1',
          title: 'Video 1',
          analyticsMetrics: [
            { metricType: 'VIEWS', value: 1000 },
            { metricType: 'LIKES', value: 100 },
          ],
        },
        {
          id: 'content-2',
          title: 'Video 2',
          analyticsMetrics: [
            { metricType: 'VIEWS', value: 2000 },
            { metricType: 'LIKES', value: 50 },
          ],
        },
      ];

      (mockPrisma.content.findMany as jest.Mock).mockResolvedValue(mockContents);

      const result = await service.compareContent('user-123', {
        contentIds: ['content-1', 'content-2'],
        metrics: ['VIEWS', 'LIKES'],
      });

      expect(result.contents).toHaveLength(2);
      expect(result.winner.contentId).toBe('content-2'); // Higher views
      expect(result.winner.winningMetrics).toContain('VIEWS');
    });
  });

  describe('getDashboard', () => {
    it('should return dashboard data', async () => {
      // Mock metrics summary
      (mockPrisma.analyticsMetric.findMany as jest.Mock)
        .mockResolvedValueOnce([
          { metricType: 'VIEWS', value: 5000 },
          { metricType: 'LIKES', value: 500 },
          { metricType: 'REVENUE', value: 100 },
        ])
        .mockResolvedValueOnce([
          { metricType: 'VIEWS', value: 4000 },
          { metricType: 'LIKES', value: 400 },
          { metricType: 'REVENUE', value: 80 },
        ]);

      // Mock content data
      (mockPrisma.content.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.content.count as jest.Mock).mockResolvedValue(10);

      const result = await service.getDashboard('user-123');

      expect(result.overview.totalViews).toBe(5000);
      expect(result.overview.totalEngagement).toBe(500);
      expect(result.overview.totalRevenue).toBe(100);
      expect(result.overview.viewsChange).toBe(25); // 25% increase
      expect(result.overview.activeContent).toBe(10);
    });
  });

  describe('getInsights', () => {
    it('should return content insights', async () => {
      const request = {
        type: 'CONTENT' as const,
        limit: 5,
      };

      // Mock would normally have complex insight generation logic
      const result = await service.getInsights('user-123', request);

      expect(result.insights).toBeDefined();
      expect(result.insights).toBeInstanceOf(Array);
    });
  });

  describe('createReport', () => {
    it('should create a performance report', async () => {
      const request = {
        name: 'Monthly Performance',
        type: 'PERFORMANCE' as const,
        dateRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z',
        },
        format: 'JSON' as const,
      };

      const mockReport = {
        id: 'report-123',
        userId: 'user-123',
        ...request,
        data: { metrics: {} },
        createdAt: new Date(),
      };

      (mockPrisma.analyticsReport.create as jest.Mock).mockResolvedValue(mockReport);

      const result = await service.createReport('user-123', request);

      expect(result.id).toBe('report-123');
      expect(result.name).toBe('Monthly Performance');
      expect(result.type).toBe('PERFORMANCE');
    });

    it('should generate download URL for non-JSON formats', async () => {
      const request = {
        name: 'Revenue Report',
        type: 'REVENUE' as const,
        dateRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z',
        },
        format: 'PDF' as const,
      };

      const mockReport = {
        id: 'report-123',
        userId: 'user-123',
        ...request,
        data: {},
        createdAt: new Date(),
      };

      (mockPrisma.analyticsReport.create as jest.Mock).mockResolvedValue(mockReport);
      (mockPrisma.analyticsReport.update as jest.Mock).mockResolvedValue({
        ...mockReport,
        downloadUrl: 'https://storage.burstlet.com/reports/report-123.pdf',
      });

      const result = await service.createReport('user-123', request);

      expect(result.downloadUrl).toBeDefined();
      expect(result.downloadUrl).toContain('.pdf');
    });
  });

  describe('Alert Management', () => {
    it('should update an alert', async () => {
      const mockAlert = {
        id: 'alert-123',
        userId: 'user-123',
        name: 'Test Alert',
        isActive: true,
      };

      (mockPrisma.analyticsAlert.findFirst as jest.Mock).mockResolvedValue(mockAlert);
      (mockPrisma.analyticsAlert.update as jest.Mock).mockResolvedValue({
        ...mockAlert,
        name: 'Updated Alert',
        updatedAt: new Date(),
      });

      const result = await service.updateAlert('user-123', 'alert-123', {
        name: 'Updated Alert',
      });

      expect(result.name).toBe('Updated Alert');
    });

    it('should delete an alert', async () => {
      const mockAlert = {
        id: 'alert-123',
        userId: 'user-123',
      };

      (mockPrisma.analyticsAlert.findFirst as jest.Mock).mockResolvedValue(mockAlert);
      (mockPrisma.analyticsAlert.delete as jest.Mock).mockResolvedValue(mockAlert);

      await service.deleteAlert('user-123', 'alert-123');

      expect(mockPrisma.analyticsAlert.delete).toHaveBeenCalledWith({
        where: { id: 'alert-123' },
      });
    });

    it('should throw error when deleting non-existent alert', async () => {
      (mockPrisma.analyticsAlert.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.deleteAlert('user-123', 'non-existent')
      ).rejects.toThrow(AnalyticsError);
    });
  });
});