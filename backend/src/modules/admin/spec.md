# Admin Module Specification

## Overview
The admin module provides comprehensive administrative functionality for managing users, system configuration, monitoring, and maintenance of the Burstlet platform. It implements role-based access control with admin and super_admin roles, providing secure access to sensitive operations.

## Van Moose Compliance
- ✅ **File Size**: All files under 500 lines
- ✅ **Module Isolation**: Self-contained admin interface
- ✅ **Agent-First**: RESTful APIs with clear documentation
- ✅ **KISS Principle**: Simple, focused administrative operations
- ✅ **Type Safety**: Full TypeScript with Zod validation

## Architecture

### Components
1. **AdminService** (`service.ts`) - Core admin logic (497 lines)
2. **AdminController** (`controller.ts`) - HTTP handlers (482 lines)
3. **AdminRoutes** (`routes.ts`) - Route definitions (40 lines)
4. **AdminModule** (`module.ts`) - Module initialization (178 lines)
5. **Types** (`types.ts`) - TypeScript interfaces and schemas (294 lines)

### Dependencies
- **Internal**: Auth module (for role-based access control)
- **External**: Prisma, bcrypt, Express

## Features

### User Management
- **List Users**: Paginated user listing with filtering and search
- **User Details**: Comprehensive user information including usage metrics
- **User Actions**: Suspend, activate, delete, reset password, revoke sessions
- **Role Management**: Assign admin/user roles (super_admin only)
- **User Impersonation**: Debug user issues by impersonating accounts

### System Statistics
- **User Metrics**: Total, active, new, suspended users
- **Content Metrics**: Published, scheduled, failed content
- **Usage Metrics**: API calls, storage, bandwidth, generation minutes
- **Revenue Metrics**: MRR, ARR, new subscriptions, churn rate
- **Health Metrics**: Uptime, error rate, response time, queue size

### System Configuration
- **Maintenance Mode**: Enable/disable with custom message
- **Feature Toggles**: Control registration, social login, AI generation
- **Security Settings**: Password requirements, session timeout, MFA
- **System Limits**: Max users per workspace, content per user, storage limits

### API Key Management
- **Admin Keys**: Create API keys with admin privileges
- **Scope Control**: Define specific permissions for keys
- **Usage Tracking**: Monitor API key usage and requests
- **Expiration**: Set automatic expiration dates

### Audit Logging
- **Action Tracking**: Log all administrative actions
- **User Activity**: Track user behavior and system access
- **Search & Filter**: Find specific actions by user, date, resource
- **Export Capability**: Download audit logs for compliance

### Data Export
- **User Data**: Export user information and statistics
- **Content Data**: Export published content and metrics
- **System Data**: Export configuration and health data
- **Multiple Formats**: CSV, JSON support

### Queue Management
- **Queue Status**: Monitor AI generation, publishing, analytics queues
- **Job Statistics**: Active, waiting, completed, failed jobs
- **Queue Health**: Identify bottlenecks and issues

### Maintenance Operations
- **Cache Management**: Clear Redis cache
- **Storage Cleanup**: Remove orphaned files
- **Database Optimization**: Run performance improvements
- **Log Rotation**: Manage log file sizes

## API Endpoints

### Authentication Required
All endpoints require admin or super_admin role.

### Dashboard & Overview
```
GET    /api/v1/admin/dashboard       - Admin dashboard overview
```

### User Management
```
GET    /api/v1/admin/users          - List users with filters
GET    /api/v1/admin/users/:id      - Get user details
PUT    /api/v1/admin/users/:id      - Update user information
POST   /api/v1/admin/users/:id/actions - Perform user actions
POST   /api/v1/admin/users/:id/impersonate - Impersonate user (super_admin)
```

### System Management
```
GET    /api/v1/admin/system/stats   - Get system statistics
GET    /api/v1/admin/system/config  - Get system configuration
PUT    /api/v1/admin/system/config  - Update configuration (super_admin)
POST   /api/v1/admin/system/maintenance - Run maintenance tasks (super_admin)
```

### Monitoring & Logs
```
GET    /api/v1/admin/audit-logs     - Get audit logs
GET    /api/v1/admin/queues/stats   - Get queue statistics
```

### Data Management
```
GET    /api/v1/admin/export         - Export data
POST   /api/v1/admin/api-keys       - Create admin API key
```

### Feature Management
```
POST   /api/v1/admin/features/:feature/toggle - Toggle feature flag (super_admin)
```

## Request/Response Examples

