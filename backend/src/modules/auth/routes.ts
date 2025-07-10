import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthController } from './controller';
import { AuthMiddleware } from './middleware';
import {
  SignupSchema,
  LoginSchema,
  RefreshTokenSchema,
  UpdateProfileSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  Enable2FASchema,
  Verify2FASchema
} from './types';

export function createAuthRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const authController = new AuthController(prisma);
  const authMiddleware = new AuthMiddleware(prisma);

  // Public routes (no authentication required)
  router.post('/signup', 
    authMiddleware.corsAuth,
    authMiddleware.validateRequest(SignupSchema),
    authMiddleware.logAuthEvent('signup'),
    authController.signup
  );

  router.post('/login',
    authMiddleware.corsAuth,
    authMiddleware.validateRequest(LoginSchema),
    authMiddleware.rateLimitAuth,
    authMiddleware.logAuthEvent('login'),
    authController.login
  );

  router.post('/refresh',
    authMiddleware.corsAuth,
    authMiddleware.validateRequest(RefreshTokenSchema),
    authMiddleware.logAuthEvent('token_refresh'),
    authController.refresh
  );

  router.post('/forgot-password',
    authMiddleware.corsAuth,
    authMiddleware.validateRequest(ForgotPasswordSchema),
    authController.forgotPassword
  );

  router.post('/reset-password',
    authMiddleware.corsAuth,
    authMiddleware.validateRequest(ResetPasswordSchema),
    authController.resetPassword
  );

  // OAuth routes
  router.get('/oauth/:provider',
    authMiddleware.corsAuth,
    authController.initiateOAuth
  );

  router.get('/oauth/:provider/callback',
    authMiddleware.corsAuth,
    authController.oauthCallback
  );

  // Health check
  router.get('/health',
    authController.health
  );

  // Protected routes (authentication required)
  router.post('/logout',
    authMiddleware.corsAuth,
    authMiddleware.authenticate,
    authMiddleware.logAuthEvent('logout'),
    authController.logout
  );

  router.get('/me',
    authMiddleware.corsAuth,
    authMiddleware.authenticate,
    authController.getMe
  );

  router.put('/profile',
    authMiddleware.corsAuth,
    authMiddleware.authenticate,
    authMiddleware.validateRequest(UpdateProfileSchema),
    authController.updateProfile
  );

  router.get('/providers',
    authMiddleware.corsAuth,
    authMiddleware.authenticate,
    authController.getProviders
  );

  router.delete('/oauth/:providerId',
    authMiddleware.corsAuth,
    authMiddleware.authenticate,
    authController.disconnectProvider
  );

  // 2FA routes
  router.post('/2fa/enable',
    authMiddleware.corsAuth,
    authMiddleware.authenticate,
    authMiddleware.validateRequest(Enable2FASchema),
    authController.enable2FA
  );

  router.post('/2fa/disable',
    authMiddleware.corsAuth,
    authMiddleware.authenticate,
    authController.disable2FA
  );

  router.post('/2fa/verify',
    authMiddleware.corsAuth,
    authMiddleware.authenticate,
    authMiddleware.validateRequest(Verify2FASchema),
    authController.verify2FA
  );

  // Admin-only routes
  router.get('/admin/users',
    authMiddleware.corsAuth,
    authMiddleware.authenticate,
    authMiddleware.requireAdmin,
    // TODO: Add admin user list controller
    (req, res) => res.status(501).json({ error: 'Not implemented yet' })
  );

  router.delete('/admin/users/:userId',
    authMiddleware.corsAuth,
    authMiddleware.authenticate,
    authMiddleware.requireAdmin,
    // TODO: Add admin user deletion controller
    (req, res) => res.status(501).json({ error: 'Not implemented yet' })
  );

  // API key routes for external services
  router.post('/api-key',
    authMiddleware.corsAuth,
    authMiddleware.authenticate,
    authMiddleware.authorize('CREATOR'),
    // TODO: Add API key generation controller
    (req, res) => res.status(501).json({ error: 'Not implemented yet' })
  );

  router.get('/api-key',
    authMiddleware.corsAuth,
    authMiddleware.authenticate,
    authMiddleware.authorize('CREATOR'),
    // TODO: Add API key list controller
    (req, res) => res.status(501).json({ error: 'Not implemented yet' })
  );

  router.delete('/api-key/:keyId',
    authMiddleware.corsAuth,
    authMiddleware.authenticate,
    authMiddleware.authorize('CREATOR'),
    // TODO: Add API key deletion controller
    (req, res) => res.status(501).json({ error: 'Not implemented yet' })
  );

  return router;
}