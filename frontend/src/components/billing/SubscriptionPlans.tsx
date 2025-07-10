'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Check, X, Loader2, Sparkles } from 'lucide-react';
import { useAvailablePlans, useSubscription, useCreateCheckoutSession, usePreviewProration } from '@/hooks/useBilling';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function SubscriptionPlans() {
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showProration, setShowProration] = useState(false);
  
  const { data: plans, isLoading: plansLoading } = useAvailablePlans();
  const { data: subscription } = useSubscription();
  const { mutate: createCheckout, isPending: isCreatingCheckout } = useCreateCheckoutSession();
  const { data: prorationPreview, mutate: previewProration } = usePreviewProration();

  if (plansLoading) {
    return <SubscriptionPlansSkeleton />;
  }

  if (!plans || plans.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Plans Available</CardTitle>
          <CardDescription>
            Please contact support for assistance with subscription plans.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const filteredPlans = plans.filter(plan => plan.interval === billingInterval);
  const yearlyDiscount = billingInterval === 'year' ? 20 : 0; // 20% discount for yearly

  const handleUpgrade = (planId: string) => {
    if (subscription && subscription.planId !== planId) {
      setSelectedPlan(planId);
      previewProration(planId);
      setShowProration(true);
    } else {
      createCheckout(planId);
    }
  };

  const confirmUpgrade = () => {
    if (selectedPlan) {
      createCheckout(selectedPlan);
      setShowProration(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Billing Interval Toggle */}
      <div className="flex items-center justify-center space-x-2">
        <Label htmlFor="billing-interval">Monthly</Label>
        <Switch
          id="billing-interval"
          checked={billingInterval === 'year'}
          onCheckedChange={(checked) => setBillingInterval(checked ? 'year' : 'month')}
        />
        <Label htmlFor="billing-interval">
          Yearly
          {yearlyDiscount > 0 && (
            <Badge variant="secondary" className="ml-2">
              Save {yearlyDiscount}%
            </Badge>
          )}
        </Label>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {filteredPlans.map((plan) => {
          const isCurrentPlan = subscription?.planId === plan.id;
          const isDowngrade = subscription && 
            subscription.plan.price > plan.price;
          
          return (
            <Card
              key={plan.id}
              className={cn(
                'relative',
                plan.popular && 'border-primary shadow-lg'
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    {formatCurrency(plan.price, plan.currency)}
                  </span>
                  <span className="text-gray-600">/{plan.interval}</span>
                </div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3">
                  {/* Limits */}
                  <PlanFeatureItem
                    feature={`${plan.limits.videoGenerations === -1 ? 'Unlimited' : plan.limits.videoGenerations} video generations`}
                    included={true}
                    highlight={plan.limits.videoGenerations === -1}
                  />
                  <PlanFeatureItem
                    feature={`${plan.limits.blogPosts === -1 ? 'Unlimited' : plan.limits.blogPosts} blog posts`}
                    included={true}
                    highlight={plan.limits.blogPosts === -1}
                  />
                  <PlanFeatureItem
                    feature={`${plan.limits.socialPosts === -1 ? 'Unlimited' : plan.limits.socialPosts} social posts`}
                    included={true}
                    highlight={plan.limits.socialPosts === -1}
                  />
                  <PlanFeatureItem
                    feature={`${plan.limits.storage}GB storage`}
                    included={true}
                  />
                  <PlanFeatureItem
                    feature={`${plan.limits.teamMembers} team member${plan.limits.teamMembers > 1 ? 's' : ''}`}
                    included={plan.limits.teamMembers > 1}
                  />
                  
                  {/* Features */}
                  {plan.features.map((feature, idx) => (
                    <PlanFeatureItem
                      key={idx}
                      feature={feature.name}
                      included={feature.included}
                      value={feature.value}
                    />
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  disabled={isCurrentPlan || isCreatingCheckout}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {isCreatingCheckout && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {isCurrentPlan
                    ? 'Current Plan'
                    : isDowngrade
                    ? 'Downgrade'
                    : 'Upgrade'}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Proration Preview Dialog */}
      <Dialog open={showProration} onOpenChange={setShowProration}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Plan Change Preview</DialogTitle>
            <DialogDescription>
              Review the prorated charges for your plan change
            </DialogDescription>
          </DialogHeader>
          
          {prorationPreview && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                {prorationPreview.invoiceItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.description}</span>
                    <span className="font-medium">
                      {formatCurrency(item.amount / 100, prorationPreview.currency)}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between font-medium">
                  <span>Total due today</span>
                  <span>
                    {formatCurrency(prorationPreview.amount / 100, prorationPreview.currency)}
                  </span>
                </div>
              </div>
              
              <p className="text-sm text-gray-600">
                Your new plan will start immediately and you'll be charged the prorated amount.
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProration(false)}>
              Cancel
            </Button>
            <Button onClick={confirmUpgrade} disabled={isCreatingCheckout}>
              {isCreatingCheckout && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PlanFeatureItem({
  feature,
  included,
  value,
  highlight = false,
}: {
  feature: string;
  included: boolean;
  value?: string | number;
  highlight?: boolean;
}) {
  return (
    <li className="flex items-start">
      {included ? (
        <Check className={cn(
          'w-5 h-5 mr-2 mt-0.5 flex-shrink-0',
          highlight ? 'text-primary' : 'text-green-500'
        )} />
      ) : (
        <X className="w-5 h-5 text-gray-300 mr-2 mt-0.5 flex-shrink-0" />
      )}
      <span className={cn(
        'text-sm',
        included ? 'text-gray-900' : 'text-gray-400',
        highlight && 'font-medium'
      )}>
        {feature}
        {value && <span className="text-gray-600"> ({value})</span>}
      </span>
    </li>
  );
}

function SubscriptionPlansSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center space-x-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-6 w-12" />
        <Skeleton className="h-4 w-16" />
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-48 mt-2" />
              <Skeleton className="h-10 w-24 mt-4" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(6)].map((_, j) => (
                  <div key={j} className="flex items-center">
                    <Skeleton className="h-5 w-5 mr-2" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}