import {
  PlatformType,
  PlatformConfig,
  OAuthResponse,
  TokenResponse,
  PlatformUserInfo,
  PublishResponse,
  PlatformAnalytics,
  UploadProgress,
  MediaUploadRequest,
  PlatformError,
  OAuthError,
  RateLimitError,
} from '../types';

export interface AuthorizationParams {
  redirectUri: string;
  state: string;
  codeChallenge?: string; // For PKCE
  additionalParams?: Record<string, string>;
}

export interface TokenExchangeParams {
  code: string;
  redirectUri: string;
  codeVerifier?: string; // For PKCE
}

export interface PublishParams {
  type: 'VIDEO' | 'IMAGE' | 'TEXT' | 'STORY';
  title?: string;
  description?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  hashtags?: string[];
  metadata?: any;
  scheduledAt?: Date;
}

export abstract class BasePlatformProvider {
  protected config: PlatformConfig;
  protected rateLimiter: Map<string, { count: number; resetAt: Date }> = new Map();

  constructor(config: PlatformConfig) {
    this.config = config;
  }

  // OAuth methods
  abstract getAuthorizationUrl(params: AuthorizationParams): string;
  abstract exchangeCodeForToken(params: TokenExchangeParams): Promise<TokenResponse>;
  abstract refreshAccessToken(refreshToken: string): Promise<TokenResponse>;
  abstract getUserInfo(accessToken: string): Promise<PlatformUserInfo>;
  abstract revokeToken(accessToken: string): Promise<void>;

  // Content publishing methods
  abstract publishContent(accessToken: string, params: PublishParams): Promise<PublishResponse>;
  abstract updatePost(accessToken: string, postId: string, updates: any): Promise<void>;
  abstract deletePost(accessToken: string, postId: string): Promise<void>;
  abstract getPost(accessToken: string, postId: string): Promise<any>;

  // Media upload methods
  abstract uploadMedia(accessToken: string, request: MediaUploadRequest): Promise<{
    mediaId: string;
    mediaUrl: string;
  }>;
  abstract getUploadProgress(uploadId: string): Promise<UploadProgress>;

  // Analytics methods
  abstract getPostAnalytics(
    accessToken: string,
    postId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<PlatformAnalytics>;
  
  abstract getAccountAnalytics(
    accessToken: string,
    startDate: Date,
    endDate: Date,
    metrics?: string[]
  ): Promise<any>;

  // Platform information
  abstract getPlatformType(): PlatformType;
  abstract getConfig(): PlatformConfig;
  abstract isHealthy(): Promise<boolean>;

  // Common HTTP methods
  protected async makeRequest(
    url: string,
    options: RequestInit & { accessToken?: string }
  ): Promise<any> {
    const { accessToken, ...fetchOptions } = options;

    // Check rate limits
    this.checkRateLimit(url);

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers || {}),
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      // Update rate limit tracking
      this.updateRateLimit(url, response.headers);

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      }

