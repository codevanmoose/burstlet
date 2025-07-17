// Simple Express server for DigitalOcean deployment
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');

// Create Express app
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Trust proxy
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
  origin: process.env.FRONTEND_URL || 'https://burstlet.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '0.1.0',
    services: {
      database: checkEnvVar('DATABASE_URL'),
      redis: checkEnvVar('REDIS_URL'),
      supabase: checkEnvVar('SUPABASE_URL') && checkEnvVar('SUPABASE_SERVICE_KEY'),
      email: checkEnvVar('RESEND_API_KEY'),
      ai: checkEnvVar('OPENAI_API_KEY') && checkEnvVar('HAILUOAI_API_KEY'),
      payments: checkEnvVar('STRIPE_SECRET_KEY'),
    },
    config: {
      frontend_url: process.env.FRONTEND_URL || 'Not configured',
      auth_configured: checkEnvVar('JWT_SECRET') && checkEnvVar('SESSION_SECRET'),
      storage_bucket: process.env.STORAGE_BUCKET || 'Not configured',
    }
  };

  res.json(healthStatus);
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Burstlet API',
    version: '0.1.0',
    status: 'operational',
    endpoints: {
      health: '/health',
      api: '/api/*'
    }
  });
});

// Basic API endpoints
app.get('/api/status', (req, res) => {
  res.json({
    status: 'API is operational',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.url}`,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
});

// Helper function to check if env var exists
function checkEnvVar(varName) {
  return !!process.env[varName];
}

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Burstlet API server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'Not configured'}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = { app, server };