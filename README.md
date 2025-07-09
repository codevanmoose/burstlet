# Burstlet.com - AI-Powered Content Creation & Distribution Platform

## Overview

Burstlet.com is a SaaS platform that automates content creation and distribution across multiple social media platforms. Users input a simple prompt, and the system generates videos, distributes them across YouTube Shorts, TikTok, Instagram Reels, creates blog posts and tweets, and provides analytics tracking.

## Features

- **Prompt-Based Content Generation**: Transform text prompts into videos using AI
- **Multi-Platform Publishing**: Simultaneous distribution across all major social platforms
- **Content Management**: Dashboard, calendar, and editing tools
- **Analytics & Reporting**: Unified metrics and performance tracking
- **Social Account Management**: OAuth integrations for all platforms

## Tech Stack

### Frontend
- Next.js 14 with App Router
- TailwindCSS + shadcn/ui
- TypeScript
- Zustand for state management

### Backend
- Node.js with Express
- PostgreSQL with Prisma ORM
- Redis + BullMQ for queues
- TypeScript

### Infrastructure
- **Frontend**: Vercel
- **Backend**: DigitalOcean App Platform
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage
- **Auth**: Supabase Auth

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

- `npm run dev` - Start development servers
- `npm run build` - Build for production
- `npm run test` - Run all tests
- `npm run test:e2e` - Run E2E tests
- `npm run lint` - Run linting
- `npm run type-check` - Run type checking

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