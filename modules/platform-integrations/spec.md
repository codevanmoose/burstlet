# MODULE: Platform Integrations

## Purpose
Manages OAuth connections and content publishing to social media platforms including YouTube Shorts, TikTok, Instagram Reels, and Twitter/X. Handles platform-specific formatting, scheduling, and API interactions.

## Features
- OAuth connection management for all platforms
- Automated content publishing
- Platform-specific content formatting
- Scheduled publishing
- Publishing status tracking
- Error handling and retry logic
- Platform health monitoring
- Multi-account support per platform
- Content duplication prevention

## User Stories
- As a user, I want to connect my social accounts so that I can publish content automatically
- As a user, I want to publish to multiple platforms simultaneously so that I can maximize reach
- As a user, I want to schedule posts so that I can publish at optimal times
- As a user, I want to track publishing status so that I know if content was posted successfully
- As a user, I want platform-specific formatting so that my content looks good on each platform
- As a user, I want to manage multiple accounts per platform so that I can handle multiple brands

## Data Models
```yaml
PlatformConnection:
  id: uuid (PK)
  user_id: uuid (FK -> User.id)
  platform: enum (youtube, tiktok, instagram, twitter)
  account_id: string
  account_name: string
  account_username: string
  account_avatar: string (nullable)
  access_token: string (encrypted)
  refresh_token: string (encrypted, nullable)
  token_expires_at: timestamp (nullable)
  scopes: string[]
  status: enum (active, expired, error, disconnected)
  last_sync_at: timestamp (nullable)
  error_message: text (nullable)
  connection_metadata: jsonb
  created_at: timestamp
  updated_at: timestamp

PublishingJob:
  id: uuid (PK)
  user_id: uuid (FK -> User.id)
  generation_id: uuid (FK -> ContentGeneration.id)
  platform_connection_id: uuid (FK -> PlatformConnection.id)
  platform: enum (youtube, tiktok, instagram, twitter)
  content_type: enum (video, image, text)
  status: enum (pending, processing, published, failed, cancelled)
  scheduled_at: timestamp (nullable)
  published_at: timestamp (nullable)
  platform_post_id: string (nullable)
  platform_url: string (nullable)
  error_message: text (nullable)
  retry_count: integer
  max_retries: integer
  publishing_metadata: jsonb
  created_at: timestamp
  updated_at: timestamp

PlatformContent:
  id: uuid (PK)
  publishing_job_id: uuid (FK -> PublishingJob.id)
  platform: enum (youtube, tiktok, instagram, twitter)
  title: string (nullable)
  description: text (nullable)
  hashtags: string[]
  video_url: string (nullable)
  thumbnail_url: string (nullable)
  duration: integer (nullable)
  privacy: enum (public, unlisted, private)
  category: string (nullable)
  tags: string[]
  custom_metadata: jsonb
  created_at: timestamp

PlatformAPI:
  id: uuid (PK)
  platform: enum (youtube, tiktok, instagram, twitter)
  endpoint: string
  rate_limit: integer
  rate_window: integer (seconds)
  current_usage: integer
  reset_at: timestamp
  status: enum (operational, degraded, down)
  last_check_at: timestamp
  response_time: integer (ms)
  error_rate: decimal (0.0-1.0)
```

## API Endpoints
| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | /api/v1/platforms/connections | List user's platform connections | Yes |
| POST | /api/v1/platforms/{platform}/connect | Initiate platform connection | Yes |
| DELETE | /api/v1/platforms/{platform}/disconnect | Disconnect platform account | Yes |
| POST | /api/v1/platforms/publish | Publish content to platforms | Yes |
| POST | /api/v1/platforms/schedule | Schedule content publication | Yes |
| GET | /api/v1/platforms/jobs | List publishing jobs | Yes |
| GET | /api/v1/platforms/jobs/{id} | Get publishing job status | Yes |
| POST | /api/v1/platforms/jobs/{id}/retry | Retry failed publishing job | Yes |
| DELETE | /api/v1/platforms/jobs/{id} | Cancel scheduled job | Yes |
| GET | /api/v1/platforms/{platform}/status | Get platform API status | Yes |
| POST | /api/v1/platforms/test | Test platform connections | Yes |

## Dependencies
- Internal: 
  - auth (user authentication)
  - ai-generation (content to publish)
- External:
  - YouTube Data API v3
  - TikTok Business API
  - Instagram Basic Display API
  - Twitter API v2
  - Redis/BullMQ (scheduling)

## Success Criteria
- [ ] Users can connect/disconnect platform accounts
- [ ] Content publishes successfully to all platforms
- [ ] Platform-specific formatting works correctly
- [ ] Scheduled publishing works reliably
- [ ] Failed publications are retried automatically
- [ ] Platform rate limits are respected
- [ ] Multi-account support works for each platform
- [ ] Error messages are clear and actionable
- [ ] Publishing status is tracked accurately
- [ ] API health monitoring works properly

