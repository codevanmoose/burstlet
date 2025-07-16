'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Zap,
  Target,
  Eye,
  Share2,
  Clock,
  ArrowUp,
  ArrowDown,
  BarChart3,
  PieChart,
  Download,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GrowthMetrics {
  visitors: number;
  signups: number;
  trials: number;
  paid: number;
  revenue: number;
  viralCoefficient: number;
  ltv: number;
  cac: number;
  mrr: number;
  mrrGrowth: number;
  activeUsers: number;
  churnRate: number;
}

interface FunnelStage {
  name: string;
  count: number;
  percentage: number;
  dropoff: number;
  icon: any;
  color: string;
}

interface CohortData {
  cohort: string;
  size: number;
  retention: number[];
  revenue: number;
  ltv: number;
}

export function GrowthMetricsDashboard() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [isLive, setIsLive] = useState(true);
  const [metrics, setMetrics] = useState<GrowthMetrics>({
    visitors: 12847,
    signups: 1827,
    trials: 892,
    paid: 267,
    revenue: 7743,
    viralCoefficient: 1.8,
    ltv: 87,
    cac: 32,
    mrr: 7743,
    mrrGrowth: 23.5,
    activeUsers: 3421,
    churnRate: 5.2
  });

  // Conversion funnel data
  const funnelData: FunnelStage[] = [
    {
      name: 'Visitors',
      count: metrics.visitors,
      percentage: 100,
      dropoff: 0,
      icon: Eye,
      color: 'bg-blue-500'
    },
    {
      name: 'Signups',
      count: metrics.signups,
      percentage: (metrics.signups / metrics.visitors) * 100,
      dropoff: ((metrics.visitors - metrics.signups) / metrics.visitors) * 100,
      icon: Users,
      color: 'bg-indigo-500'
    },
    {
      name: 'Trials',
      count: metrics.trials,
      percentage: (metrics.trials / metrics.visitors) * 100,
      dropoff: ((metrics.signups - metrics.trials) / metrics.signups) * 100,
      icon: Clock,
      color: 'bg-purple-500'
    },
    {
      name: 'Paid',
      count: metrics.paid,
      percentage: (metrics.paid / metrics.visitors) * 100,
      dropoff: ((metrics.trials - metrics.paid) / metrics.trials) * 100,
      icon: DollarSign,
      color: 'bg-green-500'
    }
  ];

  // Cohort retention data
  const cohortData: CohortData[] = [
    { cohort: 'Week 1', size: 450, retention: [100, 68, 52, 45, 42, 40, 38], revenue: 13050, ltv: 29 },
    { cohort: 'Week 2', size: 380, retention: [100, 72, 58, 51, 48, 45], revenue: 12540, ltv: 33 },
    { cohort: 'Week 3', size: 520, retention: [100, 75, 62, 55, 52], revenue: 18720, ltv: 36 },
    { cohort: 'Week 4', size: 477, retention: [100, 78, 65, 58], revenue: 19080, ltv: 40 },
    { cohort: 'This Week', size: 892, retention: [100, 82], revenue: 26760, ltv: 30 }
  ];

  // Simulate real-time updates
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        visitors: prev.visitors + Math.floor(Math.random() * 5),
        signups: prev.signups + (Math.random() > 0.7 ? 1 : 0),
        trials: prev.trials + (Math.random() > 0.9 ? 1 : 0),
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 3) - 1
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [isLive]);

  const getChangeIndicator = (value: number) => {
    if (value > 0) {
      return (
        <span className="flex items-center text-sm text-green-600">
          <ArrowUp className="h-3 w-3 mr-1" />
          {value}%
        </span>
      );
    } else if (value < 0) {
      return (
        <span className="flex items-center text-sm text-red-600">
          <ArrowDown className="h-3 w-3 mr-1" />
          {Math.abs(value)}%
        </span>
      );
    }
    return <span className="text-sm text-gray-500">0%</span>;
  };

  const getRetentionColor = (retention: number) => {
    if (retention >= 80) return 'bg-green-500';
    if (retention >= 60) return 'bg-yellow-500';
    if (retention >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Growth Analytics</h2>
          <p className="text-muted-foreground">
            Real-time metrics to scale your business
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isLive ? "default" : "outline"}
            size="sm"
            onClick={() => setIsLive(!isLive)}
            className="gap-2"
          >
            {isLive ? (
              <>
                <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
                Live
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3" />
                Paused
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-3 w-3" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.mrr.toLocaleString()}</div>
            {getChangeIndicator(metrics.mrrGrowth)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Viral Coefficient</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              {metrics.viralCoefficient}
              {metrics.viralCoefficient > 1 && (
                <Badge className="ml-2 gap-1" variant="default">
                  <Zap className="h-3 w-3" />
                  Viral
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Each user brings {metrics.viralCoefficient} new users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LTV:CAC</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(metrics.ltv / metrics.cac).toFixed(1)}:1
            </div>
            <p className="text-xs text-muted-foreground">
              ${metrics.ltv} LTV / ${metrics.cac} CAC
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {metrics.activeUsers}
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.churnRate}% monthly churn
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="funnel" className="space-y-4">
        <TabsList>
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="cohorts">Cohort Analysis</TabsTrigger>
          <TabsTrigger value="viral">Viral Metrics</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>
                Track user progression from visitor to paying customer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Funnel Visualization */}
                <div className="space-y-4">
                  {funnelData.map((stage, index) => {
                    const Icon = stage.icon;
                    return (
                      <div key={stage.name} className="relative">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-lg ${stage.color} bg-opacity-10`}>
                            <Icon className={`h-5 w-5 ${stage.color.replace('bg-', 'text-')}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-medium">{stage.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {stage.count.toLocaleString()} users
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">{stage.percentage.toFixed(1)}%</p>
                                {index > 0 && (
                                  <p className="text-sm text-red-600">
                                    -{stage.dropoff.toFixed(1)}% dropoff
                                  </p>
                                )}
                              </div>
                            </div>
                            <Progress 
                              value={stage.percentage} 
                              className="h-3"
                            />
                          </div>
                        </div>
                        {index < funnelData.length - 1 && (
                          <div className="ml-6 my-2 border-l-2 border-dashed border-gray-300 h-4" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Optimization Suggestions */}
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3">Optimization Opportunities</h4>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                      <Target className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Improve Trial → Paid Conversion</p>
                        <p className="text-xs text-muted-foreground">
                          Current 30% is below target 40%. Consider extending trial or adding onboarding.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cohorts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cohort Retention Analysis</CardTitle>
              <CardDescription>
                Track user retention and revenue by signup cohort
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Cohort</th>
                      <th className="text-center py-2">Size</th>
                      <th className="text-center py-2">Week 0</th>
                      <th className="text-center py-2">Week 1</th>
                      <th className="text-center py-2">Week 2</th>
                      <th className="text-center py-2">Week 3</th>
                      <th className="text-center py-2">Week 4</th>
                      <th className="text-center py-2">LTV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cohortData.map((cohort) => (
                      <tr key={cohort.cohort} className="border-b">
                        <td className="py-3 font-medium">{cohort.cohort}</td>
                        <td className="text-center">{cohort.size}</td>
                        {cohort.retention.map((retention, week) => (
                          <td key={week} className="text-center p-2">
                            <div className={cn(
                              "inline-block px-3 py-1 rounded-md text-white text-sm",
                              getRetentionColor(retention)
                            )}>
                              {retention}%
                            </div>
                          </td>
                        ))}
                        {[...Array(5 - cohort.retention.length)].map((_, i) => (
                          <td key={`empty-${i}`} className="text-center p-2">
                            <span className="text-gray-400">-</span>
                          </td>
                        ))}
                        <td className="text-center font-medium">${cohort.ltv}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold">68%</p>
                  <p className="text-sm text-muted-foreground">Avg Week 1 Retention</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold">$35</p>
                  <p className="text-sm text-muted-foreground">Avg Cohort LTV</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold">+15%</p>
                  <p className="text-sm text-muted-foreground">Retention Improvement</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="viral" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Viral Growth Metrics</CardTitle>
              <CardDescription>
                Track how users are driving organic growth
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Viral Coefficient Breakdown */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <h4 className="font-medium mb-4">Referral Performance</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Users w/ Referrals</span>
                        <span className="font-medium">34%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Avg Referrals per User</span>
                        <span className="font-medium">5.3</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Referral Conversion</span>
                        <span className="font-medium">32%</span>
                      </div>
                      <div className="pt-3 mt-3 border-t">
                        <div className="flex justify-between">
                          <span className="font-medium">Viral Coefficient</span>
                          <span className="font-bold text-lg">1.8</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium mb-4">Content Virality</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Avg Views per Video</span>
                        <span className="font-medium">125K</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Share Rate</span>
                        <span className="font-medium">8.2%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Creator → User Conv</span>
                        <span className="font-medium">2.1%</span>
                      </div>
                      <div className="pt-3 mt-3 border-t">
                        <div className="flex justify-between">
                          <span className="font-medium">Content K-Factor</span>
                          <span className="font-bold text-lg">0.17</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Viral Loops */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Active Viral Loops</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                      <div className="flex items-center gap-3">
                        <Share2 className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">Referral Program</p>
                          <p className="text-sm text-muted-foreground">
                            Users: 892 → Invites: 4,728 → New Users: 1,513
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-700">K=1.7</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="flex items-center gap-3">
                        <Zap className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium">Viral Templates</p>
                          <p className="text-sm text-muted-foreground">
                            Videos: 3,421 → Views: 428M → Signups: 7,162
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700">K=2.1</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>
                Deep dive into revenue metrics and growth
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Revenue Breakdown */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">New MRR</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-600">+$2,847</p>
                      <p className="text-xs text-muted-foreground">From 98 new customers</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Expansion MRR</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-blue-600">+$892</p>
                      <p className="text-xs text-muted-foreground">From 34 upgrades</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Churned MRR</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-red-600">-$423</p>
                      <p className="text-xs text-muted-foreground">From 15 cancellations</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Plan Distribution */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Revenue by Plan</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Starter ($29)</span>
                        <span className="text-sm font-medium">42% • $3,248</span>
                      </div>
                      <Progress value={42} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Professional ($99)</span>
                        <span className="text-sm font-medium">38% • $2,940</span>
                      </div>
                      <Progress value={38} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Enterprise ($299)</span>
                        <span className="text-sm font-medium">20% • $1,555</span>
                      </div>
                      <Progress value={20} className="h-2" />
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">ARPU</p>
                    <p className="text-xl font-bold">$29</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Churn Rate</p>
                    <p className="text-xl font-bold">5.2%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Net Revenue Retention</p>
                    <p className="text-xl font-bold">112%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payback Period</p>
                    <p className="text-xl font-bold">3.2 mo</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}