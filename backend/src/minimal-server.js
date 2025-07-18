// Minimal server with no dependencies for DigitalOcean
const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 3001;

// Create server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // Set CORS headers - allow multiple origins
  const allowedOrigins = [
    'https://burstlet.vercel.app',
    'https://burstlet.com',
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
  
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Set JSON content type
  res.setHeader('Content-Type', 'application/json');
  
  // Routes
  if (pathname === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '0.1.0',
      message: 'Minimal server running without Express',
      services: {
        database: !!process.env.DATABASE_URL,
        redis: !!process.env.REDIS_URL,
        supabase: !!process.env.SUPABASE_URL,
        frontend_url: process.env.FRONTEND_URL || 'Not configured'
      }
    }));
  } else if (pathname === '/') {
    res.writeHead(200);
    res.end(JSON.stringify({
      name: 'Burstlet API',
      version: '0.1.0',
      status: 'operational',
      endpoints: {
        health: '/health',
        api: '/api/*'
      }
    }));
  } else if (pathname === '/api/status') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'API is operational',
      timestamp: new Date().toISOString()
    }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({
      error: 'Not Found',
      message: `Cannot ${req.method} ${pathname}`,
      timestamp: new Date().toISOString()
    }));
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Burstlet Minimal API server running on port ${PORT}`);
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