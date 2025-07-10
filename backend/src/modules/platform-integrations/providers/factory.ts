import { BasePlatformProvider } from './base';
import { YouTubeProvider } from './youtube';
import { TwitterProvider } from './twitter';
import { PlatformType, PlatformConfig, PlatformError } from '../types';

export class PlatformProviderFactory {
  private static providers: Map<PlatformType, BasePlatformProvider> = new Map();
  private static configs: Map<PlatformType, PlatformConfig> = new Map();

  static initialize(configs: Record<PlatformType, PlatformConfig>): void {
    for (const [platform, config] of Object.entries(configs)) {
      this.configs.set(platform as PlatformType, config);
      const provider = this.createProvider(platform as PlatformType, config);
      this.providers.set(platform as PlatformType, provider);
    }
  }

  static createProvider(platform: PlatformType, config: PlatformConfig): BasePlatformProvider {
    switch (platform) {
      case 'YOUTUBE':
        return new YouTubeProvider(config);
      
      case 'TWITTER':
        return new TwitterProvider(config);
      
      case 'TIKTOK':
      case 'INSTAGRAM':
        // TODO: Implement these providers
        throw new PlatformError(
          `Provider for ${platform} not implemented yet`,
          'PROVIDER_NOT_IMPLEMENTED',
          platform,
          501
        );
      
      default:
        throw new PlatformError(
          `Unknown platform: ${platform}`,
          'UNKNOWN_PLATFORM',
          platform,
          400
        );
    }
  }

  static getProvider(platform: PlatformType): BasePlatformProvider {
    const provider = this.providers.get(platform);
    if (!provider) {
      throw new PlatformError(
        `Provider for ${platform} not found`,
        'PROVIDER_NOT_FOUND',
        platform,
        404
      );
    }
    return provider;
  }

  static getAllProviders(): Map<PlatformType, BasePlatformProvider> {
    return new Map(this.providers);
  }

  static getConfig(platform: PlatformType): PlatformConfig | undefined {
    return this.configs.get(platform);
  }

  static updateConfig(platform: PlatformType, config: PlatformConfig): void {
    this.configs.set(platform, config);
    const provider = this.createProvider(platform, config);
    this.providers.set(platform, provider);
  }

  static async getHealthStatus(): Promise<Record<PlatformType, boolean>> {
    const status: Record<string, boolean> = {};
    
    for (const [platform, provider] of this.providers) {
      try {
        status[platform] = await provider.isHealthy();
      } catch {
        status[platform] = false;
      }
    }
    
    return status as Record<PlatformType, boolean>;
  }

  static getSupportedPlatforms(): PlatformType[] {
    return Array.from(this.providers.keys());
  }

  static getPlatformFeatures(platform: PlatformType): PlatformConfig['features'] | undefined {
    const config = this.configs.get(platform);
    return config?.features;
  }

  static getPlatformLimits(platform: PlatformType): PlatformConfig['limits'] | undefined {
    const config = this.configs.get(platform);
    return config?.limits;
  }
}