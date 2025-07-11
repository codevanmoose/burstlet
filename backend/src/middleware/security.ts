import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://js.stripe.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https://api.stripe.com; " +
    "frame-src https://js.stripe.com; " +
    "object-src 'none'; " +
    "base-uri 'self';"
  );

  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Remove server identification
  res.removeHeader('X-Powered-By');
  
  next();
};

// CSRF protection middleware
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Skip for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const token = req.headers['x-csrf-token'] as string;
  const sessionToken = req.headers['x-session-token'] as string;

  if (!token) {
    return res.status(403).json({
      error: 'CSRF Token Missing',
      message: 'X-CSRF-Token header is required',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'],
    });
  }

  // TODO: Validate CSRF token against session
  // For now, basic validation
  if (token.length < 32) {
    return res.status(403).json({
      error: 'Invalid CSRF Token',
      message: 'CSRF token is invalid',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'],
    });
  }

  next();
};

// IP allowlist middleware
export const ipAllowlist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (!clientIP || !allowedIPs.includes(clientIP)) {
      return res.status(403).json({
        error: 'IP Not Allowed',
        message: 'Your IP address is not authorized to access this resource',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'],
      });
    }
    
    next();
  };
};

// Webhook signature validation
export const validateWebhookSignature = (secret: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const signature = req.headers['stripe-signature'] as string;
    const webhookSecret = secret;
    
    if (!signature) {
      return res.status(400).json({
        error: 'Missing Signature',
        message: 'Webhook signature is required',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'],
      });
    }

    try {
      // Extract timestamp and signature from header
      const elements = signature.split(',');
      const timestamp = elements.find(el => el.startsWith('t='))?.substring(2);
      const sig = elements.find(el => el.startsWith('v1='))?.substring(3);

      if (!timestamp || !sig) {
        throw new Error('Invalid signature format');
      }

      // Create expected signature
      const payload = timestamp + '.' + req.body;
      const expectedSig = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload, 'utf8')
        .digest('hex');

      // Compare signatures
      if (!crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expectedSig, 'hex'))) {
        throw new Error('Signature mismatch');
      }

      // Check timestamp (prevent replay attacks)
      const webhookTimestamp = parseInt(timestamp, 10);
      const tolerance = 300; // 5 minutes
      const currentTime = Math.floor(Date.now() / 1000);

      if (currentTime - webhookTimestamp > tolerance) {
        throw new Error('Timestamp too old');
      }

      next();
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid Webhook Signature',
        message: error instanceof Error ? error.message : 'Signature validation failed',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'],
      });
    }
  };
};

// API versioning middleware
export const apiVersioning = (req: Request, res: Response, next: NextFunction) => {
  const acceptedVersion = req.headers['api-version'] as string || '1.0';
  const supportedVersions = ['1.0'];

  if (!supportedVersions.includes(acceptedVersion)) {
    return res.status(400).json({
      error: 'Unsupported API Version',
      message: `API version ${acceptedVersion} is not supported`,
      supportedVersions,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'],
    });
  }

  // Set version in request for use in handlers
  req.apiVersion = acceptedVersion;
  res.setHeader('API-Version', acceptedVersion);
  
  next();
};

// Maintenance mode middleware
export const maintenanceMode = (req: Request, res: Response, next: NextFunction) => {
  const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';
  const isHealthCheck = req.path === '/health' || req.path === '/ready';
  const isAdmin = req.headers['x-admin-override'] === process.env.ADMIN_OVERRIDE_TOKEN;

  if (isMaintenanceMode && !isHealthCheck && !isAdmin) {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'The service is currently under maintenance. Please try again later.',
      estimatedDowntime: process.env.MAINTENANCE_ESTIMATED_END || 'Unknown',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'],
    });
  }

  next();
};

// Request size validation
export const validateRequestSize = (maxSize: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    
    if (contentLength > maxSize) {
      return res.status(413).json({
        error: 'Request Too Large',
        message: `Request size exceeds maximum allowed size of ${maxSize} bytes`,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'],
      });
    }
    
    next();
  };
};

// Slow request detection
export const slowRequestDetection = (thresholdMs: number = 5000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      if (duration > thresholdMs) {
        console.warn('Slow request detected:', {
          method: req.method,
          url: req.originalUrl,
          duration: `${duration}ms`,
          ip: req.ip,
          userAgent: req.get('user-agent'),
          requestId: req.headers['x-request-id'],
        });
      }
    });
    
    next();
  };
};