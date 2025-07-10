import { BaseProvider, VideoProvider, TextProvider, BaseProviderConfig } from './base';
import { HailuoAIProvider } from './hailuoai';
import { OpenAIProvider } from './openai';
import { GenerationError } from '../types';

export type ProviderType = 'VIDEO' | 'TEXT' | 'IMAGE' | 'HYBRID';
export type ProviderName = 'HAILUOAI' | 'OPENAI' | 'ANTHROPIC' | 'GEMINI' | 'RUNWAY' | 'PIKA';

export interface ProviderConfig {
  name: ProviderName;
  type: ProviderType;
  config: BaseProviderConfig;
  enabled: boolean;
  priority: number;
  fallback?: ProviderName;
}

export class ProviderFactory {
  private static providers: Map<ProviderName, BaseProvider> = new Map();
  private static configurations: Map<ProviderName, ProviderConfig> = new Map();

  static initialize(configs: ProviderConfig[]): void {
    for (const config of configs) {
      this.configurations.set(config.name, config);
      
      if (config.enabled) {
        const provider = this.createProvider(config.name, config.config);
        this.providers.set(config.name, provider);
      }
    }
  }

  static createProvider(name: ProviderName, config: BaseProviderConfig): BaseProvider {
    switch (name) {
      case 'HAILUOAI':
        return new HailuoAIProvider(config);
      
      case 'OPENAI':
        return new OpenAIProvider(config);
      
      // TODO: Add other providers
      case 'ANTHROPIC':
      case 'GEMINI':
      case 'RUNWAY':
      case 'PIKA':
        throw new GenerationError(
          `Provider ${name} not implemented yet`,
          'PROVIDER_NOT_IMPLEMENTED',
          501
        );
      
      default:
        throw new GenerationError(
          `Unknown provider: ${name}`,
          'UNKNOWN_PROVIDER',
          400
        );
    }
  }

  static getProvider(name: ProviderName): BaseProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new GenerationError(
        `Provider ${name} not found or not enabled`,
        'PROVIDER_NOT_FOUND',
        404
      );
    }
    return provider;
  }

  static getVideoProvider(name?: ProviderName): VideoProvider {
    if (name) {
      const provider = this.getProvider(name);
      if (!this.isVideoProvider(provider)) {
        throw new GenerationError(
          `Provider ${name} does not support video generation`,
          'PROVIDER_TYPE_MISMATCH',
          400
        );
      }
      return provider as VideoProvider;
    }

    // Get default video provider
    const videoProviders = this.getProvidersByType('VIDEO');
    if (videoProviders.length === 0) {
      throw new GenerationError(
        'No video providers available',
        'NO_VIDEO_PROVIDERS',
        503
      );
    }

    return videoProviders[0] as VideoProvider;
  }

  static getTextProvider(name?: ProviderName): TextProvider {
    if (name) {
      const provider = this.getProvider(name);
      if (!this.isTextProvider(provider)) {
        throw new GenerationError(
          `Provider ${name} does not support text generation`,
          'PROVIDER_TYPE_MISMATCH',
          400
        );
      }
      return provider as TextProvider;
    }

    // Get default text provider
    const textProviders = this.getProvidersByType('TEXT');
    if (textProviders.length === 0) {
      throw new GenerationError(
        'No text providers available',
        'NO_TEXT_PROVIDERS',
        503
      );
    }

    return textProviders[0] as TextProvider;
  }

  static getProvidersByType(type: ProviderType): BaseProvider[] {
    const providers: BaseProvider[] = [];
    
    for (const [name, config] of this.configurations) {
      if (config.type === type && config.enabled) {
        const provider = this.providers.get(name);
        if (provider) {
          providers.push(provider);
        }
      }
    }

    // Sort by priority (higher priority first)
    return providers.sort((a, b) => {
      const configA = this.configurations.get(a.getName() as ProviderName);
      const configB = this.configurations.get(b.getName() as ProviderName);
      return (configB?.priority || 0) - (configA?.priority || 0);
    });
  }

  static getAllProviders(): BaseProvider[] {
    return Array.from(this.providers.values());
  }

  static getProviderNames(): ProviderName[] {
    return Array.from(this.providers.keys());
  }

  static isVideoProvider(provider: BaseProvider): provider is VideoProvider {
    return 'generateVideo' in provider;
  }

  static isTextProvider(provider: BaseProvider): provider is TextProvider {
    return 'generateText' in provider;
  }

  static async getHealthyProviders(): Promise<BaseProvider[]> {
    const providers = this.getAllProviders();
    const healthyProviders: BaseProvider[] = [];

    await Promise.all(
      providers.map(async (provider) => {
        try {
          const isHealthy = await provider.isHealthy();
          if (isHealthy) {
            healthyProviders.push(provider);
          }
        } catch (error) {
          // Provider is not healthy, skip it
        }
      })
    );

    return healthyProviders;
  }

  static async getProviderWithFallback(
    primaryName: ProviderName,
    type: ProviderType
  ): Promise<BaseProvider> {
    try {
      const provider = this.getProvider(primaryName);
      const isHealthy = await provider.isHealthy();
      
      if (isHealthy) {
        return provider;
      }
    } catch (error) {
      // Primary provider failed, try fallback
    }

    // Try fallback provider
    const config = this.configurations.get(primaryName);
    if (config?.fallback) {
      try {
        const fallbackProvider = this.getProvider(config.fallback);
        const isHealthy = await fallbackProvider.isHealthy();
        
        if (isHealthy) {
          return fallbackProvider;
        }
      } catch (error) {
        // Fallback also failed
      }
    }

    // Get any healthy provider of the same type
    const healthyProviders = await this.getHealthyProviders();
    const typeProviders = healthyProviders.filter(p => {
      const providerConfig = this.configurations.get(p.getName() as ProviderName);
      return providerConfig?.type === type;
    });

    if (typeProviders.length === 0) {
      throw new GenerationError(
        `No healthy ${type} providers available`,
        'NO_HEALTHY_PROVIDERS',
        503
      );
    }

    return typeProviders[0];
  }

  static getProviderConfig(name: ProviderName): ProviderConfig | undefined {
    return this.configurations.get(name);
  }

  static updateProviderConfig(name: ProviderName, config: Partial<ProviderConfig>): void {
    const existing = this.configurations.get(name);
    if (existing) {
      this.configurations.set(name, { ...existing, ...config });
      
      // Recreate provider if config changed
      if (config.config || config.enabled !== undefined) {
        this.providers.delete(name);
        
        if (config.enabled !== false) {
          const provider = this.createProvider(name, config.config || existing.config);
          this.providers.set(name, provider);
        }
      }
    }
  }

  static removeProvider(name: ProviderName): void {
    this.providers.delete(name);
    this.configurations.delete(name);
  }

  static getProviderStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [name, provider] of this.providers) {
      const config = this.configurations.get(name);
      stats[name] = {
        type: config?.type,
        enabled: config?.enabled,
        priority: config?.priority,
        fallback: config?.fallback,
        ...(provider as any).getProviderStats?.() || {},
      };
    }

    return stats;
  }
}