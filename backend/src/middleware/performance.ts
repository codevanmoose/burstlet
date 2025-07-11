import { Request, Response, NextFunction } from 'express';
import compression from 'compression';
import { createHash } from 'crypto';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  hits: number;
}

// In-memory cache implementation (use Redis in production)
class MemoryCache {
  private cache = new Map<string, CacheEntry>();
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    size: 0,
  };

  set(key: string, value: any, ttlSeconds: number = 300): void {
    const entry: CacheEntry = {
      data: value,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
      hits: 0,
    };

    this.cache.set(key, entry);
    this.stats.sets++;
    this.stats.size = this.cache.size;
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.deletes++;
      this.stats.misses++;
      this.stats.size = this.cache.size;
      return null;
    }

    entry.hits++;
    this.stats.hits++;
    return entry.data;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      this.stats.size = this.cache.size;
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
  }

  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
      totalRequests,
    };
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();
    let deletedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      this.stats.deletes += deletedCount;
      this.stats.size = this.cache.size;
    }
  }

  // Get cache entries by pattern
  getByPattern(pattern: RegExp): Array<{ key: string; value: any }> {
    const results: Array<{ key: string; value: any }> = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (pattern.test(key)) {
        // Check if not expired
        if (Date.now() - entry.timestamp <= entry.ttl) {
          results.push({ key, value: entry.data });
        }
      }
    }

    return results;
  }
}

// Global cache instance
const cache = new MemoryCache();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  cache.cleanup();
}, 5 * 60 * 1000);

// Response caching middleware
export const responseCache = (options: {
  ttl?: number;
  keyGenerator?: (req: Request) => string;
  skipQuery?: boolean;
  skipIf?: (req: Request, res: Response) => boolean;
} = {}) => {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator = (req) => `${req.method}:${req.originalUrl}`,
    skipQuery = false,
    skipIf = () => false,
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip if condition is met
    if (skipIf(req, res)) {
      return next();
    }

    const cacheKey = skipQuery 
      ? keyGenerator(req).split('?')[0] 
      : keyGenerator(req);

    // Try to get from cache
    const cachedResponse = cache.get(cacheKey);
    
    if (cachedResponse) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-Key', cacheKey);
      return res.json(cachedResponse);
    }

    // Override res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = function(body: any) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, body, ttl);
      }
      
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('X-Cache-Key', cacheKey);
      return originalJson(body);
    };

    next();
  };
};

// ETags for conditional requests
export const etagCache = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json.bind(res);
  
  res.json = function(body: any) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      // Generate ETag based on response body
      const etag = generateETag(JSON.stringify(body));
      res.setHeader('ETag', etag);
      
      // Check If-None-Match header
      const clientETag = req.headers['if-none-match'];
      if (clientETag === etag) {
        return res.status(304).end();
      }
    }
    
    return originalJson(body);
  };

  next();
};

// Generate ETag
function generateETag(content: string): string {
  return `"${createHash('sha1').update(content).digest('hex').substring(0, 16)}"`;
}

// Intelligent compression based on content type and size
export const smartCompression = compression({
  level: 6, // Balanced compression level
  threshold: 1024, // Only compress if larger than 1KB
  filter: (req, res) => {
    const contentType = res.getHeader('content-type') as string;
    
    // Don't compress already compressed content
    if (contentType && (
      contentType.includes('image/') ||
      contentType.includes('video/') ||
      contentType.includes('audio/') ||
      contentType.includes('application/zip') ||
      contentType.includes('application/gzip')
    )) {
      return false;
    }

    // Use default compression filter for other content
    return compression.filter(req, res);
  },
});

// Request timeout middleware
export const requestTimeout = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          error: 'Request Timeout',
          message: `Request took longer than ${timeoutMs}ms`,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'],
        });
      }
    }, timeoutMs);

    res.on('finish', () => {
      clearTimeout(timeout);
    });

    res.on('close', () => {
      clearTimeout(timeout);
    });

    next();
  };
};

