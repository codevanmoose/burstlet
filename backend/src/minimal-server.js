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
      version: '0.2.0',
      message: 'Minimal server with auth endpoints',
      services: {
        database: !!process.env.DATABASE_URL,
        redis: !!process.env.REDIS_URL,
        supabase: !!process.env.SUPABASE_URL,
        frontend_url: process.env.FRONTEND_URL || 'Not configured'
      },
      debug: {
        has_database_url: !!process.env.DATABASE_URL,
        has_redis_url: !!process.env.REDIS_URL,
        has_supabase_url: !!process.env.SUPABASE_URL,
        node_env: process.env.NODE_ENV,
        port: process.env.PORT
      }
    }));
  } else if (pathname === '/') {
    res.writeHead(200);
    res.end(JSON.stringify({
      name: 'Burstlet API',
      version: '0.2.0',
      status: 'operational',
      endpoints: {
        health: '/health',
        api: '/api/*',
        auth: {
          register: '/api/auth/register',
          login: '/api/auth/login'
        }
      }
    }));
  } else if (pathname === '/api/status') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'API is operational',
      timestamp: new Date().toISOString(),
      version: '0.2.0',
      deployedAt: '2025-07-18T14:03:22Z',
      env_check: {
        has_db: !!process.env.DATABASE_URL,
        has_redis: !!process.env.REDIS_URL,
        has_supabase: !!process.env.SUPABASE_URL
      }
    }));
  } else if (pathname === '/api/auth/register' && req.method === 'POST') {
    // Handle registration
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { email, password, name } = data;
        
        if (!email || !password) {
          res.writeHead(400);
          res.end(JSON.stringify({
            error: 'Email and password are required'
          }));
          return;
        }
        
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          message: 'Registration endpoint working',
          data: {
            user: {
              email,
              name,
              id: 'test_' + Date.now()
            }
          }
        }));
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({
          error: 'Invalid JSON in request body'
        }));
      }
    });
  } else if (pathname === '/api/auth/login' && req.method === 'POST') {
    // Handle login
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { email, password } = data;
        
        if (!email || !password) {
          res.writeHead(400);
          res.end(JSON.stringify({
            error: 'Email and password are required'
          }));
          return;
        }
        
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          message: 'Login endpoint working',
          data: {
            token: 'test_jwt_token_' + Date.now(),
            user: {
              email,
              id: 'test_user_id'
            }
          }
        }));
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({
          error: 'Invalid JSON in request body'
        }));
      }
    });
  } else if (pathname === '/api/debug/env') {
    // Debug endpoint to check environment variables
    const envKeys = Object.keys(process.env).filter(key => 
      !key.includes('npm_') && 
      !key.includes('YARN_') && 
      !key.includes('PATH') &&
      !key.includes('HOME') &&
      !key.includes('USER')
    );
    res.writeHead(200);
    res.end(JSON.stringify({
      count: envKeys.length,
      keys: envKeys,
      hasDatabase: 'DATABASE_URL' in process.env,
      hasRedis: 'REDIS_URL' in process.env,
      hasSupabase: 'SUPABASE_URL' in process.env,
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT
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