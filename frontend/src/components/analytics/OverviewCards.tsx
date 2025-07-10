'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAnalytics } from '@/hooks/api/use-analytics';
import { 
  Eye, 
  Heart, 
  Share2, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  BarChart3
} from 'lucide-react';
import { formatNumber, formatCurrency, formatPercentage } from '@/lib/utils/format';

interface OverviewCardsProps {
  dateRange: { from: Date; to: Date };
  platform: string;
}

export function OverviewCards({ dateRange, platform }: OverviewCardsProps) {
  const { data: analytics, isLoading } = useAnalytics({
    dateFrom: dateRange.from.toISOString(),
    dateTo: dateRange.to.toISOString(),
    platform: platform === 'all' ? undefined : platform,
  });

  const cards = [
    {
      title: 'Total Views',
      value: analytics?.totalViews || 0,
      change: analytics?.growthRate || 0,
      icon: Eye,
      formatter: formatNumber,
    },
    {
      title: 'Engagement Rate',
      value: analytics?.engagementRate || 0,
      change: analytics?.growthRate || 0,
      icon: Heart,
      formatter: formatPercentage,
    },
    {
      title: 'Total Engagement',
      value: analytics?.totalEngagement || 0,
      change: analytics?.growthRate || 0,
      icon: Users,
      formatter: formatNumber,
    },
    {
      title: 'Total Content',
      value: analytics?.totalContent || 0,
      change: analytics?.growthRate || 0,
      icon: BarChart3,
      formatter: formatNumber,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const isPositive = card.change >= 0;
        const TrendIcon = isPositive ? TrendingUp : TrendingDown;

        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {card.formatter(card.value)}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendIcon
                  className={`mr-1 h-3 w-3 ${
                    isPositive ? 'text-green-500' : 'text-red-500'
                  }`}
                />
                <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
                  {isPositive ? '+' : ''}{formatPercentage(card.change)}
                </span>
                <span className="ml-1">from last period</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}