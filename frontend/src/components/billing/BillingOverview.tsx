'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription, useUsageStats } from '@/hooks/useBilling';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { AlertCircle, CheckCircle, Clock, CreditCard, Package, Zap } from 'lucide-react';
import { format } from 'date-fns';

export function BillingOverview() {
  const { data: subscription, isLoading: subscriptionLoading } = useSubscription();
  const { data: usage, isLoading: usageLoading } = useUsageStats();

  if (subscriptionLoading || usageLoading) {
    return <BillingOverviewSkeleton />;
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Subscription</CardTitle>
          <CardDescription>
            Choose a plan to start creating amazing content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button>View Available Plans</Button>
        </CardContent>
      </Card>
    );
  }

  const statusColor = {
    active: 'bg-green-500',
    cancelled: 'bg-red-500',
    past_due: 'bg-yellow-500',
    trialing: 'bg-blue-500',
    paused: 'bg-gray-500',
  }[subscription.status];

  const statusIcon = {
    active: CheckCircle,
    cancelled: AlertCircle,
    past_due: CreditCard,
    trialing: Clock,
    paused: Clock,
  }[subscription.status];

  const StatusIcon = statusIcon || CheckCircle;

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your subscription details</CardDescription>
            </div>
            <Badge className={statusColor}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {subscription.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">{subscription.plan.name}</h3>
              <p className="text-gray-600">{subscription.plan.description}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">
                {formatCurrency(subscription.plan.price, subscription.plan.currency)}
              </p>
              <p className="text-gray-600">per {subscription.plan.interval}</p>
            </div>
          </div>

          {subscription.cancelAtPeriodEnd && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Subscription ending
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Your subscription will end on{' '}
                    {format(new Date(subscription.currentPeriodEnd), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600">
              Current period: {format(new Date(subscription.currentPeriodStart), 'MMM d')} -{' '}
              {format(new Date(subscription.currentPeriodEnd), 'MMM d, yyyy')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      {usage && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <UsageCard
            title="Video Generations"
            icon={Zap}
            used={usage.videoGenerations.used}
            limit={usage.videoGenerations.limit}
            percentage={usage.videoGenerations.percentage}
          />
          <UsageCard
            title="Blog Posts"
            icon={Package}
            used={usage.blogPosts.used}
            limit={usage.blogPosts.limit}
            percentage={usage.blogPosts.percentage}
          />
          <UsageCard
            title="Social Posts"
            icon={Package}
            used={usage.socialPosts.used}
            limit={usage.socialPosts.limit}
            percentage={usage.socialPosts.percentage}
          />
          <UsageCard
            title="Storage"
            icon={Package}
            used={usage.storage.used}
            limit={usage.storage.limit}
            percentage={usage.storage.percentage}
            unit="GB"
          />
          <UsageCard
            title="API Requests"
            icon={Zap}
            used={usage.apiRequests.used}
            limit={usage.apiRequests.limit}
            percentage={usage.apiRequests.percentage}
          />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Billing Period</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{usage.billingPeriod.daysRemaining}</p>
              <p className="text-sm text-gray-600">days remaining</p>
              <p className="text-xs text-gray-500 mt-2">
                Resets on {format(new Date(usage.billingPeriod.end), 'MMM d, yyyy')}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function UsageCard({
  title,
  icon: Icon,
  used,
  limit,
  percentage,
  unit = '',
}: {
  title: string;
  icon: React.ElementType;
  used: number;
  limit: number;
  percentage: number;
  unit?: string;
}) {
  const isUnlimited = limit === -1;
  const displayLimit = isUnlimited ? '∞' : `${limit}${unit ? ' ' + unit : ''}`;
  const displayUsed = `${used}${unit ? ' ' + unit : ''}`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <Icon className="w-4 h-4 text-gray-400" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end justify-between">
          <p className="text-2xl font-bold">{displayUsed}</p>
          <p className="text-sm text-gray-600">of {displayLimit}</p>
        </div>
        {!isUnlimited && (
          <div className="space-y-1">
            <Progress value={percentage} className="h-2" />
            <p className="text-xs text-gray-500">{percentage}% used</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BillingOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-4 w-64 mt-2" />
            </div>
            <div>
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-4 w-16 mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-2 w-full mt-4" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}