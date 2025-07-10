import { z } from 'zod';

// Content Types
export interface Content {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: 'VIDEO' | 'BLOG' | 'SOCIAL_POST' | 'SCRIPT' | 'TEMPLATE';
  status: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';
  generationId?: string; // Link to AI generation
  platformPosts?: string[]; // Links to platform posts
  tags: string[];
  category?: string;
  metadata?: any;
  content?: any; // Actual content data
  mediaUrl?: string;
  thumbnailUrl?: string;
  version: number;
  parentId?: string; // For versioning
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  scheduledAt?: Date;
}

export interface ContentVersion {
  id: string;
  contentId: string;
  version: number;
  title: string;
  description?: string;
  content?: any;
  metadata?: any;
  changedBy: string;
  changeNote?: string;
  createdAt: Date;
}

export interface ContentTemplate {
  id: string;
  userId: string;
  name: string;
  description?: string;
  type: 'VIDEO' | 'BLOG' | 'SOCIAL_POST' | 'SCRIPT';
  template: any;
  tags: string[];
  category?: string;
  usageCount: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentCalendar {
  id: string;
  userId: string;
  contentId: string;
  scheduledDate: Date;
  platforms: string[];
  status: 'SCHEDULED' | 'PUBLISHED' | 'FAILED' | 'CANCELLED';
  publishOptions?: any;
  reminders?: Date[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentTag {
  id: string;
  userId: string;
  name: string;
  slug: string;
  color?: string;
  usageCount: number;
  createdAt: Date;
}

export interface ContentCategory {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  color?: string;
  icon?: string;
  contentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Request/Response Schemas
export const CreateContentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  type: z.enum(['VIDEO', 'BLOG', 'SOCIAL_POST', 'SCRIPT', 'TEMPLATE']),
  content: z.any().optional(),
  tags: z.array(z.string()).optional().default([]),
  category: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  mediaUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  generationId: z.string().optional(),
});

export const UpdateContentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  content: z.any().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  mediaUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  status: z.enum(['DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED']).optional(),
  changeNote: z.string().optional(),
});

export const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  type: z.enum(['VIDEO', 'BLOG', 'SOCIAL_POST', 'SCRIPT']),
  template: z.any(),
  tags: z.array(z.string()).optional().default([]),
  category: z.string().optional(),
  isPublic: z.boolean().optional().default(false),
});

export const ScheduleContentSchema = z.object({
  contentId: z.string(),
  scheduledDate: z.string().datetime(),
  platforms: z.array(z.string()).min(1),
  publishOptions: z.record(z.any()).optional(),
  reminders: z.array(z.string().datetime()).optional(),
});

export const BulkOperationSchema = z.object({
  contentIds: z.array(z.string()).min(1),
  operation: z.enum(['DELETE', 'ARCHIVE', 'PUBLISH', 'TAG', 'CATEGORY', 'STATUS']),
  data: z.any().optional(),
});

export const SearchContentSchema = z.object({
  query: z.string().optional(),
  type: z.enum(['VIDEO', 'BLOG', 'SOCIAL_POST', 'SCRIPT', 'TEMPLATE']).optional(),
  status: z.enum(['DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED']).optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'publishedAt', 'title']).optional().default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
});

export const ExportContentSchema = z.object({
  contentIds: z.array(z.string()).optional(),
  format: z.enum(['JSON', 'CSV', 'MARKDOWN']).default('JSON'),
  includeMedia: z.boolean().optional().default(false),
  includeVersions: z.boolean().optional().default(false),
});

export const ImportContentSchema = z.object({
  format: z.enum(['JSON', 'CSV', 'MARKDOWN']),
  data: z.string(),
  overwrite: z.boolean().optional().default(false),
  mappings: z.record(z.string()).optional(),
});

// API Response Types
export interface ContentResponse {
  content: Content;
  versions?: ContentVersion[];
  platformPosts?: any[];
  analytics?: any;
}

export interface ContentListResponse {
  contents: Content[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface CalendarResponse {
  events: Array<{
    id: string;
    contentId: string;
    content: Content;
    date: Date;
    platforms: string[];
    status: string;
  }>;
  startDate: Date;
  endDate: Date;
}

export interface ContentStats {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  recentlyUpdated: number;
  scheduled: number;
  published: number;
}

export interface TemplateResponse {
  template: ContentTemplate;
  previewContent?: any;
}

export interface BulkOperationResponse {
  operation: string;
  totalItems: number;
  successCount: number;
  failedCount: number;
  errors?: Array<{ contentId: string; error: string }>;
}

export interface ExportResponse {
  format: string;
  data: string;
  contentCount: number;
  exportedAt: Date;
  downloadUrl?: string;
}

export interface ImportResponse {
  format: string;
  totalItems: number;
  importedCount: number;
  skippedCount: number;
  failedCount: number;
  errors?: Array<{ item: any; error: string }>;
}

// Error Types
export class ContentError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ContentError';
  }
}

export class TemplateError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'TemplateError';
  }
}

export class CalendarError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'CalendarError';
  }
}

// Content Filters
export interface ContentFilters {
  query?: string;
  type?: Content['type'];
  status?: Content['status'];
  tags?: string[];
  category?: string;
  dateFrom?: Date;
  dateTo?: Date;
  generationId?: string;
  hasMedia?: boolean;
  isTemplate?: boolean;
}

// Content Permissions
export interface ContentPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canPublish: boolean;
  canShare: boolean;
  canExport: boolean;
}

// Calendar View Types
export type CalendarView = 'month' | 'week' | 'day' | 'list';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  color?: string;
  content: Content;
  platforms: string[];
  status: string;
}

// Template Variables
export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean';
  required: boolean;
  defaultValue?: any;
  options?: string[]; // For select type
  description?: string;
}

// Content Workflow
export interface ContentWorkflow {
  id: string;
  name: string;
  stages: WorkflowStage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowStage {
  id: string;
  name: string;
  order: number;
  requiredApprovals?: number;
  assignees?: string[];
  actions?: WorkflowAction[];
}

export interface WorkflowAction {
  type: 'NOTIFY' | 'AUTO_PUBLISH' | 'REQUIRE_REVIEW' | 'RUN_WEBHOOK';
  config: any;
}

// Type exports
export type CreateContentRequest = z.infer<typeof CreateContentSchema>;
export type UpdateContentRequest = z.infer<typeof UpdateContentSchema>;
export type CreateTemplateRequest = z.infer<typeof CreateTemplateSchema>;
export type ScheduleContentRequest = z.infer<typeof ScheduleContentSchema>;
export type BulkOperationRequest = z.infer<typeof BulkOperationSchema>;
export type SearchContentRequest = z.infer<typeof SearchContentSchema>;
export type ExportContentRequest = z.infer<typeof ExportContentSchema>;
export type ImportContentRequest = z.infer<typeof ImportContentSchema>;