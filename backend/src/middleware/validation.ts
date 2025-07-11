import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Request ID middleware for tracking
export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string || uuidv4();
  req.headers['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);
  next();
};

// Input validation middleware factory
export const validateInput = (schema: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }

      // Validate query parameters
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }

      // Validate URL parameters
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            received: err.received,
          })),
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'],
        });
      }
      next(error);
    }
  };
};

// Common validation schemas
export const commonSchemas = {
  pagination: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),

  id: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),

  dateRange: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),

  email: z.string().email('Invalid email format').toLowerCase(),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),

  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters'),

  url: z.string().url('Invalid URL format'),

  slug: z.string()
    .min(1, 'Slug is required')
    .max(100, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
};

// API Key validation middleware
export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'API Key Required',
      message: 'X-API-Key header is required for this endpoint',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'],
    });
  }

  // Validate API key format (basic validation)
  if (!/^blt_[a-zA-Z0-9]{32}$/.test(apiKey)) {
    return res.status(401).json({
      error: 'Invalid API Key',
      message: 'API key format is invalid',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'],
    });
  }

  // TODO: Validate against database
  // For now, accept all properly formatted keys
  next();
};

// Content type validation
export const validateContentType = (allowedTypes: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentType = req.headers['content-type'];
    
    if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
      return res.status(415).json({
        error: 'Unsupported Media Type',
        message: `Content-Type must be one of: ${allowedTypes.join(', ')}`,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'],
      });
    }
    
    next();
  };
};

// File upload validation
export const validateFileUpload = (options: {
  maxSize?: number;
  allowedTypes?: string[];
  required?: boolean;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const files = req.files as Express.Multer.File[] | undefined;
    const file = req.file;
    
    if (options.required && !file && !files?.length) {
      return res.status(400).json({
        error: 'File Required',
        message: 'A file upload is required for this endpoint',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'],
      });
    }

    const validateFile = (uploadedFile: Express.Multer.File) => {
      // Check file size
      if (options.maxSize && uploadedFile.size > options.maxSize) {
        throw new Error(`File size exceeds maximum allowed size of ${options.maxSize} bytes`);
      }

      // Check file type
      if (options.allowedTypes && !options.allowedTypes.includes(uploadedFile.mimetype)) {
        throw new Error(`File type ${uploadedFile.mimetype} is not allowed`);
      }
    };

    try {
      if (file) {
        validateFile(file);
      }
      
      if (files) {
        files.forEach(validateFile);
      }
      
      next();
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid File',
        message: error instanceof Error ? error.message : 'File validation failed',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'],
      });
    }
  };
};

// Rate limiting by user
export const userRateLimit = (options: {
  windowMs: number;
  maxRequests: number;
}) => {
  const userRequests = new Map<string, { count: number; resetTime: number }>();
  
  return (req: Request, res: Response, next: NextFunction) => {
    // TODO: Get user ID from JWT token
    const userId = req.headers['user-id'] as string || req.ip;
    const now = Date.now();
    const windowStart = now - options.windowMs;
    
    // Clean up old entries
    for (const [key, value] of userRequests.entries()) {
      if (value.resetTime < windowStart) {
        userRequests.delete(key);
      }
    }
    
    const userRequestData = userRequests.get(userId);
    
    if (!userRequestData) {
      userRequests.set(userId, { count: 1, resetTime: now + options.windowMs });
      return next();
    }
    
    if (userRequestData.count >= options.maxRequests) {
      return res.status(429).json({
        error: 'Rate Limit Exceeded',
        message: `Too many requests. Limit: ${options.maxRequests} per ${options.windowMs}ms`,
        retryAfter: Math.ceil((userRequestData.resetTime - now) / 1000),
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'],
      });
    }
    
    userRequestData.count++;
    next();
  };
};