import { PrismaClient } from '@prisma/client';
import {
  Content,
  ContentVersion,
  ContentTemplate,
  ContentCalendar,
  ContentTag,
  ContentCategory,
  CreateContentRequest,
  UpdateContentRequest,
  CreateTemplateRequest,
  ScheduleContentRequest,
  BulkOperationRequest,
  SearchContentRequest,
  ExportContentRequest,
  ImportContentRequest,
  ContentResponse,
  ContentListResponse,
  CalendarResponse,
  ContentStats,
  TemplateResponse,
  BulkOperationResponse,
  ExportResponse,
  ImportResponse,
  ContentError,
  TemplateError,
  CalendarError,
  ContentFilters,
} from './types';

export class ContentManagementService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Create new content
   */
  async createContent(
    userId: string,
    request: CreateContentRequest
  ): Promise<ContentResponse> {
    // Validate generation ID if provided
    if (request.generationId) {
      const generation = await this.prisma.contentGeneration.findUnique({
        where: { id: request.generationId, userId },
      });

      if (!generation) {
        throw new ContentError(
          'Content generation not found',
          'GENERATION_NOT_FOUND',
          404
        );
      }
    }

    // Process tags
    const tags = await this.processContentTags(userId, request.tags || []);

    // Create content
    const content = await this.prisma.content.create({
      data: {
        userId,
        title: request.title,
        description: request.description,
        type: request.type,
        status: 'DRAFT',
        content: request.content,
        tags: tags.map(t => t.name),
        category: request.category,
        metadata: request.metadata,
        mediaUrl: request.mediaUrl,
        thumbnailUrl: request.thumbnailUrl,
        generationId: request.generationId,
        version: 1,
      },
    });

    // Create initial version
    await this.createContentVersion(content, userId, 'Initial version');

    return {
      content: content as Content,
    };
  }

  /**
   * Update existing content
   */
  async updateContent(
    userId: string,
    contentId: string,
    request: UpdateContentRequest
  ): Promise<ContentResponse> {
    // Find existing content
    const existingContent = await this.prisma.content.findUnique({
      where: { id: contentId, userId },
    });

    if (!existingContent) {
      throw new ContentError('Content not found', 'CONTENT_NOT_FOUND', 404);
    }

    // Process tags if provided
    let tags = existingContent.tags;
    if (request.tags) {
      const processedTags = await this.processContentTags(userId, request.tags);
      tags = processedTags.map(t => t.name);
    }

    // Update content
    const updatedContent = await this.prisma.content.update({
      where: { id: contentId },
      data: {
        title: request.title,
        description: request.description,
        content: request.content,
        tags,
        category: request.category,
        metadata: request.metadata ? { ...existingContent.metadata, ...request.metadata } : undefined,
        mediaUrl: request.mediaUrl,
        thumbnailUrl: request.thumbnailUrl,
        status: request.status,
        version: { increment: 1 },
      },
    });

    // Create version if content changed
    if (request.content || request.title || request.description) {
      await this.createContentVersion(
        updatedContent,
        userId,
        request.changeNote || 'Content updated'
      );
    }

    return {
      content: updatedContent as Content,
    };
  }

  /**
   * Get content by ID
   */
  async getContent(
    userId: string,
    contentId: string,
    includeVersions: boolean = false
  ): Promise<ContentResponse> {
    const content = await this.prisma.content.findUnique({
      where: { id: contentId, userId },
      include: {
        contentVersions: includeVersions,
        platformPosts: true,
      },
    });

    if (!content) {
      throw new ContentError('Content not found', 'CONTENT_NOT_FOUND', 404);
    }

    // Get analytics if published
    let analytics;
    if (content.platformPosts && content.platformPosts.length > 0) {
      analytics = await this.getContentAnalytics(content.id);
    }

    return {
      content: content as Content,
      versions: includeVersions ? content.contentVersions as ContentVersion[] : undefined,
      platformPosts: content.platformPosts,
      analytics,
    };
  }

  /**
   * List user's content
   */
  async listContent(
    userId: string,
    filters: SearchContentRequest
  ): Promise<ContentListResponse> {
    const where = this.buildContentWhereClause(userId, filters);

    const [contents, total] = await Promise.all([
      this.prisma.content.findMany({
        where,
        orderBy: { [filters.sortBy || 'updatedAt']: filters.sortOrder || 'desc' },
        take: filters.limit,
        skip: filters.offset,
      }),
      this.prisma.content.count({ where }),
    ]);

    return {
      contents: contents as Content[],
      total,
      limit: filters.limit || 20,
      offset: filters.offset || 0,
      hasMore: (filters.offset || 0) + (filters.limit || 20) < total,
    };
  }

  /**
   * Delete content
   */
  async deleteContent(userId: string, contentId: string): Promise<void> {
    const content = await this.prisma.content.findUnique({
      where: { id: contentId, userId },
    });

    if (!content) {
      throw new ContentError('Content not found', 'CONTENT_NOT_FOUND', 404);
    }

    // Check if content is published
    if (content.status === 'PUBLISHED') {
      throw new ContentError(
        'Cannot delete published content. Archive it instead.',
        'CANNOT_DELETE_PUBLISHED',
        400
      );
    }

    // Delete content and related data
    await this.prisma.$transaction([
      this.prisma.contentVersion.deleteMany({ where: { contentId } }),
      this.prisma.contentCalendar.deleteMany({ where: { contentId } }),
      this.prisma.content.delete({ where: { id: contentId } }),
    ]);
  }

  /**
   * Create content template
   */
  async createTemplate(
    userId: string,
    request: CreateTemplateRequest
  ): Promise<TemplateResponse> {
    // Process tags
    const tags = await this.processContentTags(userId, request.tags || []);

    const template = await this.prisma.contentTemplate.create({
      data: {
        userId,
        name: request.name,
        description: request.description,
        type: request.type,
        template: request.template,
        tags: tags.map(t => t.name),
        category: request.category,
        isPublic: request.isPublic,
        usageCount: 0,
      },
    });

    return {
      template: template as ContentTemplate,
    };
  }

  /**
   * Apply template to create content
   */
  async applyTemplate(
    userId: string,
    templateId: string,
    variables?: Record<string, any>
  ): Promise<ContentResponse> {
    const template = await this.prisma.contentTemplate.findFirst({
      where: {
        id: templateId,
        OR: [{ userId }, { isPublic: true }],
      },
    });

    if (!template) {
      throw new TemplateError('Template not found', 'TEMPLATE_NOT_FOUND', 404);
    }

    // Process template with variables
    const processedContent = this.processTemplate(template.template, variables || {});

    // Create content from template
    const content = await this.createContent(userId, {
      title: processedContent.title || `New ${template.type} from ${template.name}`,
      description: processedContent.description,
      type: template.type as any,
      content: processedContent,
      tags: template.tags,
      category: template.category,
      metadata: { templateId, templateName: template.name },
    });

    // Increment template usage
    await this.prisma.contentTemplate.update({
      where: { id: templateId },
      data: { usageCount: { increment: 1 } },
    });

    return content;
  }

  /**
   * Schedule content for publishing
   */
  async scheduleContent(
    userId: string,
    request: ScheduleContentRequest
  ): Promise<ContentCalendar> {
    // Validate content
    const content = await this.prisma.content.findUnique({
      where: { id: request.contentId, userId },
    });

    if (!content) {
      throw new ContentError('Content not found', 'CONTENT_NOT_FOUND', 404);
    }

    if (content.status !== 'APPROVED' && content.status !== 'PUBLISHED') {
      throw new ContentError(
        'Content must be approved before scheduling',
        'CONTENT_NOT_APPROVED',
        400
      );
    }

    // Check for existing schedule
    const existingSchedule = await this.prisma.contentCalendar.findFirst({
      where: {
        contentId: request.contentId,
        status: 'SCHEDULED',
      },
    });

    if (existingSchedule) {
      throw new CalendarError(
        'Content is already scheduled',
        'ALREADY_SCHEDULED',
        400
      );
    }

    // Create calendar entry
    const calendar = await this.prisma.contentCalendar.create({
      data: {
        userId,
        contentId: request.contentId,
        scheduledDate: new Date(request.scheduledDate),
        platforms: request.platforms,
        status: 'SCHEDULED',
        publishOptions: request.publishOptions,
        reminders: request.reminders?.map(r => new Date(r)),
      },
    });

    // Update content scheduled date
    await this.prisma.content.update({
      where: { id: request.contentId },
      data: { scheduledAt: new Date(request.scheduledDate) },
    });

    return calendar as ContentCalendar;
  }

  /**
   * Get content calendar
   */
  async getCalendar(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarResponse> {
    const events = await this.prisma.contentCalendar.findMany({
      where: {
        userId,
        scheduledDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        content: true,
      },
      orderBy: { scheduledDate: 'asc' },
    });

    return {
      events: events.map(event => ({
        id: event.id,
        contentId: event.contentId,
        content: event.content as Content,
        date: event.scheduledDate,
        platforms: event.platforms,
        status: event.status,
      })),
      startDate,
      endDate,
    };
  }

  /**
   * Perform bulk operations
   */
  async performBulkOperation(
    userId: string,
    request: BulkOperationRequest
  ): Promise<BulkOperationResponse> {
    const results = {
      operation: request.operation,
      totalItems: request.contentIds.length,
      successCount: 0,
      failedCount: 0,
      errors: [] as Array<{ contentId: string; error: string }>,
    };

    for (const contentId of request.contentIds) {
      try {
        switch (request.operation) {
          case 'DELETE':
            await this.deleteContent(userId, contentId);
            break;

          case 'ARCHIVE':
            await this.updateContent(userId, contentId, { status: 'ARCHIVED' });
            break;

          case 'PUBLISH':
            await this.updateContent(userId, contentId, { status: 'PUBLISHED' });
            break;

          case 'TAG':
            if (request.data?.tags) {
              await this.updateContent(userId, contentId, { tags: request.data.tags });
            }
            break;

          case 'CATEGORY':
            if (request.data?.category) {
              await this.updateContent(userId, contentId, { category: request.data.category });
            }
            break;

          case 'STATUS':
            if (request.data?.status) {
              await this.updateContent(userId, contentId, { status: request.data.status });
            }
            break;
        }

        results.successCount++;
      } catch (error) {
        results.failedCount++;
        results.errors.push({
          contentId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Export content
   */
  async exportContent(
    userId: string,
    request: ExportContentRequest
  ): Promise<ExportResponse> {
    let contents: any[];

    if (request.contentIds && request.contentIds.length > 0) {
      contents = await this.prisma.content.findMany({
        where: {
          id: { in: request.contentIds },
          userId,
        },
        include: {
          contentVersions: request.includeVersions,
        },
      });
    } else {
      contents = await this.prisma.content.findMany({
        where: { userId },
        include: {
          contentVersions: request.includeVersions,
        },
      });
    }

    let data: string;
    switch (request.format) {
      case 'JSON':
        data = JSON.stringify(contents, null, 2);
        break;

      case 'CSV':
        data = this.convertToCSV(contents);
        break;

      case 'MARKDOWN':
        data = this.convertToMarkdown(contents);
        break;

      default:
        throw new ContentError('Unsupported export format', 'UNSUPPORTED_FORMAT', 400);
    }

    return {
      format: request.format,
      data,
      contentCount: contents.length,
      exportedAt: new Date(),
    };
  }

  /**
   * Import content
   */
  async importContent(
    userId: string,
    request: ImportContentRequest
  ): Promise<ImportResponse> {
    const results = {
      format: request.format,
      totalItems: 0,
      importedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      errors: [] as Array<{ item: any; error: string }>,
    };

    let items: any[];
    try {
      switch (request.format) {
        case 'JSON':
          items = JSON.parse(request.data);
          break;

        case 'CSV':
          items = this.parseCSV(request.data);
          break;

        case 'MARKDOWN':
          items = this.parseMarkdown(request.data);
          break;

        default:
          throw new ContentError('Unsupported import format', 'UNSUPPORTED_FORMAT', 400);
      }
    } catch (error) {
      throw new ContentError('Invalid import data', 'INVALID_DATA', 400);
    }

    results.totalItems = items.length;

    for (const item of items) {
      try {
        // Check if content already exists
        if (!request.overwrite && item.id) {
          const existing = await this.prisma.content.findUnique({
            where: { id: item.id, userId },
          });
          if (existing) {
            results.skippedCount++;
            continue;
          }
        }

        // Apply mappings if provided
        const mappedItem = request.mappings
          ? this.applyMappings(item, request.mappings)
          : item;

        // Create or update content
        await this.createContent(userId, {
          title: mappedItem.title,
          description: mappedItem.description,
          type: mappedItem.type,
          content: mappedItem.content,
          tags: mappedItem.tags || [],
          category: mappedItem.category,
          metadata: mappedItem.metadata,
          mediaUrl: mappedItem.mediaUrl,
          thumbnailUrl: mappedItem.thumbnailUrl,
        });

        results.importedCount++;
      } catch (error) {
        results.failedCount++;
        results.errors.push({
          item,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Get content statistics
   */
  async getContentStats(userId: string): Promise<ContentStats> {
    const [
      total,
      byType,
      byStatus,
      recentlyUpdated,
      scheduled,
      published,
    ] = await Promise.all([
      this.prisma.content.count({ where: { userId } }),
      this.prisma.content.groupBy({
        by: ['type'],
        where: { userId },
        _count: true,
      }),
      this.prisma.content.groupBy({
        by: ['status'],
        where: { userId },
        _count: true,
      }),
      this.prisma.content.count({
        where: {
          userId,
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
      this.prisma.contentCalendar.count({
        where: {
          userId,
          status: 'SCHEDULED',
          scheduledDate: { gte: new Date() },
        },
      }),
      this.prisma.content.count({
        where: { userId, status: 'PUBLISHED' },
      }),
    ]);

    return {
      total,
      byType: byType.reduce((acc, curr) => {
        acc[curr.type] = curr._count;
        return acc;
      }, {} as Record<string, number>),
      byStatus: byStatus.reduce((acc, curr) => {
        acc[curr.status] = curr._count;
        return acc;
      }, {} as Record<string, number>),
      recentlyUpdated,
      scheduled,
      published,
    };
  }

  // Private helper methods
  private async processContentTags(
    userId: string,
    tagNames: string[]
  ): Promise<ContentTag[]> {
    const tags: ContentTag[] = [];

    for (const name of tagNames) {
      const slug = this.slugify(name);
      let tag = await this.prisma.contentTag.findFirst({
        where: { userId, slug },
      });

      if (!tag) {
        tag = await this.prisma.contentTag.create({
          data: {
            userId,
            name,
            slug,
            usageCount: 0,
          },
        });
      } else {
        await this.prisma.contentTag.update({
          where: { id: tag.id },
          data: { usageCount: { increment: 1 } },
        });
      }

      tags.push(tag as ContentTag);
    }

    return tags;
  }

  private async createContentVersion(
    content: any,
    userId: string,
    changeNote: string
  ): Promise<void> {
    await this.prisma.contentVersion.create({
      data: {
        contentId: content.id,
        version: content.version,
        title: content.title,
        description: content.description,
        content: content.content,
        metadata: content.metadata,
        changedBy: userId,
        changeNote,
      },
    });
  }

  private buildContentWhereClause(userId: string, filters: SearchContentRequest): any {
    const where: any = { userId };

    if (filters.query) {
      where.OR = [
        { title: { contains: filters.query, mode: 'insensitive' } },
        { description: { contains: filters.query, mode: 'insensitive' } },
      ];
    }

    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.category) where.category = filters.category;

    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    return where;
  }

  private processTemplate(template: any, variables: Record<string, any>): any {
    // Simple template processing - replace {{variable}} with values
    const json = JSON.stringify(template);
    const processed = json.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] || match;
    });
    return JSON.parse(processed);
  }

  private async getContentAnalytics(contentId: string): Promise<any> {
    // Aggregate analytics from platform posts
    const posts = await this.prisma.platformPost.findMany({
      where: { contentId },
    });

    const analytics = {
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      byPlatform: {} as Record<string, any>,
    };

    for (const post of posts) {
      if (post.analytics) {
        analytics.totalViews += post.analytics.views || 0;
        analytics.totalLikes += post.analytics.likes || 0;
        analytics.totalComments += post.analytics.comments || 0;
        analytics.totalShares += post.analytics.shares || 0;

        analytics.byPlatform[post.platform] = post.analytics;
      }
    }

    return analytics;
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private convertToCSV(contents: any[]): string {
    if (contents.length === 0) return '';

    const headers = ['id', 'title', 'description', 'type', 'status', 'tags', 'createdAt', 'updatedAt'];
    const rows = contents.map(content => [
      content.id,
      content.title,
      content.description || '',
      content.type,
      content.status,
      content.tags.join(';'),
      content.createdAt.toISOString(),
      content.updatedAt.toISOString(),
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private convertToMarkdown(contents: any[]): string {
    return contents
      .map(content => {
        return `# ${content.title}

**Type:** ${content.type}  
**Status:** ${content.status}  
**Tags:** ${content.tags.join(', ')}  
**Created:** ${content.createdAt.toISOString()}

${content.description || ''}

---

${JSON.stringify(content.content, null, 2)}

---
`;
      })
      .join('\n\n');
  }

  private parseCSV(data: string): any[] {
    const lines = data.split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1).map(line => {
      const values = line.split(',');
      const obj: any = {};
      
      headers.forEach((header, index) => {
        if (header === 'tags') {
          obj[header] = values[index]?.split(';') || [];
        } else {
          obj[header] = values[index];
        }
      });
      
      return obj;
    });
  }

  private parseMarkdown(data: string): any[] {
    // Simple markdown parser for content blocks
    const blocks = data.split('---\n\n');
    return blocks.map(block => {
      const lines = block.split('\n');
      const title = lines[0].replace('# ', '');
      
      // Extract metadata
      const type = lines.find(l => l.startsWith('**Type:**'))?.replace('**Type:**', '').trim();
      const status = lines.find(l => l.startsWith('**Status:**'))?.replace('**Status:**', '').trim();
      const tags = lines.find(l => l.startsWith('**Tags:**'))?.replace('**Tags:**', '').trim().split(', ');
      
      return { title, type, status, tags };
    });
  }

  private applyMappings(item: any, mappings: Record<string, string>): any {
    const mapped: any = {};
    
    for (const [source, target] of Object.entries(mappings)) {
      if (item[source] !== undefined) {
        mapped[target] = item[source];
      }
    }
    
    return { ...item, ...mapped };
  }
}