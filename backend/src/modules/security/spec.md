# Security Module Specification

## Overview
The security module provides comprehensive security features for the Burstlet platform, including rate limiting, API key management, IP filtering, encryption, audit logging, and threat detection.

## Van Moose Compliance
- ✅ **File Size**: All files under 500 lines
- ✅ **Module Isolation**: Self-contained with clear interfaces
- ✅ **Agent-First**: RESTful APIs with semantic operations
- ✅ **KISS Principle**: Simple, focused functionality
- ✅ **Type Safety**: Full TypeScript with Zod validation

## Architecture

### Components
1. **SecurityService** (`service.ts`) - Core security logic
2. **SecurityController** (`controller.ts`) - HTTP request handlers
3. **SecurityMiddleware** (`middleware.ts`) - Express middleware
4. **SecurityRoutes** (`routes.ts`) - Route definitions
5. **SecurityModule** (`module.ts`) - Module initialization
6. **Types** (`types.ts`) - TypeScript interfaces and schemas

### Dependencies
- **Internal**: Auth module (for user context)
- **External**: Express middleware, Helmet, CORS, rate-limit, bcrypt, crypto

## Features

### Rate Limiting
- Configurable per-endpoint limits
- Tier-based rate limits (Free, Pro, Business, Enterprise)
- Custom key generation (by user ID, API key, or IP)
- Redis support for distributed systems
- Automatic blocking and unblocking
- Rate limit headers in responses

#### Default Rate Limits
- **Authentication**: 5 requests per 15 minutes
- **Free tier**: 30 requests per minute
- **Pro tier**: 100 requests per minute
- **Business tier**: 300 requests per minute
- **Enterprise tier**: 1000 requests per minute
- **AI Generation**: 10 requests per hour
- **File uploads**: 10 uploads per 5 minutes

### API Key Management
- Secure key generation with `bst_` prefix
- Bcrypt hashing for storage
- Customizable permissions per key
- Expiration dates
- Rate limiting per key
- Usage tracking
- Key rotation support

### IP Filtering
- Allow/block lists
- Temporary and permanent rules
- Geolocation analysis
- VPN/Tor/Proxy detection
- Risk scoring
- Automatic threat detection
- CIDR range support

### Security Headers
- Content Security Policy (CSP)
- HSTS (HTTP Strict Transport Security)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Referrer Policy
- Cross-Origin policies
- Powered-By header removal

### CORS Configuration
- Environment-based origins
- Credential support
- Custom headers
- Preflight caching
- Method restrictions

### Encryption
- AES-256-GCM encryption
- Secure key management
- IV generation per encryption
- Authentication tags
- Data at rest protection

### Audit Logging
- All API requests logged
- User actions tracked
- IP addresses recorded
- Request/response metadata
- Searchable logs
- Retention policies

### Security Events
- Real-time threat detection
- Event severity levels (Low, Medium, High, Critical)
- Automatic alerting
- Event resolution tracking
- Types:
  - Rate limit violations
  - Invalid API keys
  - Suspicious activities
  - Brute force attempts
  - SQL injection attempts
  - XSS attempts
  - CSRF attempts
  - Unauthorized access

### Request Validation
- Input sanitization
- XSS prevention
- SQL injection prevention
- Size limits
- Type validation
- Schema validation with Zod

## API Endpoints

### API Key Management
```
POST   /api/v1/security/api-keys       - Create API key
GET    /api/v1/security/api-keys       - List API keys
PUT    /api/v1/security/api-keys/:id   - Update API key
DELETE /api/v1/security/api-keys/:id   - Revoke API key
```

### IP Management (Admin)
```
POST   /api/v1/security/ip-rules       - Create IP rule
GET    /api/v1/security/ip-rules       - List IP rules
DELETE /api/v1/security/ip-rules/:id   - Delete IP rule
GET    /api/v1/security/analyze-ip     - Analyze IP address
```

### Security Monitoring (Admin)
```
GET    /api/v1/security/events         - Get security events
PUT    /api/v1/security/events/:id/resolve - Resolve event
GET    /api/v1/security/audit-logs     - Get audit logs
GET    /api/v1/security/status         - Get security status
```

### Utility
```
GET    /api/v1/security/health         - Health check
POST   /api/v1/security/test/encrypt   - Test encryption (dev only)
```

## Database Schema

### ApiKey Table
```sql
id            String   @id @default(cuid())
userId        String
name          String
key           String   // Partial key for display
hashedKey     String   // Bcrypt hash
permissions   Json
rateLimit     Int?
expiresAt     DateTime?
lastUsedAt    DateTime?
isActive      Boolean
createdAt     DateTime @default(now())
updatedAt     DateTime @updatedAt
```

