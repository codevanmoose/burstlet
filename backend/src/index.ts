import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  const requiredEnvVars = [
    'DATABASE_URL',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'JWT_SECRET',
    'CSRF_SECRET',
    'SESSION_SECRET',
    'ENCRYPTION_KEY',
    'FRONTEND_URL',
    'OPENAI_API_KEY',
    'HAILUOAI_API_KEY',
    'MINIMAX_API_KEY',
    'RESEND_API_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET'
  ];

  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
  const envStatus = missingEnvVars.length === 0 ? 'complete' : 'incomplete';

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    environment: process.env.NODE_ENV || 'development',
    database: process.env.DATABASE_URL ? 'connected' : 'not_configured',
    environment_variables: {
      status: envStatus,
      total_required: requiredEnvVars.length,
      configured: requiredEnvVars.length - missingEnvVars.length,
      missing: missingEnvVars.length,
      missing_variables: missingEnvVars
    },
    services: {
      frontend_url: process.env.FRONTEND_URL || 'not_configured',
      openai: process.env.OPENAI_API_KEY ? 'configured' : 'not_configured',
      hailuoai: process.env.HAILUOAI_API_KEY ? 'configured' : 'not_configured',
      minimax: process.env.MINIMAX_API_KEY ? 'configured' : 'not_configured',
      stripe: process.env.STRIPE_SECRET_KEY ? 'configured' : 'not_configured',
      resend: process.env.RESEND_API_KEY ? 'configured' : 'not_configured'
    }
  });
});

// API routes
app.get('/api/v1/status', (req, res) => {
  res.json({
    message: 'Burstlet API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Burstlet API server running on port ${PORT}`);
  console.log(`📄 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;