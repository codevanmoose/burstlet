# Analytics Module Specification

## Overview
The analytics module provides comprehensive metrics collection, analysis, and reporting for the Burstlet platform. It aggregates data from all integrated platforms, provides insights, and enables data-driven decision making.

## Van Moose Compliance
- ✅ **File Size**: All files under 500 lines
- ✅ **Module Isolation**: Self-contained with clear interfaces
- ✅ **Agent-First**: RESTful APIs with semantic operations
- ✅ **KISS Principle**: Simple, focused functionality
- ✅ **Type Safety**: Full TypeScript with Zod validation

## Architecture

### Components
1. **AnalyticsService** (`service.ts`) - Core analytics logic
2. **AnalyticsController** (`controller.ts`) - HTTP request handlers
3. **AnalyticsRoutes** (`routes.ts`) - Route definitions
4. **AnalyticsModule** (`module.ts`) - Module initialization
5. **Types** (`types.ts`) - TypeScript interfaces and schemas

### Dependencies
- **Internal**: Auth module, Platform Integrations module
- **External**: Prisma ORM, Zod validation

## Features

### Metrics Collection
- Automatic collection from all platforms
- Real-time metric updates
- Support for multiple metric types:
  - Views, likes, comments, shares
  - Impressions, reach, engagement rate
  - Watch time, average view duration
  - Revenue and monetization metrics
  - Follower growth

### Analytics Types

#### Content Analytics
- Performance metrics per content piece
- Platform-wise breakdown
- Engagement rate calculation
- ROI analysis
- Trend identification

#### Audience Analytics
- Demographics (age, gender, location)
- Interest analysis
- Best posting times
- Audience retention metrics
- Growth tracking

#### Revenue Analytics
- Total revenue tracking
- Platform-wise revenue
- Content-wise revenue
- Revenue per view (RPU)
- Growth analysis
- Projections and forecasting

### Reporting System
- Pre-built report types:
  - Performance reports
  - Audience insights
  - Revenue analysis
  - Custom reports
- Multiple export formats (PDF, CSV, JSON)
- Scheduled report generation
- Report history

### Alert System
- Configurable alerts:
  - Threshold alerts (metric above/below value)
  - Anomaly detection
  - Milestone achievements
  - Trend alerts
- Multi-channel notifications:
  - In-app notifications
  - Email alerts
  - Webhook integration
- Alert history and management

### Insights Engine
- AI-powered insights:
  - Content recommendations
  - Audience behavior patterns
  - Platform optimization tips
  - Timing suggestions
- Insight categories:
  - Content insights
  - Audience insights
  - Platform insights
  - Timing insights

### Dashboard
- Real-time overview
- Key metrics summary
- Recent content performance
- Top performers
- Platform breakdown
- Trend visualization

## API Endpoints

### Analytics Data
```
GET    /api/v1/analytics              - Get raw analytics metrics
GET    /api/v1/analytics/content      - Get content analytics
GET    /api/v1/analytics/audience     - Get audience analytics
GET    /api/v1/analytics/revenue      - Get revenue analytics
GET    /api/v1/analytics/dashboard    - Get dashboard data
GET    /api/v1/analytics/realtime     - Get real-time analytics
```

### Reports
```
POST   /api/v1/analytics/reports      - Create report
GET    /api/v1/analytics/reports      - List reports
```

### Alerts
```
POST   /api/v1/analytics/alerts       - Create alert
GET    /api/v1/analytics/alerts       - List alerts
PUT    /api/v1/analytics/alerts/:id   - Update alert
DELETE /api/v1/analytics/alerts/:id   - Delete alert
```

### Analysis Tools
```
POST   /api/v1/analytics/compare      - Compare content
GET    /api/v1/analytics/insights     - Get insights
POST   /api/v1/analytics/export       - Export data
```

### Internal
```
POST   /api/v1/analytics/collect      - Collect metrics
GET    /api/v1/analytics/health       - Health check
```

## Database Schema

### AnalyticsMetric Table
```sql
id            String   @id @default(cuid())
userId        String
contentId     String?
platformPostId String?
platform      String?
metricType    String
value         Float
metadata      Json?
timestamp     DateTime
createdAt     DateTime @default(now())

@@index([userId, timestamp])
@@index([contentId, metricType])
```

