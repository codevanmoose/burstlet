import {
  BasePlatformProvider,
  AuthorizationParams,
  TokenExchangeParams,
  PublishParams,
} from './base';
import {
  PlatformType,
  PlatformConfig,
  TokenResponse,
  PlatformUserInfo,
  PublishResponse,
  PlatformAnalytics,
  UploadProgress,
  MediaUploadRequest,
  YouTubeVideoMetadata,
  PlatformError,
} from '../types';

export class YouTubeProvider extends BasePlatformProvider {
  private uploadSessions: Map<string, UploadProgress> = new Map();

  constructor(config: PlatformConfig) {
    super(config);
  }

  getPlatformType(): PlatformType {
    return 'YOUTUBE';
  }

  getConfig(): PlatformConfig {
    return this.config;
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch('https://www.googleapis.com/youtube/v3/i18nRegions?part=snippet&hl=en');
      return response.ok;
    } catch {
      return false;
    }
  }

  // OAuth Implementation
  getAuthorizationUrl(params: AuthorizationParams): string {
    const url = new URL(this.config.oauth.authorizationUrl);
    
    url.searchParams.append('client_id', this.config.oauth.clientId);
    url.searchParams.append('redirect_uri', params.redirectUri);
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('scope', this.config.oauth.scope.join(' '));
    url.searchParams.append('state', params.state);
    url.searchParams.append('access_type', 'offline');
    url.searchParams.append('prompt', 'consent');

    if (params.codeChallenge) {
      url.searchParams.append('code_challenge', params.codeChallenge);
      url.searchParams.append('code_challenge_method', 'S256');
    }

    return url.toString();
  }

  async exchangeCodeForToken(params: TokenExchangeParams): Promise<TokenResponse> {
    const response = await this.makeRequest(this.config.oauth.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.oauth.clientId,
        client_secret: this.config.oauth.clientSecret,
        code: params.code,
        redirect_uri: params.redirectUri,
        grant_type: 'authorization_code',
        ...(params.codeVerifier && { code_verifier: params.codeVerifier }),
      }).toString(),
    });

    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresIn: response.expires_in,
      scope: response.scope.split(' '),
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    const response = await this.makeRequest(this.config.oauth.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.oauth.clientId,
        client_secret: this.config.oauth.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
    });

    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token || refreshToken,
      expiresIn: response.expires_in,
      scope: response.scope.split(' '),
    };
  }

  async getUserInfo(accessToken: string): Promise<PlatformUserInfo> {
    const response = await this.makeRequest(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
      { accessToken }
    );

    if (!response.items || response.items.length === 0) {
      throw new PlatformError(
        'No YouTube channel found',
        'NO_CHANNEL',
        this.getPlatformType(),
        404
      );
    }

    const channel = response.items[0];
    return {
      id: channel.id,
      username: channel.snippet.customUrl || channel.id,
      displayName: channel.snippet.title,
      avatar: channel.snippet.thumbnails?.default?.url,
      followers: parseInt(channel.statistics.subscriberCount) || 0,
      verified: channel.status?.isLinked || false,
    };
  }

  async revokeToken(accessToken: string): Promise<void> {
    await this.makeRequest(
      `https://oauth2.googleapis.com/revoke?token=${accessToken}`,
      { method: 'POST' }
    );
  }

  // Content Publishing
  async publishContent(accessToken: string, params: PublishParams): Promise<PublishResponse> {
    if (params.type !== 'VIDEO') {
      throw new PlatformError(
        'YouTube only supports video content',
        'UNSUPPORTED_CONTENT_TYPE',
        this.getPlatformType(),
        400
      );
    }

    if (!params.mediaUrl) {
      throw new PlatformError(
        'Media URL is required for YouTube videos',
        'MISSING_MEDIA',
        this.getPlatformType(),
        400
      );
    }

    // First, upload the video
    const videoId = await this.uploadVideoFromUrl(accessToken, params.mediaUrl, {
      title: params.title || 'Untitled Video',
      description: this.formatDescription(
        params.description || '',
        params.hashtags || [],
        'YOUTUBE'
      ),
      tags: params.hashtags || [],
      categoryId: params.metadata?.categoryId || '22', // People & Blogs
      privacyStatus: params.scheduledAt ? 'private' : 'public',
      madeForKids: params.metadata?.madeForKids || false,
    });

    // Set thumbnail if provided
    if (params.thumbnailUrl) {
      await this.uploadThumbnail(accessToken, videoId, params.thumbnailUrl);
    }

    // Schedule if needed
    if (params.scheduledAt) {
      await this.scheduleVideo(accessToken, videoId, params.scheduledAt);
    }

    return {
      postId: videoId,
      platform: 'YOUTUBE',
      platformPostId: videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      status: params.scheduledAt ? 'SCHEDULED' : 'PUBLISHED',
      scheduledAt: params.scheduledAt,
      publishedAt: params.scheduledAt ? undefined : new Date(),
    };
  }

  async updatePost(accessToken: string, postId: string, updates: any): Promise<void> {
    const updateData: any = {
      id: postId,
      snippet: {},
    };

    if (updates.title) updateData.snippet.title = updates.title;
    if (updates.description) {
      updateData.snippet.description = this.formatDescription(
        updates.description,
        updates.hashtags || [],
        'YOUTUBE'
      );
    }
    if (updates.hashtags) updateData.snippet.tags = updates.hashtags;

    await this.makeRequest(
      'https://www.googleapis.com/youtube/v3/videos?part=snippet',
      {
        method: 'PUT',
        accessToken,
        body: JSON.stringify(updateData),
      }
    );
  }

  async deletePost(accessToken: string, postId: string): Promise<void> {
    await this.makeRequest(
      `https://www.googleapis.com/youtube/v3/videos?id=${postId}`,
      {
        method: 'DELETE',
        accessToken,
      }
    );
  }

  async getPost(accessToken: string, postId: string): Promise<any> {
    const response = await this.makeRequest(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,status,statistics&id=${postId}`,
      { accessToken }
    );

    if (!response.items || response.items.length === 0) {
      throw new PlatformError(
        'Video not found',
        'NOT_FOUND',
        this.getPlatformType(),
        404
      );
    }

    return response.items[0];
  }

  // Media Upload
  async uploadMedia(accessToken: string, request: MediaUploadRequest): Promise<{
    mediaId: string;
    mediaUrl: string;
  }> {
    if (request.type !== 'VIDEO' && request.type !== 'THUMBNAIL') {
      throw new PlatformError(
        'YouTube only supports video and thumbnail uploads',
        'UNSUPPORTED_MEDIA_TYPE',
        this.getPlatformType(),
        400
      );
    }

    this.validateMediaFile(request.file, request.type === 'VIDEO' ? 'VIDEO' : 'IMAGE');

    const uploadId = `youtube_${Date.now()}`;
    const uploadProgress: UploadProgress = {
      uploadId,
      platformConnectionId: '',
      platform: 'YOUTUBE',
      fileName: request.file.filename,
      fileSize: request.file.size,
      uploadedBytes: 0,
      progress: 0,
      status: 'PENDING',
      startedAt: new Date(),
    };

    this.uploadSessions.set(uploadId, uploadProgress);

    try {
      // For YouTube, we need to use resumable upload
      const videoId = await this.performResumableUpload(
        accessToken,
        request.file,
        request.metadata || {},
        uploadId
      );

      uploadProgress.status = 'COMPLETED';
      uploadProgress.completedAt = new Date();
      uploadProgress.progress = 100;

      return {
        mediaId: videoId,
        mediaUrl: `https://www.youtube.com/watch?v=${videoId}`,
      };
    } catch (error) {
      uploadProgress.status = 'FAILED';
      uploadProgress.error = error instanceof Error ? error.message : 'Upload failed';
      throw error;
    }
  }

  async getUploadProgress(uploadId: string): Promise<UploadProgress> {
    const progress = this.uploadSessions.get(uploadId);
    if (!progress) {
      throw new PlatformError(
        'Upload session not found',
        'UPLOAD_NOT_FOUND',
        this.getPlatformType(),
        404
      );
    }
    return progress;
  }

  // Analytics
  async getPostAnalytics(
    accessToken: string,
    postId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<PlatformAnalytics> {
    const response = await this.makeRequest(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${postId}`,
      { accessToken }
    );

    if (!response.items || response.items.length === 0) {
      throw new PlatformError(
        'Video not found',
        'NOT_FOUND',
        this.getPlatformType(),
        404
      );
    }

    const stats = response.items[0].statistics;
    
    // YouTube Analytics API would provide more detailed metrics
    // This is basic statistics from the Data API
    return {
      postId,
      platformPostId: postId,
      platform: 'YOUTUBE',
      metrics: {
        views: parseInt(stats.viewCount) || 0,
        likes: parseInt(stats.likeCount) || 0,
        comments: parseInt(stats.commentCount) || 0,
        shares: 0, // Not available in basic stats
        saves: parseInt(stats.favoriteCount) || 0,
      },
      period: {
        start: startDate || new Date(0),
        end: endDate || new Date(),
      },
      fetchedAt: new Date(),
    };
  }

  async getAccountAnalytics(
    accessToken: string,
    startDate: Date,
    endDate: Date,
    metrics?: string[]
  ): Promise<any> {
    // This would use YouTube Analytics API
    // For now, return channel statistics
    const response = await this.makeRequest(
      'https://www.googleapis.com/youtube/v3/channels?part=statistics&mine=true',
      { accessToken }
    );

    if (!response.items || response.items.length === 0) {
      throw new PlatformError(
        'Channel not found',
        'NOT_FOUND',
        this.getPlatformType(),
        404
      );
    }

    return {
      channel: response.items[0].statistics,
      period: { start: startDate, end: endDate },
    };
  }

  // Private helper methods
  private async uploadVideoFromUrl(
    accessToken: string,
    videoUrl: string,
    metadata: YouTubeVideoMetadata
  ): Promise<string> {
    // Download video first
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new PlatformError(
        'Failed to download video',
        'DOWNLOAD_FAILED',
        this.getPlatformType(),
        500
      );
    }

    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
    const contentType = videoResponse.headers.get('content-type') || 'video/mp4';

    // Create video resource
    const createResponse = await this.makeRequest(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      {
        method: 'POST',
        accessToken,
        headers: {
          'X-Upload-Content-Length': videoBuffer.length.toString(),
          'X-Upload-Content-Type': contentType,
        },
        body: JSON.stringify({
          snippet: {
            title: metadata.title,
            description: metadata.description,
            tags: metadata.tags,
            categoryId: metadata.categoryId,
          },
          status: {
            privacyStatus: metadata.privacyStatus,
            madeForKids: metadata.madeForKids,
            selfDeclaredMadeForKids: metadata.madeForKids,
          },
        }),
      }
    );

    // Upload video data
    const uploadUrl = createResponse.headers.get('location');
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'Content-Length': videoBuffer.length.toString(),
      },
      body: videoBuffer,
    });

    const result = await uploadResponse.json();
    return result.id;
  }

  private async performResumableUpload(
    accessToken: string,
    file: MediaUploadRequest['file'],
    metadata: any,
    uploadId: string
  ): Promise<string> {
    const uploadProgress = this.uploadSessions.get(uploadId)!;
    uploadProgress.status = 'UPLOADING';

    // Initialize resumable upload
    const initResponse = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Length': file.size.toString(),
          'X-Upload-Content-Type': file.mimetype,
        },
        body: JSON.stringify({
          snippet: {
            title: metadata.title || 'Untitled Video',
            description: metadata.description || '',
            tags: metadata.tags || [],
            categoryId: metadata.categoryId || '22',
          },
          status: {
            privacyStatus: metadata.privacyStatus || 'private',
          },
        }),
      }
    );

    if (!initResponse.ok) {
      throw new PlatformError(
        'Failed to initialize upload',
        'UPLOAD_INIT_FAILED',
        this.getPlatformType(),
        initResponse.status
      );
    }

    const uploadUrl = initResponse.headers.get('location')!;

    // Upload the file
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.mimetype,
      },
      body: file.buffer,
    });

    if (!uploadResponse.ok) {
      throw new PlatformError(
        'Failed to upload video',
        'UPLOAD_FAILED',
        this.getPlatformType(),
        uploadResponse.status
      );
    }

    const result = await uploadResponse.json();
    uploadProgress.uploadedBytes = file.size;
    uploadProgress.progress = 100;

    return result.id;
  }

  private async uploadThumbnail(
    accessToken: string,
    videoId: string,
    thumbnailUrl: string
  ): Promise<void> {
    const thumbnailResponse = await fetch(thumbnailUrl);
    if (!thumbnailResponse.ok) {
      throw new PlatformError(
        'Failed to download thumbnail',
        'DOWNLOAD_FAILED',
        this.getPlatformType(),
        500
      );
    }

    const thumbnailBuffer = await thumbnailResponse.arrayBuffer();

    await this.makeRequest(
      `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${videoId}`,
      {
        method: 'POST',
        accessToken,
        headers: {
          'Content-Type': 'image/jpeg',
        },
        body: thumbnailBuffer,
      }
    );
  }

  private async scheduleVideo(
    accessToken: string,
    videoId: string,
    scheduledAt: Date
  ): Promise<void> {
    await this.makeRequest(
      'https://www.googleapis.com/youtube/v3/videos?part=status',
      {
        method: 'PUT',
        accessToken,
        body: JSON.stringify({
          id: videoId,
          status: {
            privacyStatus: 'private',
            publishAt: scheduledAt.toISOString(),
          },
        }),
      }
    );
  }
}