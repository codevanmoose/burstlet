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

// CORS configuration with multiple origins
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'https://burstlet.vercel.app',
      'https://burstlet.vercel.app',
      'https://burstlet.com',
      'http://localhost:3000'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

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
    timestamp: new Date().toISOString(),
    version: '0.2.0',
    server: 'express'
  });
});

// Authentication endpoints (temporary - for testing)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }
    
    // For now, just return success to test the connection
    res.json({
      success: true,
      message: 'Registration endpoint working',
      data: {
        user: {
          email,
          name,
          id: 'test_' + Date.now()
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      error: error.message || 'Registration failed'
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }
    
    // For now, just return success to test the connection
    res.json({
      success: true,
      message: 'Login endpoint working',
      data: {
        token: 'test_jwt_token_' + Date.now(),
        user: {
          email,
          id: 'test_user_id'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      error: error.message || 'Login failed'
    });
  }
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