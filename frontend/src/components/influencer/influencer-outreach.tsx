'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  Send,
  Copy,
  CheckCircle2,
  Clock,
  TrendingUp,
  DollarSign,
  MessageSquare,
  Instagram,
  Youtube,
  Twitter,
  Linkedin,
  Filter,
  Download,
  Eye,
  UserPlus,
  Sparkles
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { 
  influencerTemplates, 
  getTemplatesByPlatform,
  personalizeTemplate,
  InfluencerTemplate 
} from '@/data/influencer-templates';

interface InfluencerData {
  id: string;
  name: string;
  handle: string;
  platform: string;
  followers: number;
  engagementRate: number;
  niche: string;
  avatar?: string;
  recentContent?: string;
  status: 'not_contacted' | 'contacted' | 'responded' | 'converted' | 'declined';
  lastContact?: Date;
  revenue?: number;
}

// Mock data for demonstration
const mockInfluencers: InfluencerData[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    handle: '@sarahcreates',
    platform: 'tiktok',
    followers: 45000,
    engagementRate: 8.5,
    niche: 'lifestyle',
    status: 'responded',
    revenue: 450
  },
  {
    id: '2', 
    name: 'Mike Chen',
    handle: '@techmikey',
    platform: 'youtube',
    followers: 125000,
    engagementRate: 5.2,
    niche: 'tech',
    status: 'converted',
    revenue: 2300
  },
  {
    id: '3',
    name: 'Jessica Lee',
    handle: '@jessicafitness',
    platform: 'instagram',
    followers: 78000,
    engagementRate: 6.8,
    niche: 'fitness',
    status: 'contacted',
    lastContact: new Date('2024-01-10')
  },
  {
    id: '4',
    name: 'David Park',
    handle: '@davidbusiness',
    platform: 'linkedin',
    followers: 55000,
    engagementRate: 4.2,
    niche: 'business',
    status: 'not_contacted'
  }
];

