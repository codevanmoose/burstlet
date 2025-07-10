import { apiClient } from './client';

// Types
export interface Platform {
  id: string;
  name: string;
  type: 'YOUTUBE' | 'TIKTOK' | 'INSTAGRAM' | 'TWITTER';
  icon: string;
  connected: boolean;
  accountName?: string;
  accountId?: string;
  profileImage?: string;
  permissions?: string[];
}

export interface PlatformConnection {
  id: string;
  userId: string;
  platform: string;
  accountId: string;
  accountName: string;
  profileImage?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  scopes: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublishRequest {
  contentId: string;
  platforms: string[];
  scheduledAt?: string;
  platformOptions?: Record<string, any>;
}

export interface PublishResult {
  platform: string;
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

export interface PlatformAnalytics {
  platform: string;
  metrics: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
    followers: number;
    engagement: number;
  };
  posts: Array<{
    id: string;
    title: string;
    publishedAt: string;
    views: number;
    likes: number;
    shares: number;
    comments: number;
  }>;
}

// API functions
export const platformsApi = {
  /**
   * Get available platforms
   */
  async getAvailablePlatforms(): Promise<Platform[]> {
    return apiClient.get('/platforms');
  },

  /**
   * Get connected platforms
   */
  async getConnectedPlatforms(): Promise<PlatformConnection[]> {
    return apiClient.get('/platforms/connections');
  },

  /**
   * Connect platform (initiate OAuth)
   */
  async connectPlatform(platform: string): Promise<{ authUrl: string }> {
    return apiClient.post(`/platforms/${platform}/connect`);
  },

  /**
   * Disconnect platform
   */
  async disconnectPlatform(platform: string): Promise<{ message: string }> {
    return apiClient.delete(`/platforms/${platform}/disconnect`);
  },

  /**
   * Refresh platform connection
   */
  async refreshConnection(platform: string): Promise<PlatformConnection> {
    return apiClient.post(`/platforms/${platform}/refresh`);
  },

  /**
   * Publish content to platforms
   */
  async publish(data: PublishRequest): Promise<PublishResult[]> {
    return apiClient.post('/platforms/publish', data);
  },

  /**
   * Get platform-specific analytics
   */
  async getAnalytics(platform: string, params?: {
    startDate?: string;
    endDate?: string;
    postId?: string;
  }): Promise<PlatformAnalytics> {
    return apiClient.get(`/platforms/${platform}/analytics`, { params });
  },

  /**
   * Get platform posts
   */
  async getPlatformPosts(platform: string, params?: {
    limit?: number;
    offset?: number;
  }): Promise<{
    posts: Array<{
      id: string;
      platformPostId: string;
      title: string;
      description?: string;
      mediaUrl?: string;
      publishedAt: string;
      metrics: any;
    }>;
    total: number;
  }> {
    return apiClient.get(`/platforms/${platform}/posts`, { params });
  },

  /**
   * Delete platform post
   */
  async deletePlatformPost(platform: string, postId: string): Promise<{ message: string }> {
    return apiClient.delete(`/platforms/${platform}/posts/${postId}`);
  },

  /**
   * Get platform-specific settings
   */
  async getPlatformSettings(platform: string): Promise<any> {
    return apiClient.get(`/platforms/${platform}/settings`);
  },

  /**
   * Update platform-specific settings
   */
  async updatePlatformSettings(platform: string, settings: any): Promise<any> {
    return apiClient.patch(`/platforms/${platform}/settings`, settings);
  },

  /**
   * Validate platform credentials
   */
  async validateCredentials(platform: string): Promise<{ valid: boolean; message?: string }> {
    return apiClient.get(`/platforms/${platform}/validate`);
  },

  /**
   * Get platform webhooks
   */
  async getWebhooks(platform: string): Promise<Array<{
    id: string;
    event: string;
    url: string;
    active: boolean;
  }>> {
    return apiClient.get(`/platforms/${platform}/webhooks`);
  },

  /**
   * Create platform webhook
   */
  async createWebhook(platform: string, data: {
    event: string;
    url: string;
  }): Promise<{
    id: string;
    event: string;
    url: string;
    secret: string;
  }> {
    return apiClient.post(`/platforms/${platform}/webhooks`, data);
  },
};