import { GenerationError, ProviderError } from '../types';

export interface BaseProviderConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
}

export interface GenerationResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    processingTime: number;
    cost: number;
    provider: string;
    model?: string;
  };
}

export abstract class BaseProvider {
  protected config: BaseProviderConfig;
  protected rateLimiter: Map<string, number[]> = new Map();

  constructor(config: BaseProviderConfig) {
    this.config = config;
  }

  protected async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    data?: any,
    headers?: Record<string, string>
  ): Promise<any> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const startTime = Date.now();

    // Check rate limits
    if (!this.checkRateLimit()) {
      throw new ProviderError(
        'Rate limit exceeded',
        this.constructor.name,
        null,
        429
      );
    }

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
            ...headers,
          },
          body: data ? JSON.stringify(data) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new ProviderError(
            errorData.error || `HTTP ${response.status}`,
            this.constructor.name,
            errorData,
            response.status
          );
        }

        this.updateRateLimit();
        return await response.json();

      } catch (error) {
        if (error instanceof ProviderError) {
          if (attempt === this.config.maxRetries - 1) throw error;
          
          // Exponential backoff
          await this.sleep(Math.pow(2, attempt) * 1000);
          continue;
        }

        throw new ProviderError(
          'Request failed',
          this.constructor.name,
          error,
          500
        );
      }
    }
  }

  protected checkRateLimit(): boolean {
    const now = Date.now();
    const key = 'requests';
    const timestamps = this.rateLimiter.get(key) || [];
    
    // Remove old timestamps
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;
    
    const recentTimestamps = timestamps.filter(ts => ts > oneHourAgo);
    const recentMinuteTimestamps = recentTimestamps.filter(ts => ts > oneMinuteAgo);
    
    // Check limits
    if (recentMinuteTimestamps.length >= this.config.rateLimit.requestsPerMinute) {
      return false;
    }
    
    if (recentTimestamps.length >= this.config.rateLimit.requestsPerHour) {
      return false;
    }
    
    return true;
  }

  protected updateRateLimit(): void {
    const now = Date.now();
    const key = 'requests';
    const timestamps = this.rateLimiter.get(key) || [];
    
    timestamps.push(now);
    
    // Keep only last hour of timestamps
    const oneHourAgo = now - 60 * 60 * 1000;
    const filteredTimestamps = timestamps.filter(ts => ts > oneHourAgo);
    
    this.rateLimiter.set(key, filteredTimestamps);
  }

  protected async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  abstract getName(): string;
  abstract getType(): 'VIDEO' | 'TEXT' | 'IMAGE' | 'HYBRID';
  abstract isHealthy(): Promise<boolean>;
}

export interface VideoProvider extends BaseProvider {
  generateVideo(params: {
    prompt: string;
    style?: string;
    duration?: number;
    aspectRatio?: string;
    quality?: string;
  }): Promise<GenerationResult>;
  
  getVideoStatus(jobId: string): Promise<GenerationResult>;
  getSupportedAspectRatios(): string[];
  getSupportedQualities(): string[];
  getMaxDuration(): number;
  estimateCost(duration: number, quality: string): number;
}

export interface TextProvider extends BaseProvider {
  generateText(params: {
    prompt: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
  }): Promise<GenerationResult>;
  
  generateBlog(params: {
    prompt: string;
    tone: string;
    wordCount: number;
    seoKeywords: string[];
  }): Promise<GenerationResult>;
  
  generateSocialPost(params: {
    prompt: string;
    platform: string;
    tone: string;
    includeHashtags: boolean;
    includeEmojis: boolean;
  }): Promise<GenerationResult>;
  
  generateScript(params: {
    prompt: string;
    type: string;
    duration: number;
    tone: string;
    includeHooks: boolean;
    includeCTA: boolean;
  }): Promise<GenerationResult>;
  
  getMaxTokens(): number;
  getSupportedModels(): string[];
  estimateTokens(text: string): number;
  estimateCost(tokens: number, model: string): number;
}

export interface ImageProvider extends BaseProvider {
  generateImage(params: {
    prompt: string;
    style?: string;
    size?: string;
    quality?: string;
  }): Promise<GenerationResult>;
  
  getSupportedSizes(): string[];
  getSupportedStyles(): string[];
  estimateCost(size: string, quality: string): number;
}

export interface HybridProvider extends VideoProvider, TextProvider {
  generateMultimodal(params: {
    prompt: string;
    type: 'VIDEO_WITH_SCRIPT' | 'BLOG_WITH_IMAGES' | 'SOCIAL_WITH_MEDIA';
    settings: any;
  }): Promise<GenerationResult>;
}