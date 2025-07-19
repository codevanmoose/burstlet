#!/bin/bash

# Database Setup Script for Burstlet
echo "🔧 Setting up Burstlet Database"
echo "==============================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if we're in the right directory
if [ ! -f "backend/prisma/schema.prisma" ]; then
    echo -e "${RED}❌ Error: Not in Burstlet root directory${NC}"
    echo "Please run this script from the project root"
    exit 1
fi

cd backend

echo -e "\n${BLUE}1. Checking environment...${NC}"
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}⚠️  DATABASE_URL not set in environment${NC}"
    echo "Loading from .env file..."
    if [ -f ".env" ]; then
        export $(cat .env | grep DATABASE_URL | xargs)
    fi
fi

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL still not found${NC}"
    echo "Please set DATABASE_URL environment variable"
    exit 1
fi

echo -e "${GREEN}✅ Database URL found${NC}"

echo -e "\n${BLUE}2. Installing Prisma CLI...${NC}"
npm install -D prisma@latest @prisma/client@latest

echo -e "\n${BLUE}3. Generating Prisma Client...${NC}"
npx prisma generate

echo -e "\n${BLUE}4. Running database migrations...${NC}"
echo "This will create all tables in your Supabase database"
echo -e "${YELLOW}Continue? (y/n)${NC}"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "Running migrations..."
    npx prisma migrate deploy
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database migrations completed successfully${NC}"
    else
        echo -e "${RED}❌ Migration failed${NC}"
        echo "Trying to push schema directly..."
        npx prisma db push
    fi
else
    echo "Skipping migrations"
fi

echo -e "\n${BLUE}5. Testing database connection...${NC}"
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    await prisma.\$connect();
    const count = await prisma.user.count();
    console.log('✅ Database connected successfully');
    console.log('   Users in database:', count);
    await prisma.\$disconnect();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

test();
"

echo -e "\n${BLUE}6. Setting up Supabase Storage bucket...${NC}"
echo "Please manually create a storage bucket named 'burstlet-media' in Supabase dashboard"
echo "URL: https://supabase.com/dashboard/project/cmfdlebyqgjifwmfvquu/storage/buckets"

echo -e "\n${GREEN}✅ Database setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Deploy the updated backend with full Express server"
echo "2. Test user registration and login"
echo "3. Configure storage policies in Supabase"