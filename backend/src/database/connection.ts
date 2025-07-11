import { PrismaClient } from '@prisma/client';
import winston from 'winston';

// Enhanced Prisma client with connection pooling and monitoring
class DatabaseManager {
  private static instance: DatabaseManager;
  private prisma: PrismaClient;
  private logger: winston.Logger;
  private connectionPool: {
    total: number;
    idle: number;
    active: number;
  } = { total: 0, idle: 0, active: 0 };

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

    this.prisma = new PrismaClient({
      log: this.getLogLevels(),
      datasources: {
        db: {
          url: this.getDatabaseUrl(),
        },
      },
    });

    this.setupEventListeners();
    this.setupConnectionPooling();
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public getClient(): PrismaClient {
    return this.prisma;
  }

  private getDatabaseUrl(): string {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    // Add connection pooling parameters for production
    if (process.env.NODE_ENV === 'production') {
      const urlObj = new URL(url);
      
      // Connection pool settings
      urlObj.searchParams.set('pgbouncer', 'true');
      urlObj.searchParams.set('connection_limit', '20');
      urlObj.searchParams.set('pool_timeout', '15');
      
      // SSL settings for production
      if (!urlObj.searchParams.has('sslmode')) {
        urlObj.searchParams.set('sslmode', 'require');
      }
      
      return urlObj.toString();
    }

    return url;
  }

  private getLogLevels() {
    if (process.env.NODE_ENV === 'production') {
      return ['error', 'warn'];
    }
    return ['query', 'info', 'warn', 'error'];
  }

  private setupEventListeners() {
    // Log database queries in development
    if (process.env.NODE_ENV !== 'production') {
      this.prisma.$on('query', (e) => {
        this.logger.debug('Database Query', {
          query: e.query,
          params: e.params,
          duration: `${e.duration}ms`,
          target: e.target,
        });
      });
    }

    // Log slow queries
    this.prisma.$on('query', (e) => {
      if (e.duration > 1000) { // Queries slower than 1 second
        this.logger.warn('Slow Database Query', {
          query: e.query,
          duration: `${e.duration}ms`,
          target: e.target,
        });
      }
    });

    // Log database errors
    this.prisma.$on('error', (e) => {
      this.logger.error('Database Error', {
        message: e.message,
        target: e.target,
      });
    });
  }

  private setupConnectionPooling() {
    // Monitor connection pool every 30 seconds
    setInterval(async () => {
      try {
        await this.updateConnectionPoolStats();
      } catch (error) {
        this.logger.error('Failed to update connection pool stats', { error });
      }
    }, 30000);
  }

  private async updateConnectionPoolStats() {
    try {
      // This is a simplified example - actual implementation would depend on the database driver
      const result = await this.prisma.$queryRaw`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections
        FROM pg_stat_activity 
        WHERE datname = current_database()
      ` as any[];

      if (result && result[0]) {
        this.connectionPool = {
          total: parseInt(result[0].total_connections),
          idle: parseInt(result[0].idle_connections),
          active: parseInt(result[0].active_connections),
        };
      }
    } catch (error) {
      // Ignore errors - this is just for monitoring
    }
  }

  public getConnectionPoolStats() {
    return this.connectionPool;
  }

  public async healthCheck(): Promise<{ healthy: boolean; latency: number; error?: string }> {
    const start = Date.now();
    
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;
      
      return {
        healthy: true,
        latency,
      };
    } catch (error) {
      const latency = Date.now() - start;
      
      return {
        healthy: false,
        latency,
        error: error instanceof Error ? error.message : 'Unknown database error',
      };
    }
  }

  public async getStats() {
    try {
      const dbSize = await this.prisma.$queryRaw`
        SELECT pg_size_pretty(pg_database_size(current_database())) as database_size
      ` as any[];

      const tableStats = await this.prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation
        FROM pg_stats 
        WHERE schemaname = 'public'
        ORDER BY tablename, attname
      ` as any[];

      return {
        databaseSize: dbSize[0]?.database_size || 'Unknown',
        connectionPool: this.connectionPool,
        tableCount: tableStats.length,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get database stats', { error });
      return {
        error: 'Failed to retrieve database statistics',
        connectionPool: this.connectionPool,
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  public async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
    this.logger.info('Database connection closed');
  }

  // Transaction wrapper with retry logic
  public async withTransaction<T>(
    operation: (prisma: PrismaClient) => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.prisma.$transaction(operation);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown transaction error');
        
        this.logger.warn(`Transaction attempt ${attempt} failed`, {
          error: lastError.message,
          attempt,
          maxRetries,
        });

        // Don't retry on certain types of errors
        if (lastError.message.includes('unique constraint') || 
            lastError.message.includes('foreign key')) {
          throw lastError;
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 100; // 200ms, 400ms, 800ms
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Transaction failed after retries');
  }

  // Bulk operations with batching
  public async bulkCreate<T>(
    model: any,
    data: T[],
    batchSize: number = 1000
  ): Promise<number> {
    let totalCreated = 0;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      try {
        const result = await model.createMany({
          data: batch,
          skipDuplicates: true,
        });
        
        totalCreated += result.count;
        
        this.logger.info(`Bulk create batch completed`, {
          batch: Math.floor(i / batchSize) + 1,
          totalBatches: Math.ceil(data.length / batchSize),
          batchSize: batch.length,
          created: result.count,
        });
      } catch (error) {
        this.logger.error(`Bulk create batch failed`, {
          batch: Math.floor(i / batchSize) + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    }

    return totalCreated;
  }
}

// Export singleton instance
export const db = DatabaseManager.getInstance();
export const prisma = db.getClient();