      return await response.text();
    } catch (error) {
      if (error instanceof PlatformError || error instanceof OAuthError || error instanceof RateLimitError) {
        throw error;
      }

      throw new PlatformError(
        'Network request failed',
        'NETWORK_ERROR',
        this.getPlatformType(),
        500,
        error
      );
    }
  }

  protected async handleErrorResponse(response: Response): Promise<void> {
    const contentType = response.headers.get('content-type');
    let errorData: any = {};

    if (contentType?.includes('application/json')) {
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: await response.text() };
      }
    } else {
      errorData = { message: await response.text() };
    }

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after');
      const limit = response.headers.get('x-rate-limit-limit');
      
      throw new RateLimitError(
        errorData.message || 'Rate limit exceeded',
        this.getPlatformType(),
        retryAfter ? parseInt(retryAfter) : undefined,
        limit ? parseInt(limit) : undefined
      );
    }

    // Handle OAuth errors
    if (response.status === 401 || response.status === 403) {
      throw new OAuthError(
        errorData.message || 'Authentication failed',
        errorData.code || 'AUTH_FAILED',
        this.getPlatformType(),
        response.status
      );
    }

    // Handle other errors
    throw new PlatformError(
      errorData.message || `Request failed with status ${response.status}`,
      errorData.code || 'REQUEST_FAILED',
      this.getPlatformType(),
      response.status,
      errorData
    );
  }

  protected checkRateLimit(endpoint: string): void {
    const key = `${this.getPlatformType()}_${endpoint}`;
    const limit = this.rateLimiter.get(key);

    if (limit && limit.resetAt > new Date() && limit.count <= 0) {
      throw new RateLimitError(
        'Rate limit exceeded',
        this.getPlatformType(),
        Math.ceil((limit.resetAt.getTime() - Date.now()) / 1000)
      );
    }
  }

  protected updateRateLimit(endpoint: string, headers: Headers): void {
    const remaining = headers.get('x-rate-limit-remaining');
    const reset = headers.get('x-rate-limit-reset');

    if (remaining && reset) {
      const key = `${this.getPlatformType()}_${endpoint}`;
      this.rateLimiter.set(key, {
        count: parseInt(remaining),
        resetAt: new Date(parseInt(reset) * 1000),
      });
    }
  }

  // Utility methods
  protected generateState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  protected generateCodeVerifier(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let verifier = '';
    for (let i = 0; i < 128; i++) {
      verifier += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return verifier;
  }

  protected async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  protected validateMediaFile(file: MediaUploadRequest['file'], type: 'VIDEO' | 'IMAGE'): void {
    const limits = this.config.limits;

    if (type === 'VIDEO') {
      if (file.size > limits.maxVideoSize * 1024 * 1024) {
        throw new PlatformError(
          `Video file size exceeds ${limits.maxVideoSize}MB limit`,
          'FILE_TOO_LARGE',
          this.getPlatformType(),
          400
        );
      }

      const videoFormats = limits.supportedFormats.filter(f => f.startsWith('video/'));
      if (!videoFormats.includes(file.mimetype)) {
        throw new PlatformError(
          `Unsupported video format: ${file.mimetype}`,
          'UNSUPPORTED_FORMAT',
          this.getPlatformType(),
          400
        );
      }
    } else {
      if (file.size > limits.maxImageSize * 1024 * 1024) {
        throw new PlatformError(
          `Image file size exceeds ${limits.maxImageSize}MB limit`,
          'FILE_TOO_LARGE',
          this.getPlatformType(),
          400
        );
      }

      const imageFormats = limits.supportedFormats.filter(f => f.startsWith('image/'));
      if (!imageFormats.includes(file.mimetype)) {
        throw new PlatformError(
          `Unsupported image format: ${file.mimetype}`,
          'UNSUPPORTED_FORMAT',
          this.getPlatformType(),
          400
        );
      }
    }
  }

  protected truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  protected formatHashtags(hashtags: string[]): string[] {
    return hashtags.map(tag => {
      // Remove # if present and re-add it
      tag = tag.replace(/^#/, '');
      // Remove spaces and special characters
      tag = tag.replace(/[^a-zA-Z0-9_]/g, '');
      return `#${tag}`;
    }).filter(tag => tag.length > 1); // Filter out empty hashtags
  }

  // Platform-specific formatting
  protected formatDescription(description: string, hashtags: string[], platform: PlatformType): string {
    const maxLength = this.config.limits.maxTextLength;
    const formattedHashtags = this.formatHashtags(hashtags);
    const hashtagString = formattedHashtags.join(' ');
    
    // Calculate available space for description
    const availableLength = maxLength - hashtagString.length - 2; // 2 for spacing
    
    let formattedDescription = this.truncateText(description, availableLength);
    
    if (hashtagString) {
      formattedDescription += `\n\n${hashtagString}`;
    }
    
    return formattedDescription;
  }
}