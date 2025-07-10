import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { ContentManagementService } from './service';
import { ContentManagementController } from './controller';
import { createContentManagementRoutes } from './routes';
import { AuthMiddleware } from '../auth/middleware';

export interface ContentManagementModuleConfig {
  prefix?: string;
  enableVersioning?: boolean;
  enableTemplates?: boolean;
  enableCalendar?: boolean;
  enableImportExport?: boolean;
  maxContentSize?: number; // in MB
  allowedFileTypes?: string[];
}

export class ContentManagementModule {
  private prisma: PrismaClient;
  private service: ContentManagementService;
  private controller: ContentManagementController;
  private config: ContentManagementModuleConfig;

  constructor(
    prisma: PrismaClient,
    config: ContentManagementModuleConfig = {}
  ) {
    this.prisma = prisma;
    this.config = {
      prefix: '/api/v1/content',
      enableVersioning: true,
      enableTemplates: true,
      enableCalendar: true,
      enableImportExport: true,
      maxContentSize: 50, // 50MB default
      allowedFileTypes: ['image/*', 'video/*', 'audio/*'],
      ...config,
    };

    // Initialize services
    this.service = new ContentManagementService(prisma);
    this.controller = new ContentManagementController(this.service);
  }

  /**
   * Initialize the content management module
   */
  async init(app: Express): Promise<void> {
    // Create auth middleware
    const authMiddleware = new AuthMiddleware(this.prisma);

    // Create and mount routes
    const routes = createContentManagementRoutes(this.controller, authMiddleware);
    app.use(this.config.prefix!, routes);

    // Setup cleanup tasks
    this.startCleanupTasks();

    // Setup scheduled publishing
    if (this.config.enableCalendar) {
      this.startScheduledPublishing();
    }

    console.log(`[CONTENT-MANAGEMENT] Module initialized at ${this.config.prefix}`);
    console.log(`[CONTENT-MANAGEMENT] Features: Versioning=${this.config.enableVersioning}, Templates=${this.config.enableTemplates}, Calendar=${this.config.enableCalendar}`);
  }

  /**
   * Get module statistics
   */
  async getStats(): Promise<{
    totalContent: number;
    totalTemplates: number;
    totalVersions: number;
    scheduledContent: number;
    publishedContent: number;
    storageUsed: number;
  }> {
    const [
      totalContent,
      totalTemplates,
      totalVersions,
      scheduledContent,
      publishedContent,
    ] = await Promise.all([
      this.prisma.content.count(),
      this.prisma.contentTemplate.count(),
      this.prisma.contentVersion.count(),
      this.prisma.contentCalendar.count({
        where: {
          status: 'SCHEDULED',
          scheduledDate: { gte: new Date() },
        },
      }),
      this.prisma.content.count({
        where: { status: 'PUBLISHED' },
      }),
    ]);

    // Calculate storage (simplified - would need actual file size tracking)
    const contents = await this.prisma.content.findMany({
      select: { metadata: true },
    });

    const storageUsed = contents.reduce((total, content) => {
      return total + (content.metadata?.fileSize || 0);
    }, 0);

    return {
      totalContent,
      totalTemplates,
      totalVersions,
      scheduledContent,
      publishedContent,
      storageUsed,
    };
  }

