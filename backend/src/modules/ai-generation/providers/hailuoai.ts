import { BaseProvider, VideoProvider, GenerationResult, BaseProviderConfig } from './base';
import { ProviderError } from '../types';

interface HailuoAIConfig extends BaseProviderConfig {
  model: string;
  webhookUrl?: string;
}

interface HailuoAIVideoRequest {
  prompt: string;
  model?: string;
  aspect_ratio?: string;
  duration?: number;
  quality?: string;
  style?: string;
  webhook_url?: string;
}

interface HailuoAIVideoResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  video_url?: string;
  thumbnail_url?: string;
  duration?: number;
  error?: string;
  created_at: string;
  completed_at?: string;
}

export class HailuoAIProvider extends BaseProvider implements VideoProvider {
  private config: HailuoAIConfig;
  private supportedAspectRatios = ['16:9', '9:16', '1:1', '4:3', '3:4'];
  private supportedQualities = ['draft', 'standard', 'high', 'ultra'];
  private maxDuration = 60; // seconds
  private costPerSecond = 0.02; // $0.02 per second

  constructor(config: HailuoAIConfig) {
    super(config);
    this.config = config;
  }

  getName(): string {
    return 'HailuoAI';
  }

  getType(): 'VIDEO' | 'TEXT' | 'IMAGE' | 'HYBRID' {
    return 'VIDEO';
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/health', 'GET');
      return response.status === 'healthy';
    } catch (error) {
      return false;
    }
  }

  async generateVideo(params: {
    prompt: string;
    style?: string;
    duration?: number;
    aspectRatio?: string;
    quality?: string;
  }): Promise<GenerationResult> {
    const startTime = Date.now();

    try {
      // Validate parameters
      this.validateVideoParams(params);

      const request: HailuoAIVideoRequest = {
        prompt: params.prompt,
        model: this.config.model,
        aspect_ratio: params.aspectRatio || '16:9',
        duration: params.duration || 15,
        quality: params.quality || 'standard',
        style: params.style || 'realistic',
        webhook_url: this.config.webhookUrl,
      };

      const response = await this.makeRequest('/generate/video', 'POST', request);

      const processingTime = Date.now() - startTime;
      const cost = this.estimateCost(request.duration!, request.quality!);

      return {
        success: true,
        data: {
          id: response.id,
          status: response.status,
          videoUrl: response.video_url,
          thumbnailUrl: response.thumbnail_url,
          duration: response.duration,
          aspectRatio: request.aspect_ratio,
          quality: request.quality,
        },
        metadata: {
          processingTime,
          cost,
          provider: this.getName(),
          model: this.config.model,
        },
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;

      if (error instanceof ProviderError) {
        return {
          success: false,
          error: error.message,
          metadata: {
            processingTime,
            cost: 0,
            provider: this.getName(),
          },
        };
      }

      throw error;
    }
  }

  async getVideoStatus(jobId: string): Promise<GenerationResult> {
    const startTime = Date.now();

    try {
      const response: HailuoAIVideoResponse = await this.makeRequest(
        `/generate/video/${jobId}`,
        'GET'
      );

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          id: response.id,
          status: response.status,
          videoUrl: response.video_url,
          thumbnailUrl: response.thumbnail_url,
          duration: response.duration,
          error: response.error,
          createdAt: response.created_at,
          completedAt: response.completed_at,
        },
        metadata: {
          processingTime,
          cost: 0, // Status checks are free
          provider: this.getName(),
        },
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;

      if (error instanceof ProviderError) {
        return {
          success: false,
          error: error.message,
          metadata: {
            processingTime,
            cost: 0,
            provider: this.getName(),
          },
        };
      }

      throw error;
    }
  }

  getSupportedAspectRatios(): string[] {
    return this.supportedAspectRatios;
  }

  getSupportedQualities(): string[] {
    return this.supportedQualities;
  }

  getMaxDuration(): number {
    return this.maxDuration;
  }

  estimateCost(duration: number, quality: string): number {
    let multiplier = 1;
    
    switch (quality) {
      case 'draft':
        multiplier = 0.5;
        break;
      case 'standard':
        multiplier = 1;
        break;
      case 'high':
        multiplier = 1.5;
        break;
      case 'ultra':
        multiplier = 2.5;
        break;
    }

    return duration * this.costPerSecond * multiplier;
  }

  private validateVideoParams(params: {
    prompt: string;
    style?: string;
    duration?: number;
    aspectRatio?: string;
    quality?: string;
  }): void {
    if (!params.prompt || params.prompt.trim().length === 0) {
      throw new ProviderError(
        'Prompt is required',
        this.getName(),
        null,
        400
      );
    }

    if (params.prompt.length > 500) {
      throw new ProviderError(
        'Prompt is too long (max 500 characters)',
        this.getName(),
        null,
        400
      );
    }

    if (params.duration && (params.duration < 1 || params.duration > this.maxDuration)) {
      throw new ProviderError(
        `Duration must be between 1 and ${this.maxDuration} seconds`,
        this.getName(),
        null,
        400
      );
    }

    if (params.aspectRatio && !this.supportedAspectRatios.includes(params.aspectRatio)) {
      throw new ProviderError(
        `Unsupported aspect ratio. Supported: ${this.supportedAspectRatios.join(', ')}`,
        this.getName(),
        null,
        400
      );
    }

    if (params.quality && !this.supportedQualities.includes(params.quality)) {
      throw new ProviderError(
        `Unsupported quality. Supported: ${this.supportedQualities.join(', ')}`,
        this.getName(),
        null,
        400
      );
    }
  }

  // Utility methods for webhook handling
  async handleWebhook(payload: any): Promise<{
    jobId: string;
    status: string;
    result?: any;
    error?: string;
  }> {
    try {
      const { id, status, video_url, thumbnail_url, duration, error } = payload;

      return {
        jobId: id,
        status,
        result: status === 'completed' ? {
          videoUrl: video_url,
          thumbnailUrl: thumbnail_url,
          duration,
        } : undefined,
        error,
      };

    } catch (error) {
      throw new ProviderError(
        'Invalid webhook payload',
        this.getName(),
        error,
        400
      );
    }
  }

  // Batch processing support
  async generateVideoBatch(requests: Array<{
    prompt: string;
    style?: string;
    duration?: number;
    aspectRatio?: string;
    quality?: string;
  }>): Promise<GenerationResult[]> {
    const results: GenerationResult[] = [];

    for (const request of requests) {
      try {
        const result = await this.generateVideo(request);
        results.push(result);
        
        // Add small delay to avoid overwhelming the provider
        await this.sleep(1000);
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          metadata: {
            processingTime: 0,
            cost: 0,
            provider: this.getName(),
          },
        });
      }
    }

    return results;
  }

  // Get provider statistics
  getProviderStats(): {
    supportedAspectRatios: string[];
    supportedQualities: string[];
    maxDuration: number;
    costPerSecond: number;
    rateLimit: {
      requestsPerMinute: number;
      requestsPerHour: number;
    };
  } {
    return {
      supportedAspectRatios: this.supportedAspectRatios,
      supportedQualities: this.supportedQualities,
      maxDuration: this.maxDuration,
      costPerSecond: this.costPerSecond,
      rateLimit: this.config.rateLimit,
    };
  }
}