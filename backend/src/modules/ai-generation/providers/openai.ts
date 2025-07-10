import { BaseProvider, TextProvider, GenerationResult, BaseProviderConfig } from './base';
import { ProviderError } from '../types';

interface OpenAIConfig extends BaseProviderConfig {
  defaultModel: string;
  organization?: string;
}

interface OpenAITextRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string[];
}

interface OpenAITextResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenAIProvider extends BaseProvider implements TextProvider {
  private config: OpenAIConfig;
  private supportedModels = ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-3.5-turbo-16k'];
  private maxTokens = 4000;
  private contextWindow = 8192;
  private costPerToken = {
    'gpt-4': 0.00006,
    'gpt-4-turbo': 0.00003,
    'gpt-3.5-turbo': 0.000002,
    'gpt-3.5-turbo-16k': 0.000004,
  };

  constructor(config: OpenAIConfig) {
    super(config);
    this.config = config;
  }

  getName(): string {
    return 'OpenAI';
  }

  getType(): 'VIDEO' | 'TEXT' | 'IMAGE' | 'HYBRID' {
    return 'TEXT';
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/models', 'GET');
      return response.data && response.data.length > 0;
    } catch (error) {
      return false;
    }
  }

  async generateText(params: {
    prompt: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
  }): Promise<GenerationResult> {
    const startTime = Date.now();

    try {
      const model = params.model || this.config.defaultModel;
      this.validateModel(model);

      const messages: OpenAITextRequest['messages'] = [];
      
      if (params.systemPrompt) {
        messages.push({
          role: 'system',
          content: params.systemPrompt,
        });
      }

      messages.push({
        role: 'user',
        content: params.prompt,
      });

      const request: OpenAITextRequest = {
        model,
        messages,
        max_tokens: params.maxTokens || this.maxTokens,
        temperature: params.temperature || 0.7,
      };

      const response: OpenAITextResponse = await this.makeRequest('/chat/completions', 'POST', request);

      const processingTime = Date.now() - startTime;
      const cost = this.estimateCost(response.usage.total_tokens, model);

      return {
        success: true,
        data: {
          content: response.choices[0].message.content,
          model: response.model,
          tokens: response.usage.total_tokens,
          finishReason: response.choices[0].finish_reason,
        },
        metadata: {
          processingTime,
          cost,
          provider: this.getName(),
          model: response.model,
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

  async generateBlog(params: {
    prompt: string;
    tone: string;
    wordCount: number;
    seoKeywords: string[];
  }): Promise<GenerationResult> {
    const systemPrompt = `You are a professional blog writer. Write engaging, SEO-optimized blog posts.
    
    Guidelines:
    - Use a ${params.tone.toLowerCase()} tone
    - Target approximately ${params.wordCount} words
    - Include these SEO keywords naturally: ${params.seoKeywords.join(', ')}
    - Structure with clear headings and subheadings
    - Include a compelling introduction and conclusion
    - Make it engaging and informative
    
    Format the response as JSON with the following structure:
    {
      "title": "Blog post title",
      "content": "Full blog post content with markdown formatting",
      "excerpt": "Brief summary excerpt",
      "wordCount": actual_word_count,
      "seoKeywords": ["keyword1", "keyword2"]
    }`;

    return this.generateText({
      prompt: params.prompt,
      systemPrompt,
      maxTokens: Math.min(params.wordCount * 2, this.maxTokens),
      temperature: 0.7,
    });
  }

  async generateSocialPost(params: {
    prompt: string;
    platform: string;
    tone: string;
    includeHashtags: boolean;
    includeEmojis: boolean;
  }): Promise<GenerationResult> {
    const platformLimits = {
      'TWITTER': 280,
      'LINKEDIN': 3000,
      'FACEBOOK': 2200,
      'INSTAGRAM': 2200,
    };

    const limit = platformLimits[params.platform as keyof typeof platformLimits] || 280;

    const systemPrompt = `You are a social media content creator. Create engaging posts for ${params.platform}.
    
    Guidelines:
    - Use a ${params.tone.toLowerCase()} tone
    - Keep within ${limit} characters
    - ${params.includeHashtags ? 'Include relevant hashtags' : 'Do not include hashtags'}
    - ${params.includeEmojis ? 'Use emojis appropriately' : 'Do not use emojis'}
    - Make it engaging and shareable
    - Follow ${params.platform} best practices
    
    Format the response as JSON:
    {
      "content": "Post content",
      "hashtags": ["hashtag1", "hashtag2"],
      "platform": "${params.platform}",
      "characterCount": actual_character_count
    }`;

    return this.generateText({
      prompt: params.prompt,
      systemPrompt,
      maxTokens: 500,
      temperature: 0.8,
    });
  }

  async generateScript(params: {
    prompt: string;
    type: string;
    duration: number;
    tone: string;
    includeHooks: boolean;
    includeCTA: boolean;
  }): Promise<GenerationResult> {
    const systemPrompt = `You are a video script writer. Create engaging scripts for ${params.type}.
    
    Guidelines:
    - Target ${params.duration} seconds duration (approximately ${Math.floor(params.duration / 2)} words)
    - Use a ${params.tone.toLowerCase()} tone
    - ${params.includeHooks ? 'Include attention-grabbing hooks' : 'Focus on main content'}
    - ${params.includeCTA ? 'Include a clear call-to-action' : 'End naturally'}
    - Format for ${params.type} platform
    - Make it engaging and actionable
    
    Format the response as JSON:
    {
      "title": "Script title",
      "script": "Full script content",
      "hooks": ["hook1", "hook2"],
      "cta": "Call to action text",
      "estimatedDuration": duration_in_seconds
    }`;

    return this.generateText({
      prompt: params.prompt,
      systemPrompt,
      maxTokens: Math.min(params.duration * 2, this.maxTokens),
      temperature: 0.7,
    });
  }

  getMaxTokens(): number {
    return this.maxTokens;
  }

  getSupportedModels(): string[] {
    return this.supportedModels;
  }

  estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  estimateCost(tokens: number, model: string): number {
    const costPerToken = this.costPerToken[model as keyof typeof this.costPerToken] || 0.000002;
    return tokens * costPerToken;
  }

  private validateModel(model: string): void {
    if (!this.supportedModels.includes(model)) {
      throw new ProviderError(
        `Unsupported model: ${model}. Supported models: ${this.supportedModels.join(', ')}`,
        this.getName(),
        null,
        400
      );
    }
  }

  // Batch processing support
  async generateTextBatch(requests: Array<{
    prompt: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
  }>): Promise<GenerationResult[]> {
    const results: GenerationResult[] = [];

    for (const request of requests) {
      try {
        const result = await this.generateText(request);
        results.push(result);
        
        // Add small delay to avoid overwhelming the provider
        await this.sleep(500);
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

  // Specialized content generation methods
  async generateHashtags(content: string, platform: string, count: number = 5): Promise<string[]> {
    const result = await this.generateText({
      prompt: `Generate ${count} relevant hashtags for this ${platform} post: "${content}"`,
      systemPrompt: 'You are a social media hashtag expert. Generate only hashtags, one per line, without explanations.',
      maxTokens: 100,
      temperature: 0.5,
    });

    if (result.success && result.data?.content) {
      return result.data.content
        .split('\n')
        .filter((line: string) => line.trim().startsWith('#'))
        .map((line: string) => line.trim().substring(1))
        .slice(0, count);
    }

    return [];
  }

  async improveContent(content: string, instructions: string): Promise<GenerationResult> {
    return this.generateText({
      prompt: `Improve this content according to the instructions:\n\nContent: ${content}\n\nInstructions: ${instructions}`,
      systemPrompt: 'You are a content improvement specialist. Enhance the given content based on the provided instructions.',
      maxTokens: this.maxTokens,
      temperature: 0.6,
    });
  }

  // Get provider statistics
  getProviderStats(): {
    supportedModels: string[];
    maxTokens: number;
    contextWindow: number;
    costPerToken: Record<string, number>;
    rateLimit: {
      requestsPerMinute: number;
      requestsPerHour: number;
    };
  } {
    return {
      supportedModels: this.supportedModels,
      maxTokens: this.maxTokens,
      contextWindow: this.contextWindow,
      costPerToken: this.costPerToken,
      rateLimit: this.config.rateLimit,
    };
  }
}