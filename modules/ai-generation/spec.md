# MODULE: AI Content Generation

## Purpose
Handles AI-powered video and content generation using HailuoAI and OpenAI APIs. Transforms user prompts into videos, scripts, metadata, and platform-specific content.

## Features
- Text-to-video generation via HailuoAI API
- Script generation and enhancement via OpenAI
- Platform-specific content adaptation
- Thumbnail generation and selection
- Caption and hashtag generation
- Content metadata extraction
- Video processing queue management
- Generation progress tracking
- Content quality validation

## User Stories
- As a user, I want to generate a video from a text prompt so that I can create content quickly
- As a user, I want my content optimized for each platform so that it performs better
- As a user, I want to preview generated content before publishing so that I can ensure quality
- As a user, I want automatic hashtags and captions so that I don't have to write them manually
- As a user, I want thumbnail options so that I can choose the most engaging one
- As a user, I want to track generation progress so that I know when content is ready

## Data Models
```yaml
ContentGeneration:
  id: uuid (PK)
  user_id: uuid (FK -> User.id)
  prompt: text
  enhanced_prompt: text (nullable)
  status: enum (pending, processing, completed, failed)
  progress_percentage: integer (0-100)
  generated_video_url: string (nullable)
  video_duration: integer (seconds, nullable)
  video_resolution: string (nullable)
  generation_metadata: jsonb
  error_message: text (nullable)
  created_at: timestamp
  updated_at: timestamp
  completed_at: timestamp (nullable)

GeneratedContent:
  id: uuid (PK)
  generation_id: uuid (FK -> ContentGeneration.id)
  content_type: enum (video, script, thumbnail, caption, hashtags)
  content_url: string (nullable)
  content_text: text (nullable)
  platform: enum (youtube, tiktok, instagram, twitter, all)
  metadata: jsonb
  quality_score: decimal (0.0-1.0, nullable)
  created_at: timestamp

AIProvider:
  id: uuid (PK)
  name: string (hailuoai, openai, claude)
  status: enum (active, inactive, maintenance)
  rate_limit: integer
  cost_per_request: decimal
  quality_rating: decimal (0.0-1.0)
  last_used_at: timestamp (nullable)
  error_count: integer
  success_count: integer

GenerationQueue:
  id: uuid (PK)
  generation_id: uuid (FK -> ContentGeneration.id)
  priority: enum (low, normal, high)
  attempts: integer
  max_attempts: integer
  next_retry_at: timestamp (nullable)
  queue_position: integer
  created_at: timestamp
  started_at: timestamp (nullable)
  completed_at: timestamp (nullable)
```

## API Endpoints
| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | /api/v1/generate/video | Generate video from prompt | Yes |
| GET | /api/v1/generate/{id} | Get generation status and result | Yes |
| GET | /api/v1/generate/user/{userId} | List user's generations | Yes |
| DELETE | /api/v1/generate/{id} | Cancel or delete generation | Yes |
| POST | /api/v1/generate/enhance-prompt | Enhance user prompt with AI | Yes |
| POST | /api/v1/generate/thumbnails | Generate thumbnail options | Yes |
| POST | /api/v1/generate/captions | Generate platform-specific captions | Yes |
| POST | /api/v1/generate/hashtags | Generate relevant hashtags | Yes |
| GET | /api/v1/generate/queue/status | Get queue status and position | Yes |
| POST | /api/v1/generate/retry/{id} | Retry failed generation | Yes |

## Dependencies
- Internal: auth (user authentication)
- External:
  - HailuoAI API (video generation)
  - OpenAI API (text generation)
  - Supabase Storage (video storage)
  - Redis/BullMQ (queue management)
  - FFmpeg (video processing)

## Success Criteria
- [ ] Videos generate successfully from text prompts
- [ ] Generation progress is tracked and reported accurately
- [ ] Generated content is stored securely and retrievably
- [ ] Queue system handles multiple concurrent generations
- [ ] Failed generations are retried automatically
- [ ] Content quality meets platform requirements
- [ ] Generation time is under 5 minutes for most requests
- [ ] API responses include proper status and metadata
- [ ] Platform-specific optimizations work correctly
- [ ] Error handling provides useful feedback to users

## Error Handling
- Invalid prompt: 400 Bad Request with validation errors
- AI service unavailable: 503 Service Unavailable
- Generation timeout: 408 Request Timeout
- Storage error: 500 Internal Server Error
- Rate limit exceeded: 429 Too Many Requests
- Insufficient credits: 402 Payment Required
- Content policy violation: 422 Unprocessable Entity

## Generation Pipeline
```yaml
1. Prompt Enhancement:
   - Validate user prompt (length, content)
   - Enhance prompt with AI for better results
   - Add platform-specific instructions

2. Video Generation:
   - Submit to HailuoAI API
   - Track generation progress
   - Handle API rate limits
   - Store intermediate results

3. Post-Processing:
   - Download generated video
   - Extract thumbnails
   - Validate video quality
   - Generate platform versions

4. Content Enhancement:
   - Generate captions with OpenAI
   - Create platform-specific hashtags
   - Optimize for each platform's requirements
   - Generate metadata

5. Storage and Delivery:
   - Upload to Supabase Storage
   - Create CDN links
   - Update database records
   - Notify user of completion
```

## Platform Optimizations
```yaml
YouTube Shorts:
  - 9:16 aspect ratio
  - 60 seconds max duration
  - Eye-catching thumbnails
  - Trending hashtags
  - Engaging titles

TikTok:
  - 9:16 aspect ratio
  - 15-60 seconds duration
  - Trending sounds/music
  - Popular hashtags
  - Quick-cut editing style

Instagram Reels:
  - 9:16 aspect ratio
  - 15-90 seconds duration
  - Instagram-specific hashtags
  - Story-format captions
  - Visual effects

Twitter/X:
  - 16:9 or 9:16 aspect ratio
  - 140 seconds max duration
  - Concise captions
  - Relevant hashtags
  - Direct messaging
```

## Quality Validation
- Video resolution minimum 720p
- Audio quality check
- Content appropriateness scan
- Platform compliance verification
- Duration within platform limits
- File size optimization

## Queue Management
- Priority queue based on user tier
- Automatic retry on failures (max 3 attempts)
- Load balancing across AI providers
- Queue position estimation
- Real-time progress updates via WebSocket

## Cost Management
- Track API usage per user
- Monitor generation costs
- Implement usage limits by plan
- Optimize API calls to reduce costs
- Cache common generations

## Testing Requirements
- Unit tests for all generation functions
- Integration tests with AI providers
- Load tests for concurrent generations
- E2E tests for complete generation flow
- Mock tests for AI API responses
- Performance tests for queue processing

## Performance Requirements
- Video generation completion < 5 minutes
- Queue processing latency < 30 seconds
- API response time < 2 seconds
- Support 100 concurrent generations
- Storage upload speed > 10 MB/s

## Monitoring and Logging
- Track generation success/failure rates
- Monitor AI provider response times
- Log queue processing metrics
- Alert on high failure rates
- Track cost per generation
- Monitor storage usage