import { apiClient } from './client';
import { z } from 'zod';

// Schemas
export const VideoGenerationSchema = z.object({
  prompt: z.string().min(1).max(500),
  style: z.string().optional(),
  duration: z.number().min(5).max(60).optional(),
  aspectRatio: z.enum(['16:9', '9:16', '1:1', '4:3', '3:4']).optional(),
  quality: z.enum(['draft', 'standard', 'high', 'ultra']).optional(),
  includeAudio: z.boolean().optional(),
  audioOptions: z.object({
    voiceover: z.object({
      text: z.string().optional(),
      useAutoScript: z.boolean().optional(),
      voice: z.string().optional(),
      language: z.string().optional(),
    }).optional(),
    backgroundMusic: z.object({
      style: z.string().optional(),
      mood: z.string().optional(),
      volume: z.number().min(0).max(1).optional(),
    }).optional(),
    soundEffects: z.boolean().optional(),
  }).optional(),
});

export const BlogGenerationSchema = z.object({
  topic: z.string().min(1).max(200),
  tone: z.enum(['professional', 'casual', 'humorous', 'educational']).optional(),
  length: z.enum(['short', 'medium', 'long']).optional(),
  keywords: z.array(z.string()).optional(),
  includeImages: z.boolean().optional(),
});

export const SocialPostGenerationSchema = z.object({
  topic: z.string().min(1).max(200),
  platforms: z.array(z.enum(['twitter', 'instagram', 'tiktok', 'youtube'])),
  tone: z.string().optional(),
  hashtags: z.boolean().optional(),
  emojis: z.boolean().optional(),
});

// Types
export type VideoGenerationRequest = z.infer<typeof VideoGenerationSchema>;
export type BlogGenerationRequest = z.infer<typeof BlogGenerationSchema>;
export type SocialPostGenerationRequest = z.infer<typeof SocialPostGenerationSchema>;

export interface GenerationJob {
  id: string;
  type: 'VIDEO' | 'BLOG' | 'SOCIAL' | 'SCRIPT';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  prompt: string;
  result?: any;
  error?: string;
  metadata?: any;
  createdAt: string;
  completedAt?: string;
}

export interface VideoResult {
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  aspectRatio: string;
  hasAudio: boolean;
  audioTracks?: string[];
  optimizedUrls?: Record<string, string>;
  fileSize: number;
}

export interface BlogResult {
  title: string;
  content: string;
  excerpt: string;
  keywords: string[];
  readTime: number;
  images?: Array<{ url: string; alt: string }>;
}

export interface SocialPostResult {
  posts: Array<{
    platform: string;
    content: string;
    hashtags?: string[];
    mediaUrl?: string;
    scheduledTime?: string;
  }>;
}

export interface UsageStats {
  creditsUsed: number;
  creditsRemaining: number;
  costEstimate: number;
}

export interface AudioCapabilities {
  voiceover: boolean;
  backgroundMusic: boolean;
  soundEffects: boolean;
  languages: string[];
  voices: string[];
  musicStyles: string[];
}

// API functions
export const generationApi = {
  /**
   * Generate video with optional audio
   */
  async generateVideo(data: VideoGenerationRequest): Promise<GenerationJob> {
    return apiClient.post('/generation/video', data);
  },

  /**
   * Generate blog post
   */
  async generateBlog(data: BlogGenerationRequest): Promise<GenerationJob> {
    return apiClient.post('/generation/blog', data);
  },

  /**
   * Generate social media posts
   */
  async generateSocialPosts(data: SocialPostGenerationRequest): Promise<GenerationJob> {
    return apiClient.post('/generation/social', data);
  },

  /**
   * Get generation job status
   */
  async getJobStatus(jobId: string): Promise<GenerationJob> {
    return apiClient.get(`/generation/jobs/${jobId}`);
  },

  /**
   * Get all generation jobs
   */
  async getJobs(params?: {
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ jobs: GenerationJob[]; total: number }> {
    return apiClient.get('/generation/jobs', { params });
  },

  /**
   * Cancel generation job
   */
  async cancelJob(jobId: string): Promise<{ message: string }> {
    return apiClient.post(`/generation/jobs/${jobId}/cancel`);
  },

  /**
   * Get usage statistics
   */
  async getUsageStats(): Promise<UsageStats> {
    return apiClient.get('/generation/usage');
  },

  /**
   * Get audio capabilities
   */
  async getAudioCapabilities(): Promise<AudioCapabilities> {
    return apiClient.get('/generation/audio/capabilities');
  },

  /**
   * Get available voices
   */
  async getAvailableVoices(language?: string): Promise<Array<{
    id: string;
    name: string;
    language: string;
    gender: string;
    preview_url?: string;
  }>> {
    return apiClient.get('/generation/audio/voices', { params: { language } });
  },

  /**
   * Estimate generation cost
   */
  async estimateCost(type: 'video' | 'blog' | 'social', params: any): Promise<{
    estimatedCost: number;
    creditsRequired: number;
  }> {
    return apiClient.post('/generation/estimate-cost', { type, params });
  },

  /**
   * Generate video script from prompt
   */
  async generateScript(prompt: string, duration: number): Promise<{
    narration: string;
    musicDescription: string;
    soundEffects: Array<{ description: string; timing: string }>;
  }> {
    return apiClient.post('/generation/script', { prompt, duration });
  },
};