### List Users
```json
// GET /api/v1/admin/users?page=1&limit=20&role=user&search=john
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_123",
        "email": "john@example.com",
        "name": "John Doe",
        "role": "user",
        "status": "active",
        "createdAt": "2024-01-01T00:00:00Z",
        "subscription": {
          "plan": "pro",
          "status": "active"
        },
        "usage": {
          "contentCount": 45,
          "storageUsed": 2048,
          "apiCalls": 1250
        }
      }
    ],
    "total": 150,
    "page": 1,
    "totalPages": 8
  }
}
```

### System Statistics
```json
// GET /api/v1/admin/system/stats
{
  "success": true,
  "data": {
    "users": {
      "total": 1500,
      "active": 450,
      "new": 25,
      "suspended": 5
    },
    "content": {
      "total": 5000,
      "published": 4200,
      "scheduled": 150,
      "failed": 15
    },
    "revenue": {
      "mrr": 15000,
      "arr": 180000,
      "newSubscriptions": 45,
      "churn": 2.5
    },
    "health": {
      "uptime": 99.9,
      "errorRate": 0.1,
      "avgResponseTime": 150
    }
  }
}
```

### User Action
```json
// POST /api/v1/admin/users/user_123/actions
{
  "action": "suspend",
  "reason": "Violation of terms of service",
  "notifyUser": true
}

// Response
{
  "success": true,
  "data": {
    "success": true,
    "message": "User suspended successfully"
  }
}
```

## Role-Based Access Control

### Admin Role
Can perform:
- View and manage users
- View system statistics
- View audit logs
- Create API keys
- Export data
- View queue statistics

Cannot perform:
- Modify system configuration
- Run maintenance tasks
- Impersonate users
- Toggle feature flags

### Super Admin Role
Has all admin permissions plus:
- Modify system configuration
- Run maintenance operations
- Impersonate any user
- Toggle feature flags
- Delete admin accounts

## Security Features

### Audit Logging
All admin actions are logged with:
- Timestamp and user information
- Action performed and target resource
- IP address and user agent
- Success/failure status
- Detailed context and changes

### Access Control
- JWT token validation
- Role-based permissions
- Action-specific authorization
- IP address logging
- Session management

### Data Protection
- Sensitive data masking
- Secure password reset
- API key hashing
- Audit trail integrity

## Configuration Options

```typescript
{
  prefix: "/api/v1/admin",
  enableImpersonation: true,
  enableDataExport: true,
  enableMaintenanceActions: true
}
```

## Database Schema Requirements

### Audit Log Table
```sql
id            String   @id @default(cuid())
timestamp     DateTime @default(now())
userId        String
action        String
resource      String
resourceId    String?
details       Json
ipAddress     String
userAgent     String
result        String
```

### User Extensions
```sql
role          String   @default("user")  // user, admin, super_admin
status        String   @default("active") // active, suspended, deleted
lastActive    DateTime?
deletedAt     DateTime?
metadata      Json?
```

## Error Handling

### Common Errors
- `USER_NOT_FOUND` - User does not exist
- `FORBIDDEN` - Insufficient permissions
- `INVALID_ACTION` - Unknown action type
- `ADMIN_ERROR` - General admin operation error

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User with ID user_123 not found"
  }
}
```

## Performance Considerations

### Pagination
- Default page size: 20 items
- Maximum page size: 100 items
- Efficient database queries with proper indexing

### Caching
- System statistics cached for 5 minutes
- Configuration cached until updates
- User data cached per request

### Background Tasks
- Maintenance tasks run via scheduled jobs
- Audit log cleanup automated
- Session cleanup automated

## Integration Points

### Auth Module
- Role validation
- Permission checking
- Session management
- JWT token verification

### All Other Modules
- User activity tracking
- System health monitoring
- Resource usage calculation
- Error rate monitoring

## Best Practices

### Admin Security
1. **Minimal Privileges**: Grant least necessary permissions
2. **Regular Audits**: Review admin actions regularly
3. **Strong Authentication**: Require MFA for admin accounts
4. **Session Management**: Short session timeouts
5. **IP Restrictions**: Limit admin access by IP when possible

### Data Management
1. **Regular Backups**: Automated database backups
2. **Data Retention**: Clear policies for log retention
3. **Privacy Compliance**: GDPR/CCPA compliant exports
4. **Secure Deletion**: Proper data deletion procedures

### Monitoring
1. **Real-time Alerts**: Critical system issues
2. **Performance Metrics**: Response time monitoring
3. **Usage Tracking**: Resource utilization
4. **Health Checks**: Automated system validation

## Future Enhancements

### Planned Features
- Advanced analytics dashboards
- Automated threat detection
- Machine learning insights
- Custom report builder
- Bulk operations interface

### Advanced Administration
- Multi-tenant management
- Advanced role definitions
- Workflow automation
- Integration webhooks
- Custom admin plugins