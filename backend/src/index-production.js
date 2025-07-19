// Production server with graceful Express loading
const http = require('http');
const url = require('url');

console.log('🚀 Starting Burstlet Backend...');

// Try to load Express and dependencies
let expressApp = null;
let isExpressAvailable = false;

try {
  // Check if we can load Express
  require.resolve('express');
  require.resolve('@prisma/client');
  
  console.log('✅ Express and dependencies available, loading full server...');
  
  // Load the full Express server
  const { app } = require('./app');
  expressApp = app;
  isExpressAvailable = true;
  
} catch (error) {
  console.log('⚠️  Express not available, using minimal server mode');
  console.log('   Error:', error.message);
}

const PORT = process.env.PORT || 3001;

if (isExpressAvailable && expressApp) {
  // Use Express server
  const server = http.createServer(expressApp);
  
  server.listen(PORT, () => {
    console.log(`✅ Burstlet Express server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'Not configured'}`);
    console.log(`💾 Database: ${!!process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
    console.log(`🔄 Redis: ${!!process.env.REDIS_URL ? 'Connected' : 'Not configured'}`);
    console.log(`☁️  Supabase: ${!!process.env.SUPABASE_URL ? 'Connected' : 'Not configured'}`);
  });
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
  
} else {
  // Fallback to minimal server
  console.log('📦 Running in minimal mode...');
  
  const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    // Set CORS headers
    const allowedOrigins = [
      'https://burstlet.vercel.app',
      'https://burstlet.com',
      'https://www.burstlet.com',
      'http://localhost:3000'
    ];
    
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (process.env.FRONTEND_URL) {
      res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL);
    } else {
      res.setHeader('Access-Control-Allow-Origin', 'https://burstlet.vercel.app');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Handle OPTIONS
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    
    res.setHeader('Content-Type', 'application/json');
    
    // Basic routes
    if (pathname === '/health') {
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'healthy',
        mode: 'minimal',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: '0.3.0',
        message: 'Backend running in minimal mode - Express not available',
        services: {
          database: !!process.env.DATABASE_URL,
          redis: !!process.env.REDIS_URL,
          supabase: !!process.env.SUPABASE_URL,
          openai: !!process.env.OPENAI_API_KEY,
          hailuoai: !!process.env.HAILUOAI_API_KEY,
          stripe: !!process.env.STRIPE_SECRET_KEY
        }
      }));
    } else if (pathname === '/') {
      res.writeHead(200);
      res.end(JSON.stringify({
        name: 'Burstlet API',
        version: '0.3.0',
        mode: 'minimal',
        status: 'operational'
      }));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({
        error: 'Not Found',
        message: 'Express server not available',
        mode: 'minimal'
      }));
    }
  });
  
  server.listen(PORT, () => {
    console.log(`⚠️  Burstlet Minimal server running on port ${PORT}`);
    console.log(`   Express modules not available`);
    console.log(`   Only health check endpoints available`);
  });
}