export function InfluencerOutreach() {
  const [selectedTemplate, setSelectedTemplate] = useState<InfluencerTemplate | null>(null);
  const [selectedInfluencer, setSelectedInfluencer] = useState<InfluencerData | null>(null);
  const [personalizedMessage, setPersonalizedMessage] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState('all');

  const stats = {
    totalContacted: 47,
    responseRate: 28,
    converted: 12,
    totalRevenue: 14500,
    avgDealSize: 1208
  };

  const handleTemplateSelect = (template: InfluencerTemplate) => {
    setSelectedTemplate(template);
    // Initialize variables with placeholders
    const initialVars: Record<string, string> = {};
    template.variables.forEach(v => {
      initialVars[v] = '';
    });
    setVariables(initialVars);
  };

  const handlePersonalize = () => {
    if (!selectedTemplate || !selectedInfluencer) return;
    
    const personalizedVars = {
      ...variables,
      name: selectedInfluencer.name.split(' ')[0],
      your_name: 'Your Name' // Would come from user profile
    };
    
    const personalized = personalizeTemplate(selectedTemplate, personalizedVars);
    setPersonalizedMessage(personalized.message);
  };

  const handleSendMessage = () => {
    if (!selectedInfluencer) return;
    
    // In production, this would send via API
    toast.success(`Message sent to ${selectedInfluencer.name}!`);
    
    // Update influencer status
    selectedInfluencer.status = 'contacted';
    selectedInfluencer.lastContact = new Date();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return <Instagram className="h-4 w-4" />;
      case 'youtube': return <Youtube className="h-4 w-4" />;
      case 'tiktok': return <span className="text-xs font-bold">TT</span>;
      case 'twitter': return <Twitter className="h-4 w-4" />;
      case 'linkedin': return <Linkedin className="h-4 w-4" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_contacted': return 'bg-gray-100 text-gray-700';
      case 'contacted': return 'bg-blue-100 text-blue-700';
      case 'responded': return 'bg-yellow-100 text-yellow-700';
      case 'converted': return 'bg-green-100 text-green-700';
      case 'declined': return 'bg-red-100 text-red-700';
      default: return '';
    }
  };

  const filteredInfluencers = filter === 'all' 
    ? mockInfluencers 
    : mockInfluencers.filter(i => i.platform === filter);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Influencer Outreach</h2>
        <p className="text-muted-foreground">
          Connect with influencers to grow Burstlet organically
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contacted</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContacted}</div>
            <p className="text-xs text-muted-foreground">+12 this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.responseRate}%</div>
            <p className="text-xs text-muted-foreground">Industry avg: 15%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Converted</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.converted}</div>
            <p className="text-xs text-muted-foreground">25% conversion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue}</div>
            <p className="text-xs text-muted-foreground">From referrals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Deal</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.avgDealSize}</div>
            <p className="text-xs text-muted-foreground">Per influencer</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="outreach" className="space-y-4">
        <TabsList>
          <TabsTrigger value="outreach">Send Outreach</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="outreach" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Influencer List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Select Influencer</CardTitle>
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="twitter">Twitter</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {filteredInfluencers.map((influencer) => (
                  <div
                    key={influencer.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedInfluencer?.id === influencer.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedInfluencer(influencer)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{influencer.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            {influencer.name}
                            <span className="text-sm text-muted-foreground">
                              {influencer.handle}
                            </span>
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {getPlatformIcon(influencer.platform)}
                            <span>{(influencer.followers / 1000).toFixed(0)}K followers</span>
                            <span>•</span>
                            <span>{influencer.engagementRate}% ER</span>
                          </div>
                        </div>
                      </div>
                      <Badge className={getStatusColor(influencer.status)} variant="secondary">
                        {influencer.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Message Composer */}
            <Card>
              <CardHeader>
                <CardTitle>Compose Message</CardTitle>
                <CardDescription>
                  Select a template and personalize it
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Template</Label>
                  <Select
                    value={selectedTemplate?.id}
                    onValueChange={(id) => {
                      const template = influencerTemplates.find(t => t.id === id);
                      if (template) handleTemplateSelect(template);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {influencerTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTemplate && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Fill in the variables to personalize:
                    </p>
                    {selectedTemplate.variables
                      .filter(v => v !== 'name' && v !== 'your_name')
                      .map((variable) => (
                        <div key={variable}>
                          <Label className="text-xs">
                            {variable.replace(/_/g, ' ')}
                          </Label>
                          <Input
                            placeholder={`Enter ${variable.replace(/_/g, ' ')}`}
                            value={variables[variable] || ''}
                            onChange={(e) => setVariables({
                              ...variables,
                              [variable]: e.target.value
                            })}
                          />
                        </div>
                      ))}
                    
                    <Button 
                      onClick={handlePersonalize}
                      className="w-full gap-2"
                      disabled={!selectedInfluencer}
                    >
                      <Sparkles className="h-4 w-4" />
                      Generate Personalized Message
                    </Button>
                  </div>
                )}

                {personalizedMessage && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Personalized Message</Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(personalizedMessage)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <Textarea
                      value={personalizedMessage}
                      onChange={(e) => setPersonalizedMessage(e.target.value)}
                      className="min-h-[200px] text-sm"
                    />
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleSendMessage}
                        className="flex-1 gap-2"
                        disabled={!selectedInfluencer}
                      >
                        <Send className="h-4 w-4" />
                        Send Message
                      </Button>
                      <Button variant="outline" className="gap-2">
                        <Clock className="h-4 w-4" />
                        Schedule
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4">
            {influencerTemplates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {getPlatformIcon(template.platform)}
                        {template.name}
                      </CardTitle>
                      <CardDescription>
                        {template.followerRange} followers • {template.niche} niche
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {template.estimatedResponseRate}% response rate
                      </Badge>
                      <Badge>
                        {template.offerType.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap font-mono">
                      {template.message.substring(0, 200)}...
                    </p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleTemplateSelect(template)}
                    >
                      Use Template
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => copyToClipboard(template.message)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tracking" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Outreach Performance</CardTitle>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Conversion Funnel */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Conversion Funnel</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm w-24">Contacted</span>
                      <Progress value={100} className="flex-1" />
                      <span className="text-sm font-medium w-12">47</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm w-24">Responded</span>
                      <Progress value={28} className="flex-1" />
                      <span className="text-sm font-medium w-12">13</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm w-24">Interested</span>
                      <Progress value={19} className="flex-1" />
                      <span className="text-sm font-medium w-12">9</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm w-24">Converted</span>
                      <Progress value={25} className="flex-1" />
                      <span className="text-sm font-medium w-12">12</span>
                    </div>
                  </div>
                </div>

                {/* Top Performers */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Top Performing Influencers</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>MC</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">Mike Chen</p>
                          <p className="text-xs text-muted-foreground">125K followers</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">$2,300</p>
                        <p className="text-xs text-muted-foreground">46 referrals</p>
                      </div>
                    </div>
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