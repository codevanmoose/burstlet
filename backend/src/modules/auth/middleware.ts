import { Request, Response, NextFunction } from 'express';
import { AuthService } from './service';
import { AuthError } from './types';
import { PrismaClient } from '@prisma/client';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: 'CREATOR' | 'ADMIN';
      };
    }
  }
}

export class AuthMiddleware {
  private authService: AuthService;

  constructor(prisma: PrismaClient) {
    this.authService = new AuthService(prisma);
  }

  /**
   * Middleware to authenticate JWT tokens
   */
  authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return res.status(401).json({
          error: 'Authorization header missing',
          code: 'MISSING_AUTH_HEADER'
        });
      }

      const token = authHeader.split(' ')[1]; // Bearer <token>
      
      if (!token) {
        return res.status(401).json({
          error: 'Token missing from authorization header',
          code: 'MISSING_TOKEN'
        });
      }

      // Verify token and get user
      const user = await this.authService.verifyToken(token);
      
      // Attach user to request
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role
      };

      next();
    } catch (error) {
      if (error instanceof AuthError) {
        return res.status(error.statusCode).json({
          error: error.message,
          code: error.code
        });
      }

      return res.status(401).json({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }
  };

  /**
   * Middleware to check if user has required role
   */
  authorize = (requiredRole: 'CREATOR' | 'ADMIN') => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'User not authenticated',
          code: 'NOT_AUTHENTICATED'
        });
      }

      if (req.user.role !== requiredRole && req.user.role !== 'ADMIN') {
        return res.status(403).json({
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      next();
    };
  };

  /**
   * Middleware to check if user is admin
   */
  requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'User not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Admin access required',
        code: 'ADMIN_REQUIRED'
      });
    }

    next();
  };

  /**
   * Optional authentication middleware
   * Sets req.user if token is valid, but doesn't fail if missing
   */
  optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return next();
      }

      const token = authHeader.split(' ')[1];
      
      if (!token) {
        return next();
      }

      // Verify token and get user
      const user = await this.authService.verifyToken(token);
      
      // Attach user to request
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role
      };

      next();
    } catch (error) {
      // Continue without authentication if token is invalid
      next();
    }
  };

  /**
   * Rate limiting middleware for authentication endpoints
   */
  rateLimitAuth = (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    
    // Store IP and user agent for rate limiting
    req.clientInfo = {
      ip,
      userAgent
    };

    next();
  };

  /**
   * Middleware to log authentication events
   */
  logAuthEvent = (eventType: 'login' | 'logout' | 'signup' | 'token_refresh') => {
    return (req: Request, res: Response, next: NextFunction) => {
      const originalSend = res.send;
      
      res.send = function(data) {
        const statusCode = res.statusCode;
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent');
        
        // Log the event
        console.log(`[AUTH] ${eventType.toUpperCase()} - ${statusCode} - ${ip} - ${userAgent}`);
        
        // Log success/failure
        if (statusCode >= 200 && statusCode < 300) {
          console.log(`[AUTH] ${eventType.toUpperCase()} successful for ${req.body?.email || req.user?.email || 'unknown'}`);
        } else {
          console.log(`[AUTH] ${eventType.toUpperCase()} failed: ${data}`);
        }
        
        return originalSend.call(this, data);
      };

      next();
    };
  };

  /**
   * Middleware to validate request body against schema
   */
  validateRequest = (schema: any) => {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const validatedData = schema.parse(req.body);
        req.body = validatedData;
        next();
      } catch (error: any) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors || error.message
        });
      }
    };
  };

  /**
   * Middleware to handle CORS for auth endpoints
   */
  corsAuth = (req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }

    next();
  };

  /**
   * Middleware to extract and validate API key for external services
   */
  validateApiKey = (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({
        error: 'API key required',
        code: 'MISSING_API_KEY'
      });
    }

    // Validate API key format
    if (typeof apiKey !== 'string' || apiKey.length < 32) {
      return res.status(401).json({
        error: 'Invalid API key format',
        code: 'INVALID_API_KEY'
      });
    }

    // TODO: Validate against database
    // For now, just check if it's a valid format
    next();
  };
}

// Extend Request type for client info
declare global {
  namespace Express {
    interface Request {
      clientInfo?: {
        ip: string;
        userAgent: string;
      };
    }
  }
}