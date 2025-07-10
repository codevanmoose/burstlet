import { PrismaClient } from '@prisma/client';
import { 
  SignupRequest, 
  LoginRequest, 
  AuthResponse, 
  TokenResponse,
  UserResponse,
  OAuthProvidersResponse,
  AuthError,
  ValidationError,
  User,
  Session,
  UpdateProfileRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  Enable2FARequest,
  Verify2FARequest
} from './types';
import {
  PasswordUtils,
  TokenUtils,
  EmailUtils,
  RateLimitUtils,
  TwoFactorUtils,
  EncryptionUtils,
  SessionUtils,
  SanitizationUtils
} from './utils';

export class AuthService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * User registration
   */
  async signup(data: SignupRequest, ipAddress?: string): Promise<AuthResponse> {
    const { email, password, name } = data;

    // Validate input
    const sanitizedEmail = SanitizationUtils.sanitizeEmail(email);
    const sanitizedName = name ? SanitizationUtils.sanitizeName(name) : undefined;

    // Check password strength
    const passwordValidation = PasswordUtils.validateStrength(password);
    if (!passwordValidation.isValid) {
      throw new ValidationError('Password does not meet requirements', 400, passwordValidation.errors);
    }

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: sanitizedEmail }
    });

    if (existingUser) {
      throw new AuthError('User already exists', 409);
    }

    // Hash password
    const passwordHash = await PasswordUtils.hash(password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: sanitizedEmail,
        passwordHash,
        name: sanitizedName,
        role: 'CREATOR'
      }
    });

    // Generate tokens
    const accessToken = TokenUtils.generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role
    });
    const refreshToken = TokenUtils.generateRefreshToken();

    // Create session
    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        token: accessToken,
        refreshToken,
        expiresAt: TokenUtils.getTokenExpiration(),
        ipAddress,
        deviceInfo: SessionUtils.extractDeviceInfo()
      }
    });

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken,
      expiresAt: session.expiresAt
    };
  }

  /**
   * User login
   */
  async login(data: LoginRequest, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const { email, password } = data;

    // Check rate limiting
    if (ipAddress && !RateLimitUtils.checkLoginAttempts(ipAddress)) {
      throw new AuthError('Too many login attempts. Please try again later.', 429);
    }

    // Sanitize input
    const sanitizedEmail = SanitizationUtils.sanitizeEmail(email);

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: sanitizedEmail }
    });

    if (!user || !user.passwordHash) {
      throw new AuthError('Invalid email or password', 401);
    }

    // Verify password
    const isValidPassword = await PasswordUtils.verify(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AuthError('Invalid email or password', 401);
    }

    // Clear rate limit on successful login
    if (ipAddress) {
      RateLimitUtils.clearLoginAttempts(ipAddress);
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate tokens
    const accessToken = TokenUtils.generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role
    });
    const refreshToken = TokenUtils.generateRefreshToken();

    // Create session
    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        token: accessToken,
        refreshToken,
        expiresAt: TokenUtils.getTokenExpiration(),
        ipAddress,
        deviceInfo: SessionUtils.extractDeviceInfo(userAgent)
      }
    });

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken,
      expiresAt: session.expiresAt
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    // Find session with refresh token
    const session = await this.prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true }
    });

    if (!session) {
      throw new AuthError('Invalid refresh token', 401);
    }

    // Check if session is expired
    if (SessionUtils.isSessionExpired(session.expiresAt)) {
      // Clean up expired session
      await this.prisma.session.delete({
        where: { id: session.id }
      });
      throw new AuthError('Session expired', 401);
    }

    // Generate new tokens
    const accessToken = TokenUtils.generateAccessToken({
      sub: session.user.id,
      email: session.user.email,
      role: session.user.role
    });
    const newRefreshToken = TokenUtils.generateRefreshToken();

    // Update session
    const updatedSession = await this.prisma.session.update({
      where: { id: session.id },
      data: {
        token: accessToken,
        refreshToken: newRefreshToken,
        expiresAt: TokenUtils.getTokenExpiration()
      }
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresAt: updatedSession.expiresAt
    };
  }

  /**
   * Logout user
   */
  async logout(accessToken: string): Promise<void> {
    // Find and delete session
    await this.prisma.session.deleteMany({
      where: { token: accessToken }
    });
  }

  /**
   * Get current user
   */
  async getCurrentUser(userId: string): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new AuthError('User not found', 404);
    }

    return {
      user: this.sanitizeUser(user)
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: UpdateProfileRequest): Promise<UserResponse> {
    const sanitizedName = data.name ? SanitizationUtils.sanitizeName(data.name) : undefined;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: sanitizedName,
        avatarUrl: data.avatarUrl
      }
    });

    return {
      user: this.sanitizeUser(user)
    };
  }

  /**
   * Request password reset
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    const { email } = data;
    const sanitizedEmail = SanitizationUtils.sanitizeEmail(email);

    const user = await this.prisma.user.findUnique({
      where: { email: sanitizedEmail }
    });

    if (!user) {
      // Don't reveal if user exists
      return;
    }

    // Generate reset token
    const resetToken = EmailUtils.generatePasswordResetToken();
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    // Store reset token (you'll need to create a PasswordReset model)
    // For now, we'll use a simple in-memory store
    // In production, store this in database with expiration

    // TODO: Send email with reset link
    console.log(`Password reset token for ${email}: ${resetToken}`);
  }

  /**
   * Reset password
   */
  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    const { token, password } = data;

    // Validate password strength
    const passwordValidation = PasswordUtils.validateStrength(password);
    if (!passwordValidation.isValid) {
      throw new ValidationError('Password does not meet requirements', 400, passwordValidation.errors);
    }

    // TODO: Verify reset token from database
    // For now, we'll skip this step

    // Hash new password
    const passwordHash = await PasswordUtils.hash(password);

    // Update user password
    // Note: You'll need to implement token verification
    // await this.prisma.user.update({
    //   where: { /* based on token */ },
    //   data: { passwordHash }
    // });
  }

  /**
   * Get connected OAuth providers
   */
  async getOAuthProviders(userId: string): Promise<OAuthProvidersResponse> {
    const providers = await this.prisma.oAuthProvider.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        accountName: true,
        accountAvatar: true,
        connectedAt: true
      }
    });

    return {
      providers: providers.map(p => ({
        id: p.id,
        provider: p.provider,
        accountName: p.accountName,
        accountAvatar: p.accountAvatar,
        connectedAt: p.connectedAt
      }))
    };
  }

  /**
   * Disconnect OAuth provider
   */
  async disconnectOAuthProvider(userId: string, providerId: string): Promise<void> {
    await this.prisma.oAuthProvider.delete({
      where: {
        id: providerId,
        userId
      }
    });
  }

  /**
   * Enable two-factor authentication
   */
  async enable2FA(userId: string, data: Enable2FARequest): Promise<{ secret: string; backupCodes: string[] }> {
    const { password } = data;

    // Verify current password
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.passwordHash) {
      throw new AuthError('User not found', 404);
    }

    const isValidPassword = await PasswordUtils.verify(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AuthError('Invalid password', 401);
    }

    // Generate 2FA secret and backup codes
    const secret = TwoFactorUtils.generateSecret();
    const backupCodes = TwoFactorUtils.generateBackupCodes();

    // Store in database
    await this.prisma.twoFactorAuth.create({
      data: {
        userId,
        secret: EncryptionUtils.encrypt(secret),
        backupCodes: backupCodes.map(code => EncryptionUtils.encrypt(code))
      }
    });

    // Update user
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true }
    });

    return { secret, backupCodes };
  }

  /**
   * Disable two-factor authentication
   */
  async disable2FA(userId: string): Promise<void> {
    await this.prisma.twoFactorAuth.delete({
      where: { userId }
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false }
    });
  }

  /**
   * Verify 2FA token
   */
  async verify2FA(userId: string, data: Verify2FARequest): Promise<boolean> {
    const { token } = data;

    const twoFactorAuth = await this.prisma.twoFactorAuth.findUnique({
      where: { userId }
    });

    if (!twoFactorAuth) {
      throw new AuthError('Two-factor authentication not enabled', 404);
    }

    const secret = EncryptionUtils.decrypt(twoFactorAuth.secret);
    const isValid = TwoFactorUtils.verifyToken(secret, token);

    if (isValid) {
      await this.prisma.twoFactorAuth.update({
        where: { userId },
        data: { lastUsedAt: new Date() }
      });
    }

    return isValid;
  }

  /**
   * Verify JWT token and get user
   */
  async verifyToken(token: string): Promise<User> {
    const payload = TokenUtils.verifyAccessToken(token);
    
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub }
    });

    if (!user) {
      throw new AuthError('User not found', 404);
    }

    return user;
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
    await this.prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });
  }

  /**
   * Remove sensitive data from user object
   */
  private sanitizeUser(user: any): Omit<User, 'passwordHash'> {
    const { passwordHash, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}