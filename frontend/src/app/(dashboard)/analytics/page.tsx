'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDateRangePicker } from '@/components/analytics/CalendarDateRangePicker';
import { OverviewCards } from '@/components/analytics/OverviewCards';
import { PerformanceCharts } from '@/components/analytics/PerformanceCharts';
import { PlatformBreakdown } from '@/components/analytics/PlatformBreakdown';
import { TopContent } from '@/components/analytics/TopContent';
import { AudienceInsights } from '@/components/analytics/AudienceInsights';
import { TrendAnalysis } from '@/components/analytics/TrendAnalysis';
import { Download, RefreshCw } from 'lucide-react';

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<{from: Date; to: Date}>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date(),
  });
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Track your content performance across all platforms
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <CalendarDateRangePicker
            date={dateRange}
            onDateChange={setDateRange}
          />
          <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All platforms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="twitter">Twitter</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <OverviewCards dateRange={dateRange} platform={selectedPlatform} />

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content Performance</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PerformanceCharts dateRange={dateRange} platform={selectedPlatform} />
            <PlatformBreakdown dateRange={dateRange} />
          </div>
          <TopContent dateRange={dateRange} platform={selectedPlatform} />
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Content Performance Over Time</CardTitle>
                <CardDescription>
                  Track how your content performs across different time periods
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PerformanceCharts 
                  dateRange={dateRange} 
                  platform={selectedPlatform}
                  detailed={true}
                />
              </CardContent>
            </Card>
            <TopContent dateRange={dateRange} platform={selectedPlatform} compact={true} />
          </div>
        </TabsContent>

        <TabsContent value="audience" className="space-y-6">
          <AudienceInsights dateRange={dateRange} platform={selectedPlatform} />
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <TrendAnalysis dateRange={dateRange} platform={selectedPlatform} />
        </TabsContent>
      </Tabs>
    </div>
  );
}