## Error Handling
- OAuth expired: 401 Unauthorized - trigger re-auth flow
- Rate limit exceeded: 429 Too Many Requests - queue for retry
- Platform API down: 503 Service Unavailable - retry later
- Content policy violation: 422 Unprocessable Entity
- Invalid content format: 400 Bad Request
- Network timeout: 408 Request Timeout - retry
- Storage access error: 500 Internal Server Error

## Platform-Specific Implementation

### YouTube Shorts
```yaml
API: YouTube Data API v3
OAuth Scopes:
  - https://www.googleapis.com/auth/youtube.upload
  - https://www.googleapis.com/auth/youtube

Content Requirements:
  - Video format: MP4
  - Max duration: 60 seconds
  - Aspect ratio: 9:16 (vertical)
  - Max file size: 256 GB
  - Supported resolutions: 720p, 1080p, 1440p, 2160p

Publishing Process:
  1. Upload video file
  2. Set metadata (title, description, tags)
  3. Set thumbnail (if provided)
  4. Configure privacy settings
  5. Monitor upload status
```

### TikTok
```yaml
API: TikTok Business API
OAuth Scopes:
  - user.info.basic
  - video.upload

Content Requirements:
  - Video format: MP4, MOV, MPEG, 3GPP, AVI
  - Duration: 15 seconds to 10 minutes
  - Aspect ratio: 9:16 (recommended)
  - Max file size: 4 GB
  - Resolution: 540x960 to 1080x1920

Publishing Process:
  1. Upload video to TikTok
  2. Set caption and hashtags
  3. Configure privacy settings
  4. Submit for review
  5. Monitor publishing status
```

### Instagram Reels
```yaml
API: Instagram Basic Display API + Graph API
OAuth Scopes:
  - instagram_basic
  - pages_show_list
  - pages_read_engagement

Content Requirements:
  - Video format: MP4, MOV
  - Duration: 15-90 seconds
  - Aspect ratio: 9:16
  - Max file size: 4 GB
  - Resolution: 720x1280 minimum

Publishing Process:
  1. Create media container
  2. Upload video file
  3. Set caption and hashtags
  4. Publish container
  5. Monitor status
```

### Twitter/X
```yaml
API: Twitter API v2
OAuth Scopes:
  - tweet.read
  - tweet.write
  - users.read

Content Requirements:
  - Video format: MP4, MOV
  - Duration: up to 2 minutes 20 seconds
  - Max file size: 512 MB
  - Supported resolutions: up to 1920x1200

Publishing Process:
  1. Upload media (chunked upload for large files)
  2. Create tweet with media
  3. Set text content
  4. Publish tweet
  5. Track engagement
```

## Publishing Queue Management
- Priority queue based on user tier and scheduled time
- Automatic retry with exponential backoff
- Rate limit compliance per platform
- Batch processing optimization
- Real-time status updates via WebSocket

## Content Formatting
```yaml
Auto-formatting rules:
  - Trim videos to platform duration limits
  - Resize videos to optimal aspect ratios
  - Compress videos to size limits
  - Generate platform-specific captions
  - Optimize hashtags for each platform
  - Select best thumbnail for each platform
```

## Rate Limit Management
```yaml
YouTube:
  - 10,000 quota units per day
  - Video upload: 1,600 units
  - Monitor and queue requests

TikTok:
  - 100 requests per minute per app
  - 10 video uploads per day per user
  - Implement sliding window rate limiting

Instagram:
  - 200 requests per hour per user
  - 25 posts per day per user
  - Use token bucket algorithm

Twitter:
  - 300 tweets per 15 minutes
  - 50 media uploads per 15 minutes
  - Implement request queuing
```

## Security Considerations
- Encrypt all OAuth tokens with AES-256-GCM
- Rotate tokens before expiration
- Implement PKCE for OAuth flows
- Validate all content before publishing
- Sanitize user input
- Log all platform interactions
- Monitor for suspicious activity

## Testing Requirements
- Unit tests for each platform integration
- Integration tests with platform APIs (sandbox)
- E2E tests for complete publishing flow
- Load tests for concurrent publishing
- Mock tests for error scenarios
- Rate limit testing

## Performance Requirements
- Publishing initiation < 5 seconds
- Status updates within 30 seconds
- Support 1000 concurrent publishing jobs
- Queue processing latency < 1 minute
- Platform health checks every 5 minutes

## Monitoring and Logging
- Track publishing success/failure rates per platform
- Monitor platform API response times
- Alert on high error rates or API outages
- Log all publishing attempts and outcomes
- Track token refresh rates
- Monitor rate limit usage