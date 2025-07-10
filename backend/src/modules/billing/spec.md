# Billing Module Specification

## Overview
The billing module provides comprehensive subscription management, payment processing, and usage tracking for the Burstlet platform. It integrates with Stripe for payment processing and implements tiered pricing with usage-based quotas.

## Van Moose Compliance
- ✅ **File Size**: All files under 500 lines
- ✅ **Module Isolation**: Self-contained with clear interfaces
- ✅ **Agent-First**: RESTful APIs with semantic operations
- ✅ **KISS Principle**: Simple, focused functionality
- ✅ **Type Safety**: Full TypeScript with Zod validation

## Architecture

### Components
1. **BillingService** (`service.ts`) - Core billing logic
2. **BillingController** (`controller.ts`) - HTTP request handlers
3. **BillingRoutes** (`routes.ts`) - Route definitions
4. **BillingModule** (`module.ts`) - Module initialization
5. **Types** (`types.ts`) - TypeScript interfaces and schemas

### Dependencies
- **Internal**: Auth module, AI Generation module
- **External**: Stripe SDK, Prisma ORM, Zod validation

## Features

### Subscription Plans
Four tiers with different features and limits:

#### Free Tier
- Price: $0/month
- AI Generations: 10 total (2 videos, 3 blogs, 5 social posts)
- Platform Integrations: 2 platforms
- Storage: 1 GB
- Analytics: 7 days history
- Support: Community

#### Pro Tier
- Price: $29/month or $290/year
- AI Generations: 100 total (20 videos, 30 blogs, 50 social posts)
- Platform Integrations: All platforms
- Storage: 50 GB
- Analytics: 90 days history
- Support: Priority
- Features: Custom branding

#### Business Tier
- Price: $99/month or $990/year
- AI Generations: 500 total (100 videos, 150 blogs, 250 social posts)
- Platform Integrations: All platforms
- Storage: 200 GB
- Analytics: Unlimited history
- Team: Up to 5 members
- Features: API access, white label

#### Enterprise Tier
- Price: $499/month or $4990/year
- AI Generations: Unlimited
- Platform Integrations: All platforms
- Storage: Unlimited
- Analytics: Unlimited
- Team: Unlimited members
- Features: Custom integrations, SLA

### Payment Processing
- Stripe integration for secure payments
- Support for credit/debit cards
- Multiple payment methods per user
- Default payment method management
- PCI compliance through Stripe

### Subscription Management
- Create new subscriptions via Stripe Checkout
- Upgrade/downgrade plans with proration
- Switch between monthly/yearly billing
- Cancel subscriptions (at period end)
- Trial periods for new users
- Subscription status tracking

### Usage Tracking
- Real-time usage monitoring
- Quota enforcement per plan limits
- Usage types:
  - AI video generations
  - AI blog generations
  - AI social post generations
  - AI script generations
  - Content storage (GB)
  - API calls

### Invoice Management
- Automatic invoice generation
- Invoice history
- PDF downloads via Stripe
- Line item details
- Multiple currencies support

### Webhook Handling
- Stripe webhook integration
- Event processing:
  - Subscription created/updated/deleted
  - Payment succeeded/failed
  - Invoice paid/payment failed
- Automatic status updates
- Error recovery

### Billing Analytics
- Monthly Recurring Revenue (MRR)
- Churn rate calculation
- Trial conversion tracking
- Plan distribution
- Revenue forecasting

## API Endpoints

### Public Endpoints
```
GET    /api/v1/billing/plans         - Get available plans
GET    /api/v1/billing/health        - Health check
POST   /api/v1/billing/webhook       - Stripe webhook
```

### Subscription Management
```
POST   /api/v1/billing/checkout      - Create checkout session
GET    /api/v1/billing/subscription  - Get current subscription
PUT    /api/v1/billing/subscription  - Update subscription
DELETE /api/v1/billing/subscription  - Cancel subscription
```

### Payment Methods
```
GET    /api/v1/billing/payment-methods     - List payment methods
POST   /api/v1/billing/payment-methods     - Add payment method
PUT    /api/v1/billing/payment-methods/:id - Update payment method
DELETE /api/v1/billing/payment-methods/:id - Remove payment method
```

### Usage & Invoices
```
GET    /api/v1/billing/usage         - Get usage summary
POST   /api/v1/billing/usage         - Track usage (internal)
GET    /api/v1/billing/invoices      - Get invoices
```