### AnalyticsReport Table
```sql
id            String   @id @default(cuid())
userId        String
name          String
type          String
dateRange     Json
filters       Json?
data          Json
format        String
downloadUrl   String?
createdAt     DateTime @default(now())
```

### AnalyticsAlert Table
```sql
id            String   @id @default(cuid())
userId        String
name          String
type          String
condition     Json
isActive      Boolean
lastTriggered DateTime?
notifications Json
createdAt     DateTime @default(now())
updatedAt     DateTime @updatedAt
```

## Metric Types

### Engagement Metrics
- **Views**: Total content views
- **Likes**: Total likes/reactions
- **Comments**: Total comments
- **Shares**: Total shares
- **Saves**: Bookmarks/saves
- **Engagement Rate**: (Likes + Comments + Shares) / Views

### Reach Metrics
- **Impressions**: Times content was shown
- **Reach**: Unique users reached
- **Followers Gained**: New followers

### Performance Metrics
- **Watch Time**: Total time watched (video)
- **Average View Duration**: Average time per view
- **Click-Through Rate**: Clicks / Impressions

### Revenue Metrics
- **Revenue**: Earnings from content
- **RPM**: Revenue per thousand views
- **RPU**: Revenue per user

## Data Aggregation

### Time-based Aggregation
- Hourly aggregation for real-time
- Daily aggregation for trends
- Weekly/Monthly for reports

### Platform Aggregation
- Unified metrics across platforms
- Platform-specific insights
- Cross-platform comparison

### Content Aggregation
- Per-content metrics
- Content type analysis
- Performance ranking

## Alert Conditions

### Threshold Alerts
```typescript
{
  metric: "VIEWS",
  operator: "GREATER_THAN",
  value: 10000,
  timeWindow: "24h"
}
```

### Change Alerts
```typescript
{
  metric: "ENGAGEMENT_RATE",
  operator: "CHANGE_BY",
  value: 20, // 20% change
  timeWindow: "7d"
}
```

### Milestone Alerts
```typescript
{
  metric: "FOLLOWERS_GAINED",
  operator: "EQUALS",
  value: 1000,
  timeWindow: "30d"
}
```

## Configuration Options

```typescript
{
  enableRealtime: boolean;      // Real-time analytics
  enableAlerts: boolean;        // Alert system
  enableReports: boolean;       // Report generation
  retentionDays: number;        // Data retention period
  aggregationInterval: number;  // Minutes between aggregations
}
```

## Performance Optimization

### Data Storage
- Time-series optimized storage
- Indexed queries
- Data partitioning by date
- Automatic data cleanup

### Query Optimization
- Pre-aggregated metrics
- Cached dashboard data
- Efficient time-range queries

### Background Processing
- Asynchronous metric collection
- Batch processing
- Queue-based alert checking

## Security & Privacy

### Data Access
- User-scoped queries
- No cross-user data access
- Audit logging

### Data Retention
- Configurable retention periods
- Automatic old data cleanup
- GDPR compliance

### Export Controls
- User owns their data
- Complete data export
- Deletion on request

## Integration Points

### Platform Integrations Module
- Fetches platform metrics
- Handles API rate limits
- Manages credentials

### Content Management Module
- Links metrics to content
- Provides content metadata
- Enables content comparison

### AI Generation Module
- Tracks AI content performance
- Provides generation insights
- Optimizes AI parameters

## Error Handling

### Error Types
- `AnalyticsError` - General analytics errors
- `ReportError` - Report generation errors

### Common Error Codes
- `METRICS_NOT_FOUND` - No metrics available
- `INVALID_DATE_RANGE` - Invalid time period
- `REPORT_GENERATION_FAILED` - Report creation failed
- `ALERT_LIMIT_EXCEEDED` - Too many alerts
- `EXPORT_FAILED` - Data export failed

## Future Enhancements

### Planned Features
- Machine learning insights
- Predictive analytics
- A/B test tracking
- Custom metric definitions
- Advanced anomaly detection

### Advanced Analytics
- Cohort analysis
- Funnel tracking
- Attribution modeling
- Sentiment analysis
- Competitor benchmarking