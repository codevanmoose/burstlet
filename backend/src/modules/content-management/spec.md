# Content Management Module Specification

## Overview
The content management module provides comprehensive content creation, organization, and lifecycle management for the Burstlet platform. It serves as the central hub for all content-related operations, integrating with AI generation and platform publishing modules.

## Van Moose Compliance
- ✅ **File Size**: All files under 500 lines
- ✅ **Module Isolation**: Self-contained with clear interfaces
- ✅ **Agent-First**: RESTful APIs with semantic operations
- ✅ **KISS Principle**: Simple, focused functionality
- ✅ **Type Safety**: Full TypeScript with Zod validation

## Architecture

### Components
1. **ContentManagementService** (`service.ts`) - Core business logic
2. **ContentManagementController** (`controller.ts`) - HTTP request handlers
3. **ContentManagementRoutes** (`routes.ts`) - Route definitions
4. **ContentManagementModule** (`module.ts`) - Module initialization
5. **Types** (`types.ts`) - TypeScript interfaces and schemas

### Dependencies
- **Internal**: Auth module (for user context)
- **External**: Prisma ORM, Zod validation

## Features

### Content CRUD Operations
- Create, read, update, delete content
- Support for multiple content types (VIDEO, BLOG, SOCIAL_POST, SCRIPT)
- Content status workflow (DRAFT → REVIEW → APPROVED → PUBLISHED → ARCHIVED)
- Rich metadata support
- Media attachment handling

### Content Organization
- **Tags**: Flexible tagging system with usage tracking
- **Categories**: Hierarchical categorization
- **Search**: Full-text search with filters
- **Sorting**: Multiple sort options (date, title, status)
- **Pagination**: Efficient content listing

### Content Versioning
- Automatic version tracking
- Change history with notes
- Version comparison
- Rollback capability
- Configurable retention policy

### Template System
- Create reusable content templates
- Variable substitution
- Public/private templates
- Usage tracking
- Template categories

### Content Calendar
- Schedule content for future publishing
- Multi-platform scheduling
- Reminder system
- Calendar views (month, week, day, list)
- Automatic publishing

### Import/Export
- Multiple formats (JSON, CSV, Markdown)
- Bulk import with mapping
- Media inclusion options
- Version export support

### Bulk Operations
- Mass delete/archive
- Bulk tagging
- Status updates
- Category assignment

## API Endpoints

### Content Management
```
POST   /api/v1/content              - Create content
GET    /api/v1/content              - List content
GET    /api/v1/content/stats        - Get statistics
GET    /api/v1/content/:id          - Get specific content
PUT    /api/v1/content/:id          - Update content
DELETE /api/v1/content/:id          - Delete content
GET    /api/v1/content/:id/versions - Get content versions
POST   /api/v1/content/:id/duplicate - Duplicate content
```

### Search & Organization
```
POST   /api/v1/content/search       - Search content
GET    /api/v1/content/tags         - Get user's tags
GET    /api/v1/content/categories   - Get categories
```

### Templates
```
POST   /api/v1/content/templates    - Create template
POST   /api/v1/content/templates/:id/apply - Apply template
```

### Calendar & Scheduling
```
GET    /api/v1/content/calendar     - Get calendar view
POST   /api/v1/content/schedule     - Schedule content
```

### Import/Export
```
POST   /api/v1/content/export       - Export content
POST   /api/v1/content/import       - Import content
```

### Bulk Operations
```
POST   /api/v1/content/bulk         - Perform bulk operation
```

### Utility
```
POST   /api/v1/content/preview      - Preview content
GET    /api/v1/content/health       - Health check
```

## Database Schema

