'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InfluencerOutreach } from '@/components/influencer/influencer-outreach';
import { InfluencerDiscovery } from '@/components/influencer/influencer-discovery';

export default function InfluencersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Influencer Marketing</h1>
        <p className="text-muted-foreground">
          Discover and connect with influencers to grow Burstlet organically
        </p>
      </div>

      <Tabs defaultValue="discovery" className="space-y-4">
        <TabsList>
          <TabsTrigger value="discovery">Discover</TabsTrigger>
          <TabsTrigger value="outreach">Outreach</TabsTrigger>
        </TabsList>

        <TabsContent value="discovery">
          <InfluencerDiscovery />
        </TabsContent>

        <TabsContent value="outreach">
          <InfluencerOutreach />
        </TabsContent>
      </Tabs>
    </div>
  );
}