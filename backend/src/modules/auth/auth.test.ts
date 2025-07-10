import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { AuthService } from './service';
import { AuthError, ValidationError } from './types';

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  session: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  oAuthProvider: {
    findMany: jest.fn(),
    delete: jest.fn(),
  },
  twoFactorAuth: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
} as unknown as PrismaClient;

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService(mockPrisma);
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should create a new user successfully', async () => {
      const signupData = {
        email: 'test@example.com',
        password: 'StrongPassword123!',
        name: 'Test User'
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CREATOR',
        emailVerified: false,
        twoFactorEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        token: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.session.create as jest.Mock).mockResolvedValue(mockSession);

      const result = await authService.signup(signupData, '127.0.0.1');

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('test@example.com');
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          passwordHash: expect.any(String),
          name: 'Test User',
          role: 'CREATOR'
        }
      });
    });

    it('should throw error if user already exists', async () => {
      const signupData = {
        email: 'existing@example.com',
        password: 'StrongPassword123!'
      };

      const existingUser = {
        id: 'user-123',
        email: 'existing@example.com',
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

      await expect(authService.signup(signupData)).rejects.toThrow(AuthError);
      await expect(authService.signup(signupData)).rejects.toThrow('User already exists');
    });

    it('should throw validation error for weak password', async () => {
      const signupData = {
        email: 'test@example.com',
        password: 'weak'
      };

      await expect(authService.signup(signupData)).rejects.toThrow(ValidationError);
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'StrongPassword123!'
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: '$2b$12$hashedPassword',
        role: 'CREATOR',
        emailVerified: true,
        twoFactorEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        token: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.session.create as jest.Mock).mockResolvedValue(mockSession);

      // Mock password verification
      jest.spyOn(require('./utils').PasswordUtils, 'verify').mockResolvedValue(true);

      const result = await authService.login(loginData, '127.0.0.1', 'test-agent');

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw error for invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(authService.login(loginData)).rejects.toThrow(AuthError);
      await expect(authService.login(loginData)).rejects.toThrow('Invalid email or password');
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const refreshToken = 'valid-refresh-token';

      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        token: 'old-access-token',
        refreshToken: 'valid-refresh-token',
        expiresAt: new Date(Date.now() + 3600000),
        user: {
          id: 'user-123',
          email: 'test@example.com',
          role: 'CREATOR'
        }
      };

      const updatedSession = {
        ...mockSession,
        token: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresAt: new Date(Date.now() + 3600000),
      };

      (mockPrisma.session.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (mockPrisma.session.update as jest.Mock).mockResolvedValue(updatedSession);

      const result = await authService.refreshToken(refreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresAt');
    });

    it('should throw error for invalid refresh token', async () => {
      const refreshToken = 'invalid-refresh-token';

      (mockPrisma.session.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(authService.refreshToken(refreshToken)).rejects.toThrow(AuthError);
      await expect(authService.refreshToken(refreshToken)).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user', async () => {
      const userId = 'user-123';
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CREATOR',
        emailVerified: true,
        twoFactorEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.getCurrentUser(userId);

      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw error if user not found', async () => {
      const userId = 'non-existent-user';

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(authService.getCurrentUser(userId)).rejects.toThrow(AuthError);
      await expect(authService.getCurrentUser(userId)).rejects.toThrow('User not found');
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const accessToken = 'valid-access-token';

      (mockPrisma.session.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

      await authService.logout(accessToken);

      expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({
        where: { token: accessToken }
      });
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const userId = 'user-123';
      const updateData = {
        name: 'Updated Name',
        avatarUrl: 'https://example.com/avatar.jpg'
      };

      const updatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Updated Name',
        avatarUrl: 'https://example.com/avatar.jpg',
        role: 'CREATOR',
        emailVerified: true,
        twoFactorEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await authService.updateProfile(userId, updateData);

      expect(result).toHaveProperty('user');
      expect(result.user.name).toBe('Updated Name');
      expect(result.user.avatarUrl).toBe('https://example.com/avatar.jpg');
    });
  });
});