// Express application setup
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const { PrismaClient } = require('@prisma/client');

// Create Express app
const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'https://burstlet.vercel.app',
      'https://burstlet.vercel.app',
      'https://burstlet.com',
      'https://www.burstlet.com',
      'http://localhost:3000'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
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
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  let dbConnected = false;
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbConnected = true;
  } catch (error) {
    console.error('Database connection error:', error);
  }
  
  res.json({
    status: 'healthy',
    mode: 'express',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    message: 'Full Express server running',
    services: {
      database: dbConnected,
      redis: !!process.env.REDIS_URL,
      supabase: !!process.env.SUPABASE_URL,
      openai: !!process.env.OPENAI_API_KEY,
      hailuoai: !!process.env.HAILUOAI_API_KEY,
      minimax: !!process.env.MINIMAX_API_KEY,
      stripe: !!process.env.STRIPE_SECRET_KEY,
      resend: !!process.env.RESEND_API_KEY
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Burstlet API',
    version: '1.0.0',
    mode: 'express',
    status: 'operational',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      content: '/api/content',
      generation: '/api/generation',
      platforms: '/api/platforms',
      analytics: '/api/analytics',
      billing: '/api/billing'
    }
  });
});

// API Routes
app.get('/api/status', (req, res) => {
  res.json({
    status: 'API is operational',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    mode: 'express'
  });
});

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists'
      });
    }
    
    // In production, you would hash the password here
    // For now, create user with basic info
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: 'temp_' + password, // This should be bcrypt hashed
      }
    });
    
    res.json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: error.message
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
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }
    
    // In production, verify password hash here
    // For now, simple check
    if (user.passwordHash !== 'temp_' + password) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }
    
    // Create session (simplified - should use proper JWT)
    const token = 'jwt_' + Date.now() + '_' + user.id;
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: error.message
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing database connection...');
  await prisma.$disconnect();
});

module.exports = { app, prisma };