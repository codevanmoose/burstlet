import { apiClient } from './client';
import { z } from 'zod';

// Schemas
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const ResetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

// Types
export type LoginRequest = z.infer<typeof LoginSchema>;
export type RegisterRequest = z.infer<typeof RegisterSchema>;
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordRequest = z.infer<typeof ResetPasswordSchema>;

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
    role: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role: string;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

// API functions
export const authApi = {
  /**
   * Login with email and password
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    return apiClient.post('/auth/login', data);
  },

  /**
   * Register new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    return apiClient.post('/auth/register', data);
  },

  /**
   * Logout
   */
  async logout(): Promise<void> {
    return apiClient.post('/auth/logout');
  },

  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    return apiClient.get('/auth/profile');
  },

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    return apiClient.patch('/auth/profile', data);
  },

  /**
   * Request password reset
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
    return apiClient.post('/auth/forgot-password', data);
  },

  /**
   * Reset password with token
   */
  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    return apiClient.post('/auth/reset-password', data);
  },

  /**
   * Change password
   */
  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
    return apiClient.post('/auth/change-password', data);
  },

  /**
   * Enable two-factor authentication
   */
  async enableTwoFactor(): Promise<{ qrCode: string; secret: string }> {
    return apiClient.post('/auth/2fa/enable');
  },

  /**
   * Disable two-factor authentication
   */
  async disableTwoFactor(code: string): Promise<{ message: string }> {
    return apiClient.post('/auth/2fa/disable', { code });
  },

  /**
   * Verify two-factor code
   */
  async verifyTwoFactor(code: string): Promise<AuthResponse> {
    return apiClient.post('/auth/2fa/verify', { code });
  },

  /**
   * Delete account
   */
  async deleteAccount(password: string): Promise<{ message: string }> {
    return apiClient.delete('/auth/account', { data: { password } });
  },
};