# 🚀 Burstlet - AI-Powered Content Creation & Distribution Platform

[![Built with Van Moose](https://img.shields.io/badge/Built%20with-Van%20Moose-blue)](https://vanmoose.dev)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Burstlet is a cutting-edge AI-powered platform that automates content creation and distribution across multiple social media platforms. Generate engaging videos, blog posts, and social media content with AI, then automatically publish to YouTube, TikTok, Instagram, and Twitter.

## ✨ Features

### 🎬 AI Content Generation
- **Video Generation**: Create stunning videos using HailuoAI with custom prompts
- **Audio Integration**: Add AI-generated voiceovers and background music with MiniMax
- **Blog Creation**: Generate SEO-optimized blog posts with OpenAI GPT-4
- **Social Posts**: Create platform-optimized content for all major social networks
### 📱 Multi-Platform Distribution
- **YouTube**: Automatic Shorts upload with optimized titles and descriptions
- **TikTok**: Direct posting with trending hashtags and captions
- **Instagram**: Reels and posts with automatic formatting
- **Twitter/X**: Thread creation and media uploads
### 📊 Analytics & Insights
- Unified analytics dashboard across all platforms
- Performance tracking and engagement metrics
- Content calendar with scheduling
- ROI tracking for each piece of content

### 💳 Monetization & Billing
- Flexible subscription plans with Stripe integration
- Usage-based pricing for AI generations
- Team collaboration features
- White-label options for agencies


## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Styling**: TailwindCSS + shadcn/ui components
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts for analytics

### Backend
- **Runtime**: Node.js with Express
- **Database**: PostgreSQL with Prisma ORM
- **Queue**: Redis + BullMQ for job processing
- **Storage**: Supabase Storage for media files
- **Auth**: Supabase Auth with OAuth providers

### AI Services
- **Video Generation**: HailuoAI API
- **Audio Generation**: MiniMax API
- **Text Generation**: OpenAI GPT-4 / Claude API
- **Video Processing**: FFmpeg for audio-video synthesis

### Infrastructure
- **Frontend Hosting**: Vercel
- **Backend Hosting**: DigitalOcean App Platform
- **Database**: Supabase PostgreSQL
- **CDN**: Cloudflare for media delivery

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Redis server
- FFmpeg (for video processing)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/burstlet.git
cd burstlet
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

4. Set up the database:
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

5. Start the development servers:

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm run dev
```

Queue Worker:
```bash
cd backend
npm run worker
```

## 📁 Project Structure

```
burstlet/
├── frontend/                # Next.js frontend application
│   ├── src/
│   │   ├── app/            # App router pages
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and API client
│   │   ├── store/          # Zustand state management
│   │   └── types/          # TypeScript definitions
│   └── public/             # Static assets
│
├── backend/                 # Node.js backend application
│   ├── src/
│   │   ├── modules/        # Feature modules
│   │   │   ├── auth/       # Authentication & authorization
│   │   │   ├── ai-generation/  # AI content generation
│   │   │   ├── platform-integrations/  # Social media APIs
│   │   │   ├── content-management/     # Content CRUD
│   │   │   ├── analytics/  # Analytics aggregation
│   │   │   ├── billing/    # Stripe integration
│   │   │   └── ...         # Other modules
│   │   └── shared/         # Shared utilities
│   └── prisma/             # Database schema
│
├── tests/                   # Test suites
│   ├── visual/             # Visual regression tests
│   └── e2e/                # End-to-end tests
│
└── docs/                    # Documentation
```

## 🧪 Testing

Run all tests:
```bash
npm test
```

Run visual regression tests:
```bash
npm run test:visual
```

Update visual baselines:
```bash
npm run test:visual:update
```

## 📚 API Documentation

The API follows RESTful principles and is documented with OpenAPI/Swagger. Once the backend is running, visit:

```
http://localhost:3001/api-docs
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with the Van Moose modular architecture
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Video generation powered by [HailuoAI](https://hailuoai.video)
- Audio generation by [MiniMax](https://minimax.io)

## 📞 Support

- Documentation: [docs.burstlet.com](https://docs.burstlet.com)
- Discord: [Join our community](https://discord.gg/burstlet)
- Email: support@burstlet.com

---

Made with ❤️ by the Burstlet Team