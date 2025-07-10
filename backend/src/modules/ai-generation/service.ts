import { PrismaClient } from '@prisma/client';
import { ProviderFactory, ProviderName } from './providers/factory';
import {
  ContentGeneration,
  VideoGenerationRequest,
  BlogGenerationRequest,
  SocialPostGenerationRequest,
  ScriptGenerationRequest,
  BatchGenerationRequest,
  GenerationResponse,
  VideoGenerationResponse,
  BlogGenerationResponse,
  SocialPostGenerationResponse,
  ScriptGenerationResponse,
  BatchGenerationResponse,
  GenerationError,
  QuotaError,
  UserQuota,
  UsageRecord,
} from './types';
import { AuthService } from '../auth/service';

export class AIGenerationService {
  private prisma: PrismaClient;
  private authService: AuthService;

  constructor(prisma: PrismaClient, authService: AuthService) {
    this.prisma = prisma;
    this.authService = authService;
  }

  /**
   * Generate video content
   */
  async generateVideo(
    userId: string,
    request: VideoGenerationRequest,
    providerName?: ProviderName
  ): Promise<VideoGenerationResponse> {
    // Check user quota
    await this.checkUserQuota(userId, 'VIDEO');

    // Get video provider
    const provider = ProviderFactory.getVideoProvider(providerName);

    // Create content generation record
    const contentGeneration = await this.prisma.contentGeneration.create({
      data: {
        userId,
        type: 'VIDEO',
        status: 'PENDING',
        prompt: request.prompt,
        metadata: {
          style: request.style,
          duration: request.duration,
          aspectRatio: request.aspectRatio,
          quality: request.quality,
          platform: request.platform,
        },
      },
    });

    try {
      // Update status to generating
      await this.prisma.contentGeneration.update({
        where: { id: contentGeneration.id },
        data: { status: 'GENERATING' },
      });

      // Generate video
      const result = await provider.generateVideo({
        prompt: request.prompt,
        style: request.style,
        duration: request.duration,
        aspectRatio: request.aspectRatio,
        quality: request.quality,
      });

      if (result.success) {
        // Update content generation with result
        await this.prisma.contentGeneration.update({
          where: { id: contentGeneration.id },
          data: {
            status: 'COMPLETED',
            result: result.data,
            completedAt: new Date(),
          },
        });

        // Create video generation record
        await this.prisma.videoGeneration.create({
          data: {
            contentGenerationId: contentGeneration.id,
            provider: provider.getName() as any,
            prompt: request.prompt,
            style: request.style || 'realistic',
            duration: request.duration || 15,
            aspectRatio: request.aspectRatio || '16:9',
            quality: request.quality || 'STANDARD',
            videoUrl: result.data.videoUrl,
            thumbnailUrl: result.data.thumbnailUrl,
            metadata: result.metadata,
            processingTime: result.metadata?.processingTime,
            cost: result.metadata?.cost,
            status: 'COMPLETED',
          },
        });

        // Record usage
        await this.recordUsage(userId, 'VIDEO', provider.getName(), result.metadata?.cost || 0);

        return {
          id: contentGeneration.id,
          type: 'VIDEO',
          status: 'COMPLETED',
          result: result.data,
        };
      } else {
        throw new GenerationError(
          result.error || 'Video generation failed',
          'VIDEO_GENERATION_FAILED',
          500,
          provider.getName()
        );
      }
    } catch (error) {
      // Update content generation with error
      await this.prisma.contentGeneration.update({
        where: { id: contentGeneration.id },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Generate blog content
   */
  async generateBlog(
    userId: string,
    request: BlogGenerationRequest,
    providerName?: ProviderName
  ): Promise<BlogGenerationResponse> {
    // Check user quota
    await this.checkUserQuota(userId, 'BLOG');

    // Get text provider
    const provider = ProviderFactory.getTextProvider(providerName);

    // Create content generation record
    const contentGeneration = await this.prisma.contentGeneration.create({
      data: {
        userId,
        type: 'BLOG',
        status: 'PENDING',
        prompt: request.prompt,
        metadata: {
          tone: request.tone,
          wordCount: request.wordCount,
          seoKeywords: request.seoKeywords,
          platform: request.platform,
        },
      },
    });

    try {
      // Update status to generating
      await this.prisma.contentGeneration.update({
        where: { id: contentGeneration.id },
        data: { status: 'GENERATING' },
      });

      // Generate blog
      const result = await provider.generateBlog({
        prompt: request.prompt,
        tone: request.tone,
        wordCount: request.wordCount,
        seoKeywords: request.seoKeywords,
      });

      if (result.success) {
        let parsedResult;
        try {
          parsedResult = JSON.parse(result.data.content);
        } catch {
          // If not JSON, create structured response
          parsedResult = {
            title: 'Generated Blog Post',
            content: result.data.content,
            excerpt: result.data.content.substring(0, 150) + '...',
            wordCount: result.data.content.split(' ').length,
            seoKeywords: request.seoKeywords,
          };
        }

        // Update content generation with result
        await this.prisma.contentGeneration.update({
          where: { id: contentGeneration.id },
          data: {
            status: 'COMPLETED',
            result: parsedResult,
            completedAt: new Date(),
          },
        });

        // Create blog generation record
        await this.prisma.blogGeneration.create({
          data: {
            contentGenerationId: contentGeneration.id,
            provider: provider.getName() as any,
            prompt: request.prompt,
            tone: request.tone,
            wordCount: request.wordCount,
            seoKeywords: request.seoKeywords,
            title: parsedResult.title,
            content: parsedResult.content,
            excerpt: parsedResult.excerpt,
            metadata: result.metadata,
            processingTime: result.metadata?.processingTime,
            cost: result.metadata?.cost,
            status: 'COMPLETED',
          },
        });

        // Record usage
        await this.recordUsage(userId, 'BLOG', provider.getName(), result.metadata?.cost || 0);

        return {
          id: contentGeneration.id,
          type: 'BLOG',
          status: 'COMPLETED',
          result: parsedResult,
        };
      } else {
        throw new GenerationError(
          result.error || 'Blog generation failed',
          'BLOG_GENERATION_FAILED',
          500,
          provider.getName()
        );
      }
    } catch (error) {
      // Update content generation with error
      await this.prisma.contentGeneration.update({
        where: { id: contentGeneration.id },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Generate social media post
   */
  async generateSocialPost(
    userId: string,
    request: SocialPostGenerationRequest,
    providerName?: ProviderName
  ): Promise<SocialPostGenerationResponse> {
    // Check user quota
    await this.checkUserQuota(userId, 'SOCIAL_POST');

    // Get text provider
    const provider = ProviderFactory.getTextProvider(providerName);

    // Create content generation record
    const contentGeneration = await this.prisma.contentGeneration.create({
      data: {
        userId,
        type: 'SOCIAL_POST',
        status: 'PENDING',
        prompt: request.prompt,
        platform: request.platform,
        metadata: {
          tone: request.tone,
          includeHashtags: request.includeHashtags,
          includeEmojis: request.includeEmojis,
        },
      },
    });

    try {
      // Update status to generating
      await this.prisma.contentGeneration.update({
        where: { id: contentGeneration.id },
        data: { status: 'GENERATING' },
      });

      // Generate social post
      const result = await provider.generateSocialPost({
        prompt: request.prompt,
        platform: request.platform,
        tone: request.tone,
        includeHashtags: request.includeHashtags,
        includeEmojis: request.includeEmojis,
      });

      if (result.success) {
        let parsedResult;
        try {
          parsedResult = JSON.parse(result.data.content);
        } catch {
          // If not JSON, create structured response
          parsedResult = {
            content: result.data.content,
            hashtags: [],
            platform: request.platform,
            characterCount: result.data.content.length,
          };
        }

        // Update content generation with result
        await this.prisma.contentGeneration.update({
          where: { id: contentGeneration.id },
          data: {
            status: 'COMPLETED',
            result: parsedResult,
            completedAt: new Date(),
          },
        });

        // Record usage
        await this.recordUsage(userId, 'SOCIAL_POST', provider.getName(), result.metadata?.cost || 0);

        return {
          id: contentGeneration.id,
          type: 'SOCIAL_POST',
          status: 'COMPLETED',
          result: parsedResult,
        };
      } else {
        throw new GenerationError(
          result.error || 'Social post generation failed',
          'SOCIAL_POST_GENERATION_FAILED',
          500,
          provider.getName()
        );
      }
    } catch (error) {
      // Update content generation with error
      await this.prisma.contentGeneration.update({
        where: { id: contentGeneration.id },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Generate script content
   */
  async generateScript(
    userId: string,
    request: ScriptGenerationRequest,
    providerName?: ProviderName
  ): Promise<ScriptGenerationResponse> {
    // Check user quota
    await this.checkUserQuota(userId, 'SCRIPT');

    // Get text provider
    const provider = ProviderFactory.getTextProvider(providerName);

    // Create content generation record
    const contentGeneration = await this.prisma.contentGeneration.create({
      data: {
        userId,
        type: 'SCRIPT',
        status: 'PENDING',
        prompt: request.prompt,
        metadata: {
          type: request.type,
          duration: request.duration,
          tone: request.tone,
          includeHooks: request.includeHooks,
          includeCTA: request.includeCTA,
        },
      },
    });

    try {
      // Update status to generating
      await this.prisma.contentGeneration.update({
        where: { id: contentGeneration.id },
        data: { status: 'GENERATING' },
      });

      // Generate script
      const result = await provider.generateScript({
        prompt: request.prompt,
        type: request.type,
        duration: request.duration,
        tone: request.tone,
        includeHooks: request.includeHooks,
        includeCTA: request.includeCTA,
      });

      if (result.success) {
        let parsedResult;
        try {
          parsedResult = JSON.parse(result.data.content);
        } catch {
          // If not JSON, create structured response
          parsedResult = {
            title: 'Generated Script',
            script: result.data.content,
            hooks: [],
            cta: '',
            estimatedDuration: request.duration,
          };
        }

        // Update content generation with result
        await this.prisma.contentGeneration.update({
          where: { id: contentGeneration.id },
          data: {
            status: 'COMPLETED',
            result: parsedResult,
            completedAt: new Date(),
          },
        });

        // Record usage
        await this.recordUsage(userId, 'SCRIPT', provider.getName(), result.metadata?.cost || 0);

        return {
          id: contentGeneration.id,
          type: 'SCRIPT',
          status: 'COMPLETED',
          result: parsedResult,
        };
      } else {
        throw new GenerationError(
          result.error || 'Script generation failed',
          'SCRIPT_GENERATION_FAILED',
          500,
          provider.getName()
        );
      }
    } catch (error) {
      // Update content generation with error
      await this.prisma.contentGeneration.update({
        where: { id: contentGeneration.id },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Get generation status
   */
  async getGenerationStatus(userId: string, generationId: string): Promise<GenerationResponse> {
    const generation = await this.prisma.contentGeneration.findUnique({
      where: { id: generationId, userId },
    });

    if (!generation) {
      throw new GenerationError('Generation not found', 'GENERATION_NOT_FOUND', 404);
    }

    return {
      id: generation.id,
      type: generation.type as any,
      status: generation.status as any,
      result: generation.result,
      error: generation.error,
    };
  }

  /**
   * Get user's generations
   */
  async getUserGenerations(
    userId: string,
    filters: {
      type?: 'VIDEO' | 'BLOG' | 'SOCIAL_POST' | 'SCRIPT';
      status?: 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED';
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    generations: GenerationResponse[];
    total: number;
  }> {
    const where = {
      userId,
      ...(filters.type && { type: filters.type }),
      ...(filters.status && { status: filters.status }),
    };

    const [generations, total] = await Promise.all([
      this.prisma.contentGeneration.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      this.prisma.contentGeneration.count({ where }),
    ]);

    return {
      generations: generations.map(g => ({
        id: g.id,
        type: g.type as any,
        status: g.status as any,
        result: g.result,
        error: g.error,
      })),
      total,
    };
  }

  /**
   * Check user quota
   */
  private async checkUserQuota(userId: string, type: 'VIDEO' | 'BLOG' | 'SOCIAL_POST' | 'SCRIPT'): Promise<void> {
    // Get user's subscription plan
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      throw new GenerationError('User not found', 'USER_NOT_FOUND', 404);
    }

    // Define quota limits based on subscription plan
    const quotaLimits = {
      FREE: { monthly: 5, daily: 2, hourly: 1 },
      STARTER: { monthly: 50, daily: 10, hourly: 5 },
      PRO: { monthly: 500, daily: 50, hourly: 20 },
      ENTERPRISE: { monthly: 5000, daily: 200, hourly: 100 },
    };

    const plan = user.subscription?.plan || 'FREE';
    const limits = quotaLimits[plan as keyof typeof quotaLimits];

    // Check monthly quota
    const monthlyUsage = await this.prisma.usageRecord.count({
      where: {
        userId,
        type,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    });

    if (monthlyUsage >= limits.monthly) {
      throw new QuotaError(
        'Monthly quota exceeded',
        'MONTHLY',
        limits.monthly,
        monthlyUsage
      );
    }

    // Check daily quota
    const dailyUsage = await this.prisma.usageRecord.count({
      where: {
        userId,
        type,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    if (dailyUsage >= limits.daily) {
      throw new QuotaError(
        'Daily quota exceeded',
        'DAILY',
        limits.daily,
        dailyUsage
      );
    }

    // Check hourly quota
    const hourlyUsage = await this.prisma.usageRecord.count({
      where: {
        userId,
        type,
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000),
        },
      },
    });

    if (hourlyUsage >= limits.hourly) {
      throw new QuotaError(
        'Hourly quota exceeded',
        'HOURLY',
        limits.hourly,
        hourlyUsage
      );
    }
  }

  /**
   * Record usage
   */
  private async recordUsage(
    userId: string,
    type: 'VIDEO' | 'BLOG' | 'SOCIAL_POST' | 'SCRIPT',
    provider: string,
    cost: number,
    tokens?: number,
    seconds?: number
  ): Promise<void> {
    await this.prisma.usageRecord.create({
      data: {
        userId,
        type,
        provider,
        cost,
        tokens,
        seconds,
      },
    });
  }
}