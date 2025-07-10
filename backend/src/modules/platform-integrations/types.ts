import { z } from 'zod';

// Platform Types
export type PlatformType = 'YOUTUBE' | 'TIKTOK' | 'INSTAGRAM' | 'TWITTER';

export interface PlatformConnection {
  id: string;
  userId: string;
  platform: PlatformType;
  accountId: string;
  accountName: string;
  accountAvatar?: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  scope: string[];
  isActive: boolean;
  metadata?: any;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlatformPost {
  id: string;
  userId: string;
  platformConnectionId: string;
  platform: PlatformType;
  platformPostId?: string;
  contentGenerationId?: string;
  type: 'VIDEO' | 'IMAGE' | 'TEXT' | 'STORY';
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED';
  title?: string;
  description?: string;
  hashtags: string[];
  mediaUrl?: string;
  thumbnailUrl?: string;
  scheduledAt?: Date;
  publishedAt?: Date;
  metadata?: any;
  analytics?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

// OAuth Configuration
export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl?: string;
}

// Platform-specific configurations
export interface PlatformConfig {
  oauth: OAuthConfig;
  api: {
    baseUrl: string;
    version: string;
    timeout: number;
  };
  limits: {
    maxVideoSize: number; // in MB
    maxVideoDuration: number; // in seconds
    maxImageSize: number; // in MB
    maxTextLength: number; // characters
    aspectRatios: string[];
    supportedFormats: string[];
  };
  features: {
    supportsVideo: boolean;
    supportsImage: boolean;
    supportsText: boolean;
    supportsStories: boolean;
    supportsScheduling: boolean;
    supportsAnalytics: boolean;
    supportsCaptions: boolean;
    supportsHashtags: boolean;
    supportsThumbnails: boolean;
  };
}

// Request/Response Schemas
export const ConnectPlatformSchema = z.object({
  platform: z.enum(['YOUTUBE', 'TIKTOK', 'INSTAGRAM', 'TWITTER']),
  redirectUrl: z.string().url().optional(),
});

export const DisconnectPlatformSchema = z.object({
  connectionId: z.string(),
});

export const PublishContentSchema = z.object({
  platformConnectionId: z.string(),
  type: z.enum(['VIDEO', 'IMAGE', 'TEXT', 'STORY']),
  title: z.string().optional(),
  description: z.string().optional(),
  hashtags: z.array(z.string()).optional().default([]),
  mediaUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  scheduledAt: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
});

export const BatchPublishSchema = z.object({
  platforms: z.array(z.string()),
  content: z.object({
    type: z.enum(['VIDEO', 'IMAGE', 'TEXT']),
    title: z.string().optional(),
    description: z.string().optional(),
    hashtags: z.array(z.string()).optional().default([]),
    mediaUrl: z.string().url().optional(),
    thumbnailUrl: z.string().url().optional(),
  }),
  scheduledAt: z.string().datetime().optional(),
});

export const UpdatePostSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  scheduledAt: z.string().datetime().optional(),
});

export const PlatformAnalyticsSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  metrics: z.array(z.string()).optional(),
});

// API Response Types
export interface OAuthResponse {
  authUrl: string;
  state: string;
  codeVerifier?: string; // For PKCE
}

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  scope: string[];
}

export interface PlatformUserInfo {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  email?: string;
  followers?: number;
  verified?: boolean;
}

export interface PublishResponse {
  postId: string;
  platform: PlatformType;
  platformPostId: string;
  url: string;
  status: 'PUBLISHED' | 'SCHEDULED' | 'FAILED';
  scheduledAt?: Date;
  publishedAt?: Date;
  error?: string;
}

export interface PlatformAnalytics {
  postId: string;
  platformPostId: string;
  platform: PlatformType;
  metrics: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves?: number;
    impressions?: number;
    reach?: number;
    engagement?: number;
    clickThroughRate?: number;
    watchTime?: number;
    averageViewDuration?: number;
  };
  demographics?: {
    age?: Record<string, number>;
    gender?: Record<string, number>;
    location?: Record<string, number>;
    device?: Record<string, number>;
  };
  period: {
    start: Date;
    end: Date;
  };
  fetchedAt: Date;
}

// Upload Types
export interface UploadProgress {
  uploadId: string;
  platformConnectionId: string;
  platform: PlatformType;
  fileName: string;
  fileSize: number;
  uploadedBytes: number;
  progress: number;
  status: 'PENDING' | 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface MediaUploadRequest {
  platformConnectionId: string;
  file: {
    buffer: Buffer;
    mimetype: string;
    size: number;
    filename: string;
  };
  type: 'VIDEO' | 'IMAGE' | 'THUMBNAIL';
  metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
  };
}

// Error Types
export class PlatformError extends Error {
  constructor(
    message: string,
    public code: string,
    public platform: PlatformType,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'PlatformError';
  }
}

export class OAuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public platform: PlatformType,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'OAuthError';
  }
}

export class UploadError extends Error {
  constructor(
    message: string,
    public code: string,
    public platform: PlatformType,
    public uploadId?: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'UploadError';
  }
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public platform: PlatformType,
    public retryAfter?: number,
    public limit?: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

// Platform-specific types
export interface YouTubeVideoMetadata {
  title: string;
  description: string;
  tags: string[];
  categoryId: string;
  privacyStatus: 'private' | 'unlisted' | 'public';
  madeForKids: boolean;
  thumbnailUrl?: string;
  playlistId?: string;
  notifySubscribers?: boolean;
}

export interface TikTokVideoMetadata {
  description: string;
  coverImageUrl?: string;
  privacyLevel: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY';
  allowComments: boolean;
  allowDuet: boolean;
  allowStitch: boolean;
  videoFormat?: string;
}

export interface InstagramMediaMetadata {
  caption: string;
  productTags?: Array<{ x: number; y: number; username: string }>;
  userTags?: Array<{ x: number; y: number; username: string }>;
  location?: { id: string; name: string };
  coverUrl?: string; // for reels
  shareToFeed?: boolean; // for reels/stories
}

export interface TwitterTweetMetadata {
  text: string;
  mediaIds?: string[];
  replySettings?: 'everyone' | 'mentionedUsers' | 'following';
  quoteTweetId?: string;
  replyToId?: string;
  pollOptions?: string[];
  pollDurationMinutes?: number;
  sensitive?: boolean;
  geo?: { lat: number; long: number };
}

// Webhook Types
export interface WebhookEvent {
  id: string;
  platform: PlatformType;
  type: 'POST_PUBLISHED' | 'POST_FAILED' | 'ANALYTICS_UPDATE' | 'ACCOUNT_UPDATE' | 'TOKEN_EXPIRED';
  platformAccountId: string;
  data: any;
  signature?: string;
  timestamp: Date;
}

// Type exports
export type ConnectPlatformRequest = z.infer<typeof ConnectPlatformSchema>;
export type DisconnectPlatformRequest = z.infer<typeof DisconnectPlatformSchema>;
export type PublishContentRequest = z.infer<typeof PublishContentSchema>;
export type BatchPublishRequest = z.infer<typeof BatchPublishSchema>;
export type UpdatePostRequest = z.infer<typeof UpdatePostSchema>;
export type PlatformAnalyticsRequest = z.infer<typeof PlatformAnalyticsSchema>;