### Overview & Preview
```
GET    /api/v1/billing/overview      - Get billing overview
POST   /api/v1/billing/preview-upgrade - Preview plan upgrade
```

## Database Schema

### Subscription Table
```sql
id                    String   @id @default(cuid())
userId                String   @unique
planId                String
tier                  String
status                String
billingCycle          String
currentPeriodStart    DateTime
currentPeriodEnd      DateTime
cancelAtPeriodEnd     Boolean
stripeSubscriptionId  String   @unique
stripeCustomerId      String
metadata              Json?
createdAt             DateTime @default(now())
updatedAt             DateTime @updatedAt
```

### PaymentMethod Table
```sql
id                      String   @id @default(cuid())
userId                  String
type                    String
isDefault               Boolean
stripePaymentMethodId   String   @unique
card                    Json?
bankAccount             Json?
createdAt               DateTime @default(now())
```

### UsageRecord Table
```sql
id              String   @id @default(cuid())
userId          String
subscriptionId  String
type            String
quantity        Float
metadata        Json?
timestamp       DateTime @default(now())
billingPeriod   DateTime
```

### Invoice Table
```sql
id                String   @id @default(cuid())
userId            String
subscriptionId    String
amount            Float
currency          String
status            String
dueDate           DateTime?
paidAt            DateTime?
stripeInvoiceId   String   @unique
lineItems         Json
downloadUrl       String?
createdAt         DateTime @default(now())
```

### BillingEvent Table
```sql
id              String   @id @default(cuid())
userId          String?
type            String
data            Json
stripeEventId   String   @unique
processed       Boolean
processedAt     DateTime?
error           String?
createdAt       DateTime @default(now())
```

## Quota Management

### Enforcement
- Pre-action quota checks
- Real-time usage tracking
- Graceful degradation
- Clear error messages

### Quota Types
- Hard limits: Block action when exceeded
- Soft limits: Allow with warnings
- Unlimited: No restrictions (-1 value)

### Usage Aggregation
- Per billing period tracking
- Historical usage retention
- Usage analytics and trends

## Webhook Security

### Signature Verification
- Stripe webhook signatures
- Replay attack prevention
- Idempotent event processing

### Error Handling
- Automatic retries
- Dead letter queue
- Manual reconciliation

## Configuration Options

```typescript
{
  stripeSecretKey: string;        // Required
  stripeWebhookSecret: string;    // Required for webhooks
  trialPeriodDays: number;        // Default trial length
  defaultPlanId: string;          // Default plan for new users
  currency: string;               // Default currency
  taxRates?: string[];            // Stripe tax rate IDs
  enableWebhooks: boolean;        // Enable webhook processing
  enableUsageTracking: boolean;   // Enable automatic tracking
  usageCheckInterval: number;     // Minutes between checks
}
```

## Error Handling

### Error Types
- `BillingError` - General billing errors
- `PaymentError` - Payment-related errors
- `QuotaError` - Usage quota errors

### Common Error Codes
- `USER_NOT_FOUND` - User doesn't exist
- `SUBSCRIPTION_EXISTS` - Already subscribed
- `NO_SUBSCRIPTION` - No active subscription
- `INVALID_PLAN` - Invalid plan ID
- `QUOTA_EXCEEDED` - Usage limit reached
- `PAYMENT_METHOD_NOT_FOUND` - Payment method not found
- `PAYMENT_FAILED` - Payment processing failed

## Integration Points

### AI Generation Module
- Usage tracking on generation
- Quota checks before generation
- Usage metadata collection

### Auth Module
- User context for all operations
- Stripe customer ID storage
- Subscription status in JWT

### Analytics Module
- Revenue metrics reporting
- Usage analytics
- Conversion tracking

## Security Considerations

### Payment Security
- No credit card storage
- PCI compliance via Stripe
- Secure token handling

### Access Control
- User-scoped operations
- Admin override capabilities
- Audit logging

### Data Privacy
- Minimal data retention
- Secure webhook handling
- Encrypted sensitive data

## Testing Considerations

### Development Mode
- Test Stripe keys
- Simulated webhooks
- Test subscription creation
- Quota override options

### Test Scenarios
- Subscription lifecycle
- Payment failures
- Quota enforcement
- Webhook processing
- Plan changes

## Future Enhancements

### Planned Features
- Coupon/discount system
- Referral program
- Usage-based pricing
- Team billing
- Invoice customization

### Advanced Features
- Revenue recognition
- Tax automation
- Multi-currency support
- Dunning management
- Subscription analytics