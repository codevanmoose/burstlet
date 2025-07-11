import { Request, Response } from 'express';

interface APIEndpoint {
  method: string;
  path: string;
  description: string;
  parameters?: Record<string, string>;
  response?: any;
  authentication?: boolean;
}

const endpoints: APIEndpoint[] = [
  // Health & Status
  {
    method: 'GET',
    path: '/health',
    description: 'Health check endpoint with database connectivity test',
    response: {
      status: 'healthy',
      timestamp: '2025-01-11T08:00:00.000Z',
      version: '0.1.0',
      environment: 'production',
      database: 'connected',
      uptime: 3600,
    },
  },
  {
    method: 'GET',
    path: '/ready',
    description: 'Readiness check for orchestrators',
    response: 'OK',
  },
  {
    method: 'GET',
    path: '/metrics',
    description: 'System metrics in JSON format',
    response: {
      timestamp: '2025-01-11T08:00:00.000Z',
      uptime: 3600,
      memory: { used: 1234567, total: 2345678, percentage: 52.6 },
      api: { totalRequests: 1000, errorRate: 0.5, averageResponseTime: 150 },
    },
  },
  {
    method: 'GET',
    path: '/metrics/prometheus',
    description: 'System metrics in Prometheus format',
    response: 'text/plain format',
  },

  // API Info
  {
    method: 'GET',
    path: '/api',
    description: 'API information and available endpoints',
    response: {
      name: 'Burstlet API',
      version: '0.1.0',
      status: 'operational',
      endpoints: {},
    },
  },
  {
    method: 'GET',
    path: '/api/v1/status',
    description: 'API v1 status and feature availability',
    response: {
      message: 'Burstlet API v1',
      status: 'operational',
      features: {},
    },
  },

  // Authentication (Future endpoints)
  {
    method: 'POST',
    path: '/api/auth/register',
    description: 'Register a new user account',
    parameters: {
      email: 'User email address',
      password: 'User password (min 8 characters)',
      name: 'User display name (optional)',
    },
    authentication: false,
  },
  {
    method: 'POST',
    path: '/api/auth/login',
    description: 'Login with email and password',
    parameters: {
      email: 'User email address',
      password: 'User password',
    },
    authentication: false,
  },
  {
    method: 'POST',
    path: '/api/auth/logout',
    description: 'Logout and invalidate session',
    authentication: true,
  },
  {
    method: 'GET',
    path: '/api/auth/me',
    description: 'Get current user profile',
    authentication: true,
  },

  // Content Generation (Future endpoints)
  {
    method: 'POST',
    path: '/api/generation/video',
    description: 'Generate video content using AI',
    parameters: {
      prompt: 'Video generation prompt',
      duration: 'Video duration in seconds (optional)',
      style: 'Video style (optional)',
    },
    authentication: true,
  },
  {
    method: 'POST',
    path: '/api/generation/blog',
    description: 'Generate blog post content',
    parameters: {
      title: 'Blog post title',
      keywords: 'SEO keywords (optional)',
      length: 'Content length preference (optional)',
    },
    authentication: true,
  },
  {
    method: 'POST',
    path: '/api/generation/social',
    description: 'Generate social media content',
    parameters: {
      platform: 'Target platform (twitter, instagram, etc.)',
      topic: 'Content topic',
      tone: 'Content tone (optional)',
    },
    authentication: true,
  },

  // Content Management (Future endpoints)
  {
    method: 'GET',
    path: '/api/content',
    description: 'List user content with filtering and pagination',
    parameters: {
      page: 'Page number (default: 1)',
      limit: 'Items per page (default: 20)',
      type: 'Content type filter (optional)',
      status: 'Content status filter (optional)',
    },
    authentication: true,
  },
  {
    method: 'GET',
    path: '/api/content/:id',
    description: 'Get specific content item by ID',
    authentication: true,
  },
  {
    method: 'PUT',
    path: '/api/content/:id',
    description: 'Update content item',
    authentication: true,
  },
  {
    method: 'DELETE',
    path: '/api/content/:id',
    description: 'Delete content item',
    authentication: true,
  },

  // Platform Integrations (Future endpoints)
  {
    method: 'GET',
    path: '/api/platforms',
    description: 'List connected social media platforms',
    authentication: true,
  },
  {
    method: 'POST',
    path: '/api/platforms/:platform/connect',
    description: 'Connect to a social media platform',
    authentication: true,
  },
  {
    method: 'POST',
    path: '/api/platforms/:platform/publish',
    description: 'Publish content to a platform',
    parameters: {
      contentId: 'ID of content to publish',
      scheduledAt: 'Schedule publication time (optional)',
    },
    authentication: true,
  },

  // Analytics (Future endpoints)
  {
    method: 'GET',
    path: '/api/analytics/overview',
    description: 'Get analytics overview dashboard data',
    parameters: {
      dateRange: 'Date range (7d, 30d, 90d, custom)',
      platforms: 'Comma-separated platform list (optional)',
    },
    authentication: true,
  },
  {
    method: 'GET',
    path: '/api/analytics/content/:id',
    description: 'Get analytics for specific content',
    authentication: true,
  },

  // Billing (Future endpoints)
  {
    method: 'GET',
    path: '/api/billing/subscription',
    description: 'Get current subscription details',
    authentication: true,
  },
  {
    method: 'POST',
    path: '/api/billing/checkout',
    description: 'Create Stripe checkout session',
    parameters: {
      planId: 'Subscription plan ID',
      billingCycle: 'monthly or yearly',
    },
    authentication: true,
  },
  {
    method: 'GET',
    path: '/api/billing/invoices',
    description: 'List billing invoices',
    authentication: true,
  },
];

