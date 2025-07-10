'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAnalytics } from '@/hooks/api/use-analytics';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { formatNumber, formatPercentage } from '@/lib/utils/format';
import { Youtube, Instagram, Twitter, Video } from 'lucide-react';

interface PlatformBreakdownProps {
  dateRange: { from: Date; to: Date };
}

const PLATFORM_COLORS = {
  youtube: '#FF0000',
  instagram: '#E4405F',
  twitter: '#1DA1F2',
  tiktok: '#000000',
  linkedin: '#0077B5',
};

const PLATFORM_ICONS = {
  youtube: Youtube,
  instagram: Instagram,
  twitter: Twitter,
  tiktok: Video,
  linkedin: Video,
};

export function PlatformBreakdown({ dateRange }: PlatformBreakdownProps) {
  const { data: analytics, isLoading } = useAnalytics({
    dateFrom: dateRange.from.toISOString(),
    dateTo: dateRange.to.toISOString(),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Mock platform data for demo - in real app this would come from API
  const platformData = [
    { platform: 'youtube', views: analytics?.totalViews ? Math.floor(analytics.totalViews * 0.4) : 0 },
    { platform: 'instagram', views: analytics?.totalViews ? Math.floor(analytics.totalViews * 0.3) : 0 },
    { platform: 'twitter', views: analytics?.totalViews ? Math.floor(analytics.totalViews * 0.2) : 0 },
    { platform: 'tiktok', views: analytics?.totalViews ? Math.floor(analytics.totalViews * 0.1) : 0 },
  ];
  const totalViews = platformData.reduce((sum: number, platform: any) => sum + platform.views, 0);

  const chartData = platformData.map((platform) => ({
    ...platform,
    percentage: totalViews > 0 ? (platform.views / totalViews) * 100 : 0,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium capitalize">{data.platform}</p>
          <p className="text-sm text-muted-foreground">
            Views: {formatNumber(data.views)}
          </p>
          <p className="text-sm text-muted-foreground">
            Share: {formatPercentage(data.percentage)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Breakdown</CardTitle>
        <CardDescription>
          Performance distribution across platforms
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Pie Chart */}
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="views"
                label={false}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={PLATFORM_COLORS[entry.platform as keyof typeof PLATFORM_COLORS] || '#8884d8'} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Platform List */}
          <div className="space-y-3">
            {chartData.map((platform) => {
              const Icon = PLATFORM_ICONS[platform.platform as keyof typeof PLATFORM_ICONS];
              const color = PLATFORM_COLORS[platform.platform as keyof typeof PLATFORM_COLORS];
              
              return (
                <div key={platform.platform} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <div className="flex items-center gap-2">
                      {Icon && <Icon className="h-4 w-4" />}
                      <span className="font-medium capitalize">{platform.platform}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {formatNumber(platform.views)}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {formatPercentage(platform.percentage)}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold">{formatNumber(totalViews)}</div>
              <div className="text-sm text-muted-foreground">Total Views</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{platformData.length}</div>
              <div className="text-sm text-muted-foreground">Active Platforms</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}