import { PrismaClient } from '@prisma/client';
import { ProviderFactory, ProviderName } from './providers/factory';
import { HailuoAIWithAudioProvider } from './providers/hailuoai-with-audio';
import {
  ContentGeneration,
  VideoGenerationRequest,
  GenerationResponse,
  VideoGenerationResponse,
  GenerationError,
  QuotaError,
} from './types';
import { AuthService } from '../auth/service';

export interface VideoWithAudioGenerationRequest extends VideoGenerationRequest {
  // Audio options
  includeAudio?: boolean;
  audioOptions?: {
    voiceover?: {
      text?: string;
      useAutoScript?: boolean;
      voice?: string;
      language?: string;
    };
    backgroundMusic?: {
      style?: string;
      mood?: string;
      volume?: number;
    };
    soundEffects?: boolean;
  };
}

export class AIGenerationServiceWithAudio {
  private prisma: PrismaClient;
  private authService: AuthService;
  private audioProvider: HailuoAIWithAudioProvider;

  constructor(prisma: PrismaClient, authService: AuthService) {
    this.prisma = prisma;
    this.authService = authService;
    
    // Initialize the audio-enabled provider
    this.audioProvider = new HailuoAIWithAudioProvider({
      apiKey: process.env.HAILUOAI_API_KEY!,
      model: 'hailuo-video-v1',
      rateLimit: {
        requestsPerMinute: 10,
        requestsPerHour: 100,
      },
    });
  }