const generateHTML = (): string => {
  const endpointsByCategory = endpoints.reduce((acc, endpoint) => {
    const category = endpoint.path.split('/')[2] || 'System';
    if (!acc[category]) acc[category] = [];
    acc[category].push(endpoint);
    return acc;
  }, {} as Record<string, APIEndpoint[]>);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Burstlet API Documentation</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 20px; 
            background: #f8fafc;
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 30px; 
            border-radius: 10px; 
            margin-bottom: 30px; 
            text-align: center;
        }
        .category { 
            background: white; 
            margin: 20px 0; 
            border-radius: 8px; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
            overflow: hidden;
        }
        .category-header { 
            background: #4f46e5; 
            color: white; 
            padding: 15px 20px; 
            font-weight: bold; 
            font-size: 18px;
        }
        .endpoint { 
            border-bottom: 1px solid #e5e7eb; 
            padding: 20px;
        }
        .endpoint:last-child { border-bottom: none; }
        .method { 
            display: inline-block; 
            padding: 4px 8px; 
            border-radius: 4px; 
            font-weight: bold; 
            font-size: 12px; 
            margin-right: 10px;
        }
        .method.GET { background: #10b981; color: white; }
        .method.POST { background: #3b82f6; color: white; }
        .method.PUT { background: #f59e0b; color: white; }
        .method.DELETE { background: #ef4444; color: white; }
        .path { 
            font-family: 'Monaco', 'Courier New', monospace; 
            background: #f3f4f6; 
            padding: 2px 6px; 
            border-radius: 4px; 
            font-size: 14px;
        }
        .auth-required { 
            background: #fef3c7; 
            color: #92400e; 
            padding: 2px 6px; 
            border-radius: 4px; 
            font-size: 12px; 
            margin-left: 10px;
        }
        .description { margin: 10px 0; color: #4b5563; }
        .parameters, .response { 
            background: #f9fafb; 
            padding: 15px; 
            border-radius: 6px; 
            margin: 10px 0; 
            border-left: 4px solid #4f46e5;
        }
        .parameters h4, .response h4 { margin-top: 0; color: #374151; }
        pre { 
            background: #1f2937; 
            color: #e5e7eb; 
            padding: 15px; 
            border-radius: 6px; 
            overflow-x: auto; 
            font-size: 13px;
        }
        .param { margin: 5px 0; }
        .param-name { font-weight: bold; color: #4f46e5; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Burstlet API Documentation</h1>
        <p>AI-powered content creation and distribution platform</p>
        <p><strong>Version:</strong> 0.1.0 | <strong>Base URL:</strong> ${process.env.BACKEND_URL || 'https://api.burstlet.com'}</p>
    </div>

    ${Object.entries(endpointsByCategory).map(([category, categoryEndpoints]) => `
        <div class="category">
            <div class="category-header">${category.charAt(0).toUpperCase() + category.slice(1)}</div>
            ${categoryEndpoints.map(endpoint => `
                <div class="endpoint">
                    <div>
                        <span class="method ${endpoint.method}">${endpoint.method}</span>
                        <span class="path">${endpoint.path}</span>
                        ${endpoint.authentication ? '<span class="auth-required">🔒 Auth Required</span>' : ''}
                    </div>
                    <div class="description">${endpoint.description}</div>
                    ${endpoint.parameters ? `
                        <div class="parameters">
                            <h4>Parameters</h4>
                            ${Object.entries(endpoint.parameters).map(([name, desc]) => 
                                `<div class="param"><span class="param-name">${name}:</span> ${desc}</div>`
                            ).join('')}
                        </div>
                    ` : ''}
                    ${endpoint.response ? `
                        <div class="response">
                            <h4>Example Response</h4>
                            <pre>${JSON.stringify(endpoint.response, null, 2)}</pre>
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    `).join('')}

    <div class="category">
        <div class="category-header">Authentication</div>
        <div class="endpoint">
            <div class="description">
                Most endpoints require authentication. Include the JWT token in the Authorization header:
            </div>
            <pre>Authorization: Bearer YOUR_JWT_TOKEN</pre>
        </div>
    </div>

    <div class="category">
        <div class="category-header">Error Responses</div>
        <div class="endpoint">
            <div class="description">
                All endpoints return consistent error responses:
            </div>
            <pre>{
  "error": "Error message",
  "message": "Detailed error description",
  "timestamp": "2025-01-11T08:00:00.000Z",
  "requestId": "req_123456"
}</pre>
        </div>
    </div>

    <div style="text-align: center; margin-top: 40px; color: #6b7280;">
        <p>Generated automatically by Burstlet API | Last updated: ${new Date().toISOString()}</p>
    </div>
</body>
</html>`;

  return html;
};

export const docsHandler = (req: Request, res: Response) => {
  const html = generateHTML();
  res.set('Content-Type', 'text/html');
  res.send(html);
};

export const openApiHandler = (req: Request, res: Response) => {
  const openApiSpec = {
    openapi: '3.0.0',
    info: {
      title: 'Burstlet API',
      version: '0.1.0',
      description: 'AI-powered content creation and distribution platform',
      contact: {
        name: 'Burstlet Support',
        url: 'https://burstlet.com/support',
      },
    },
    servers: [
      {
        url: process.env.BACKEND_URL || 'https://api.burstlet.com',
        description: 'Production server',
      },
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    paths: {},
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  };

  res.json(openApiSpec);
};