# MODULE: Billing

## Purpose
Manages subscription billing, usage tracking, payment processing through Stripe, and provides a comprehensive billing system for Burstlet's tiered pricing model.

## Features
- Stripe subscription management
- Usage-based billing tracking
- Multiple pricing tiers (Free, Pro, Business)
- Payment method management
- Invoice generation and history
- Usage limits enforcement
- Billing analytics and reporting
- Proration handling
- Failed payment recovery
- Tax calculation support

## User Stories
- As a user, I want to subscribe to a paid plan so that I can access premium features
- As a user, I want to track my usage so that I know how much I'm consuming
- As a user, I want to manage my payment methods so that I can update billing information
- As a user, I want to view my billing history so that I can track payments
- As a user, I want to upgrade/downgrade plans so that I can adjust to my needs
- As a user, I want usage alerts so that I know when I'm approaching limits
- As an admin, I want to track revenue metrics so that I can analyze business performance

## Data Models
```yaml
Subscription:
  id: uuid (PK)
  user_id: uuid (FK -> User.id)
  stripe_subscription_id: string (unique)
  stripe_customer_id: string
  plan_id: string
  status: enum (active, past_due, canceled, unpaid, incomplete)
  current_period_start: timestamp
  current_period_end: timestamp
  cancel_at_period_end: boolean
  canceled_at: timestamp (nullable)
  trial_start: timestamp (nullable)
  trial_end: timestamp (nullable)
  metadata: jsonb
  created_at: timestamp
  updated_at: timestamp

Plan:
  id: string (PK)
  name: string
  description: text
  price_monthly: decimal
  price_yearly: decimal
  currency: string
  stripe_price_id_monthly: string
  stripe_price_id_yearly: string
  features: jsonb
  limits: jsonb
  is_active: boolean
  sort_order: integer
  created_at: timestamp
  updated_at: timestamp

UsageRecord:
  id: uuid (PK)
  user_id: uuid (FK -> User.id)
  subscription_id: uuid (FK -> Subscription.id)
  usage_type: enum (video_generation, api_calls, storage_gb, platform_connections)
  quantity: integer
  recorded_at: timestamp
  billing_period_start: timestamp
  billing_period_end: timestamp
  metadata: jsonb
  created_at: timestamp

Invoice:
  id: uuid (PK)
  user_id: uuid (FK -> User.id)
  subscription_id: uuid (FK -> Subscription.id)
  stripe_invoice_id: string (unique)
  number: string
  status: enum (draft, open, paid, void, uncollectible)
  amount_total: decimal
  amount_paid: decimal
  currency: string
  invoice_pdf: string (nullable)
  due_date: timestamp (nullable)
  paid_at: timestamp (nullable)
  created_at: timestamp
  updated_at: timestamp

PaymentMethod:
  id: uuid (PK)
  user_id: uuid (FK -> User.id)
  stripe_payment_method_id: string (unique)
  type: enum (card, bank_account, paypal)
  brand: string (nullable)
  last_four: string (nullable)
  exp_month: integer (nullable)
  exp_year: integer (nullable)
  is_default: boolean
  metadata: jsonb
  created_at: timestamp
  updated_at: timestamp

BillingEvent:
  id: uuid (PK)
  user_id: uuid (FK -> User.id)
  event_type: enum (subscription_created, subscription_updated, payment_succeeded, payment_failed, usage_recorded)
  stripe_event_id: string (nullable)
  event_data: jsonb
  processed: boolean
  error_message: text (nullable)
  created_at: timestamp
  processed_at: timestamp (nullable)
```

## API Endpoints
| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | /api/v1/billing/subscription | Get user's subscription details | Yes |
| POST | /api/v1/billing/subscription | Create new subscription | Yes |
| PUT | /api/v1/billing/subscription | Update subscription | Yes |
| DELETE | /api/v1/billing/subscription | Cancel subscription | Yes |
| GET | /api/v1/billing/plans | List available plans | No |
| GET | /api/v1/billing/usage | Get current usage metrics | Yes |
| GET | /api/v1/billing/invoices | List user's invoices | Yes |
| GET | /api/v1/billing/invoices/{id} | Get specific invoice | Yes |
| GET | /api/v1/billing/payment-methods | List payment methods | Yes |
| POST | /api/v1/billing/payment-methods | Add payment method | Yes |
| PUT | /api/v1/billing/payment-methods/{id} | Update payment method | Yes |
| DELETE | /api/v1/billing/payment-methods/{id} | Remove payment method | Yes |
| POST | /api/v1/billing/portal | Create customer portal session | Yes |
| POST | /api/v1/billing/webhooks/stripe | Handle Stripe webhooks | No |

## Dependencies
- Internal: auth (user authentication)
- External:
  - Stripe API (payment processing)
  - Stripe CLI (webhook testing)
  - Tax calculation service (optional)

## Success Criteria
- [ ] Users can subscribe to any plan successfully
- [ ] Payment processing works for all supported methods
- [ ] Usage tracking is accurate and real-time
- [ ] Billing limits are enforced properly
- [ ] Invoice generation works correctly
- [ ] Plan changes handle proration accurately
- [ ] Failed payment recovery works automatically
- [ ] Webhook processing is reliable
- [ ] Customer portal integration functions properly
- [ ] Tax calculations are accurate (if applicable)

