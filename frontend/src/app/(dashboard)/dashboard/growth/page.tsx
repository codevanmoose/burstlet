'use client';

import { GrowthMetricsDashboard } from '@/components/growth/growth-metrics-dashboard';
import { LiveActivityFeed } from '@/components/growth/live-activity-feed';

export default function GrowthPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <GrowthMetricsDashboard />
        </div>
        <div className="lg:col-span-1">
          <LiveActivityFeed />
        </div>
      </div>
    </div>
  );
}