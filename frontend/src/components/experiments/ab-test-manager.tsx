'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Flask,
  Play,
  Pause,
  TrendingUp,
  BarChart3,
  Users,
  CheckCircle2,
  AlertCircle,
  Zap,
  Target,
  ArrowRight,
  Copy,
  Download
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ABTest {
  id: string;
  name: string;
  description: string;
  type: 'landing' | 'pricing' | 'email' | 'feature' | 'ui';
  status: 'draft' | 'running' | 'completed' | 'paused';
  variants: Variant[];
  metrics: {
    primaryMetric: string;
    secondaryMetrics: string[];
  };
  traffic: {
    split: number[]; // percentage for each variant
    totalVisitors: number;
    minimumSampleSize: number;
  };
  results?: TestResults;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

interface Variant {
  id: string;
  name: string;
  description: string;
  changes: string[];
  visitors: number;
  conversions: number;
  revenue?: number;
}

interface TestResults {
  winner?: string;
  confidence: number;
  improvement: number;
  significanceReached: boolean;
}

export function ABTestManager() {
  const [activeTests, setActiveTests] = useState<ABTest[]>([
    {
      id: '1',
      name: 'Homepage Hero Copy Test',
      description: 'Testing emotional vs technical messaging',
      type: 'landing',
      status: 'running',
      variants: [
        {
          id: 'control',
          name: 'Control - Technical',
          description: 'Create AI videos in 2 minutes',
          changes: ['Original headline', 'Feature-focused copy'],
          visitors: 3421,
          conversions: 287
        },
        {
          id: 'variant-a',
          name: 'Variant A - Emotional',
          description: 'Turn your ideas into viral videos instantly',
          changes: ['Emotional headline', 'Benefit-focused copy'],
          visitors: 3398,
          conversions: 342
        }
      ],
      metrics: {
        primaryMetric: 'Signup Conversion',
        secondaryMetrics: ['Time on Page', 'Scroll Depth']
      },
      traffic: {
        split: [50, 50],
        totalVisitors: 6819,
        minimumSampleSize: 8000
      },
      results: {
        confidence: 87,
        improvement: 19.2,
        significanceReached: false
      },
      createdAt: new Date('2024-01-08'),
      startedAt: new Date('2024-01-09')
    },
    {
      id: '2',
      name: 'Pricing Page Layout',
      description: 'Cards vs table view for pricing plans',
      type: 'pricing',
      status: 'completed',
      variants: [
        {
          id: 'control',
          name: 'Control - Cards',
          description: 'Traditional card layout',
          changes: ['3 cards side by side', 'Vertical feature list'],
          visitors: 5000,
          conversions: 425
        },
        {
          id: 'variant-a',
          name: 'Variant A - Table',
          description: 'Comparison table layout',
          changes: ['Horizontal comparison', 'Feature checkmarks'],
          visitors: 5000,
          conversions: 512
        }
      ],
      metrics: {
        primaryMetric: 'Plan Selection',
        secondaryMetrics: ['Pro Plan %', 'Page Exit Rate']
      },
      traffic: {
        split: [50, 50],
        totalVisitors: 10000,
        minimumSampleSize: 8000
      },
      results: {
        winner: 'variant-a',
        confidence: 95.2,
        improvement: 20.5,
        significanceReached: true
      },
      createdAt: new Date('2024-01-01'),
      startedAt: new Date('2024-01-02'),
      completedAt: new Date('2024-01-07')
    }
  ]);

  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'paused': return 'bg-yellow-100 text-yellow-700';
      case 'draft': return 'bg-gray-100 text-gray-700';
      default: return '';
    }
  };

  const calculateSignificance = (control: Variant, variant: Variant): number => {
    // Simplified statistical significance calculation
    const n1 = control.visitors;
    const n2 = variant.visitors;
    const p1 = control.conversions / n1;
    const p2 = variant.conversions / n2;
    const p = (control.conversions + variant.conversions) / (n1 + n2);
    const z = Math.abs(p1 - p2) / Math.sqrt(p * (1 - p) * (1/n1 + 1/n2));
    
    // Convert z-score to confidence percentage
    return Math.min(99.9, 50 + (z * 20));
  };

  const toggleTestStatus = (testId: string) => {
    setActiveTests(prev => prev.map(test => {
      if (test.id === testId) {
        const newStatus = test.status === 'running' ? 'paused' : 'running';
        toast.success(`Test ${newStatus === 'running' ? 'resumed' : 'paused'}`);
        return { ...test, status: newStatus };
      }
      return test;
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">A/B Testing</h2>
          <p className="text-muted-foreground">
            Optimize conversions with data-driven experiments
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowCreateModal(true)}>
          <Flask className="h-4 w-4" />
          Create Test
        </Button>
      </div>

      {/* Active Tests Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tests</CardTitle>
            <Flask className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeTests.filter(t => t.status === 'running').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {activeTests.filter(t => t.status === 'draft').length} drafts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeTests.reduce((sum, test) => sum + test.traffic.totalVisitors, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all tests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Improvement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +{activeTests
                .filter(t => t.results?.improvement)
                .reduce((sum, t) => sum + (t.results?.improvement || 0), 0) / 
                activeTests.filter(t => t.results?.improvement).length || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              From winning variants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                (activeTests.filter(t => t.results?.winner).length / 
                activeTests.filter(t => t.status === 'completed').length) * 100
              )}%
            </div>
            <p className="text-xs text-muted-foreground">
              Tests with clear winners
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Tests</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeTests
            .filter(test => test.status === 'running' || test.status === 'paused')
            .map(test => (
              <Card key={test.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {test.name}
                        <Badge className={getStatusColor(test.status)}>
                          {test.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{test.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleTestStatus(test.id)}
                      >
                        {test.status === 'running' ? (
                          <>
                            <Pause className="h-3 w-3 mr-1" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3 mr-1" />
                            Resume
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedTest(test)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Variant Performance */}
                    <div className="space-y-3">
                      {test.variants.map((variant, index) => {
                        const conversionRate = (variant.conversions / variant.visitors) * 100;
                        const isWinning = test.results && index > 0 && 
                          variant.conversions / variant.visitors > 
                          test.variants[0].conversions / test.variants[0].visitors;
                        
                        return (
                          <div key={variant.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{variant.name}</span>
                                {index === 0 && (
                                  <Badge variant="outline">Control</Badge>
                                )}
                                {isWinning && (
                                  <Badge className="bg-green-100 text-green-700">
                                    Leading
                                  </Badge>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-medium">{conversionRate.toFixed(2)}%</p>
                                <p className="text-xs text-muted-foreground">
                                  {variant.conversions} / {variant.visitors}
                                </p>
                              </div>
                            </div>
                            <Progress value={conversionRate * 10} className="h-2" />
                          </div>
                        );
                      })}
                    </div>

                    {/* Test Progress */}
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Sample Size Progress</span>
                        <span className="text-sm font-medium">
                          {test.traffic.totalVisitors} / {test.traffic.minimumSampleSize}
                        </span>
                      </div>
                      <Progress 
                        value={(test.traffic.totalVisitors / test.traffic.minimumSampleSize) * 100} 
                        className="h-2"
                      />
                      {test.results && (
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={test.results.significanceReached ? "default" : "secondary"}>
                            {test.results.confidence.toFixed(1)}% confidence
                          </Badge>
                          {!test.results.significanceReached && (
                            <span className="text-xs text-muted-foreground">
                              Need 95% for significance
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {activeTests
            .filter(test => test.status === 'completed')
            .map(test => (
              <Card key={test.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {test.name}
                        {test.results?.winner && (
                          <Badge className="bg-green-100 text-green-700 gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Winner Found
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Completed {test.completedAt?.toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Button size="sm" variant="outline" className="gap-2">
                      <Download className="h-3 w-3" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {test.results && (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Winning Variant</p>
                            <p className="text-sm text-muted-foreground">
                              {test.variants.find(v => v.id === test.results?.winner)?.name}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600">
                              +{test.results.improvement.toFixed(1)}%
                            </p>
                            <p className="text-sm text-muted-foreground">improvement</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3">
                        {test.variants.map((variant) => (
                          <div 
                            key={variant.id}
                            className={cn(
                              "p-3 rounded-lg border",
                              variant.id === test.results?.winner ? "bg-green-50 border-green-200" : ""
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{variant.name}</span>
                              <span>
                                {((variant.conversions / variant.visitors) * 100).toFixed(2)}% conversion
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <Button className="w-full gap-2">
                        <Zap className="h-4 w-4" />
                        Implement Winner
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Testing Insights</CardTitle>
              <CardDescription>
                Key learnings from your experiments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Best Performing Tests */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Top Improvements</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                      <div>
                        <p className="font-medium">Pricing Page Layout</p>
                        <p className="text-sm text-muted-foreground">Table view increased conversions</p>
                      </div>
                      <span className="font-bold text-green-600">+20.5%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                      <div>
                        <p className="font-medium">Email Subject Lines</p>
                        <p className="text-sm text-muted-foreground">Emojis improved open rates</p>
                      </div>
                      <span className="font-bold text-blue-600">+15.3%</span>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Recommended Tests</h4>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-between h-auto p-3">
                      <div className="text-left">
                        <p className="font-medium">Test CTA Button Colors</p>
                        <p className="text-xs text-muted-foreground">
                          Purple vs Green for primary actions
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="w-full justify-between h-auto p-3">
                      <div className="text-left">
                        <p className="font-medium">Optimize Onboarding Flow</p>
                        <p className="text-xs text-muted-foreground">
                          Test progressive vs upfront information
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
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

// Import missing utility
import { cn } from '@/lib/utils';