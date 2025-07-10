import { z } from 'zod';

// User types
export interface User {
  id: string;
  email: string;
  passwordHash?: string;
  name?: string;
  avatarUrl?: string;
  role: 'CREATOR' | 'ADMIN';
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  deviceInfo?: any;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OAuthProvider {
  id: string;
  userId: string;
  provider: 'YOUTUBE' | 'TIKTOK' | 'INSTAGRAM' | 'TWITTER';
  providerUserId: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  scope: string[];
  accountName: string;
  accountAvatar?: string;
  connectedAt: Date;
  updatedAt: Date;
}

// Request/Response schemas
export const SignupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const UpdateProfileSchema = z.object({
  name: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const Enable2FASchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export const Verify2FASchema = z.object({
  token: z.string().length(6, 'Token must be 6 digits'),
});

// API Response types
export interface AuthResponse {
  user: Omit<User, 'passwordHash'>;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface UserResponse {
  user: Omit<User, 'passwordHash'>;
}

export interface OAuthProvidersResponse {
  providers: Array<{
    id: string;
    provider: string;
    accountName: string;
    accountAvatar?: string;
    connectedAt: Date;
  }>;
}

// JWT payload interface
export interface JWTPayload {
  sub: string; // userId
  email: string;
  role: 'CREATOR' | 'ADMIN';
  iat: number;
  exp: number;
}

// Error types
export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401,
    public code?: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public errors?: any[]
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// OAuth configuration
export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
}

export interface OAuthProviderConfig {
  [key: string]: OAuthConfig;
}

export type SignupRequest = z.infer<typeof SignupSchema>;
export type LoginRequest = z.infer<typeof LoginSchema>;
export type RefreshTokenRequest = z.infer<typeof RefreshTokenSchema>;
export type UpdateProfileRequest = z.infer<typeof UpdateProfileSchema>;
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordRequest = z.infer<typeof ResetPasswordSchema>;
export type Enable2FARequest = z.infer<typeof Enable2FASchema>;
export type Verify2FARequest = z.infer<typeof Verify2FASchema>;