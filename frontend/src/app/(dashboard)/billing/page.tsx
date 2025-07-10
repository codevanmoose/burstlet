'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BillingOverview } from '@/components/billing/BillingOverview';
import { SubscriptionPlans } from '@/components/billing/SubscriptionPlans';
import { PaymentMethods } from '@/components/billing/PaymentMethods';
import { BillingHistory } from '@/components/billing/BillingHistory';

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-gray-600 mt-2">
          Manage your subscription, payment methods, and billing history
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="payment">Payment Methods</TabsTrigger>
          <TabsTrigger value="history">Billing History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <BillingOverview />
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <SubscriptionPlans />
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <PaymentMethods />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <BillingHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}