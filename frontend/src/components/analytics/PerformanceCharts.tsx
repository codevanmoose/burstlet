'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePerformanceMetrics } from '@/hooks/api/use-analytics';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { formatNumber, formatDate } from '@/lib/utils/format';

interface PerformanceChartsProps {
  dateRange: { from: Date; to: Date };
  platform: string;
  detailed?: boolean;
}

export function PerformanceCharts({ dateRange, platform, detailed = false }: PerformanceChartsProps) {
  const { data: metrics, isLoading } = usePerformanceMetrics({
    dateFrom: dateRange.from.toISOString(),
    dateTo: dateRange.to.toISOString(),
    platform: platform === 'all' ? undefined : platform,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-80 w-full" />
          </CardContent>
        </Card>
        {detailed && (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-80 w-full" />
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Transform metrics data into chart format
  const chartData = metrics ? 
    metrics.views.map((view, index) => ({
      date: view.date,
      views: view.value,
      engagement: metrics.engagement[index]?.value || 0,
      reach: metrics.likes[index]?.value || 0, // Using likes as proxy for reach
      impressions: metrics.shares[index]?.value || 0, // Using shares as proxy for impressions
    })) : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Views & Engagement</CardTitle>
          <CardDescription>
            Track your content views and engagement over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={detailed ? 400 : 300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => formatDate(new Date(value))}
              />
              <YAxis tickFormatter={formatNumber} />
              <Tooltip 
                labelFormatter={(value) => formatDate(new Date(value))}
                formatter={(value: number, name: string) => [
                  formatNumber(value),
                  name === 'views' ? 'Views' : 'Engagement'
                ]}
              />
              <Area
                type="monotone"
                dataKey="views"
                stackId="1"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="engagement"
                stackId="1"
                stroke="#82ca9d"
                fill="#82ca9d"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {detailed && (
        <Card>
          <CardHeader>
            <CardTitle>Reach & Impressions</CardTitle>
            <CardDescription>
              Monitor your content reach and total impressions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => formatDate(new Date(value))}
                />
                <YAxis tickFormatter={formatNumber} />
                <Tooltip 
                  labelFormatter={(value) => formatDate(new Date(value))}
                  formatter={(value: number, name: string) => [
                    formatNumber(value),
                    name === 'reach' ? 'Reach' : 'Impressions'
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="reach"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="impressions"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}