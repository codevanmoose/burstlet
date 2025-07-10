# Monitoring Module Specification

## Overview
The monitoring module provides comprehensive observability for the Burstlet platform, including system metrics, application performance monitoring, health checks, alerting, logging, and distributed tracing.

## Van Moose Compliance
- ✅ **File Size**: All files under 500 lines
- ✅ **Module Isolation**: Self-contained with clear interfaces
- ✅ **Agent-First**: RESTful APIs with semantic operations
- ✅ **KISS Principle**: Simple, focused functionality
- ✅ **Type Safety**: Full TypeScript with Zod validation

## Architecture

### Components
1. **MonitoringService** (`service.ts`) - Core monitoring logic
2. **MonitoringController** (`controller.ts`) - HTTP request handlers
3. **MonitoringMiddleware** (`middleware.ts`) - Express middleware
4. **MonitoringRoutes** (`routes.ts`) - Route definitions
5. **MonitoringModule** (`module.ts`) - Module initialization
6. **Types** (`types.ts`) - TypeScript interfaces and schemas

### Dependencies
- **Internal**: Auth module (for protected endpoints)
- **External**: OS metrics, performance hooks, Prisma ORM

## Features

### System Metrics
- CPU usage and load average
- Memory usage (total, used, free, percentage)
- Disk usage and available space
- Network I/O statistics
- Process-specific metrics
- Automatic collection at configurable intervals

### Application Metrics
- Request counts and rates
- Response time tracking (average, median, p95, p99)
- Error rates and types
- Active users and sessions
- Endpoint-specific metrics
- Method and status code breakdowns

### Health Checks
- Multiple check types:
  - HTTP endpoint checks
  - TCP port checks
  - Database connectivity
  - Redis connectivity
  - External API availability
  - Disk space thresholds
  - Memory usage thresholds
  - Custom checks
- Configurable intervals and timeouts
- Retry logic
- Health status aggregation

### Alerting System
- Alert types:
  - Threshold alerts
  - Anomaly detection
  - Error rate alerts
  - Downtime alerts
  - Performance alerts
  - Custom alerts
- Alert channels:
  - Email notifications
  - Slack integration
  - Webhook delivery
  - SMS (future)
- Alert conditions with operators
- Cooldown periods
- Severity levels (Info, Warning, Error, Critical)

### Logging
- Structured logging with levels
- Service-based categorization
- Metadata support
- Trace context integration
- Search and filtering
- Retention policies
- Log aggregation

### Custom Metrics
- Metric types:
  - Counter (incremental values)
  - Gauge (point-in-time values)
  - Histogram (distributions)
  - Summary (aggregations)
- Tag-based organization
- Business metric tracking
- SLA monitoring

### Dashboards
- Customizable widgets:
  - Line charts
  - Bar charts
  - Gauges
  - Numbers
  - Tables
  - Log viewers
  - Alert lists
- Public/private dashboards
- Auto-refresh capability
- Widget positioning

### Distributed Tracing
- Trace ID propagation
- Span tracking
- Parent-child relationships
- Cross-service correlation
- Sampling configuration

## API Endpoints

### Health & Metrics
```
GET    /api/v1/monitoring/health       - Get health status (public)
GET    /api/v1/monitoring/metrics      - Get metrics data
POST   /api/v1/monitoring/metrics/collect - Trigger metric collection
POST   /api/v1/monitoring/metrics/custom - Record custom metric
```

### Health Checks
```
POST   /api/v1/monitoring/health-checks     - Create health check
GET    /api/v1/monitoring/health-checks     - List health checks
DELETE /api/v1/monitoring/health-checks/:id - Delete health check
```

### Alerts
```
POST   /api/v1/monitoring/alerts            - Create alert
GET    /api/v1/monitoring/alerts            - List alerts
PUT    /api/v1/monitoring/alerts/:id        - Update alert
DELETE /api/v1/monitoring/alerts/:id        - Delete alert
POST   /api/v1/monitoring/alerts/events/:id/acknowledge - Acknowledge alert
```

### Logs & Dashboards
```
GET    /api/v1/monitoring/logs              - Get logs
POST   /api/v1/monitoring/dashboards        - Create dashboard
GET    /api/v1/monitoring/dashboards        - List dashboards
GET    /api/v1/monitoring/dashboards/:id    - Get dashboard
DELETE /api/v1/monitoring/dashboards/:id    - Delete dashboard
```

