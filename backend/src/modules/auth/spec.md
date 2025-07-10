# Authentication Module Specification

## Overview
The authentication module provides secure user authentication, authorization, and session management for the Burstlet platform. It supports email/password authentication, OAuth integrations, two-factor authentication, and JWT-based session management.

## Van Moose Compliance
- ✅ **File Size**: All files under 500 lines
- ✅ **Module Isolation**: Self-contained with clear boundaries
- ✅ **Agent-First**: RESTful APIs with comprehensive error handling
- ✅ **KISS Principle**: Simple, focused functionality
- ✅ **Security First**: Comprehensive input validation and sanitization

## Architecture

### Components
1. **AuthService** (`service.ts`) - Core business logic
2. **AuthController** (`controller.ts`) - HTTP request handlers
3. **AuthMiddleware** (`middleware.ts`) - Authentication/authorization middleware
4. **AuthRoutes** (`routes.ts`) - Route definitions and middleware composition
5. **AuthModule** (`module.ts`) - Module initialization and lifecycle
6. **Types** (`types.ts`) - TypeScript interfaces and Zod schemas
7. **Utils** (`utils.ts`) - Utility functions for crypto, validation, etc.

### Dependencies
- **Internal**: None (base module)
- **External**: Prisma, bcrypt, jsonwebtoken, zod

## API Endpoints

### Public Endpoints
```
POST /api/v1/auth/signup          - User registration
POST /api/v1/auth/login           - User login
POST /api/v1/auth/refresh         - Refresh access token
POST /api/v1/auth/forgot-password - Request password reset
POST /api/v1/auth/reset-password  - Reset password with token
GET  /api/v1/auth/health          - Health check
GET  /api/v1/auth/oauth/:provider - Initiate OAuth flow
GET  /api/v1/auth/oauth/:provider/callback - OAuth callback
```

### Protected Endpoints
```
POST /api/v1/auth/logout          - User logout
GET  /api/v1/auth/me              - Get current user
PUT  /api/v1/auth/profile         - Update user profile
GET  /api/v1/auth/providers       - Get connected OAuth providers
DELETE /api/v1/auth/oauth/:id     - Disconnect OAuth provider
POST /api/v1/auth/2fa/enable      - Enable 2FA
POST /api/v1/auth/2fa/disable     - Disable 2FA
POST /api/v1/auth/2fa/verify      - Verify 2FA token
```

### Admin Endpoints
```
GET    /api/v1/auth/admin/users     - List all users
DELETE /api/v1/auth/admin/users/:id - Delete user
```

## Features

### Core Authentication
- Email/password registration and login
- Password strength validation
- Secure password hashing with bcrypt
- JWT-based access tokens
- Refresh token rotation
- Session management

### OAuth Integration
- Google OAuth for general authentication
- Platform-specific OAuth (YouTube, TikTok, Instagram, Twitter)
- Token storage and refresh handling
- Account linking and unlinking

### Security Features
- Two-factor authentication (TOTP)
- Rate limiting for login attempts
- Input sanitization and validation
- CORS handling
- IP address tracking
- Device fingerprinting

### Session Management
- Secure session creation and validation
- Automatic session cleanup
- Multi-device support
- Session revocation

## Database Schema

### Users Table
```sql
id              String   @id @default(cuid())
email           String   @unique
passwordHash    String?
name            String?
avatarUrl       String?
role            Role     @default(CREATOR)
emailVerified   Boolean  @default(false)
twoFactorEnabled Boolean @default(false)
createdAt       DateTime @default(now())
updatedAt       DateTime @updatedAt
lastLoginAt     DateTime?
```

### Sessions Table
```sql
id            String   @id @default(cuid())
userId        String
token         String   @unique
refreshToken  String   @unique
expiresAt     DateTime
deviceInfo    Json?
ipAddress     String?
createdAt     DateTime @default(now())
updatedAt     DateTime @updatedAt
```

### OAuth Providers Table
```sql
id              String   @id @default(cuid())
userId          String
provider        Platform
providerUserId  String
accessToken     String
refreshToken    String?
tokenExpiresAt  DateTime?
scope           String[]
accountName     String
accountAvatar   String?
connectedAt     DateTime @default(now())
updatedAt       DateTime @updatedAt
```

### Two Factor Auth Table
```sql
id          String   @id @default(cuid())
userId      String   @unique
secret      String
backupCodes String[]
lastUsedAt  DateTime?
createdAt   DateTime @default(now())
updatedAt   DateTime @updatedAt
```

## Security Considerations

### Password Security
- Minimum 8 characters with complexity requirements
- bcrypt hashing with 12 salt rounds
- Password strength validation
- Secure password reset flow

### Token Security
- JWT with short expiration (1 hour)
- Refresh tokens with rotation
- Secure token storage recommendations
- Token revocation on logout

### Rate Limiting
- Login attempt limiting by IP
- Configurable rate limits
- Automatic lockout and unlock

### Input Validation
- Zod schema validation
- Email format validation
- XSS prevention through sanitization
- SQL injection prevention through Prisma

### OAuth Security
- State parameter validation
- PKCE for public clients
- Secure token storage
- Scope validation

## Error Handling

### Error Types
- `AuthError` - Authentication failures
- `ValidationError` - Input validation failures
- Database errors - Connection and query failures

### Error Responses
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {} // Optional additional details
}
```

## Testing Strategy

### Unit Tests
- Service layer functionality
- Utility function validation
- Error handling scenarios
- Edge cases and boundary conditions

### Integration Tests
- API endpoint testing
- Database interaction testing
- OAuth flow testing
- Session management testing

### Security Tests
- Authentication bypass attempts
- Authorization validation
- Input validation testing
- Rate limiting verification

## Performance Considerations

### Optimization
- Password hashing optimization
- Token validation caching
- Session cleanup automation
- Database query optimization

### Monitoring
- Login success/failure rates
- Session duration metrics
- OAuth connection health
- Database performance metrics

## Configuration

### Environment Variables
```
JWT_SECRET=your-jwt-secret-key
ENCRYPTION_KEY=your-encryption-key-32-chars
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
YOUTUBE_CLIENT_ID=your-youtube-client-id
YOUTUBE_CLIENT_SECRET=your-youtube-client-secret
FRONTEND_URL=http://localhost:3000
```

### Module Configuration
```typescript
interface AuthModuleConfig {
  prefix?: string;           // Default: '/api/v1/auth'
  enableRateLimit?: boolean; // Default: true
  enableLogging?: boolean;   // Default: true
}
```

## Future Enhancements

### Planned Features
- WebAuthn/FIDO2 support
- Magic link authentication
- Social login providers (GitHub, LinkedIn)
- Advanced session analytics
- Audit logging

### Scalability Improvements
- Redis session storage
- Distributed rate limiting
- Horizontal scaling support
- CDN integration for static assets

## Integration Points

### Frontend Integration
- React authentication hooks
- Token management utilities
- OAuth redirect handling
- Error state management

### Other Modules
- User profile management
- Content generation permissions
- Platform integration authorization
- Admin panel authentication

## Compliance

### Standards
- OAuth 2.0 / OpenID Connect
- JWT (RFC 7519)
- TOTP (RFC 6238)
- PKCE (RFC 7636)

### Privacy
- GDPR compliance ready
- Data minimization
- User consent management
- Right to be forgotten support