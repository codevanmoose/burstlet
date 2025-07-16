'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Mail,
  Send,
  Users,
  TrendingUp,
  DollarSign,
  Eye,
  MousePointer,
  Clock,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Zap,
  Play,
  Pause,
  Edit,
  Sparkles,
  Target
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { emailSequences, EmailSequence, EmailTemplate } from '@/data/email-sequences';
import { cn } from '@/lib/utils';
import { EmailPreview } from './email-preview';

interface CampaignMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  revenue: number;
  activeSubscribers: number;
}

interface EmailPerformance {
  emailId: string;
  sent: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  revenue: number;
}

export function EmailCampaigns() {
  const [selectedSequence, setSelectedSequence] = useState<EmailSequence | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<EmailTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [campaignStatus, setCampaignStatus] = useState<Record<string, boolean>>({
    'welcome-series': true,
    'abandoned-video': true,
    'weekly-trends': false,
    'win-back': true,
    'referral-activation': true
  });

  // Mock metrics
  const overallMetrics: CampaignMetrics = {
    sent: 45320,
    delivered: 44100,
    opened: 18500,
    clicked: 5200,
    converted: 1850,
    revenue: 53650,
    activeSubscribers: 3420
  };

  const sequenceMetrics: Record<string, EmailPerformance[]> = {
    'welcome-series': [
      { emailId: 'welcome-1', sent: 8500, openRate: 68, clickRate: 32, conversionRate: 12, revenue: 8400 },
      { emailId: 'welcome-2', sent: 7200, openRate: 52, clickRate: 24, conversionRate: 8, revenue: 5600 },
      { emailId: 'welcome-3', sent: 6100, openRate: 48, clickRate: 18, conversionRate: 15, revenue: 10500 },
      { emailId: 'welcome-4', sent: 5200, openRate: 62, clickRate: 35, conversionRate: 28, revenue: 18200 },
      { emailId: 'welcome-5', sent: 4300, openRate: 71, clickRate: 42, conversionRate: 35, revenue: 22750 }
    ]
  };

  const toggleCampaign = (sequenceId: string) => {
    setCampaignStatus(prev => ({
      ...prev,
      [sequenceId]: !prev[sequenceId]
    }));
    
    const sequence = emailSequences.find(s => s.id === sequenceId);
    const newStatus = !campaignStatus[sequenceId];
    
    toast.success(
      `${sequence?.name} ${newStatus ? 'activated' : 'paused'}`
    );
  };

  const getTriggerIcon = (trigger: string) => {
    switch (trigger) {
      case 'signup': return <UserPlus className="h-4 w-4" />;
      case 'trial_start': return <Clock className="h-4 w-4" />;
      case 'first_video': return <Video className="h-4 w-4" />;
      case 'payment': return <DollarSign className="h-4 w-4" />;
      case 'inactive': return <AlertCircle className="h-4 w-4" />;
      case 'churn': return <UserX className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  const getTriggerColor = (trigger: string) => {
    switch (trigger) {
      case 'signup': return 'bg-green-100 text-green-700';
      case 'payment': return 'bg-blue-100 text-blue-700';
      case 'inactive': return 'bg-yellow-100 text-yellow-700';
      case 'churn': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Email Campaigns</h2>
        <p className="text-muted-foreground">
          Automated email sequences that convert and retain users
        </p>
      </div>

      {/* Overall Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(overallMetrics.sent / 1000).toFixed(1)}K
            </div>
            <p className="text-xs text-muted-foreground">
              {((overallMetrics.delivered / overallMetrics.sent) * 100).toFixed(1)}% delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((overallMetrics.opened / overallMetrics.delivered) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Industry avg: 25%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((overallMetrics.clicked / overallMetrics.opened) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {overallMetrics.clicked.toLocaleString()} total clicks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(overallMetrics.revenue / 1000).toFixed(1)}K
            </div>
            <p className="text-xs text-muted-foreground">
              ${(overallMetrics.revenue / overallMetrics.converted).toFixed(0)} per conversion
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sequences" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sequences">Email Sequences</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="ab-tests">A/B Tests</TabsTrigger>
        </TabsList>

        <TabsContent value="sequences" className="space-y-4">
          <div className="grid gap-4">
            {emailSequences.map((sequence) => (
              <Card key={sequence.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {sequence.name}
                        {campaignStatus[sequence.id] ? (
                          <Badge className="gap-1" variant="default">
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge className="gap-1" variant="secondary">
                            <Pause className="h-3 w-3" />
                            Paused
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Badge className={cn("gap-1", getTriggerColor(sequence.trigger))}>
                          {getTriggerIcon(sequence.trigger)}
                          Triggered by {sequence.trigger.replace('_', ' ')}
                        </Badge>
                        <span>•</span>
                        <span>{sequence.emails.length} emails</span>
                        <span>•</span>
                        <span>{sequence.expectedConversion}% expected conversion</span>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedSequence(sequence)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant={campaignStatus[sequence.id] ? "secondary" : "default"}
                        onClick={() => toggleCampaign(sequence.id)}
                      >
                        {campaignStatus[sequence.id] ? (
                          <>
                            <Pause className="h-3 w-3 mr-1" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3 mr-1" />
                            Activate
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Email Preview */}
                    <div className="grid gap-2">
                      {sequence.emails.slice(0, 3).map((email, index) => (
                        <div
                          key={email.id}
                          className="flex items-center gap-3 p-2 rounded-lg bg-gray-50"
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-sm font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{email.subject}</p>
                            <p className="text-xs text-muted-foreground">
                              Sent {email.delay ? `${email.delay}h after trigger` : 'immediately'}
                            </p>
                          </div>
                          {sequenceMetrics[sequence.id]?.[index] && (
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{sequenceMetrics[sequence.id][index].openRate}% open</span>
                              <span>{sequenceMetrics[sequence.id][index].clickRate}% click</span>
                            </div>
                          )}
                        </div>
                      ))}
                      {sequence.emails.length > 3 && (
                        <p className="text-xs text-center text-muted-foreground">
                          +{sequence.emails.length - 3} more emails
                        </p>
                      )}
                    </div>

                    {/* Performance Summary */}
                    {sequenceMetrics[sequence.id] && (
                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Sequence Performance</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>
                                {sequenceMetrics[sequence.id].reduce((sum, e) => sum + e.sent, 0).toLocaleString()} sent
                              </span>
                              <span>
                                {(sequenceMetrics[sequence.id].reduce((sum, e) => sum + e.openRate, 0) / sequenceMetrics[sequence.id].length).toFixed(0)}% avg open
                              </span>
                              <span>
                                ${sequenceMetrics[sequence.id].reduce((sum, e) => sum + e.revenue, 0).toLocaleString()} revenue
                              </span>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" className="gap-1">
                            <BarChart3 className="h-3 w-3" />
                            Analytics
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Performance Analytics</CardTitle>
              <CardDescription>
                Track how each email in your sequences is performing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Best Performing Emails */}
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    Top Performing Emails
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                      <div className="space-y-1">
                        <p className="font-medium">⏰ 24 hours left (+ exclusive bonus)</p>
                        <p className="text-sm text-muted-foreground">Welcome Series - Email 5</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">35% conversion</p>
                        <p className="text-sm text-muted-foreground">71% open • 42% click</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div className="space-y-1">
                        <p className="font-medium">🔥 This week's viral formula (87M views)</p>
                        <p className="text-sm text-muted-foreground">Weekly Trends - Email 1</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">15% conversion</p>
                        <p className="text-sm text-muted-foreground">58% open • 28% click</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Optimization Opportunities */}
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    Optimization Opportunities
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-purple-200 bg-purple-50">
                      <Target className="h-5 w-5 text-purple-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Improve Welcome Email 3 Subject Line</p>
                        <p className="text-xs text-muted-foreground">
                          Current open rate 48% is below sequence average. A/B test recommended.
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        Create Test
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ab-tests" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>A/B Tests</CardTitle>
                  <CardDescription>
                    Optimize your email performance with split testing
                  </CardDescription>
                </div>
                <Button className="gap-2">
                  <Zap className="h-4 w-4" />
                  Create New Test
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Active Test */}
                <div className="p-4 rounded-lg border">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">Welcome Email 1 - Subject Line Test</h4>
                      <p className="text-sm text-muted-foreground">Testing emoji vs no emoji</p>
                    </div>
                    <Badge className="gap-1">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      Active
                    </Badge>
                  </div>
                  
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="p-3 rounded bg-gray-50">
                      <p className="text-sm font-medium mb-1">Variant A (Control)</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        "Your first viral video awaits (+ surprise inside)"
                      </p>
                      <div className="flex items-center gap-3 text-xs">
                        <span>68% open</span>
                        <span>32% click</span>
                        <span className="font-medium text-green-600">12% conversion</span>
                      </div>
                    </div>
                    <div className="p-3 rounded bg-purple-50 border border-purple-200">
                      <p className="text-sm font-medium mb-1">Variant B (Test)</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        "🎬 Your first viral video awaits (+ surprise inside)"
                      </p>
                      <div className="flex items-center gap-3 text-xs">
                        <span>74% open</span>
                        <span>35% click</span>
                        <span className="font-medium text-green-600">15% conversion</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        1,234 of 2,000 emails sent
                      </p>
                      <Progress value={62} className="w-32" />
                    </div>
                  </div>
                </div>

                {/* Test Ideas */}
                <div className="pt-4">
                  <h4 className="text-sm font-medium mb-3">Recommended Tests</h4>
                  <div className="grid gap-2">
                    <Button variant="outline" className="justify-start gap-2 h-auto p-3">
                      <div className="flex-1 text-left">
                        <p className="font-medium">Test urgency in Win-Back emails</p>
                        <p className="text-xs text-muted-foreground">
                          "Last chance" vs "Special offer" messaging
                        </p>
                      </div>
                      <Zap className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="justify-start gap-2 h-auto p-3">
                      <div className="flex-1 text-left">
                        <p className="font-medium">Personalization in Weekly Trends</p>
                        <p className="text-xs text-muted-foreground">
                          Generic vs personalized template recommendations
                        </p>
                      </div>
                      <Zap className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Email Preview Modal */}
      {selectedSequence && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{selectedSequence.name} - Email Preview</CardTitle>
            <CardDescription>
              {selectedSequence.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {selectedSequence.emails.map((email, index) => (
                  <div key={email.id} className="p-4 rounded-lg border">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium">Email {index + 1}: {email.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Sent {email.delay ? `${email.delay} hours after trigger` : 'immediately'}
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-xs text-muted-foreground mb-1">Subject</p>
                        <p className="font-medium">{email.subject}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-xs text-muted-foreground mb-1">Preheader</p>
                        <p className="text-sm">{email.preheader}</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          setSelectedEmail(email);
                          setShowPreview(true);
                        }}
                      >
                        View Full Email
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Email Preview Modal */}
      {selectedEmail && (
        <EmailPreview
          email={selectedEmail}
          isOpen={showPreview}
          onClose={() => {
            setShowPreview(false);
            setSelectedEmail(null);
          }}
        />
      )}
    </div>
  );
}

// Add missing imports
import { Video, UserPlus, UserX } from 'lucide-react';