### Content Table
```sql
id            String   @id @default(cuid())
userId        String
title         String
description   String?
type          ContentType
status        ContentStatus
generationId  String?  // Link to AI generation
tags          String[]
category      String?
metadata      Json?
content       Json?
mediaUrl      String?
thumbnailUrl  String?
version       Int      @default(1)
parentId      String?  // For versioning
createdAt     DateTime @default(now())
updatedAt     DateTime @updatedAt
publishedAt   DateTime?
scheduledAt   DateTime?
```

### ContentVersion Table
```sql
id            String   @id @default(cuid())
contentId     String
version       Int
title         String
description   String?
content       Json?
metadata      Json?
changedBy     String
changeNote    String?
createdAt     DateTime @default(now())
```

### ContentTemplate Table
```sql
id            String   @id @default(cuid())
userId        String
name          String
description   String?
type          ContentType
template      Json
tags          String[]
category      String?
usageCount    Int      @default(0)
isPublic      Boolean  @default(false)
createdAt     DateTime @default(now())
updatedAt     DateTime @updatedAt
```

### ContentCalendar Table
```sql
id            String   @id @default(cuid())
userId        String
contentId     String
scheduledDate DateTime
platforms     String[]
status        CalendarStatus
publishOptions Json?
reminders     DateTime[]
createdAt     DateTime @default(now())
updatedAt     DateTime @updatedAt
```

### ContentTag Table
```sql
id            String   @id @default(cuid())
userId        String
name          String
slug          String
color         String?
usageCount    Int      @default(0)
createdAt     DateTime @default(now())
```

## Content Workflow

### Status Transitions
```
DRAFT → REVIEW → APPROVED → PUBLISHED
  ↓        ↓         ↓          ↓
ARCHIVED ←─┴─────────┴──────────┘
```

### Publishing Flow
1. Content created in DRAFT status
2. User submits for REVIEW
3. Content APPROVED (manual or auto)
4. Scheduled or immediately PUBLISHED
5. Can be ARCHIVED at any time

## Security & Permissions

### Access Control
- User can only access their own content
- Template sharing with public/private flags
- Role-based permissions (future)

### Data Validation
- Title length limits (1-200 chars)
- Content size limits (configurable)
- File type restrictions
- Tag/category validation

### Privacy
- Soft delete for published content
- Version history retention
- Export data ownership

## Performance Optimization

### Caching Strategy
- Tag/category caching
- Template caching
- Search result caching

### Database Optimization
- Indexed fields: userId, type, status, tags
- Pagination for large datasets
- Lazy loading for content bodies

### Background Tasks
- Scheduled publishing
- Old draft cleanup
- Version pruning
- Tag usage updates

## Configuration Options

```typescript
{
  enableVersioning: boolean;    // Track content versions
  enableTemplates: boolean;     // Template system
  enableCalendar: boolean;      // Scheduling features
  enableImportExport: boolean;  // Import/export functionality
  maxContentSize: number;       // Max size in MB
  allowedFileTypes: string[];   // MIME types
}
```

## Error Handling

### Error Types
- `ContentError` - Content-related errors
- `TemplateError` - Template system errors
- `CalendarError` - Scheduling errors

### Common Error Codes
- `CONTENT_NOT_FOUND` - Content doesn't exist
- `CONTENT_NOT_APPROVED` - Cannot publish unapproved
- `ALREADY_SCHEDULED` - Content already scheduled
- `TEMPLATE_NOT_FOUND` - Template doesn't exist
- `QUOTA_EXCEEDED` - Storage limit reached

## Integration Points

### AI Generation Module
- Link generated content
- Apply AI enhancements
- Template generation

### Platform Integrations Module
- Publish scheduled content
- Multi-platform distribution
- Analytics feedback

### Analytics Module
- Content performance tracking
- Engagement metrics
- ROI analysis

## Future Enhancements

### Planned Features
- Collaborative editing
- Content approval workflows
- A/B testing support
- AI-powered suggestions
- Content recommendations

### Advanced Features
- Real-time collaboration
- Version branching/merging
- Advanced workflow engine
- Content marketplace
- API for external tools