// Response optimization middleware
export const responseOptimization = (req: Request, res: Response, next: NextFunction) => {
  // Remove unnecessary headers
  res.removeHeader('X-Powered-By');
  
  // Add cache control headers for static content
  if (req.path.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
  } else if (req.path.startsWith('/api/')) {
    // API responses - short cache
    res.setHeader('Cache-Control', 'public, max-age=60'); // 1 minute
  }

  // Add performance hints
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  
  next();
};

// Database query optimization middleware
export const queryOptimization = (req: Request, res: Response, next: NextFunction) => {
  // Add query optimization hints to request
  req.queryHints = {
    limit: Math.min(parseInt(req.query.limit as string) || 20, 100),
    offset: Math.max(parseInt(req.query.offset as string) || 0, 0),
    fields: req.query.fields ? (req.query.fields as string).split(',') : undefined,
    include: req.query.include ? (req.query.include as string).split(',') : undefined,
  };

  next();
};

// Memory monitoring middleware
export const memoryMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const startMemory = process.memoryUsage();
  
  res.on('finish', () => {
    const endMemory = process.memoryUsage();
    const memoryDelta = {
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
      external: endMemory.external - startMemory.external,
    };

    // Log if memory usage is significant
    if (memoryDelta.heapUsed > 10 * 1024 * 1024) { // 10MB
      console.warn('High memory usage detected:', {
        method: req.method,
        url: req.originalUrl,
        memoryDelta,
        requestId: req.headers['x-request-id'],
      });
    }
  });

  next();
};

// Performance budgets middleware
export const performanceBudgets = (budgets: {
  responseTime?: number;
  memoryUsage?: number;
  dbQueries?: number;
} = {}) => {
  const {
    responseTime = 1000, // 1 second
    memoryUsage = 50 * 1024 * 1024, // 50MB
    dbQueries = 10,
  } = budgets;

  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;
    
    // Track database queries (simplified)
    req.dbQueryCount = 0;
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const memoryUsed = process.memoryUsage().heapUsed - startMemory;
      const queries = req.dbQueryCount || 0;

      const violations: string[] = [];
      
      if (duration > responseTime) {
        violations.push(`Response time: ${duration}ms (budget: ${responseTime}ms)`);
      }
      
      if (memoryUsed > memoryUsage) {
        violations.push(`Memory usage: ${Math.round(memoryUsed / 1024 / 1024)}MB (budget: ${Math.round(memoryUsage / 1024 / 1024)}MB)`);
      }
      
      if (queries > dbQueries) {
        violations.push(`DB queries: ${queries} (budget: ${dbQueries})`);
      }

      if (violations.length > 0) {
        console.warn('Performance budget violations:', {
          method: req.method,
          url: req.originalUrl,
          violations,
          requestId: req.headers['x-request-id'],
        });
      }
    });

    next();
  };
};

// Cache management functions
export const cacheManager = {
  get: (key: string) => cache.get(key),
  set: (key: string, value: any, ttl?: number) => cache.set(key, value, ttl),
  delete: (key: string) => cache.delete(key),
  clear: () => cache.clear(),
  getStats: () => cache.getStats(),
  getByPattern: (pattern: RegExp) => cache.getByPattern(pattern),
  
  // Invalidate cache by pattern
  invalidatePattern: (pattern: RegExp) => {
    const entries = cache.getByPattern(pattern);
    entries.forEach(entry => cache.delete(entry.key));
    return entries.length;
  },
  
  // Preload cache with data
  preload: async (key: string, loader: () => Promise<any>, ttl?: number) => {
    try {
      const data = await loader();
      cache.set(key, data, ttl);
      return data;
    } catch (error) {
      console.error('Cache preload failed:', { key, error });
      throw error;
    }
  },
};

// Extend Request interface
declare global {
  namespace Express {
    interface Request {
      queryHints?: {
        limit: number;
        offset: number;
        fields?: string[];
        include?: string[];
      };
      dbQueryCount?: number;
    }
  }
}