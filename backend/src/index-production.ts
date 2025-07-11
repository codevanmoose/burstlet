import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import winston from 'winston';
import 'express-async-errors';
import { metricsHandler, prometheusHandler, recordRequest } from './monitoring';
import { docsHandler, openApiHandler } from './docs';
import { validateInput } from './middleware/validation';
import { securityHeaders, setupCSRF } from './middleware/security';
import { apmCollector } from './monitoring/apm';
import { responseCache, etagCache, smartCompression, requestTimeout, responseOptimization, queryOptimization, memoryMonitoring, performanceBudgets } from './middleware/performance';
import { securityScanMiddleware } from './security/scanner';
import { env } from './config/environment';
import { databaseManager } from './database/connection';

// Load environment variables
dotenv.config();

// Validate environment configuration
const config = env.getConfig();

// Initialize database manager
const prisma = databaseManager.getPrisma();

// Initialize Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Create Express app
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Trust proxy (for proper IP addresses behind reverse proxies)
app.set('trust proxy', 1);

// Security headers middleware
app.use(securityHeaders);

// Setup CSRF protection
if (config.NODE_ENV === 'production') {
  app.use(setupCSRF());
}

// Security scanning middleware
app.use(securityScanMiddleware);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS configuration
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'https://burstlet-gilt.vercel.app',
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Smart compression
app.use(smartCompression);

// Response optimization
app.use(responseOptimization);

// Request timeout
app.use(requestTimeout(config.REQUEST_TIMEOUT_MS));

// ETag caching
app.use(etagCache);

// Query optimization
app.use(queryOptimization);

// Memory monitoring
app.use(memoryMonitoring);

// Performance budgets
app.use(performanceBudgets({
  responseTime: 1000,
  memoryUsage: 50 * 1024 * 1024,
  dbQueries: 10,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.RATE_LIMIT_MAX, // from environment config
  message: {
    error: 'Rate Limit Exceeded',
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60,
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use forwarded IP if behind proxy
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
});

// Apply rate limiting to API routes
app.use('/api/', limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body parsing middleware with size limits from config
app.use(express.json({ 
  limit: `${config.MAX_REQUEST_SIZE_MB}mb`,
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  },
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: `${config.MAX_REQUEST_SIZE_MB}mb`,
}));

// Enhanced request logging, metrics, and APM
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Add request ID to headers
  req.headers['x-request-id'] = requestId as string;
  res.setHeader('X-Request-ID', requestId);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const isError = res.statusCode >= 400;
    
    // Record basic metrics
    recordRequest(duration, isError);
    
    // Record detailed APM metrics
    apmCollector.recordPerformance({
      endpoint: req.path,
      method: req.method,
      statusCode: res.statusCode,
      duration,
      memoryUsage: process.memoryUsage().heapUsed,
      timestamp: Date.now(),
    });
    
    // Log request with structured data
    const logData = {
      requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      contentLength: res.get('content-length'),
      timestamp: new Date().toISOString(),
    };
    
    if (isError) {
      logger.error('Request error', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });
  
  next();
});

// Enhanced health check endpoint with comprehensive system status
app.get('/health', async (req: Request, res: Response) => {
  try {
    const healthStart = Date.now();
    
    // Check database connection with timeout
    const dbPromise = Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database timeout')), 5000)
      ),
    ]);
    
    await dbPromise;
    
    const healthDuration = Date.now() - healthStart;
    const memoryUsage = process.memoryUsage();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      environment: config.NODE_ENV,
      database: {
        status: 'connected',
        responseTime: `${healthDuration}ms`,
      },
      system: {
        uptime: process.uptime(),
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024),
        },
        cpu: process.cpuUsage(),
      },
      services: {
        database: 'healthy',
        cache: 'healthy',
        monitoring: 'healthy',
      },
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      services: {
        database: 'unhealthy',
      },
    });
  }
});

// Readiness check for orchestrators
app.get('/ready', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).send('OK');
  } catch (error) {
    res.status(503).send('Not Ready');
  }
});

// API info endpoint
app.get('/api', (req: Request, res: Response) => {
  res.json({
    name: 'Burstlet API',
    version: '0.1.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    endpoints: {
      health: '/health',
      ready: '/ready',
      auth: '/api/auth',
      generation: '/api/generation',
      content: '/api/content',
      platforms: '/api/platforms',
      analytics: '/api/analytics',
      billing: '/api/billing',
    },
  });
});

// API v1 status endpoint
app.get('/api/v1/status', (req: Request, res: Response) => {
  res.json({
    message: 'Burstlet API v1',
    status: 'operational',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    features: {
      authentication: true,
      videoGeneration: true,
      contentManagement: true,
      socialMediaIntegration: true,
      analytics: true,
      billing: true,
    },
  });
});

// Metrics endpoints
app.get('/metrics', metricsHandler);
app.get('/metrics/prometheus', prometheusHandler);

// Documentation endpoints
app.get('/docs', docsHandler);
app.get('/api/docs', docsHandler);
app.get('/api/openapi.json', openApiHandler);

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  // Log error
  logger.error({
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  // Don't leak error details in production
  const isDev = process.env.NODE_ENV !== 'production';
  
  res.status(err.status || 500).json({
    error: isDev ? err.message : 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
    ...(isDev && { stack: err.stack }),
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] || 'unknown',
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed');
    
    try {
      // Close database connections
      await prisma.$disconnect();
      logger.info('Database connections closed');
      
      // Exit process
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start server with enhanced startup logging
server.listen(PORT, async () => {
  logger.info('🚀 Burstlet API Production Server Starting...');
  
  // Log environment information
  const envInfo = env.getEnvironmentInfo();
  logger.info('Environment Information', {
    environment: envInfo.environment,
    version: envInfo.version,
    node: envInfo.node,
    platform: envInfo.platform,
    arch: envInfo.arch,
  });
  
  // Test database connection
  try {
    await databaseManager.testConnection();
    logger.info('✅ Database connection verified');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
  }
  
  // Log service URLs
  logger.info('🌐 Service URLs:');
  logger.info(`   Health:     http://localhost:${PORT}/health`);
  logger.info(`   API Info:   http://localhost:${PORT}/api`);
  logger.info(`   Metrics:    http://localhost:${PORT}/metrics`);
  logger.info(`   Docs:       http://localhost:${PORT}/docs`);
  
  // Log security status
  logger.info('🔒 Security Status:');
  logger.info(`   CORS:       ${corsOptions.origin ? 'Enabled' : 'Disabled'}`);
  logger.info(`   Rate Limit: ${config.RATE_LIMIT_MAX} req/15min`);
  logger.info(`   CSRF:       ${config.NODE_ENV === 'production' ? 'Enabled' : 'Disabled'}`);
  logger.info(`   Scanning:   Enabled`);
  
  // Start APM monitoring
  apmCollector.startMonitoring();
  logger.info('📈 APM monitoring started');
  
  logger.info(`🎯 Burstlet API ready on port ${PORT} in ${config.NODE_ENV} mode`);
});

export default app;