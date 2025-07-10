import { z } from 'zod';

// Agent API Request Schemas
export const AgentContextSchema = z.object({
  agentId: z.string().optional(),
  agentName: z.string().optional(),
  capabilities: z.array(z.string()).optional(),
  context: z.record(z.any()).optional(),
});

export const AgentGenerateRequestSchema = z.object({
  action: z.enum(['video', 'blog', 'social', 'script']),
  input: z.string(),
  parameters: z.record(z.any()).optional(),
  context: AgentContextSchema.optional(),
});

export const AgentAnalyzeRequestSchema = z.object({
  contentId: z.string().optional(),
  metrics: z.array(z.string()).optional(),
  timeframe: z.string().optional(),
  insights: z.boolean().default(true),
  context: AgentContextSchema.optional(),
});

export const AgentPublishRequestSchema = z.object({
  content: z.object({
    title: z.string(),
    description: z.string().optional(),
    mediaUrl: z.string().optional(),
    type: z.enum(['video', 'image', 'text']),
  }),
  platforms: z.array(z.string()),
  schedule: z.string().datetime().optional(),
  options: z.record(z.any()).optional(),
  context: AgentContextSchema.optional(),
});

export const AgentSearchRequestSchema = z.object({
  query: z.string(),
  filters: z.object({
    type: z.enum(['video', 'blog', 'social']).optional(),
    status: z.enum(['draft', 'published', 'scheduled']).optional(),
    platform: z.string().optional(),
    dateRange: z.object({
      start: z.string().datetime().optional(),
      end: z.string().datetime().optional(),
    }).optional(),
  }).optional(),
  limit: z.number().default(10),
  context: AgentContextSchema.optional(),
});

export const AgentWorkflowRequestSchema = z.object({
  workflow: z.enum(['create_and_publish', 'analyze_and_optimize', 'bulk_generate']),
  steps: z.array(z.object({
    action: z.string(),
    parameters: z.record(z.any()),
  })),
  context: AgentContextSchema.optional(),
});

// Agent API Response Types
export interface AgentResponse<T = any> {
  success: boolean;
  data?: T;
  error?: AgentError;
  metadata: AgentMetadata;
  suggestions?: AgentSuggestion[];
}

export interface AgentError {
  code: string;
  message: string;
  details?: any;
  recovery?: string;
}

export interface AgentMetadata {
  requestId: string;
  timestamp: string;
  processingTime: number;
  apiVersion: string;
  rateLimit: {
    remaining: number;
    reset: string;
  };
}

export interface AgentSuggestion {
  action: string;
  description: string;
  parameters?: Record<string, any>;
  confidence: number;
}

// Semantic API Documentation
export interface AgentEndpointDoc {
  path: string;
  method: string;
  description: string;
  purpose: string;
  input: {
    required: string[];
    optional: string[];
    schema: any;
  };
  output: {
    success: any;
    error: any;
  };
  examples: AgentExample[];
  semantics: {
    action: string;
    object: string;
    result: string;
  };
}

export interface AgentExample {
  title: string;
  request: any;
  response: any;
  explanation: string;
}

// Agent Capability Types
export interface AgentCapabilities {
  actions: string[];
  platforms: string[];
  contentTypes: string[];
  analytics: string[];
  workflows: string[];
  limits: {
    maxRequestsPerMinute: number;
    maxContentLength: number;
    maxBatchSize: number;
  };
}

// Types
export type AgentGenerateRequest = z.infer<typeof AgentGenerateRequestSchema>;
export type AgentAnalyzeRequest = z.infer<typeof AgentAnalyzeRequestSchema>;
export type AgentPublishRequest = z.infer<typeof AgentPublishRequestSchema>;
export type AgentSearchRequest = z.infer<typeof AgentSearchRequestSchema>;
export type AgentWorkflowRequest = z.infer<typeof AgentWorkflowRequestSchema>;
export type AgentContext = z.infer<typeof AgentContextSchema>;