### Overview
```
GET    /api/v1/monitoring/overview          - Get monitoring overview
```

## Database Schema

### SystemMetric Table
```sql
id            String   @id @default(cuid())
timestamp     DateTime @default(now())
cpu           Json
memory        Json
disk          Json
network       Json
process       Json
```

### ApplicationMetric Table
```sql
id            String   @id @default(cuid())
timestamp     DateTime @default(now())
requests      Json
response      Json
errors        Json
activeUsers   Int
activeSessions Int
```

### HealthCheck Table
```sql
id            String   @id @default(cuid())
name          String
type          String
target        String
interval      Int
timeout       Int
retries       Int
config        Json?
isActive      Boolean
createdAt     DateTime @default(now())
```

### MonitoringAlert Table
```sql
id            String   @id @default(cuid())
name          String
type          String
severity      String
condition     Json
channels      Json
cooldown      Int
isActive      Boolean
lastTriggered DateTime?
createdAt     DateTime @default(now())
updatedAt     DateTime @updatedAt
```

### LogEntry Table
```sql
id            String   @id @default(cuid())
level         String
message       String
timestamp     DateTime @default(now())
service       String
metadata      Json?
trace         Json?
```

## Middleware Stack

### Request Monitoring
- Captures all HTTP requests
- Measures response times
- Records status codes
- Tracks user context
- Identifies slow requests

### Error Monitoring
- Catches all errors
- Records stack traces
- Captures request context
- Aggregates by type

### Performance Monitoring
- Route-specific tracking
- SLA violation detection
- Database query monitoring
- Memory usage tracking

### Business Metrics
- API success rates
- User activity tracking
- Custom metric recording
- Endpoint usage

### Tracing
- Trace ID generation
- Context propagation
- Span creation
- Header injection

## Monitoring Strategies

### Collection Intervals
- System metrics: 60 seconds
- Application metrics: 60 seconds
- Health checks: Variable (10s - 5m)
- Alert checks: 30 seconds

### Retention Policies
- Metrics: 30 days (configurable)
- Logs: 7 days (configurable)
- Health check results: 30 days
- Alert events: 90 days

### Alert Strategies
- Progressive thresholds
- Cooldown periods
- Severity escalation
- Channel routing

## Configuration Options

```typescript
{
  enabled: boolean;
  collectInterval: number;       // seconds
  retentionDays: number;
  services: {
    database: boolean;
    redis: boolean;
    externalApis: string[];
  };
  metrics: {
    system: boolean;
    application: boolean;
    custom: boolean;
  };
  alerts: {
    enabled: boolean;
    defaultChannels: AlertChannel[];
  };
  logging: {
    level: LogLevel;
    retention: number;          // days
  };
  tracing: {
    enabled: boolean;
    samplingRate: number;       // 0-1
  };
}
```

## Performance Optimization

### Data Storage
- Time-series optimized
- Automatic aggregation
- Old data cleanup
- Indexed queries

### Collection Efficiency
- Batch operations
- Sampling for expensive metrics
- Async processing
- Memory-efficient buffers

### Query Performance
- Limited result sets
- Time-based partitioning
- Cached dashboards
- Aggregated views

## Integration Points

### All Modules
- Request monitoring
- Error tracking
- Performance metrics
- Business events

### Security Module
- Security event correlation
- Audit log integration
- Rate limit monitoring

### Analytics Module
- Business metric sharing
- Combined dashboards
- Unified reporting

## Error Handling

### Error Types
- `MonitoringError` - General monitoring errors

### Common Error Codes
- `HEALTH_CHECK_ERROR` - Health check failed
- `COLLECTION_ERROR` - Metric collection failed
- `ALERT_ERROR` - Alert processing failed
- `VALIDATION_ERROR` - Invalid configuration

## Best Practices

### Metric Design
- Use consistent naming
- Include relevant tags
- Choose appropriate types
- Avoid high cardinality

### Alert Configuration
- Start with conservative thresholds
- Use appropriate cooldowns
- Test alert channels
- Document alert responses

### Dashboard Creation
- Focus on key metrics
- Use appropriate visualizations
- Set reasonable refresh rates
- Provide context

## Future Enhancements

### Planned Features
- APM integration
- Distributed tracing UI
- Anomaly detection ML
- Predictive alerts
- Capacity planning

### Advanced Monitoring
- Code-level profiling
- Database query analysis
- Network topology mapping
- User journey tracking
- Cost monitoring