import { z } from 'zod';

// Content Generation Types
export interface ContentGeneration {
  id: string;
  userId: string;
  type: 'VIDEO' | 'BLOG' | 'SOCIAL_POST' | 'SCRIPT';
  status: 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED';
  prompt: string;
  style?: string;
  duration?: number;
  platform?: string;
  metadata?: any;
  result?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface VideoGeneration {
  id: string;
  contentGenerationId: string;
  provider: 'HAILUOAI' | 'OPENAI' | 'RUNWAY' | 'PIKA';
  prompt: string;
  style: string;
  duration: number;
  aspectRatio: string;
  quality: 'DRAFT' | 'STANDARD' | 'HIGH';
  videoUrl?: string;
  thumbnailUrl?: string;
  metadata?: any;
  processingTime?: number;
  cost?: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlogGeneration {
  id: string;
  contentGenerationId: string;
  provider: 'OPENAI' | 'ANTHROPIC' | 'GEMINI';
  prompt: string;
  tone: string;
  wordCount: number;
  seoKeywords: string[];
  title?: string;
  content?: string;
  excerpt?: string;
  metadata?: any;
  processingTime?: number;
  cost?: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Request/Response Schemas
export const VideoGenerationSchema = z.object({
  prompt: z.string().min(10, 'Prompt must be at least 10 characters').max(500, 'Prompt too long'),
  style: z.string().optional().default('realistic'),
  duration: z.number().min(5).max(60).optional().default(15),
  aspectRatio: z.enum(['16:9', '9:16', '1:1']).optional().default('16:9'),
  quality: z.enum(['DRAFT', 'STANDARD', 'HIGH']).optional().default('STANDARD'),
  platform: z.enum(['YOUTUBE', 'TIKTOK', 'INSTAGRAM', 'TWITTER']).optional(),
});

export const BlogGenerationSchema = z.object({
  prompt: z.string().min(20, 'Prompt must be at least 20 characters').max(1000, 'Prompt too long'),
  tone: z.enum(['PROFESSIONAL', 'CASUAL', 'FRIENDLY', 'AUTHORITATIVE', 'CREATIVE']).optional().default('PROFESSIONAL'),
  wordCount: z.number().min(100).max(5000).optional().default(1000),
  seoKeywords: z.array(z.string()).optional().default([]),
  platform: z.enum(['BLOG', 'LINKEDIN', 'MEDIUM']).optional().default('BLOG'),
});

export const SocialPostGenerationSchema = z.object({
  prompt: z.string().min(10, 'Prompt must be at least 10 characters').max(300, 'Prompt too long'),
  platform: z.enum(['TWITTER', 'LINKEDIN', 'FACEBOOK', 'INSTAGRAM']),
  tone: z.enum(['PROFESSIONAL', 'CASUAL', 'FUNNY', 'INSPIRING', 'URGENT']).optional().default('CASUAL'),
  includeHashtags: z.boolean().optional().default(true),
  includeEmojis: z.boolean().optional().default(true),
});

export const ScriptGenerationSchema = z.object({
  prompt: z.string().min(20, 'Prompt must be at least 20 characters').max(500, 'Prompt too long'),
  type: z.enum(['YOUTUBE_SHORT', 'TIKTOK', 'INSTAGRAM_REEL', 'PODCAST']),
  duration: z.number().min(15).max(300).optional().default(60),
  tone: z.enum(['EDUCATIONAL', 'ENTERTAINING', 'INSPIRING', 'PROMOTIONAL']).optional().default('EDUCATIONAL'),
  includeHooks: z.boolean().optional().default(true),
  includeCTA: z.boolean().optional().default(true),
});

export const BatchGenerationSchema = z.object({
  type: z.enum(['VIDEO', 'BLOG', 'SOCIAL_POST', 'SCRIPT']),
  prompts: z.array(z.string()).min(1).max(10),
  settings: z.object({
    style: z.string().optional(),
    tone: z.string().optional(),
    platform: z.string().optional(),
    duration: z.number().optional(),
    quality: z.string().optional(),
  }).optional(),
});

// API Response Types
export interface GenerationResponse {
  id: string;
  type: 'VIDEO' | 'BLOG' | 'SOCIAL_POST' | 'SCRIPT';
  status: 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED';
  estimatedTime?: number;
  queuePosition?: number;
  result?: any;
  error?: string;
}

export interface VideoGenerationResponse extends GenerationResponse {
  type: 'VIDEO';
  result?: {
    videoUrl: string;
    thumbnailUrl: string;
    duration: number;
    aspectRatio: string;
    quality: string;
  };
}

export interface BlogGenerationResponse extends GenerationResponse {
  type: 'BLOG';
  result?: {
    title: string;
    content: string;
    excerpt: string;
    wordCount: number;
    seoKeywords: string[];
  };
}

export interface SocialPostGenerationResponse extends GenerationResponse {
  type: 'SOCIAL_POST';
  result?: {
    content: string;
    hashtags: string[];
    platform: string;
    characterCount: number;
  };
}

export interface ScriptGenerationResponse extends GenerationResponse {
  type: 'SCRIPT';
  result?: {
    title: string;
    script: string;
    hooks: string[];
    cta: string;
    estimatedDuration: number;
  };
}

export interface BatchGenerationResponse {
  batchId: string;
  totalItems: number;
  completedItems: number;
  failedItems: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  results: GenerationResponse[];
}

// Provider Configuration
export interface AIProviderConfig {
  name: string;
  apiKey: string;
  baseUrl: string;
  maxRetries: number;
  timeout: number;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  pricing: {
    costPerRequest: number;
    costPerSecond?: number;
    costPerToken?: number;
  };
}

export interface VideoProviderConfig extends AIProviderConfig {
  supportedAspectRatios: string[];
  supportedQualities: string[];
  maxDuration: number;
  supportedFormats: string[];
}

export interface TextProviderConfig extends AIProviderConfig {
  maxTokens: number;
  supportedModels: string[];
  contextWindow: number;
}

// Generation Queue Types
export interface GenerationJob {
  id: string;
  type: 'VIDEO' | 'BLOG' | 'SOCIAL_POST' | 'SCRIPT';
  userId: string;
  prompt: string;
  settings: any;
  priority: 'LOW' | 'NORMAL' | 'HIGH';
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  error?: string;
}

// Error Types
export class GenerationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public provider?: string
  ) {
    super(message);
    this.name = 'GenerationError';
  }
}

export class ProviderError extends Error {
  constructor(
    message: string,
    public provider: string,
    public originalError?: any,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

export class QuotaError extends Error {
  constructor(
    message: string,
    public quotaType: 'MONTHLY' | 'DAILY' | 'HOURLY',
    public limit: number,
    public current: number
  ) {
    super(message);
    this.name = 'QuotaError';
  }
}

// Usage Tracking Types
export interface UsageRecord {
  id: string;
  userId: string;
  type: 'VIDEO' | 'BLOG' | 'SOCIAL_POST' | 'SCRIPT';
  provider: string;
  cost: number;
  tokens?: number;
  seconds?: number;
  createdAt: Date;
}

export interface UserQuota {
  userId: string;
  monthly: {
    limit: number;
    used: number;
    resetDate: Date;
  };
  daily: {
    limit: number;
    used: number;
    resetDate: Date;
  };
  hourly: {
    limit: number;
    used: number;
    resetDate: Date;
  };
}

// Template Types
export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  type: 'VIDEO' | 'BLOG' | 'SOCIAL_POST' | 'SCRIPT';
  category: string;
  prompt: string;
  settings: any;
  tags: string[];
  isPublic: boolean;
  createdBy: string;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Type exports
export type VideoGenerationRequest = z.infer<typeof VideoGenerationSchema>;
export type BlogGenerationRequest = z.infer<typeof BlogGenerationSchema>;
export type SocialPostGenerationRequest = z.infer<typeof SocialPostGenerationSchema>;
export type ScriptGenerationRequest = z.infer<typeof ScriptGenerationSchema>;
export type BatchGenerationRequest = z.infer<typeof BatchGenerationSchema>;