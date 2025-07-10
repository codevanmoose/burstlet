#!/bin/bash

# Burstlet Development Setup Script

echo "🚀 Setting up Burstlet development environment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}PostgreSQL is not installed. You'll need it for local development.${NC}"
fi

# Check Redis
if ! command -v redis-cli &> /dev/null; then
    echo -e "${YELLOW}Redis is not installed. You'll need it for queue processing.${NC}"
fi

# Install dependencies
echo -e "${GREEN}Installing dependencies...${NC}"
npm install

# Set up environment files
echo -e "${GREEN}Setting up environment files...${NC}"

# Frontend .env.local
if [ ! -f frontend/.env.local ]; then
    cp frontend/.env.example frontend/.env.local
    echo -e "${YELLOW}Created frontend/.env.local - Please update with your API keys${NC}"
fi

# Backend .env
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo -e "${YELLOW}Created backend/.env - Please update with your API keys${NC}"
fi

# Database setup
echo -e "${GREEN}Setting up database...${NC}"
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations (only if database is configured)
if [ ! -z "$DATABASE_URL" ]; then
    npx prisma migrate dev
    echo -e "${GREEN}Database migrations completed${NC}"
else
    echo -e "${YELLOW}Skipping database migrations - DATABASE_URL not set${NC}"
fi

cd ..

# Create necessary directories
echo -e "${GREEN}Creating directories...${NC}"
mkdir -p backend/uploads
mkdir -p backend/logs
mkdir -p frontend/public/uploads

# Git hooks setup
echo -e "${GREEN}Setting up git hooks...${NC}"
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Run linting before commit
npm run lint
EOF
chmod +x .git/hooks/pre-commit

# Success message
echo -e "${GREEN}✅ Setup completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Update environment variables in:"
echo "   - frontend/.env.local"
echo "   - backend/.env"
echo ""
echo "2. Start development servers:"
echo "   - Backend: cd backend && npm run dev"
echo "   - Frontend: cd frontend && npm run dev"
echo "   - Worker: cd backend && npm run worker:dev"
echo ""
echo "3. Access the application:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:3001"
echo "   - API Docs: http://localhost:3001/api-docs"
echo ""
echo -e "${GREEN}Happy coding! 🎉${NC}"