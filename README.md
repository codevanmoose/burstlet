# Burstlet - AI-Powered Content Creation & Distribution Platform

## Overview

Burstlet is a comprehensive SaaS platform that automates content creation and distribution across multiple social media platforms. Users input a simple prompt, and the system generates videos using HailuoAI, distributes them across YouTube Shorts, TikTok, Instagram Reels, creates blog posts and tweets with OpenAI, and provides unified analytics tracking across all platforms.

## Features

### Core Capabilities ✅ MVP Complete
- **AI Content Generation**: 
  - Video creation with HailuoAI integration (complete with audio synthesis)
  - Text content with OpenAI GPT-4 for blogs and social posts
  - Smart prompt enhancement and cost estimation
  - Real-time generation status tracking with progress indicators
- **Multi-Platform Publishing**: 
  - YouTube Shorts with automated uploads and scheduling
  - TikTok with hashtag optimization and platform-specific formatting
  - Instagram Reels with cross-posting to feed
  - Twitter/X threads with media attachments
- **Content Management**: 
  - Advanced dashboard with table, grid, and calendar views
  - Template system for consistent branding
  - Version control and content history tracking
  - Bulk operations (select, delete, export, publish)
  - Advanced filtering by date, status, type, and platform
- **Analytics & Insights**: 
  - Unified metrics dashboard with key performance indicators
  - Time-series charts for views, engagement, and reach tracking
  - Platform breakdown with distribution analytics
  - Top performing content rankings with engagement metrics
  - Custom date range filtering and real-time updates
- **Team Collaboration** (Planned):
  - Multi-user workspaces
  - Role-based access control (Owner, Admin, Editor, Viewer)
  - Content approval workflows
  - Activity logs and audit trails

### Security & Compliance
- OAuth 2.0 authentication with all major platforms
- Two-factor authentication (2FA)
- API key management with scopes
- Rate limiting and DDoS protection
- GDPR compliance and data encryption

## Tech Stack

### Frontend ✅ Complete
- **Framework**: Next.js 14 with App Router
- **Styling**: TailwindCSS + shadcn/ui components
- **Language**: TypeScript with strict mode
- **Data Fetching**: TanStack Query (React Query) with automatic caching
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for analytics visualization
- **State**: Zustand for global state management (planned)
- **Testing**: Visual regression testing with Playwright

### Backend
- **Runtime**: Node.js 20+ with Express.js
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Queue**: Redis + BullMQ for job processing
- **Language**: TypeScript with strict mode
- **API**: RESTful with OpenAPI documentation
- **Testing**: Jest with supertest

### Infrastructure
- **Frontend Hosting**: Vercel with Edge Functions
- **Backend Hosting**: DigitalOcean App Platform
- **Database**: Supabase PostgreSQL with pooling
- **File Storage**: Supabase Storage for media
- **CDN**: Cloudflare for global distribution
- **Monitoring**: Custom monitoring module with APM

## Project Structure

```
burstlet/
├── CLAUDE.md                    # Living development journal
├── README.md                    # This file
├── modules/                     # Core functionality modules
│   ├── _manifest.json          # Module registry and dependencies
│   ├── auth/                   # Authentication & OAuth
│   ├── ai-generation/          # Video/content generation
│   ├── platform-integrations/  # Social media APIs
│   ├── content-management/     # Dashboard & content tools
│   ├── analytics/              # Metrics & reporting
│   ├── billing/                # Stripe integration
│   └── admin/                  # Admin panel
├── shared/                     # Cross-module utilities
│   ├── types/                  # TypeScript definitions
│   ├── utils/                  # Helper functions
│   └── constants/              # Configuration
├── frontend/                   # Next.js application
├── backend/                    # Node.js API server
├── infrastructure/             # Deployment configs
└── tests/                      # E2E tests
```

## Development Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Redis
- uv (for Python tooling)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Fill in your environment variables
   ```

4. Run database migrations:
   ```bash
   npm run db:migrate
   ```

5. Start development servers:
   ```bash
   npm run dev
   ```

## Scripts

### Development
- `npm run dev` - Start development servers
- `npm run build` - Build for production
- `npm run lint` - Run linting
- `npm run type-check` - Run type checking

### Testing
- `npm run test` - Run all tests
- `npm run test:visual` - Run visual regression tests
- `npm run test:visual:update` - Update visual test baselines
- `npm run test:e2e` - Run E2E tests (planned)

### Database
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:reset` - Reset database

## Architecture Principles

This project follows Van Moose development standards:

- **Modular Architecture**: Each feature is isolated in its own module
- **Agent-First Design**: APIs designed for AI agents with MCP compatibility
- **KISS Principle**: Keep It Simple, Stupid
- **YAGNI**: You Aren't Gonna Need It
- **Testing**: Comprehensive unit and E2E testing

## Contributing

1. Follow the modular architecture
2. Write tests for new features
3. Update documentation
4. Follow conventional commits
5. Keep files under 500 lines

## License

Private - All rights reserved

## Support

For support, email hello@burstlet.com or create an issue in the repository.