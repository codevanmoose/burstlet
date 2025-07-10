import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { PlatformIntegrationsService } from './service';
import { PlatformProviderFactory } from './providers/factory';
import { PlatformError, OAuthError } from './types';

// Mock Prisma
const mockPrisma = {
  platformConnection: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  platformPost: {
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
} as unknown as PrismaClient;

// Mock Provider
const mockProvider = {
  getPlatformType: jest.fn().mockReturnValue('YOUTUBE'),
  getConfig: jest.fn(),
  isHealthy: jest.fn().mockResolvedValue(true),
  getAuthorizationUrl: jest.fn(),
  exchangeCodeForToken: jest.fn(),
  refreshAccessToken: jest.fn(),
  getUserInfo: jest.fn(),
  revokeToken: jest.fn(),
  publishContent: jest.fn(),
  updatePost: jest.fn(),
  deletePost: jest.fn(),
  getPost: jest.fn(),
  uploadMedia: jest.fn(),
  getUploadProgress: jest.fn(),
  getPostAnalytics: jest.fn(),
  getAccountAnalytics: jest.fn(),
  generateCodeVerifier: jest.fn().mockReturnValue('test-verifier'),
  generateCodeChallenge: jest.fn().mockResolvedValue('test-challenge'),
};

describe('PlatformIntegrationsService', () => {
  let service: PlatformIntegrationsService;

  beforeEach(() => {
    service = new PlatformIntegrationsService(mockPrisma);
    jest.clearAllMocks();

    // Mock ProviderFactory
    jest.spyOn(PlatformProviderFactory, 'getProvider').mockReturnValue(mockProvider as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('connectPlatform', () => {
    it('should initiate OAuth connection', async () => {
      const request = {
        platform: 'YOUTUBE' as const,
        redirectUrl: 'http://localhost:3000/callback',
      };

      mockProvider.getAuthorizationUrl.mockReturnValue('https://oauth.example.com/auth');

      const result = await service.connectPlatform('user-123', request);

      expect(result).toHaveProperty('authUrl');
      expect(result).toHaveProperty('state');
      expect(result).toHaveProperty('codeVerifier');
      expect(result.authUrl).toBe('https://oauth.example.com/auth');
      expect(mockProvider.getAuthorizationUrl).toHaveBeenCalled();
    });
  });

  describe('completeOAuthConnection', () => {
    it('should complete OAuth connection and create platform connection', async () => {
      const state = 'test-state';
      const code = 'auth-code';
      const codeVerifier = 'test-verifier';

      // Store state
      service['oauthStates'].set(state, {
        platform: 'YOUTUBE',
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      mockProvider.exchangeCodeForToken.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
        scope: ['youtube.upload'],
      });

      mockProvider.getUserInfo.mockResolvedValue({
        id: 'channel-123',
        username: 'testchannel',
        displayName: 'Test Channel',
        avatar: 'https://example.com/avatar.jpg',
        followers: 1000,
        verified: true,
      });

      (mockPrisma.platformConnection.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.platformConnection.create as jest.Mock).mockResolvedValue({
        id: 'conn-123',
        userId: 'user-123',
        platform: 'YOUTUBE',
        platformAccountId: 'channel-123',
        accountName: 'Test Channel',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        isActive: true,
      });

      const result = await service.completeOAuthConnection(state, code, codeVerifier);

      expect(result).toHaveProperty('id');
      expect(result.platform).toBe('YOUTUBE');
      expect(result.accountName).toBe('Test Channel');
      expect(mockProvider.exchangeCodeForToken).toHaveBeenCalledWith({
        code,
        redirectUri: expect.any(String),
        codeVerifier,
      });
      expect(mockProvider.getUserInfo).toHaveBeenCalledWith('access-token');
    });

    it('should throw error for invalid state', async () => {
      await expect(
        service.completeOAuthConnection('invalid-state', 'code')
      ).rejects.toThrow(OAuthError);
    });
  });

  describe('publishContent', () => {
    const publishRequest = {
      platformConnectionId: 'conn-123',
      type: 'VIDEO' as const,
      title: 'Test Video',
      description: 'Test description',
      hashtags: ['test', 'video'],
      mediaUrl: 'https://example.com/video.mp4',
    };

    const mockConnection = {
      id: 'conn-123',
      userId: 'user-123',
      platform: 'YOUTUBE',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      tokenExpiresAt: new Date(Date.now() + 3600000),
      isActive: true,
    };

    const mockPost = {
      id: 'post-123',
      userId: 'user-123',
      platformConnectionId: 'conn-123',
      platform: 'YOUTUBE',
      type: 'VIDEO',
      status: 'PUBLISHING',
    };

    it('should publish content successfully', async () => {
      (mockPrisma.platformConnection.findUnique as jest.Mock).mockResolvedValue(mockConnection);
      (mockPrisma.platformPost.create as jest.Mock).mockResolvedValue(mockPost);
      (mockPrisma.platformPost.update as jest.Mock).mockResolvedValue(mockPost);

      mockProvider.publishContent.mockResolvedValue({
        postId: 'yt-video-123',
        platform: 'YOUTUBE',
        platformPostId: 'yt-video-123',
        url: 'https://youtube.com/watch?v=123',
        status: 'PUBLISHED',
        publishedAt: new Date(),
      });

      const result = await service.publishContent('user-123', publishRequest);

      expect(result).toHaveProperty('platformPostId');
      expect(result.status).toBe('PUBLISHED');
      expect(result.url).toContain('youtube.com');
      expect(mockProvider.publishContent).toHaveBeenCalledWith('access-token', {
        type: 'VIDEO',
        title: 'Test Video',
        description: 'Test description',
        hashtags: ['test', 'video'],
        mediaUrl: 'https://example.com/video.mp4',
      });
    });

    it('should throw error for inactive connection', async () => {
      (mockPrisma.platformConnection.findUnique as jest.Mock).mockResolvedValue({
        ...mockConnection,
        isActive: false,
      });

      await expect(
        service.publishContent('user-123', publishRequest)
      ).rejects.toThrow(PlatformError);
    });

    it('should handle publish failure and update post status', async () => {
      (mockPrisma.platformConnection.findUnique as jest.Mock).mockResolvedValue(mockConnection);
      (mockPrisma.platformPost.create as jest.Mock).mockResolvedValue(mockPost);
      (mockPrisma.platformPost.update as jest.Mock).mockResolvedValue(mockPost);

      mockProvider.publishContent.mockRejectedValue(
        new PlatformError('Upload failed', 'UPLOAD_FAILED', 'YOUTUBE', 500)
      );

      await expect(
        service.publishContent('user-123', publishRequest)
      ).rejects.toThrow(PlatformError);

      expect(mockPrisma.platformPost.update).toHaveBeenCalledWith({
        where: { id: 'post-123' },
        data: {
          status: 'FAILED',
          error: 'Upload failed',
        },
      });
    });
  });

  describe('getPostAnalytics', () => {
    const mockPost = {
      id: 'post-123',
      userId: 'user-123',
      platform: 'YOUTUBE',
      platformPostId: 'yt-video-123',
      status: 'PUBLISHED',
      platformConnection: {
        id: 'conn-123',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        tokenExpiresAt: new Date(Date.now() + 3600000),
      },
    };

    it('should fetch and return post analytics', async () => {
      (mockPrisma.platformPost.findUnique as jest.Mock).mockResolvedValue(mockPost);
      (mockPrisma.platformPost.update as jest.Mock).mockResolvedValue(mockPost);

      const mockAnalytics = {
        postId: 'post-123',
        platformPostId: 'yt-video-123',
        platform: 'YOUTUBE',
        metrics: {
          views: 1000,
          likes: 100,
          comments: 20,
          shares: 5,
        },
        period: {
          start: new Date(),
          end: new Date(),
        },
        fetchedAt: new Date(),
      };

      mockProvider.getPostAnalytics.mockResolvedValue(mockAnalytics);

      const result = await service.getPostAnalytics('user-123', 'post-123');

      expect(result).toEqual(mockAnalytics);
      expect(mockProvider.getPostAnalytics).toHaveBeenCalledWith(
        'access-token',
        'yt-video-123',
        undefined,
        undefined
      );
      expect(mockPrisma.platformPost.update).toHaveBeenCalledWith({
        where: { id: 'post-123' },
        data: {
          analytics: mockAnalytics.metrics,
          metadata: expect.objectContaining({
            lastAnalyticsUpdate: expect.any(Date),
          }),
        },
      });
    });
  });

  describe('getUserConnections', () => {
    it('should return user platform connections', async () => {
      const mockConnections = [
        {
          id: 'conn-1',
          userId: 'user-123',
          platform: 'YOUTUBE',
          accountName: 'Test Channel',
          isActive: true,
        },
        {
          id: 'conn-2',
          userId: 'user-123',
          platform: 'TWITTER',
          accountName: '@testuser',
          isActive: true,
        },
      ];

      (mockPrisma.platformConnection.findMany as jest.Mock).mockResolvedValue(mockConnections);

      const result = await service.getUserConnections('user-123');

      expect(result).toHaveLength(2);
      expect(result[0].platform).toBe('YOUTUBE');
      expect(result[1].platform).toBe('TWITTER');
    });
  });

  describe('disconnectPlatform', () => {
    it('should disconnect platform and revoke token', async () => {
      const mockConnection = {
        id: 'conn-123',
        userId: 'user-123',
        platform: 'YOUTUBE',
        accessToken: 'access-token',
      };

      (mockPrisma.platformConnection.findUnique as jest.Mock).mockResolvedValue(mockConnection);
      (mockPrisma.platformConnection.delete as jest.Mock).mockResolvedValue(mockConnection);
      mockProvider.revokeToken.mockResolvedValue(undefined);

      await service.disconnectPlatform('user-123', { connectionId: 'conn-123' });

      expect(mockProvider.revokeToken).toHaveBeenCalledWith('access-token');
      expect(mockPrisma.platformConnection.delete).toHaveBeenCalledWith({
        where: { id: 'conn-123' },
      });
    });

    it('should handle revoke token failure gracefully', async () => {
      const mockConnection = {
        id: 'conn-123',
        userId: 'user-123',
        platform: 'YOUTUBE',
        accessToken: 'access-token',
      };

      (mockPrisma.platformConnection.findUnique as jest.Mock).mockResolvedValue(mockConnection);
      (mockPrisma.platformConnection.delete as jest.Mock).mockResolvedValue(mockConnection);
      mockProvider.revokeToken.mockRejectedValue(new Error('Revoke failed'));

      // Should not throw
      await service.disconnectPlatform('user-123', { connectionId: 'conn-123' });

      expect(mockPrisma.platformConnection.delete).toHaveBeenCalled();
    });
  });
});