### SecurityEvent Table
```sql
id            String   @id @default(cuid())
type          String
severity      String
userId        String?
ipAddress     String
userAgent     String?
resource      String?
action        String?
details       Json
resolved      Boolean
resolvedAt    DateTime?
createdAt     DateTime @default(now())
```

### IpRule Table
```sql
id            String   @id @default(cuid())
ipAddress     String
type          String   // ALLOW or BLOCK
reason        String?
expiresAt     DateTime?
createdBy     String
createdAt     DateTime @default(now())
```

### AuditLog Table
```sql
id            String   @id @default(cuid())
userId        String?
action        String
resource      String
resourceId    String?
ipAddress     String
userAgent     String?
before        Json?
after         Json?
metadata      Json?
createdAt     DateTime @default(now())
```

### RateLimitRecord Table
```sql
id            String   @id @default(cuid())
key           String
endpoint      String
count         Int
windowStart   DateTime
windowEnd     DateTime
blocked       Boolean
```

## Middleware Stack

### Global Middleware Order
1. Security Context - Request ID, timing
2. Security Headers - Helmet configuration
3. CORS - Cross-origin handling
4. IP Filtering - Block/allow checks
5. Rate Limiting - Request throttling
6. Body Parsing - Size limits
7. Audit Logging - Request tracking

### Route-Specific Middleware
- API Key Authentication
- Request Validation
- Permission Checks
- Custom Rate Limits

## Security Best Practices

### API Keys
- Keys are never stored in plain text
- Partial key display only
- Automatic expiration
- Permission-based access
- Regular rotation encouraged

### Encryption
- Strong algorithm (AES-256-GCM)
- Unique IV per encryption
- Secure key storage
- No key in code

### Rate Limiting
- Progressive penalties
- Distributed coordination
- User notification
- Automatic recovery

### IP Security
- Geolocation verification
- VPN/Proxy detection
- Reputation scoring
- Automatic blocking

## Configuration Options

```typescript
{
  rateLimiting: {
    enabled: boolean;
    redis?: RedisConfig;
    defaultRules: RateLimitRule[];
  };
  encryption: {
    algorithm: string;
    keyLength: number;
    ivLength: number;
    saltRounds: number;
    secret: string;
  };
  cors: CorsConfig;
  headers: SecurityHeadersConfig;
  apiKeys: {
    enabled: boolean;
    maxPerUser: number;
    defaultExpiry: number;
    minLength: number;
  };
  ipFiltering: {
    enabled: boolean;
    geoBlocking?: {
      enabled: boolean;
      blockedCountries: string[];
    };
    vpnBlocking?: boolean;
    torBlocking?: boolean;
  };
  validation: {
    maxRequestSize: string;
    maxUrlLength: number;
    maxHeaderSize: number;
  };
  monitoring: {
    enabled: boolean;
    alertThresholds: {
      rateLimitViolations: number;
      failedAuthentications: number;
      suspiciousActivities: number;
    };
    retentionDays: number;
  };
}
```

## Error Handling

### Error Types
- `SecurityError` - General security violations
- `RateLimitError` - Rate limit exceeded
- `ValidationError` - Input validation failures

### Common Error Codes
- `API_KEY_MISSING` - No API key provided
- `API_KEY_INVALID` - Invalid or expired key
- `API_KEY_LIMIT_EXCEEDED` - Too many keys
- `PERMISSION_DENIED` - Insufficient permissions
- `IP_BLOCKED` - IP address blocked
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `VALIDATION_ERROR` - Invalid input

## Monitoring & Alerts

### Real-time Monitoring
- Active threat tracking
- Rate limit violations
- Failed authentications
- Suspicious activities

### Alert Thresholds
- 100+ rate limit violations/hour
- 50+ failed authentications/hour
- 20+ suspicious activities/hour
- Any critical security event

### Background Tasks
- Daily cleanup of old records
- Expired API key deactivation
- IP rule expiration
- Log retention enforcement

## Integration Points

### Auth Module
- User context for logging
- Role-based permissions
- Session validation

### All API Modules
- Rate limiting applied
- Audit logging
- Security headers
- Request validation

### Billing Module
- Tier-based rate limits
- API quota enforcement

## Testing Considerations

### Security Testing
- Penetration testing
- Rate limit verification
- XSS prevention tests
- SQL injection tests
- CSRF protection tests

### Load Testing
- Rate limiter performance
- Concurrent request handling
- Database query optimization

## Future Enhancements

### Planned Features
- OAuth2 server for API access
- WebAuthn support
- Hardware key support
- ML-based threat detection
- DDoS protection
- WAF integration

### Advanced Security
- Zero-trust architecture
- End-to-end encryption
- Mutual TLS
- Certificate pinning
- Security scoring