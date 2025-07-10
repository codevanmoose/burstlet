import { PrismaClient } from '@prisma/client';
import { PlatformProviderFactory } from './providers/factory';
import {
  PlatformType,
  PlatformConnection,
  PlatformPost,
  ConnectPlatformRequest,
  DisconnectPlatformRequest,
  PublishContentRequest,
  BatchPublishRequest,
  UpdatePostRequest,
  PlatformAnalyticsRequest,
  OAuthResponse,
  TokenResponse,
  PublishResponse,
  PlatformAnalytics,
  PlatformError,
  OAuthError,
} from './types';

export class PlatformIntegrationsService {
  private prisma: PrismaClient;
  private oauthStates: Map<string, { platform: PlatformType; userId: string; expiresAt: Date }> = new Map();

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    
    // Clean up expired OAuth states periodically
    setInterval(() => this.cleanupExpiredStates(), 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Initiate OAuth connection for a platform
   */
  async connectPlatform(
    userId: string,
    request: ConnectPlatformRequest
  ): Promise<OAuthResponse> {
    const provider = PlatformProviderFactory.getProvider(request.platform);
    
    // Generate state for CSRF protection
    const state = this.generateSecureState();
    const codeVerifier = provider.generateCodeVerifier ? provider.generateCodeVerifier() : undefined;
    const codeChallenge = codeVerifier ? await provider.generateCodeChallenge(codeVerifier) : undefined;
    
    // Store state for verification
    this.oauthStates.set(state, {
      platform: request.platform,
      userId,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    const authUrl = provider.getAuthorizationUrl({
      redirectUri: request.redirectUrl || this.getDefaultRedirectUri(request.platform),
      state,
      codeChallenge,
    });

    return {
      authUrl,
      state,
      codeVerifier,
    };
  }

  /**
   * Complete OAuth connection after callback
   */
  async completeOAuthConnection(
    state: string,
    code: string,
    codeVerifier?: string
  ): Promise<PlatformConnection> {
    // Verify state
    const stateData = this.oauthStates.get(state);
    if (!stateData) {
      throw new OAuthError(
        'Invalid or expired state',
        'INVALID_STATE',
        'YOUTUBE', // Default, will be overridden if state is found
        400
      );
    }

    this.oauthStates.delete(state);

    if (stateData.expiresAt < new Date()) {
      throw new OAuthError(
        'OAuth state expired',
        'STATE_EXPIRED',
        stateData.platform,
        400
      );
    }

    const provider = PlatformProviderFactory.getProvider(stateData.platform);

    // Exchange code for tokens
    const tokenResponse = await provider.exchangeCodeForToken({
      code,
      redirectUri: this.getDefaultRedirectUri(stateData.platform),
      codeVerifier,
    });

    // Get user info
    const userInfo = await provider.getUserInfo(tokenResponse.accessToken);

    // Check if connection already exists
    const existingConnection = await this.prisma.platformConnection.findFirst({
      where: {
        userId: stateData.userId,
        platform: stateData.platform,
        platformAccountId: userInfo.id,
      },
    });

    if (existingConnection) {
      // Update existing connection
      return await this.prisma.platformConnection.update({
        where: { id: existingConnection.id },
        data: {
          accessToken: tokenResponse.accessToken,
          refreshToken: tokenResponse.refreshToken,
          tokenExpiresAt: new Date(Date.now() + tokenResponse.expiresIn * 1000),
          scope: tokenResponse.scope,
          accountName: userInfo.displayName,
          accountAvatar: userInfo.avatar,
          isActive: true,
          lastSyncedAt: new Date(),
        },
      });
    }

    // Create new connection
    return await this.prisma.platformConnection.create({
      data: {
        userId: stateData.userId,
        platform: stateData.platform,
        platformAccountId: userInfo.id,
        accountName: userInfo.displayName,
        accountAvatar: userInfo.avatar,
        accessToken: tokenResponse.accessToken,
        refreshToken: tokenResponse.refreshToken,
        tokenExpiresAt: new Date(Date.now() + tokenResponse.expiresIn * 1000),
        scope: tokenResponse.scope,
        isActive: true,
        metadata: {
          username: userInfo.username,
          followers: userInfo.followers,
          verified: userInfo.verified,
        },
      },
    });
  }

  /**
   * Disconnect a platform
   */
  async disconnectPlatform(
    userId: string,
    request: DisconnectPlatformRequest
  ): Promise<void> {
    const connection = await this.prisma.platformConnection.findUnique({
      where: { id: request.connectionId, userId },
    });

    if (!connection) {
      throw new PlatformError(
        'Platform connection not found',
        'CONNECTION_NOT_FOUND',
        'YOUTUBE', // Default
        404
      );
    }

    const provider = PlatformProviderFactory.getProvider(connection.platform as PlatformType);

    // Revoke token if possible
    try {
      await provider.revokeToken(connection.accessToken);
    } catch (error) {
      console.error('Failed to revoke token:', error);
    }

    // Delete connection
    await this.prisma.platformConnection.delete({
      where: { id: connection.id },
    });
  }

  /**
   * Publish content to a platform
   */
  async publishContent(
    userId: string,
    request: PublishContentRequest
  ): Promise<PublishResponse> {
    const connection = await this.prisma.platformConnection.findUnique({
      where: { id: request.platformConnectionId, userId },
    });

    if (!connection) {
      throw new PlatformError(
        'Platform connection not found',
        'CONNECTION_NOT_FOUND',
        'YOUTUBE',
        404
      );
    }

    if (!connection.isActive) {
      throw new PlatformError(
        'Platform connection is not active',
        'CONNECTION_INACTIVE',
        connection.platform as PlatformType,
        400
      );
    }

    // Ensure token is valid
    await this.ensureValidToken(connection);

    const provider = PlatformProviderFactory.getProvider(connection.platform as PlatformType);

    // Create platform post record
    const post = await this.prisma.platformPost.create({
      data: {
        userId,
        platformConnectionId: connection.id,
        platform: connection.platform as PlatformType,
        type: request.type,
        status: 'PUBLISHING',
        title: request.title,
        description: request.description,
        hashtags: request.hashtags || [],
        mediaUrl: request.mediaUrl,
        thumbnailUrl: request.thumbnailUrl,
        scheduledAt: request.scheduledAt ? new Date(request.scheduledAt) : undefined,
        metadata: request.metadata,
      },
    });

    try {
      // Publish to platform
      const result = await provider.publishContent(connection.accessToken, {
        type: request.type,
        title: request.title,
        description: request.description,
        mediaUrl: request.mediaUrl,
        thumbnailUrl: request.thumbnailUrl,
        hashtags: request.hashtags,
        metadata: request.metadata,
        scheduledAt: request.scheduledAt ? new Date(request.scheduledAt) : undefined,
      });

      // Update post record
      await this.prisma.platformPost.update({
        where: { id: post.id },
        data: {
          platformPostId: result.platformPostId,
          status: result.status,
          publishedAt: result.publishedAt,
          scheduledAt: result.scheduledAt,
          metadata: {
            ...post.metadata,
            url: result.url,
          },
        },
      });

      return result;
    } catch (error) {
      // Update post status to failed
      await this.prisma.platformPost.update({
        where: { id: post.id },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Publish content to multiple platforms
   */
  async batchPublish(
    userId: string,
    request: BatchPublishRequest
  ): Promise<PublishResponse[]> {
    const connections = await this.prisma.platformConnection.findMany({
      where: {
        userId,
        platform: { in: request.platforms as PlatformType[] },
        isActive: true,
      },
    });

    const results: PublishResponse[] = [];

    for (const connection of connections) {
      try {
        const result = await this.publishContent(userId, {
          platformConnectionId: connection.id,
          type: request.content.type,
          title: request.content.title,
          description: request.content.description,
          hashtags: request.content.hashtags,
          mediaUrl: request.content.mediaUrl,
          thumbnailUrl: request.content.thumbnailUrl,
          scheduledAt: request.scheduledAt,
        });
        results.push(result);
      } catch (error) {
        results.push({
          postId: '',
          platform: connection.platform as PlatformType,
          platformPostId: '',
          url: '',
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Update a published post
   */
  async updatePost(
    userId: string,
    postId: string,
    updates: UpdatePostRequest
  ): Promise<void> {
    const post = await this.prisma.platformPost.findUnique({
      where: { id: postId, userId },
      include: { platformConnection: true },
    });

    if (!post) {
      throw new PlatformError(
        'Post not found',
        'POST_NOT_FOUND',
        'YOUTUBE',
        404
      );
    }

    if (!post.platformPostId) {
      throw new PlatformError(
        'Post has not been published to platform',
        'POST_NOT_PUBLISHED',
        post.platform as PlatformType,
        400
      );
    }

    // Ensure token is valid
    await this.ensureValidToken(post.platformConnection);

    const provider = PlatformProviderFactory.getProvider(post.platform as PlatformType);

    // Update on platform
    await provider.updatePost(
      post.platformConnection.accessToken,
      post.platformPostId,
      updates
    );

    // Update local record
    await this.prisma.platformPost.update({
      where: { id: postId },
      data: {
        title: updates.title,
        description: updates.description,
        hashtags: updates.hashtags,
        scheduledAt: updates.scheduledAt ? new Date(updates.scheduledAt) : undefined,
      },
    });
  }

  /**
   * Delete a post
   */
  async deletePost(userId: string, postId: string): Promise<void> {
    const post = await this.prisma.platformPost.findUnique({
      where: { id: postId, userId },
      include: { platformConnection: true },
    });

    if (!post) {
      throw new PlatformError(
        'Post not found',
        'POST_NOT_FOUND',
        'YOUTUBE',
        404
      );
    }

    if (post.platformPostId) {
      // Ensure token is valid
      await this.ensureValidToken(post.platformConnection);

      const provider = PlatformProviderFactory.getProvider(post.platform as PlatformType);

      try {
        await provider.deletePost(
          post.platformConnection.accessToken,
          post.platformPostId
        );
      } catch (error) {
        console.error('Failed to delete from platform:', error);
      }
    }

    // Delete local record
    await this.prisma.platformPost.delete({
      where: { id: postId },
    });
  }

  /**
   * Get post analytics
   */
  async getPostAnalytics(
    userId: string,
    postId: string,
    request?: PlatformAnalyticsRequest
  ): Promise<PlatformAnalytics> {
    const post = await this.prisma.platformPost.findUnique({
      where: { id: postId, userId },
      include: { platformConnection: true },
    });

    if (!post) {
      throw new PlatformError(
        'Post not found',
        'POST_NOT_FOUND',
        'YOUTUBE',
        404
      );
    }

    if (!post.platformPostId) {
      throw new PlatformError(
        'Post has not been published to platform',
        'POST_NOT_PUBLISHED',
        post.platform as PlatformType,
        400
      );
    }

    // Ensure token is valid
    await this.ensureValidToken(post.platformConnection);

    const provider = PlatformProviderFactory.getProvider(post.platform as PlatformType);

    const analytics = await provider.getPostAnalytics(
      post.platformConnection.accessToken,
      post.platformPostId,
      request?.startDate ? new Date(request.startDate) : undefined,
      request?.endDate ? new Date(request.endDate) : undefined
    );

    // Store analytics in post metadata
    await this.prisma.platformPost.update({
      where: { id: postId },
      data: {
        analytics: analytics.metrics as any,
        metadata: {
          ...post.metadata,
          lastAnalyticsUpdate: new Date(),
        },
      },
    });

    return analytics;
  }

  /**
   * Get account analytics
   */
  async getAccountAnalytics(
    userId: string,
    connectionId: string,
    request: PlatformAnalyticsRequest
  ): Promise<any> {
    const connection = await this.prisma.platformConnection.findUnique({
      where: { id: connectionId, userId },
    });

    if (!connection) {
      throw new PlatformError(
        'Platform connection not found',
        'CONNECTION_NOT_FOUND',
        'YOUTUBE',
        404
      );
    }

    // Ensure token is valid
    await this.ensureValidToken(connection);

    const provider = PlatformProviderFactory.getProvider(connection.platform as PlatformType);

    return await provider.getAccountAnalytics(
      connection.accessToken,
      new Date(request.startDate || Date.now() - 30 * 24 * 60 * 60 * 1000),
      new Date(request.endDate || Date.now()),
      request.metrics
    );
  }

  /**
   * Get user's platform connections
   */
  async getUserConnections(userId: string): Promise<PlatformConnection[]> {
    return await this.prisma.platformConnection.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get user's posts
   */
  async getUserPosts(
    userId: string,
    filters: {
      platform?: PlatformType;
      status?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ posts: PlatformPost[]; total: number }> {
    const where = {
      userId,
      ...(filters.platform && { platform: filters.platform }),
      ...(filters.status && { status: filters.status }),
    };

    const [posts, total] = await Promise.all([
      this.prisma.platformPost.findMany({
        where,
        include: { platformConnection: true },
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      this.prisma.platformPost.count({ where }),
    ]);

    return { posts, total };
  }

  /**
   * Sync all posts analytics
   */
  async syncAnalytics(userId: string): Promise<void> {
    const posts = await this.prisma.platformPost.findMany({
      where: {
        userId,
        status: 'PUBLISHED',
        platformPostId: { not: null },
      },
      include: { platformConnection: true },
    });

    for (const post of posts) {
      try {
        await this.getPostAnalytics(userId, post.id);
      } catch (error) {
        console.error(`Failed to sync analytics for post ${post.id}:`, error);
      }
    }
  }

  // Private helper methods
  private async ensureValidToken(connection: PlatformConnection): Promise<void> {
    if (!connection.tokenExpiresAt || connection.tokenExpiresAt > new Date()) {
      return; // Token is still valid
    }

    if (!connection.refreshToken) {
      throw new OAuthError(
        'Token expired and no refresh token available',
        'NO_REFRESH_TOKEN',
        connection.platform as PlatformType,
        401
      );
    }

    const provider = PlatformProviderFactory.getProvider(connection.platform as PlatformType);

    try {
      const tokenResponse = await provider.refreshAccessToken(connection.refreshToken);

      // Update connection with new tokens
      await this.prisma.platformConnection.update({
        where: { id: connection.id },
        data: {
          accessToken: tokenResponse.accessToken,
          refreshToken: tokenResponse.refreshToken || connection.refreshToken,
          tokenExpiresAt: new Date(Date.now() + tokenResponse.expiresIn * 1000),
        },
      });

      // Update the connection object for immediate use
      connection.accessToken = tokenResponse.accessToken;
      if (tokenResponse.refreshToken) {
        connection.refreshToken = tokenResponse.refreshToken;
      }
    } catch (error) {
      // Mark connection as inactive if refresh fails
      await this.prisma.platformConnection.update({
        where: { id: connection.id },
        data: { isActive: false },
      });

      throw new OAuthError(
        'Failed to refresh access token',
        'REFRESH_FAILED',
        connection.platform as PlatformType,
        401
      );
    }
  }

  private generateSecureState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) +
           Date.now().toString(36);
  }

  private getDefaultRedirectUri(platform: PlatformType): string {
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:4000';
    return `${baseUrl}/api/v1/platforms/oauth/callback/${platform.toLowerCase()}`;
  }

  private cleanupExpiredStates(): void {
    const now = new Date();
    for (const [state, data] of this.oauthStates) {
      if (data.expiresAt < now) {
        this.oauthStates.delete(state);
      }
    }
  }
}