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
  TwitterTweetMetadata,
  PlatformError,
} from '../types';

export class TwitterProvider extends BasePlatformProvider {
  private uploadSessions: Map<string, UploadProgress> = new Map();

  constructor(config: PlatformConfig) {
    super(config);
  }

  getPlatformType(): PlatformType {
    return 'TWITTER';
  }

  getConfig(): PlatformConfig {
    return this.config;
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch('https://api.twitter.com/2/openapi/status');
      return response.ok;
    } catch {
      return false;
    }
  }

  // OAuth 2.0 with PKCE Implementation
  getAuthorizationUrl(params: AuthorizationParams): string {
    const url = new URL(this.config.oauth.authorizationUrl);
    
    url.searchParams.append('client_id', this.config.oauth.clientId);
    url.searchParams.append('redirect_uri', params.redirectUri);
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('scope', this.config.oauth.scope.join(' '));
    url.searchParams.append('state', params.state);
    
    if (params.codeChallenge) {
      url.searchParams.append('code_challenge', params.codeChallenge);
      url.searchParams.append('code_challenge_method', 'S256');
    }

    return url.toString();
  }

  async exchangeCodeForToken(params: TokenExchangeParams): Promise<TokenResponse> {
    const credentials = Buffer.from(
      `${this.config.oauth.clientId}:${this.config.oauth.clientSecret}`
    ).toString('base64');

    const response = await this.makeRequest(this.config.oauth.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: new URLSearchParams({
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
    const credentials = Buffer.from(
      `${this.config.oauth.clientId}:${this.config.oauth.clientSecret}`
    ).toString('base64');

    const response = await this.makeRequest(this.config.oauth.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: new URLSearchParams({
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
      'https://api.twitter.com/2/users/me?user.fields=profile_image_url,verified,public_metrics',
      { accessToken }
    );

    const user = response.data;
    return {
      id: user.id,
      username: user.username,
      displayName: user.name,
      avatar: user.profile_image_url,
      followers: user.public_metrics?.followers_count || 0,
      verified: user.verified || false,
    };
  }

  async revokeToken(accessToken: string): Promise<void> {
    const credentials = Buffer.from(
      `${this.config.oauth.clientId}:${this.config.oauth.clientSecret}`
    ).toString('base64');

    await this.makeRequest('https://api.twitter.com/2/oauth2/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        token: accessToken,
        token_type_hint: 'access_token',
      }).toString(),
    });
  }

  // Content Publishing
  async publishContent(accessToken: string, params: PublishParams): Promise<PublishResponse> {
    let tweetData: any = {
      text: this.formatTweetText(params),
    };

    // Handle media uploads
    if (params.mediaUrl) {
      const mediaIds = await this.uploadMediaFromUrls(accessToken, [params.mediaUrl], params.type);
      if (mediaIds.length > 0) {
        tweetData.media = { media_ids: mediaIds };
      }
    }

    // Handle reply settings
    if (params.metadata?.replySettings) {
      tweetData.reply_settings = params.metadata.replySettings;
    }

    // Handle polls
    if (params.metadata?.pollOptions && params.metadata.pollOptions.length >= 2) {
      tweetData.poll = {
        options: params.metadata.pollOptions.slice(0, 4), // Max 4 options
        duration_minutes: params.metadata.pollDurationMinutes || 1440, // Default 24 hours
      };
    }

    // Create tweet
    const response = await this.makeRequest(
      'https://api.twitter.com/2/tweets',
      {
        method: 'POST',
        accessToken,
        body: JSON.stringify(tweetData),
      }
    );

    return {
      postId: response.data.id,
      platform: 'TWITTER',
      platformPostId: response.data.id,
      url: `https://twitter.com/i/web/status/${response.data.id}`,
      status: 'PUBLISHED',
      publishedAt: new Date(),
    };
  }

  async updatePost(accessToken: string, postId: string, updates: any): Promise<void> {
    // Twitter doesn't support editing tweets (except for Twitter Blue subscribers)
    throw new PlatformError(
      'Twitter does not support editing tweets',
      'UNSUPPORTED_OPERATION',
      this.getPlatformType(),
      400
    );
  }

  async deletePost(accessToken: string, postId: string): Promise<void> {
    await this.makeRequest(
      `https://api.twitter.com/2/tweets/${postId}`,
      {
        method: 'DELETE',
        accessToken,
      }
    );
  }

  async getPost(accessToken: string, postId: string): Promise<any> {
    const response = await this.makeRequest(
      `https://api.twitter.com/2/tweets/${postId}?tweet.fields=created_at,public_metrics,attachments&expansions=attachments.media_keys&media.fields=url,preview_image_url`,
      { accessToken }
    );

    return response.data;
  }

  // Media Upload
  async uploadMedia(accessToken: string, request: MediaUploadRequest): Promise<{
    mediaId: string;
    mediaUrl: string;
  }> {
    this.validateMediaFile(
      request.file,
      request.type === 'VIDEO' ? 'VIDEO' : 'IMAGE'
    );

    const uploadId = `twitter_${Date.now()}`;
    const uploadProgress: UploadProgress = {
      uploadId,
      platformConnectionId: '',
      platform: 'TWITTER',
      fileName: request.file.filename,
      fileSize: request.file.size,
      uploadedBytes: 0,
      progress: 0,
      status: 'PENDING',
      startedAt: new Date(),
    };

    this.uploadSessions.set(uploadId, uploadProgress);

    try {
      // Use Twitter's chunked upload for large files
      const mediaId = await this.performChunkedUpload(
        accessToken,
        request.file,
        uploadId
      );

      uploadProgress.status = 'COMPLETED';
      uploadProgress.completedAt = new Date();
      uploadProgress.progress = 100;

      return {
        mediaId,
        mediaUrl: '', // Twitter doesn't return media URLs immediately
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
      `https://api.twitter.com/2/tweets/${postId}?tweet.fields=public_metrics,created_at`,
      { accessToken }
    );

    const metrics = response.data.public_metrics;

    return {
      postId,
      platformPostId: postId,
      platform: 'TWITTER',
      metrics: {
        views: metrics.impression_count || 0,
        likes: metrics.like_count || 0,
        comments: metrics.reply_count || 0,
        shares: metrics.retweet_count || 0,
        saves: metrics.bookmark_count || 0,
        impressions: metrics.impression_count || 0,
        engagement: (metrics.like_count || 0) + 
                   (metrics.retweet_count || 0) + 
                   (metrics.reply_count || 0) +
                   (metrics.quote_count || 0),
      },
      period: {
        start: startDate || new Date(response.data.created_at),
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
    // This would use Twitter Analytics API (requires special access)
    // For now, return user metrics
    const response = await this.makeRequest(
      'https://api.twitter.com/2/users/me?user.fields=public_metrics',
      { accessToken }
    );

    return {
      user: response.data.public_metrics,
      period: { start: startDate, end: endDate },
    };
  }

  // Private helper methods
  private formatTweetText(params: PublishParams): string {
    let text = '';

    if (params.title && params.description) {
      text = `${params.title}\n\n${params.description}`;
    } else if (params.title) {
      text = params.title;
    } else if (params.description) {
      text = params.description;
    }

    // Add hashtags
    if (params.hashtags && params.hashtags.length > 0) {
      const formattedHashtags = this.formatHashtags(params.hashtags);
      const hashtagString = formattedHashtags.join(' ');
      
      if (text) {
        text += `\n\n${hashtagString}`;
      } else {
        text = hashtagString;
      }
    }

    // Truncate to Twitter's limit
    return this.truncateText(text, 280);
  }

  private async uploadMediaFromUrls(
    accessToken: string,
    mediaUrls: string[],
    type: 'VIDEO' | 'IMAGE' | 'TEXT' | 'STORY'
  ): Promise<string[]> {
    const mediaIds: string[] = [];

    for (const url of mediaUrls.slice(0, 4)) { // Max 4 media items
      try {
        const response = await fetch(url);
        if (!response.ok) continue;

        const buffer = Buffer.from(await response.arrayBuffer());
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        const mediaId = await this.performChunkedUpload(accessToken, {
          buffer,
          mimetype: contentType,
          size: buffer.length,
          filename: 'media',
        }, `upload_${Date.now()}`);

        mediaIds.push(mediaId);
      } catch (error) {
        console.error('Failed to upload media from URL:', url, error);
      }
    }

    return mediaIds;
  }

  private async performChunkedUpload(
    accessToken: string,
    file: { buffer: Buffer; mimetype: string; size: number; filename: string },
    uploadId: string
  ): Promise<string> {
    const uploadProgress = this.uploadSessions.get(uploadId);
    if (uploadProgress) {
      uploadProgress.status = 'UPLOADING';
    }

    // INIT
    const initResponse = await this.makeRequest(
      'https://upload.twitter.com/1.1/media/upload.json',
      {
        method: 'POST',
        accessToken,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          command: 'INIT',
          total_bytes: file.size.toString(),
          media_type: file.mimetype,
          media_category: file.mimetype.startsWith('video/') ? 'tweet_video' : 'tweet_image',
        }).toString(),
      }
    );

    const mediaId = initResponse.media_id_string;
    const chunkSize = 5 * 1024 * 1024; // 5MB chunks
    let segmentIndex = 0;

    // APPEND chunks
    for (let offset = 0; offset < file.size; offset += chunkSize) {
      const chunk = file.buffer.slice(offset, offset + chunkSize);
      
      const formData = new FormData();
      formData.append('command', 'APPEND');
      formData.append('media_id', mediaId);
      formData.append('segment_index', segmentIndex.toString());
      formData.append('media', new Blob([chunk], { type: file.mimetype }));

      await fetch('https://upload.twitter.com/1.1/media/upload.json', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      segmentIndex++;
      
      if (uploadProgress) {
        uploadProgress.uploadedBytes = Math.min(offset + chunkSize, file.size);
        uploadProgress.progress = Math.round((uploadProgress.uploadedBytes / file.size) * 100);
      }
    }

    // FINALIZE
    await this.makeRequest(
      'https://upload.twitter.com/1.1/media/upload.json',
      {
        method: 'POST',
        accessToken,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          command: 'FINALIZE',
          media_id: mediaId,
        }).toString(),
      }
    );

    return mediaId;
  }
}