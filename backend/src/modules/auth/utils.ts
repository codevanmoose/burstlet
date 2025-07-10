import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { JWTPayload, AuthError } from './types';

// Password hashing utilities
export class PasswordUtils {
  private static readonly SALT_ROUNDS = 12;

  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  static async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static validateStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// JWT token utilities
export class TokenUtils {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private static readonly JWT_EXPIRES_IN = '1h';
  private static readonly REFRESH_TOKEN_EXPIRES_IN = '30d';

  static generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    });
  }

  static generateRefreshToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static verifyAccessToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.JWT_SECRET) as JWTPayload;
    } catch (error) {
      throw new AuthError('Invalid or expired token', 401);
    }
  }

  static getTokenExpiration(): Date {
    const now = new Date();
    now.setHours(now.getHours() + 1); // 1 hour from now
    return now;
  }

  static getRefreshTokenExpiration(): Date {
    const now = new Date();
    now.setDate(now.getDate() + 30); // 30 days from now
    return now;
  }
}

// Email utilities
export class EmailUtils {
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  static generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static generatePasswordResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

// Rate limiting utilities
export class RateLimitUtils {
  private static attempts: Map<string, { count: number; resetTime: number }> = new Map();

  static checkLoginAttempts(ip: string): boolean {
    const key = `login:${ip}`;
    const now = Date.now();
    const attempt = this.attempts.get(key);

    if (!attempt) {
      this.attempts.set(key, { count: 1, resetTime: now + 15 * 60 * 1000 }); // 15 minutes
      return true;
    }

    if (now > attempt.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + 15 * 60 * 1000 });
      return true;
    }

    if (attempt.count >= 5) {
      return false;
    }

    attempt.count++;
    return true;
  }

  static clearLoginAttempts(ip: string): void {
    const key = `login:${ip}`;
    this.attempts.delete(key);
  }
}

// 2FA utilities
export class TwoFactorUtils {
  static generateSecret(): string {
    return crypto.randomBytes(16).toString('base32');
  }

  static generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  static verifyToken(secret: string, token: string): boolean {
    // This is a simplified implementation
    // In production, use a proper TOTP library like 'speakeasy'
    const window = 30; // 30 second window
    const now = Math.floor(Date.now() / 1000 / window);
    
    // Check current window and previous/next window for time drift
    for (let i = -1; i <= 1; i++) {
      const testTime = now + i;
      const testToken = this.generateTOTP(secret, testTime);
      if (testToken === token) {
        return true;
      }
    }
    
    return false;
  }

  private static generateTOTP(secret: string, time: number): string {
    // Simplified TOTP implementation
    // In production, use a proper library
    const hash = crypto.createHmac('sha1', secret)
      .update(Buffer.from(time.toString()))
      .digest();
    
    const offset = hash[hash.length - 1] & 0x0f;
    const code = ((hash[offset] & 0x7f) << 24) |
                 ((hash[offset + 1] & 0xff) << 16) |
                 ((hash[offset + 2] & 0xff) << 8) |
                 (hash[offset + 3] & 0xff);
    
    return (code % 1000000).toString().padStart(6, '0');
  }
}

// Encryption utilities for sensitive data
export class EncryptionUtils {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-encryption-key-32-chars!!!';

  static encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.ALGORITHM, this.ENCRYPTION_KEY);
    cipher.setAAD(iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  static decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipher(this.ALGORITHM, this.ENCRYPTION_KEY);
    decipher.setAAD(iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

// Session utilities
export class SessionUtils {
  static generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static extractDeviceInfo(userAgent?: string): any {
    if (!userAgent) return null;

    // Simple user agent parsing
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    const browser = userAgent.match(/(Chrome|Firefox|Safari|Edge)/)?.[1] || 'Unknown';
    const os = userAgent.match(/(Windows|Mac|Linux|Android|iOS)/)?.[1] || 'Unknown';

    return {
      isMobile,
      browser,
      os,
      userAgent,
    };
  }

  static isSessionExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }
}

// Input sanitization utilities
export class SanitizationUtils {
  static sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }

  static sanitizeEmail(email: string): string {
    return EmailUtils.normalizeEmail(email);
  }

  static sanitizeName(name: string): string {
    return name.trim().replace(/[<>]/g, '').substring(0, 100);
  }
}