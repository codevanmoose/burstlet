import { Request, Response } from 'express';
import { AuthService } from './service';
import { AuthError, ValidationError } from './types';
import { PrismaClient } from '@prisma/client';

export class AuthController {
  private authService: AuthService;

  constructor(prisma: PrismaClient) {
    this.authService = new AuthService(prisma);
  }

  /**
   * User signup
   * POST /api/v1/auth/signup
   */
  signup = async (req: Request, res: Response) => {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress;
      const result = await this.authService.signup(req.body, ipAddress);
      
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: result
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * User login
   * POST /api/v1/auth/login
   */
  login = async (req: Request, res: Response) => {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');
      
      const result = await this.authService.login(req.body, ipAddress, userAgent);
      
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   */
  refresh = async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;
      const result = await this.authService.refreshToken(refreshToken);
      
      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: result
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * User logout
   * POST /api/v1/auth/logout
   */
  logout = async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(' ')[1];
      
      if (token) {
        await this.authService.logout(token);
      }
      
      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get current user
   * GET /api/v1/auth/me
   */
  getMe = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const result = await this.authService.getCurrentUser(req.user.id);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Update user profile
   * PUT /api/v1/auth/profile
   */
  updateProfile = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const result = await this.authService.updateProfile(req.user.id, req.body);
      
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: result
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Request password reset
   * POST /api/v1/auth/forgot-password
   */
  forgotPassword = async (req: Request, res: Response) => {
    try {
      await this.authService.forgotPassword(req.body);
      
      res.status(200).json({
        success: true,
        message: 'Password reset email sent (if account exists)'
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Reset password
   * POST /api/v1/auth/reset-password
   */
  resetPassword = async (req: Request, res: Response) => {
    try {
      await this.authService.resetPassword(req.body);
      
      res.status(200).json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get OAuth providers
   * GET /api/v1/auth/providers
   */
  getProviders = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const result = await this.authService.getOAuthProviders(req.user.id);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Disconnect OAuth provider
   * DELETE /api/v1/auth/oauth/{provider}
   */
  disconnectProvider = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const { providerId } = req.params;
      await this.authService.disconnectOAuthProvider(req.user.id, providerId);
      
      res.status(200).json({
        success: true,
        message: 'Provider disconnected successfully'
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Enable two-factor authentication
   * POST /api/v1/auth/2fa/enable
   */
  enable2FA = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const result = await this.authService.enable2FA(req.user.id, req.body);
      
      res.status(200).json({
        success: true,
        message: 'Two-factor authentication enabled',
        data: result
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Disable two-factor authentication
   * POST /api/v1/auth/2fa/disable
   */
  disable2FA = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      await this.authService.disable2FA(req.user.id);
      
      res.status(200).json({
        success: true,
        message: 'Two-factor authentication disabled'
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Verify 2FA token
   * POST /api/v1/auth/2fa/verify
   */
  verify2FA = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const result = await this.authService.verify2FA(req.user.id, req.body);
      
      res.status(200).json({
        success: true,
        message: 'Two-factor authentication verified',
        data: { valid: result }
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * OAuth initiation endpoint
   * GET /api/v1/auth/oauth/{provider}
   */
  initiateOAuth = async (req: Request, res: Response) => {
    try {
      const { provider } = req.params;
      
      // TODO: Implement OAuth initiation logic
      // This will redirect to the OAuth provider
      
      const oauthUrls = {
        google: `https://accounts.google.com/oauth/authorize?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&response_type=code&scope=openid email profile`,
        youtube: `https://accounts.google.com/oauth/authorize?client_id=${process.env.YOUTUBE_CLIENT_ID}&redirect_uri=${process.env.YOUTUBE_REDIRECT_URI}&response_type=code&scope=https://www.googleapis.com/auth/youtube.upload`,
        // Add other providers...
      };

      const authUrl = oauthUrls[provider as keyof typeof oauthUrls];
      
      if (!authUrl) {
        return res.status(400).json({
          success: false,
          error: 'Unsupported OAuth provider'
        });
      }

      res.redirect(authUrl);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * OAuth callback endpoint
   * GET /api/v1/auth/oauth/{provider}/callback
   */
  oauthCallback = async (req: Request, res: Response) => {
    try {
      const { provider } = req.params;
      const { code, error } = req.query;

      if (error) {
        return res.status(400).json({
          success: false,
          error: `OAuth error: ${error}`
        });
      }

      if (!code) {
        return res.status(400).json({
          success: false,
          error: 'Authorization code missing'
        });
      }

      // TODO: Implement OAuth callback logic
      // This will exchange the code for tokens and create/update user
      
      res.status(200).json({
        success: true,
        message: 'OAuth callback received',
        data: { provider, code }
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Health check endpoint
   * GET /api/v1/auth/health
   */
  health = async (req: Request, res: Response) => {
    try {
      res.status(200).json({
        success: true,
        message: 'Auth service is healthy',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Error handler
   */
  private handleError(error: any, res: Response) {
    console.error('Auth error:', error);

    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }

    if (error instanceof ValidationError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
        details: error.errors
      });
    }

    // Default error response
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
}