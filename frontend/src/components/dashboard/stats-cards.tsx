'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Eye, Users, TrendingUp } from 'lucide-react';

const stats = [
  {
    title: 'Total Content',
    value: '124',
    description: '+12% from last month',
    icon: FileText,
  },
  {
    title: 'Total Views',
    value: '45.2K',
    description: '+20.1% from last month',
    icon: Eye,
  },
  {
    title: 'Total Followers',
    value: '2,350',
    description: '+180 new followers',
    icon: Users,
  },
  {
    title: 'Engagement Rate',
    value: '4.3%',
    description: '+0.5% from last month',
    icon: TrendingUp,
  },
];

export function StatsCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}