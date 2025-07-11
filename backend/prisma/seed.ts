import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create subscription plans
  const plans = [
    {
      id: 'free',
      name: 'Free',
      description: 'Perfect for trying out Burstlet',
      priceMonthly: 0,
      priceYearly: 0,
      stripePriceIdMonthly: 'price_free_monthly',
      stripePriceIdYearly: 'price_free_yearly',
      features: {
        videoGenerations: 5,
        blogPosts: 10,
        socialPosts: 20,
        analytics: 'basic',
        support: 'community',
      },
      limits: {
        videoGenerationsPerMonth: 5,
        blogPostsPerMonth: 10,
        socialPostsPerMonth: 20,
        storageGB: 1,
        teamMembers: 1,
      },
      sortOrder: 0,
    },
    {
      id: 'starter',
      name: 'Starter',
      description: 'For individual content creators',
      priceMonthly: 29,
      priceYearly: 290,
      stripePriceIdMonthly: 'price_starter_monthly',
      stripePriceIdYearly: 'price_starter_yearly',
      features: {
        videoGenerations: 100,
        blogPosts: 500,
        socialPosts: 'unlimited',
        analytics: 'advanced',
        support: 'email',
      },
      limits: {
        videoGenerationsPerMonth: 100,
        blogPostsPerMonth: 500,
        socialPostsPerMonth: -1, // unlimited
        storageGB: 50,
        teamMembers: 1,
      },
      sortOrder: 1,
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'For growing content teams',
      priceMonthly: 99,
      priceYearly: 990,
      stripePriceIdMonthly: 'price_professional_monthly',
      stripePriceIdYearly: 'price_professional_yearly',
      features: {
        videoGenerations: 500,
        blogPosts: 'unlimited',
        socialPosts: 'unlimited',
        analytics: 'advanced',
        support: 'priority',
        customBranding: true,
        teamCollaboration: true,
      },
      limits: {
        videoGenerationsPerMonth: 500,
        blogPostsPerMonth: -1,
        socialPostsPerMonth: -1,
        storageGB: 200,
        teamMembers: 5,
      },
      sortOrder: 2,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For large teams and agencies',
      priceMonthly: 299,
      priceYearly: 2990,
      stripePriceIdMonthly: 'price_enterprise_monthly',
      stripePriceIdYearly: 'price_enterprise_yearly',
      features: {
        videoGenerations: 'unlimited',
        blogPosts: 'unlimited',
        socialPosts: 'unlimited',
        analytics: 'enterprise',
        support: 'dedicated',
        customBranding: true,
        teamCollaboration: true,
        apiAccess: true,
        sla: true,
      },
      limits: {
        videoGenerationsPerMonth: -1,
        blogPostsPerMonth: -1,
        socialPostsPerMonth: -1,
        storageGB: 1000,
        teamMembers: -1,
      },
      sortOrder: 3,
    },
  ];

  // Upsert plans
  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { id: plan.id },
      update: plan,
      create: plan,
    });
    console.log(`✅ Created/Updated plan: ${plan.name}`);
  }

  // Create a demo user (only in development)
  if (process.env.NODE_ENV !== 'production') {
    const demoPassword = await bcrypt.hash('demo123', 10);
    
    const demoUser = await prisma.user.upsert({
      where: { email: 'demo@burstlet.com' },
      update: {},
      create: {
        email: 'demo@burstlet.com',
        passwordHash: demoPassword,
        name: 'Demo User',
        emailVerified: true,
        role: 'CREATOR',
      },
    });
    
    console.log(`✅ Created demo user: ${demoUser.email}`);

    // Create a subscription for demo user
    await prisma.subscription.upsert({
      where: { userId: demoUser.id },
      update: {},
      create: {
        userId: demoUser.id,
        stripeCustomerId: 'cus_demo_' + demoUser.id,
        stripeSubscriptionId: 'sub_demo_' + demoUser.id,
        planId: 'starter',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });
    
    console.log(`✅ Created demo subscription`);
  }

  // Create AI providers
  const aiProviders = [
    {
      name: 'openai',
      status: 'ACTIVE',
      rateLimit: 3000,
      costPerRequest: 0.02,
      qualityRating: 4.5,
    },
    {
      name: 'hailuoai',
      status: 'ACTIVE',
      rateLimit: 100,
      costPerRequest: 0.5,
      qualityRating: 4.8,
    },
    {
      name: 'minimax',
      status: 'ACTIVE',
      rateLimit: 500,
      costPerRequest: 0.1,
      qualityRating: 4.2,
    },
  ];

  for (const provider of aiProviders) {
    await prisma.aIProvider.upsert({
      where: { name: provider.name },
      update: provider,
      create: provider,
    });
    console.log(`✅ Created/Updated AI provider: ${provider.name}`);
  }

  console.log('🎉 Database seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });