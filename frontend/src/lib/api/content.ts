import { apiClient } from './client';
import { z } from 'zod';

// Schemas
export const ContentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  type: z.enum(['VIDEO', 'BLOG', 'SOCIAL']),
  status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED']),
  content: z.any(),
  mediaUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  tags: z.array(z.string()).optional(),
  scheduledAt: z.string().optional(),
  platforms: z.array(z.string()).optional(),
});

export const ContentUpdateSchema = ContentSchema.partial();

// Types
export type CreateContentRequest = z.infer<typeof ContentSchema>;
export type UpdateContentRequest = z.infer<typeof ContentUpdateSchema>;
export type ContentType = 'VIDEO' | 'BLOG' | 'SOCIAL';
export type ContentStatus = 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED';

export interface Content {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: ContentType;
  status: ContentStatus;
  content: any;
  mediaUrl?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  tags: string[];
  scheduledAt?: string;
  publishedAt?: string;
  platforms: string[];
  publishedUrls?: Record<string, string>;
  metrics?: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ContentVersion {
  id: string;
  contentId: string;
  version: number;
  changes: any;
  createdAt: string;
  createdBy: string;
}

export interface ContentTemplate {
  id: string;
  name: string;
  description?: string;
  type: 'VIDEO' | 'BLOG' | 'SOCIAL';
  template: any;
  variables: string[];
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

// API functions
export const contentApi = {
  /**
   * Create new content
   */
  async create(data: CreateContentRequest): Promise<Content> {
    return apiClient.post('/content', data);
  },

  /**
   * Get content by ID
   */
  async getById(id: string): Promise<Content> {
    return apiClient.get(`/content/${id}`);
  },

  /**
   * Update content
   */
  async update(id: string, data: UpdateContentRequest): Promise<Content> {
    return apiClient.patch(`/content/${id}`, data);
  },

  /**
   * Delete content
   */
  async delete(id: string): Promise<{ message: string }> {
    return apiClient.delete(`/content/${id}`);
  },

  /**
   * Get all content
   */
  async getAll(params?: {
    type?: string;
    status?: string;
    tag?: string;
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ content: Content[]; total: number }> {
    return apiClient.get('/content', { params });
  },

  /**
   * Publish content
   */
  async publish(id: string, platforms?: string[]): Promise<Content> {
    return apiClient.post(`/content/${id}/publish`, { platforms });
  },

  /**
   * Schedule content
   */
  async schedule(id: string, scheduledAt: string, platforms?: string[]): Promise<Content> {
    return apiClient.post(`/content/${id}/schedule`, { scheduledAt, platforms });
  },

  /**
   * Archive content
   */
  async archive(id: string): Promise<Content> {
    return apiClient.post(`/content/${id}/archive`);
  },

  /**
   * Duplicate content
   */
  async duplicate(id: string): Promise<Content> {
    return apiClient.post(`/content/${id}/duplicate`);
  },

  /**
   * Get content versions
   */
  async getVersions(id: string): Promise<ContentVersion[]> {
    return apiClient.get(`/content/${id}/versions`);
  },

  /**
   * Restore version
   */
  async restoreVersion(id: string, versionId: string): Promise<Content> {
    return apiClient.post(`/content/${id}/versions/${versionId}/restore`);
  },

  /**
   * Get content templates
   */
  async getTemplates(type?: string): Promise<ContentTemplate[]> {
    return apiClient.get('/content/templates', { params: { type } });
  },

  /**
   * Create template from content
   */
  async createTemplate(contentId: string, name: string, description?: string): Promise<ContentTemplate> {
    return apiClient.post('/content/templates', { contentId, name, description });
  },

  /**
   * Use template
   */
  async useTemplate(templateId: string, variables: Record<string, any>): Promise<Content> {
    return apiClient.post(`/content/templates/${templateId}/use`, { variables });
  },

  /**
   * Bulk operations
   */
  async bulkUpdate(ids: string[], updates: UpdateContentRequest): Promise<{ updated: number }> {
    return apiClient.post('/content/bulk/update', { ids, updates });
  },

  async bulkDelete(ids: string[]): Promise<{ deleted: number }> {
    return apiClient.post('/content/bulk/delete', { ids });
  },

  async bulkPublish(ids: string[], platforms?: string[]): Promise<{ published: number }> {
    return apiClient.post('/content/bulk/publish', { ids, platforms });
  },

  /**
   * Export content
   */
  async export(format: 'json' | 'csv', filters?: any): Promise<Blob> {
    const response = await apiClient.get('/content/export', {
      params: { format, ...filters },
      responseType: 'blob',
    });
    return response as any;
  },

  /**
   * Import content
   */
  async import(file: File): Promise<{ imported: number; errors: any[] }> {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.upload('/content/import', formData);
  },
};