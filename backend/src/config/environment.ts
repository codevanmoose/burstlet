import { z } from 'zod';
import winston from 'winston';

// Environment validation schema
const environmentSchema = z.object({
  // Core application settings
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(val => parseInt(val, 10)).default('3001'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  API_VERSION: z.string().default('1.0'),

  // Database configuration
  DATABASE_URL: z.string().url('Invalid DATABASE_URL format'),
  DIRECT_URL: z.string().url().optional(),
  DATABASE_MAX_CONNECTIONS: z.string().transform(val => parseInt(val, 10)).default('20'),
  DATABASE_TIMEOUT: z.string().transform(val => parseInt(val, 10)).default('15'),

  // Authentication
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),

  // External service URLs
  FRONTEND_URL: z.string().url('Invalid FRONTEND_URL format'),
  BACKEND_URL: z.string().url('Invalid BACKEND_URL format').optional(),

  // Supabase configuration
  SUPABASE_URL: z.string().url('Invalid SUPABASE_URL format'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_KEY: z.string().min(1, 'SUPABASE_SERVICE_KEY is required'),

  // Redis configuration
  REDIS_URL: z.string().url('Invalid REDIS_URL format'),
  REDIS_MAX_RETRIES: z.string().transform(val => parseInt(val, 10)).default('3'),
  REDIS_RETRY_DELAY_MS: z.string().transform(val => parseInt(val, 10)).default('1000'),

  // AI service API keys
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  HAILUOAI_API_KEY: z.string().min(1, 'HAILUOAI_API_KEY is required'),
  MINIMAX_API_KEY: z.string().min(1, 'MINIMAX_API_KEY is required'),

  // Email service
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  EMAIL_FROM: z.string().email('Invalid EMAIL_FROM format').default('noreply@burstlet.com'),

  // Stripe configuration
  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET is required'),
  STRIPE_PRICE_ID_STARTER: z.string().optional(),
  STRIPE_PRICE_ID_PRO: z.string().optional(),
  STRIPE_PRICE_ID_ENTERPRISE: z.string().optional(),

  // Social media API credentials
  YOUTUBE_CLIENT_ID: z.string().min(1, 'YOUTUBE_CLIENT_ID is required'),
  YOUTUBE_CLIENT_SECRET: z.string().min(1, 'YOUTUBE_CLIENT_SECRET is required'),
  TIKTOK_CLIENT_ID: z.string().min(1, 'TIKTOK_CLIENT_ID is required'),
  TIKTOK_CLIENT_SECRET: z.string().min(1, 'TIKTOK_CLIENT_SECRET is required'),
  INSTAGRAM_CLIENT_ID: z.string().min(1, 'INSTAGRAM_CLIENT_ID is required'),
  INSTAGRAM_CLIENT_SECRET: z.string().min(1, 'INSTAGRAM_CLIENT_SECRET is required'),
  TWITTER_CLIENT_ID: z.string().min(1, 'TWITTER_CLIENT_ID is required'),
  TWITTER_CLIENT_SECRET: z.string().min(1, 'TWITTER_CLIENT_SECRET is required'),

  // Storage configuration
  STORAGE_BUCKET: z.string().default('burstlet-media'),
  STORAGE_URL: z.string().url().optional(),
  MAX_FILE_SIZE_MB: z.string().transform(val => parseInt(val, 10)).default('50'),

  // Security settings
  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_WINDOW: z.string().default('15m'),
  RATE_LIMIT_MAX: z.string().transform(val => parseInt(val, 10)).default('100'),
  CSRF_SECRET: z.string().optional(),

  // Monitoring and logging
  SENTRY_DSN: z.string().url().optional(),
  ANALYTICS_API_KEY: z.string().optional(),
  HEALTH_CHECK_INTERVAL: z.string().transform(val => parseInt(val, 10)).default('30'),

  // Feature flags
  MAINTENANCE_MODE: z.string().transform(val => val === 'true').default('false'),
  ADMIN_OVERRIDE_TOKEN: z.string().optional(),
  ENABLE_METRICS: z.string().transform(val => val !== 'false').default('true'),
  ENABLE_DEBUG_LOGGING: z.string().transform(val => val === 'true').default('false'),

  // Performance settings
  REQUEST_TIMEOUT_MS: z.string().transform(val => parseInt(val, 10)).default('30000'),
  MAX_REQUEST_SIZE_MB: z.string().transform(val => parseInt(val, 10)).default('10'),
  ENABLE_COMPRESSION: z.string().transform(val => val !== 'false').default('true'),
});

type Environment = z.infer<typeof environmentSchema>;

class EnvironmentManager {
  private static instance: EnvironmentManager;
  private config: Environment;
  private logger: winston.Logger;
  private isValid: boolean = false;

  private constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
      ],
    });

    this.config = this.validateEnvironment();
  }

  public static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }

  private validateEnvironment(): Environment {
    try {
      this.logger.info('Validating environment configuration...');

      // Parse and validate environment variables
      const config = environmentSchema.parse(process.env);

      // Additional custom validations
      this.validateCustomRules(config);

      this.isValid = true;
      this.logger.info('Environment validation successful', {
        nodeEnv: config.NODE_ENV,
        port: config.PORT,
        databaseConfigured: !!config.DATABASE_URL,
        redisConfigured: !!config.REDIS_URL,
      });

      return config;
    } catch (error) {
      this.isValid = false;
      
      if (error instanceof z.ZodError) {
        this.logger.error('Environment validation failed', {
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            received: err.received,
          })),
        });
      } else {
        this.logger.error('Environment validation error', { error });
      }

      throw new Error('Environment validation failed. Check logs for details.');
    }
  }

  private validateCustomRules(config: Environment): void {
    // Validate production-specific requirements
    if (config.NODE_ENV === 'production') {
      // Ensure secure JWT secret in production
      if (config.JWT_SECRET.length < 64) {
        throw new Error('JWT_SECRET must be at least 64 characters in production');
      }

      // Ensure HTTPS URLs in production
      if (!config.FRONTEND_URL.startsWith('https://')) {
        throw new Error('FRONTEND_URL must use HTTPS in production');
      }

      if (config.BACKEND_URL && !config.BACKEND_URL.startsWith('https://')) {
        throw new Error('BACKEND_URL must use HTTPS in production');
      }

      // Ensure all required secrets are not defaults
      const requiredSecrets = [
        'STRIPE_SECRET_KEY',
        'OPENAI_API_KEY',
        'HAILUOAI_API_KEY',
        'MINIMAX_API_KEY',
      ];

      for (const secret of requiredSecrets) {
        const value = config[secret as keyof Environment] as string;
        if (value.includes('your-') || value.includes('sk-test')) {
          throw new Error(`${secret} appears to be a placeholder value in production`);
        }
      }
    }

    // Validate database URL format
    if (config.DATABASE_URL.includes('localhost') && config.NODE_ENV === 'production') {
      throw new Error('DATABASE_URL cannot point to localhost in production');
    }

    // Validate Redis URL format
    if (config.REDIS_URL.includes('localhost') && config.NODE_ENV === 'production') {
      throw new Error('REDIS_URL cannot point to localhost in production');
    }

    // Validate CORS origins
    if (config.NODE_ENV === 'production' && config.CORS_ORIGIN === '*') {
      this.logger.warn('CORS is set to allow all origins in production - consider restricting');
    }
  }

  public getConfig(): Environment {
    if (!this.isValid) {
      throw new Error('Environment configuration is invalid');
    }
    return this.config;
  }

  public get<K extends keyof Environment>(key: K): Environment[K] {
    return this.getConfig()[key];
  }

  public isDevelopment(): boolean {
    return this.get('NODE_ENV') === 'development';
  }

  public isProduction(): boolean {
    return this.get('NODE_ENV') === 'production';
  }

  public isTest(): boolean {
    return this.get('NODE_ENV') === 'test';
  }

  public getRedactedConfig(): Partial<Environment> {
    const config = this.getConfig();
    const redacted = { ...config };

    // Redact sensitive values
    const sensitiveKeys = [
      'JWT_SECRET', 'DATABASE_URL', 'REDIS_URL', 'SUPABASE_SERVICE_KEY',
      'OPENAI_API_KEY', 'HAILUOAI_API_KEY', 'MINIMAX_API_KEY',
      'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'RESEND_API_KEY',
      'YOUTUBE_CLIENT_SECRET', 'TIKTOK_CLIENT_SECRET',
      'INSTAGRAM_CLIENT_SECRET', 'TWITTER_CLIENT_SECRET',
    ];

    for (const key of sensitiveKeys) {
      if (redacted[key as keyof Environment]) {
        redacted[key as keyof Environment] = '[REDACTED]' as any;
      }
    }

    return redacted;
  }

  public validateConnection(service: string, url: string): Promise<boolean> {
    return new Promise((resolve) => {
      // Simple connection test (in real implementation, would test actual connection)
      this.logger.info(`Validating connection to ${service}`, { url: url.replace(/\/\/.*@/, '//***@') });
      
      // For now, just validate URL format
      try {
        new URL(url);
        resolve(true);
      } catch {
        resolve(false);
      }
    });
  }

  public async validateAllConnections(): Promise<{ [service: string]: boolean }> {
    const config = this.getConfig();
    const results: { [service: string]: boolean } = {};

    // Test all external service connections
    const connections = [
      { name: 'Database', url: config.DATABASE_URL },
      { name: 'Redis', url: config.REDIS_URL },
      { name: 'Supabase', url: config.SUPABASE_URL },
      { name: 'Frontend', url: config.FRONTEND_URL },
    ];

    if (config.BACKEND_URL) {
      connections.push({ name: 'Backend', url: config.BACKEND_URL });
    }

    for (const connection of connections) {
      results[connection.name] = await this.validateConnection(connection.name, connection.url);
    }

    return results;
  }

  public getEnvironmentInfo() {
    const config = this.getConfig();
    
    return {
      environment: config.NODE_ENV,
      version: process.env.npm_package_version || '0.1.0',
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      config: this.getRedactedConfig(),
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const env = EnvironmentManager.getInstance();
export type { Environment };