## Error Handling
- Payment declined: 402 Payment Required with decline reason
- Invalid plan: 400 Bad Request
- Subscription not found: 404 Not Found
- Usage limit exceeded: 429 Too Many Requests
- Stripe API error: 503 Service Unavailable
- Webhook validation failed: 400 Bad Request
- Card expired: 402 Payment Required with renewal prompt

## Pricing Tiers

### Free Tier
```yaml
Price: $0/month
Features:
  - 5 videos per month
  - 2 connected accounts per platform
  - Basic analytics
  - 720p video quality
  - Community support
  - 1 GB storage

Limits:
  video_generation: 5
  platform_connections: 8  # 2 per platform (4 platforms)
  storage_gb: 1
  analytics_retention_days: 30
```

### Pro Tier
```yaml
Price: $19/month or $190/year (16% discount)
Features:
  - 100 videos per month
  - Unlimited platform connections
  - Advanced analytics
  - 1080p video quality
  - Priority support
  - Team collaboration (up to 3 members)
  - Custom branding removal
  - Scheduling up to 30 days
  - 10 GB storage

Limits:
  video_generation: 100
  platform_connections: -1  # unlimited
  storage_gb: 10
  analytics_retention_days: 365
  team_members: 3
  scheduling_days: 30
```

### Business Tier
```yaml
Price: $49/month or $490/year (16% discount)
Features:
  - 500 videos per month
  - White-label options
  - API access
  - 4K video quality
  - Dedicated support
  - Team collaboration (up to 10 members)
  - Advanced scheduling
  - Custom integrations
  - 50 GB storage
  - Priority queue

Limits:
  video_generation: 500
  platform_connections: -1  # unlimited
  storage_gb: 50
  analytics_retention_days: 1095  # 3 years
  team_members: 10
  scheduling_days: 90
  api_calls_per_month: 10000
```

## Usage Tracking System

### Metered Usage
```yaml
Video Generation:
  - Track each successful generation
  - Count failed generations after 3 attempts
  - Reset monthly on subscription anniversary
  - Real-time usage updates

Storage Usage:
  - Track total file storage in GB
  - Include videos, thumbnails, exports
  - Update hourly
  - Automatic cleanup of old content

API Calls:
  - Track all authenticated API requests
  - Exclude health checks and auth requests
  - Reset monthly
  - Rate limiting integration

Platform Connections:
  - Track active OAuth connections
  - Include all connected accounts
  - Real-time validation
  - Automatic cleanup of expired tokens
```

### Usage Enforcement
```yaml
Soft Limits:
  - Warn at 80% usage
  - Email notification at 90%
  - Dashboard alerts and banners

Hard Limits:
  - Block new generations at 100%
  - Queue requests for next billing cycle
  - Upgrade prompts and options
  - Grace period for existing processes
```

## Subscription Management

### Plan Changes
```yaml
Upgrades:
  - Immediate access to new features
  - Proration for remaining period
  - Usage limits updated instantly
  - Email confirmation sent

Downgrades:
  - Changes at next billing cycle
  - Feature access remains until cycle end
  - Usage tracking for new limits
  - Data retention policies apply

Cancellations:
  - Access until period end
  - No further billing
  - Data retention period
  - Re-activation options
```

### Payment Processing
```yaml
Supported Payment Methods:
  - Credit/debit cards (Visa, Mastercard, Amex)
  - Digital wallets (Apple Pay, Google Pay)
  - Bank transfers (ACH for US customers)
  - PayPal (via Stripe)

Payment Flow:
  1. Collect payment method via Stripe Elements
  2. Create customer in Stripe
  3. Attach payment method
  4. Create subscription
  5. Process initial payment
  6. Handle webhook confirmations
  7. Activate subscription features
```

## Webhook Handling

### Stripe Webhook Events
```yaml
Subscription Events:
  - customer.subscription.created
  - customer.subscription.updated
  - customer.subscription.deleted
  - customer.subscription.trial_will_end

Payment Events:
  - invoice.payment_succeeded
  - invoice.payment_failed
  - payment_method.attached
  - payment_method.detached

Processing:
  - Verify webhook signature
  - Idempotent event processing
  - Retry failed webhook processing
  - Dead letter queue for failed events
  - Real-time status updates
```

## Failed Payment Recovery

### Recovery Flow
```yaml
Payment Failed:
  1. Mark subscription as past_due
  2. Send email notification
  3. Retain access for 3 days
  4. Retry payment after 3 days
  5. Retry payment after 7 days
  6. Final retry after 14 days
  7. Cancel subscription if all retries fail

Recovery Actions:
  - Update payment method prompts
  - Customer portal access
  - Email reminders
  - In-app notifications
  - Support contact options
```

## Security Considerations
- PCI DSS compliance via Stripe
- Webhook signature verification
- Encrypted storage of sensitive data
- Secure API endpoint access
- Rate limiting on billing endpoints
- Fraud detection integration
- Data anonymization for analytics

## Testing Requirements
- Unit tests for billing calculations
- Integration tests with Stripe API
- Webhook testing with Stripe CLI
- E2E tests for subscription flows
- Load tests for usage tracking
- Security tests for payment flows

## Performance Requirements
- Subscription creation < 5 seconds
- Usage tracking updates < 1 second
- Invoice generation < 10 seconds
- Webhook processing < 30 seconds
- Payment method updates < 3 seconds

## Monitoring and Logging
- Track subscription conversion rates
- Monitor payment success/failure rates
- Log all billing events and changes
- Alert on webhook processing failures
- Track usage pattern analytics
- Monitor Stripe API response times