  /**
   * Generate video with optional audio
   */
  async generateVideoWithAudio(
    userId: string,
    request: VideoWithAudioGenerationRequest
  ): Promise<VideoGenerationResponse> {
    // Check user quota
    await this.checkUserQuota(userId, 'VIDEO');

    // Create content generation record
    const contentGeneration = await this.prisma.contentGeneration.create({
      data: {
        userId,
        type: 'VIDEO',
        provider: 'HAILUOAI',
        prompt: request.prompt,
        status: 'PENDING',
        metadata: {
          style: request.style,
          duration: request.duration,
          aspectRatio: request.aspectRatio,
          quality: request.quality,
          includeAudio: request.includeAudio,
          audioOptions: request.audioOptions,
        },
      },
    });

    try {
      let result;

      if (request.includeAudio && request.audioOptions) {
        // Generate video with audio
        const audioParams = await this.prepareAudioParams(request);
        
        result = await this.audioProvider.generateVideoWithAudio({
          prompt: request.prompt,
          style: request.style,
          duration: request.duration,
          aspectRatio: request.aspectRatio,
          quality: request.quality,
          ...audioParams,
        });
      } else {
        // Generate video only
        result = await this.audioProvider.generateVideo({
          prompt: request.prompt,
          style: request.style,
          duration: request.duration,
          aspectRatio: request.aspectRatio,
          quality: request.quality,
        });
      }

      if (!result.success) {
        throw new GenerationError(result.error || 'Video generation failed');
      }

      // Update content generation record
      await this.prisma.contentGeneration.update({
        where: { id: contentGeneration.id },
        data: {
          status: 'COMPLETED',
          result: result.data,
          metadata: {
            ...contentGeneration.metadata,
            ...result.metadata,
          },
          completedAt: new Date(),
        },
      });

      // Record usage
      await this.recordUsage(userId, 'VIDEO', result.metadata?.cost || 0);

      return {
        id: contentGeneration.id,
        type: 'VIDEO',
        status: 'COMPLETED',
        result: result.data,
        metadata: result.metadata,
        createdAt: contentGeneration.createdAt,
        completedAt: new Date(),
      };

    } catch (error) {
      // Update content generation record with error
      await this.prisma.contentGeneration.update({
        where: { id: contentGeneration.id },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        },
      });

      throw error;
    }
  }

  /**
   * Prepare audio parameters
   */
  private async prepareAudioParams(request: VideoWithAudioGenerationRequest) {
    const audioParams: any = {};

    // Handle voiceover
    if (request.audioOptions?.voiceover) {
      const voiceover = request.audioOptions.voiceover;
      
      if (voiceover.useAutoScript && !voiceover.text) {
        // Generate script from video prompt
        const script = await this.audioProvider.generateScriptFromPrompt(
          request.prompt,
          request.duration || 15
        );
        audioParams.voiceover = {
          text: script.narration,
          voice: voiceover.voice,
          language: voiceover.language,
        };
        
        // Also set background music from script
        if (request.audioOptions.backgroundMusic) {
          audioParams.backgroundMusic = {
            prompt: script.musicDescription,
            ...request.audioOptions.backgroundMusic,
          };
        }
      } else if (voiceover.text) {
        audioParams.voiceover = voiceover;
      }
    }

    // Handle background music
    if (request.audioOptions?.backgroundMusic && !audioParams.backgroundMusic) {
      audioParams.backgroundMusic = {
        prompt: `${request.audioOptions.backgroundMusic.style || 'upbeat'} ${
          request.audioOptions.backgroundMusic.mood || 'positive'
        } music for a video about: ${request.prompt}`,
        ...request.audioOptions.backgroundMusic,
      };
    }

    return audioParams;
  }

  /**
   * Get video generation status
   */
  async getGenerationStatus(
    userId: string,
    generationId: string
  ): Promise<GenerationResponse> {
    const generation = await this.prisma.contentGeneration.findFirst({
      where: {
        id: generationId,
        userId,
      },
    });

    if (!generation) {
      throw new GenerationError('Generation not found');
    }

    // If still processing, check with provider
    if (generation.status === 'PROCESSING' && generation.jobId) {
      const statusResult = await this.audioProvider.getVideoStatus(generation.jobId);
      
      if (statusResult.success && statusResult.data) {
        const status = statusResult.data.status;
        
        if (status === 'completed') {
          await this.prisma.contentGeneration.update({
            where: { id: generationId },
            data: {
              status: 'COMPLETED',
              result: statusResult.data,
              completedAt: new Date(),
            },
          });
        } else if (status === 'failed') {
          await this.prisma.contentGeneration.update({
            where: { id: generationId },
            data: {
              status: 'FAILED',
              error: statusResult.data.error || 'Generation failed',
              completedAt: new Date(),
            },
          });
        }
      }
    }

    return {
      id: generation.id,
      type: generation.type as any,
      status: generation.status as any,
      result: generation.result,
      error: generation.error,
      metadata: generation.metadata,
      createdAt: generation.createdAt,
      completedAt: generation.completedAt,
    };
  }

  /**
   * Check user quota
   */
  private async checkUserQuota(userId: string, type: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
      },
    });

    if (!user) {
      throw new GenerationError('User not found');
    }

    // Get monthly usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const usage = await this.prisma.usageRecord.aggregate({
      where: {
        userId,
        type,
        createdAt: { gte: startOfMonth },
      },
      _sum: {
        credits: true,
      },
    });

    const monthlyLimit = this.getMonthlyLimit(user.subscription?.plan || 'FREE', type);
    const usedCredits = usage._sum.credits || 0;

    if (usedCredits >= monthlyLimit) {
      throw new QuotaError(
        `Monthly ${type.toLowerCase()} generation limit exceeded`,
        {
          used: usedCredits,
          limit: monthlyLimit,
          remaining: 0,
        }
      );
    }
  }

  /**
   * Record usage
   */
  private async recordUsage(
    userId: string,
    type: string,
    cost: number
  ): Promise<void> {
    await this.prisma.usageRecord.create({
      data: {
        userId,
        type,
        credits: 1,
        cost,
        metadata: {
          provider: 'HAILUOAI',
          timestamp: new Date().toISOString(),
        },
      },
    });
  }

  /**
   * Get monthly limits by plan
   */
  private getMonthlyLimit(plan: string, type: string): number {
    const limits: Record<string, Record<string, number>> = {
      FREE: {
        VIDEO: 5,
        BLOG: 10,
        SOCIAL: 50,
      },
      STARTER: {
        VIDEO: 30,
        BLOG: 100,
        SOCIAL: 500,
      },
      PROFESSIONAL: {
        VIDEO: 100,
        BLOG: 500,
        SOCIAL: 2000,
      },
      ENTERPRISE: {
        VIDEO: 500,
        BLOG: 2000,
        SOCIAL: 10000,
      },
    };

    return limits[plan]?.[type] || 0;
  }

  /**
   * Get audio-enabled provider capabilities
   */
  getAudioCapabilities() {
    return this.audioProvider.getSupportedAudioFeatures();
  }
}