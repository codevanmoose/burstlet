# MODULE: Authentication

## Purpose
Handles user authentication, OAuth integrations with social media platforms, session management, and authorization for the Burstlet platform.

## Features
- User registration and login with email/password
- OAuth integration with Google, YouTube, TikTok, Instagram, Twitter
- JWT-based session management
- Role-based access control (Admin, Creator)
- Two-factor authentication (optional)
- Password reset functionality
- Account linking and unlinking
- Session refresh and management

## User Stories
- As a user, I want to sign up with my email so that I can create an account
- As a user, I want to login with OAuth providers so that I can connect my social accounts
- As a user, I want to link multiple social accounts so that I can publish to all platforms
- As a user, I want to reset my password so that I can regain access to my account
- As a creator, I want to manage my connected accounts so that I can control publishing permissions
- As an admin, I want to manage user accounts so that I can moderate the platform

## Data Models
```yaml
User:
  id: uuid (PK)
  email: string (unique)
  password_hash: string (nullable - OAuth users)
  name: string
  avatar_url: string (nullable)
  role: enum (creator, admin)
  email_verified: boolean
  two_factor_enabled: boolean
  created_at: timestamp
  updated_at: timestamp
  last_login_at: timestamp (nullable)

Session:
  id: uuid (PK)
  user_id: uuid (FK -> User.id)
  token: string (unique)
  refresh_token: string (unique)
  expires_at: timestamp
  device_info: jsonb (nullable)
  ip_address: string (nullable)
  created_at: timestamp
  updated_at: timestamp

OAuthProvider:
  id: uuid (PK)
  user_id: uuid (FK -> User.id)
  provider: enum (google, youtube, tiktok, instagram, twitter)
  provider_user_id: string
  access_token: string (encrypted)
  refresh_token: string (encrypted, nullable)
  token_expires_at: timestamp (nullable)
  scope: string[]
  account_name: string
  account_avatar: string (nullable)
  connected_at: timestamp
  updated_at: timestamp

TwoFactorAuth:
  id: uuid (PK)
  user_id: uuid (FK -> User.id)
  secret: string (encrypted)
  backup_codes: string[] (encrypted)
  enabled_at: timestamp
  last_used_at: timestamp (nullable)
```

## API Endpoints
| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | /api/v1/auth/signup | Create new user account | No |
| POST | /api/v1/auth/login | Authenticate user with email/password | No |
| POST | /api/v1/auth/logout | End current session | Yes |
| POST | /api/v1/auth/refresh | Refresh access token | Yes |
| GET | /api/v1/auth/me | Get current user info | Yes |
| PUT | /api/v1/auth/profile | Update user profile | Yes |
| POST | /api/v1/auth/forgot-password | Request password reset | No |
| POST | /api/v1/auth/reset-password | Reset password with token | No |
| GET | /api/v1/auth/providers | List connected OAuth providers | Yes |
| GET | /api/v1/auth/oauth/{provider} | Initiate OAuth flow | No |
| GET | /api/v1/auth/oauth/{provider}/callback | OAuth callback handler | No |
| DELETE | /api/v1/auth/oauth/{provider} | Disconnect OAuth provider | Yes |
| POST | /api/v1/auth/2fa/enable | Enable two-factor authentication | Yes |
| POST | /api/v1/auth/2fa/disable | Disable two-factor authentication | Yes |
| POST | /api/v1/auth/2fa/verify | Verify 2FA code | Yes |

## Dependencies
- Internal: None (foundational module)
- External: 
  - bcrypt (password hashing)
  - jsonwebtoken (JWT tokens)
  - crypto (token generation)
  - speakeasy (2FA)
  - Supabase Auth (authentication backend)
  - OAuth libraries for each platform

## Success Criteria
- [ ] Users can register with email and password
- [ ] Users can login with email/password and OAuth
- [ ] JWT tokens are generated and validated correctly
- [ ] OAuth flows work for all supported platforms
- [ ] Password reset functionality works via email
- [ ] Sessions are managed securely with refresh tokens
- [ ] Two-factor authentication can be enabled/disabled
- [ ] Users can connect/disconnect multiple social accounts
- [ ] All passwords are hashed with bcrypt (min 12 rounds)
- [ ] API endpoints return proper HTTP status codes
- [ ] Rate limiting prevents brute force attacks
- [ ] All sensitive data is encrypted at rest

## Error Handling
- Invalid credentials: 401 Unauthorized
- Duplicate email: 409 Conflict
- OAuth error: 400 Bad Request with provider error details
- Session expired: 401 Unauthorized
- 2FA required: 403 Forbidden with 2FA challenge
- Rate limit exceeded: 429 Too Many Requests
- Server error: 500 Internal Server Error with correlation ID

## Security Considerations
- Passwords must be at least 8 characters with complexity requirements
- JWT tokens expire after 1 hour, refresh tokens after 30 days
- OAuth tokens are encrypted using AES-256-GCM
- Rate limiting: 5 failed login attempts per IP per 15 minutes
- CSRF protection for OAuth flows
- Secure cookie settings (httpOnly, secure, sameSite)
- Input validation and sanitization
- SQL injection prevention via parameterized queries

## Platform-Specific OAuth Scopes
```yaml
Google:
  - email
  - profile
  - openid

YouTube:
  - https://www.googleapis.com/auth/youtube.upload
  - https://www.googleapis.com/auth/youtube

TikTok:
  - user.info.basic
  - video.upload

Instagram:
  - user_profile
  - user_media
  - instagram_basic

Twitter:
  - tweet.read
  - tweet.write
  - users.read
```

## Testing Requirements
- Unit tests for all authentication functions
- Integration tests for OAuth flows
- E2E tests for complete login/signup flows
- Security tests for rate limiting and token validation
- Load tests for authentication endpoints
- Tests for all error scenarios

## Performance Requirements
- Login/signup response time < 500ms
- OAuth callback processing < 2 seconds
- Token validation < 100ms
- Support for 10,000 concurrent sessions
- Database queries optimized with proper indexing

## Monitoring and Logging
- Track failed login attempts
- Monitor OAuth callback failures
- Log session creation/destruction
- Alert on suspicious activity patterns
- Track token refresh rates
- Monitor provider API rate limits