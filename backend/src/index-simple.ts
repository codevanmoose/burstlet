import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import dotenv from 'dotenv';
import winston from 'winston';
import 'express-async-errors';

// Load environment variables
dotenv.config();

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
}));

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'https://burstlet-gilt.vercel.app',
  ].filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Rate Limit Exceeded',
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60,
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req: Request, res: Response, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    logger.info('Request completed', {
      requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString(),
    });
  });
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
  });
});

// Readiness check for orchestrators
app.get('/ready', (req: Request, res: Response) => {
  res.status(200).send('OK');
});

// API info endpoint
app.get('/api', (req: Request, res: Response) => {
  res.json({
    name: 'Burstlet API',
    version: '0.1.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
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

// Metrics endpoint (basic)
app.get('/metrics', (req: Request, res: Response) => {
  const memoryUsage = process.memoryUsage();
  res.setHeader('Content-Type', 'text/plain');
  res.send(`
# HELP burstlet_uptime_seconds Total uptime in seconds
# TYPE burstlet_uptime_seconds counter
burstlet_uptime_seconds ${process.uptime()}

# HELP burstlet_memory_usage_bytes Memory usage in bytes
# TYPE burstlet_memory_usage_bytes gauge
burstlet_memory_usage_bytes{type="heap_used"} ${memoryUsage.heapUsed}
burstlet_memory_usage_bytes{type="heap_total"} ${memoryUsage.heapTotal}
burstlet_memory_usage_bytes{type="external"} ${memoryUsage.external}

# HELP burstlet_requests_total Total number of requests
# TYPE burstlet_requests_total counter
burstlet_requests_total 0
`.trim());
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  logger.error({
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

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
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
  
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

// Start server
server.listen(PORT, () => {
  logger.info(`🚀 Burstlet API server running on port ${PORT}`);
  logger.info(`📄 Health check: http://localhost:${PORT}/health`);
  logger.info(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📊 Metrics: http://localhost:${PORT}/metrics`);
});

export default app;