  /**
   * Health check for the content management module
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    database: boolean;
    features: Record<string, boolean>;
    details: any;
  }> {
    try {
      // Check database connectivity
      const dbTest = await this.prisma.content.count();
      const databaseHealthy = true;

      const features = {
        versioning: this.config.enableVersioning!,
        templates: this.config.enableTemplates!,
        calendar: this.config.enableCalendar!,
        importExport: this.config.enableImportExport!,
      };

      return {
        status: 'healthy',
        database: databaseHealthy,
        features,
        details: {
          maxContentSize: `${this.config.maxContentSize}MB`,
          allowedFileTypes: this.config.allowedFileTypes,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        database: false,
        features: {},
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Start cleanup tasks
   */
  private startCleanupTasks(): void {
    // Clean up old drafts every day
    setInterval(async () => {
      try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 days old

        const result = await this.prisma.content.deleteMany({
          where: {
            status: 'DRAFT',
            updatedAt: { lt: cutoffDate },
          },
        });

        if (result.count > 0) {
          console.log(`[CONTENT-MANAGEMENT] Cleaned up ${result.count} old drafts`);
        }
      } catch (error) {
        console.error('[CONTENT-MANAGEMENT] Error cleaning up old drafts:', error);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours

    // Clean up orphaned versions
    if (this.config.enableVersioning) {
      setInterval(async () => {
        try {
          // Keep only last 10 versions per content
          const contents = await this.prisma.content.findMany({
            select: { id: true },
          });

          for (const content of contents) {
            const versions = await this.prisma.contentVersion.findMany({
              where: { contentId: content.id },
              orderBy: { version: 'desc' },
              skip: 10,
              select: { id: true },
            });

            if (versions.length > 0) {
              await this.prisma.contentVersion.deleteMany({
                where: {
                  id: { in: versions.map(v => v.id) },
                },
              });
            }
          }
        } catch (error) {
          console.error('[CONTENT-MANAGEMENT] Error cleaning up versions:', error);
        }
      }, 24 * 60 * 60 * 1000); // 24 hours
    }

    // Update tag usage counts
    setInterval(async () => {
      try {
        const tags = await this.prisma.contentTag.findMany();

        for (const tag of tags) {
          const count = await this.prisma.content.count({
            where: {
              tags: { has: tag.name },
            },
          });

          await this.prisma.contentTag.update({
            where: { id: tag.id },
            data: { usageCount: count },
          });
        }
      } catch (error) {
        console.error('[CONTENT-MANAGEMENT] Error updating tag counts:', error);
      }
    }, 60 * 60 * 1000); // 1 hour
  }

  /**
   * Start scheduled publishing
   */
  private startScheduledPublishing(): void {
    setInterval(async () => {
      try {
        const now = new Date();
        const scheduledItems = await this.prisma.contentCalendar.findMany({
          where: {
            status: 'SCHEDULED',
            scheduledDate: { lte: now },
          },
          include: {
            content: true,
          },
        });

        for (const item of scheduledItems) {
          try {
            // This would integrate with platform integrations module
            // For now, just update status
            await this.prisma.$transaction([
              this.prisma.content.update({
                where: { id: item.contentId },
                data: {
                  status: 'PUBLISHED',
                  publishedAt: now,
                },
              }),
              this.prisma.contentCalendar.update({
                where: { id: item.id },
                data: { status: 'PUBLISHED' },
              }),
            ]);

            console.log(`[CONTENT-MANAGEMENT] Published scheduled content: ${item.contentId}`);
          } catch (error) {
            console.error(`[CONTENT-MANAGEMENT] Failed to publish content ${item.contentId}:`, error);
            
            await this.prisma.contentCalendar.update({
              where: { id: item.id },
              data: { status: 'FAILED' },
            });
          }
        }
      } catch (error) {
        console.error('[CONTENT-MANAGEMENT] Error processing scheduled content:', error);
      }
    }, 60 * 1000); // Check every minute
  }

  /**
   * Get service instance
   */
  getService(): ContentManagementService {
    return this.service;
  }

  /**
   * Get controller instance
   */
  getController(): ContentManagementController {
    return this.controller;
  }

  /**
   * Update module configuration
   */
  updateConfig(config: Partial<ContentManagementModuleConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get module configuration
   */
  getModuleConfig(): ContentManagementModuleConfig {
    return this.config;
  }

  /**
   * Enable/disable features
   */
  setFeature(feature: keyof ContentManagementModuleConfig, enabled: boolean): void {
    if (feature in this.config) {
      (this.config as any)[feature] = enabled;
    }
  }

  /**
   * Get storage usage for a user
   */
  async getUserStorageUsage(userId: string): Promise<{
    used: number;
    limit: number;
    percentage: number;
  }> {
    const contents = await this.prisma.content.findMany({
      where: { userId },
      select: { metadata: true },
    });

    const used = contents.reduce((total, content) => {
      return total + (content.metadata?.fileSize || 0);
    }, 0);

    // Default 1GB limit per user (would be based on subscription)
    const limit = 1024 * 1024 * 1024;

    return {
      used,
      limit,
      percentage: (used / limit) * 100,
    };
  }

  /**
   * Validate content before saving
   */
  async validateContent(content: any): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Check content size
    const contentSize = JSON.stringify(content).length;
    if (contentSize > this.config.maxContentSize! * 1024 * 1024) {
      errors.push(`Content size exceeds ${this.config.maxContentSize}MB limit`);
    }

    // Check file types if media is included
    if (content.mediaUrl) {
      // Would validate file type from URL or metadata
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}