# Burstlet API Documentation

## Overview

The Burstlet API is a RESTful API that provides programmatic access to all platform features. All API endpoints are prefixed with `/api/v1` and require authentication unless otherwise specified.

## Base URL

```
Production: https://api.burstlet.com/api/v1
Development: http://localhost:3001/api/v1
```

## Authentication

The API uses JWT (JSON Web Token) authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

To obtain a token, use the login endpoint or OAuth flow.

## Common Headers

```
Content-Type: application/json
Accept: application/json
X-Request-ID: <unique-request-id>
```

## Response Format

All responses follow this structure:

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Additional error context
    }
  }
}
```

## Rate Limiting

- Anonymous: 10 requests per minute
- Authenticated: 60 requests per minute
- Pro: 300 requests per minute
- Enterprise: 1000 requests per minute

Rate limit headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: UTC timestamp when limit resets

## Endpoints

### Authentication

#### POST /auth/register
Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "token": "eyJhbGc..."
  }
}
```

#### POST /auth/login
Authenticate a user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

#### POST /auth/logout
End the current session.

#### POST /auth/refresh
Refresh access token using refresh token.

#### GET /auth/oauth/:provider
Initiate OAuth flow (YouTube, Twitter, TikTok, Instagram).

#### GET /auth/oauth/:provider/callback
OAuth callback endpoint (public).

### AI Generation

#### POST /ai/generate/video
Generate a video from a prompt.

**Request:**
```json
{
  "prompt": "Create a 30-second video about productivity tips",
  "aspectRatio": "9:16",
  "duration": 30,
  "style": "modern",
  "enhancePrompt": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "job_123",
    "status": "processing",
    "estimatedTime": 120
  }
}
```

#### GET /ai/jobs/:jobId
Get generation job status.

#### POST /ai/generate/blog
Generate a blog post.

**Request:**
```json
{
  "topic": "10 Productivity Tips",
  "length": "medium",
  "tone": "professional",
  "keywords": ["productivity", "efficiency"]
}
```

#### POST /ai/generate/social
Generate social media content.

**Request:**
```json
{
  "topic": "Productivity tips",
  "platforms": ["twitter", "instagram"],
  "includeHashtags": true
}
```

### Platform Integrations

#### GET /platforms
List connected platforms.

#### POST /platforms/:platform/publish
Publish content to a platform.

**Request:**
```json
{
  "contentId": "content_123",
  "scheduledAt": "2024-01-15T10:00:00Z",
  "options": {
    "autoHashtags": true,
    "crossPost": false
  }
}
```

#### GET /platforms/:platform/analytics
Get platform-specific analytics.

#### DELETE /platforms/:platform/disconnect
Disconnect a platform.

### Content Management

#### GET /content
List user's content.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)
- `status` (draft, published, scheduled)
- `type` (video, blog, social)
- `platform` (youtube, tiktok, etc.)

#### POST /content
Create new content.

**Request:**
```json
{
  "title": "My Content",
  "type": "video",
  "description": "Content description",
  "mediaUrl": "https://...",
  "platforms": ["youtube", "tiktok"],
  "scheduledAt": "2024-01-15T10:00:00Z"
}
```

#### GET /content/:id
Get content details.

#### PUT /content/:id
Update content.

#### DELETE /content/:id
Delete content.

#### GET /content/:id/versions
Get content version history.

#### POST /content/:id/revert/:versionId
Revert to a specific version.

### Templates

#### GET /templates
List templates.

#### POST /templates
Create a template.

**Request:**
```json
{
  "name": "Weekly Update",
  "type": "video",
  "variables": {
    "week_number": "number",
    "topic": "string"
  },
  "content": {
    "title": "Week {{week_number}} Update",
    "description": "This week's topic: {{topic}}"
  }
}
```

#### POST /templates/:id/use
Create content from template.

### Analytics

#### GET /analytics/overview
Get analytics overview.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalViews": 150000,
    "totalEngagement": 12000,
    "growthRate": 15.5,
    "topContent": [...],
    "platformBreakdown": {
      "youtube": { "views": 100000, "subscribers": 500 },
      "tiktok": { "views": 50000, "followers": 300 }
    }
  }
}
```

#### GET /analytics/content/:id
Get content-specific analytics.

#### POST /analytics/reports
Generate custom report.

**Request:**
```json
{
  "type": "performance",
  "dateRange": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "metrics": ["views", "engagement", "growth"],
  "groupBy": "day"
}
```

### Billing

#### GET /billing/subscription
Get current subscription.

#### POST /billing/subscribe
Create or update subscription.

**Request:**
```json
{
  "plan": "pro",
  "interval": "monthly"
}
```

#### POST /billing/cancel
Cancel subscription.

#### GET /billing/invoices
List invoices.

#### GET /billing/usage
Get current usage.

### Monitoring

#### GET /monitoring/health
Health check endpoint (public).

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "uptime": 86400,
    "services": {
      "database": "healthy",
      "redis": "healthy",
      "ai": "healthy"
    }
  }
}
```

## Error Codes

### Authentication Errors
- `AUTH_INVALID_CREDENTIALS`: Invalid email or password
- `AUTH_TOKEN_EXPIRED`: JWT token has expired
- `AUTH_TOKEN_INVALID`: Invalid JWT token
- `AUTH_UNAUTHORIZED`: Not authenticated
- `AUTH_FORBIDDEN`: Insufficient permissions

### Validation Errors
- `VALIDATION_ERROR`: Request validation failed
- `INVALID_REQUEST`: Malformed request

### Resource Errors
- `NOT_FOUND`: Resource not found
- `ALREADY_EXISTS`: Resource already exists
- `CONFLICT`: Resource conflict

### Platform Errors
- `PLATFORM_NOT_CONNECTED`: Platform not connected
- `PLATFORM_AUTH_FAILED`: Platform authentication failed
- `PLATFORM_API_ERROR`: Platform API error

### Rate Limiting
- `RATE_LIMIT_EXCEEDED`: Too many requests

### Server Errors
- `INTERNAL_ERROR`: Internal server error
- `SERVICE_UNAVAILABLE`: Service temporarily unavailable

## Webhooks

Burstlet can send webhooks for various events. Configure webhook endpoints in your account settings.

### Webhook Events

- `content.created`: New content created
- `content.published`: Content published to platform
- `content.failed`: Content publishing failed
- `job.completed`: AI generation job completed
- `job.failed`: AI generation job failed
- `subscription.updated`: Subscription changed
- `subscription.cancelled`: Subscription cancelled

### Webhook Format

```json
{
  "id": "webhook_123",
  "type": "content.published",
  "timestamp": "2024-01-09T10:00:00Z",
  "data": {
    // Event-specific data
  },
  "signature": "sha256=..."
}
```

Verify webhook signatures using the `X-Burstlet-Signature` header.

## SDK Support

Official SDKs are available for:
- JavaScript/TypeScript
- Python
- Go
- Ruby

## Changelog

### v1.0.0 (2024-01-09)
- Initial API release
- Authentication with OAuth support
- AI generation endpoints
- Platform integrations
- Content management
- Analytics and billing

---

For more information or support, contact api@burstlet.com