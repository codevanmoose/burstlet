'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Filter,
  UserPlus,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Instagram,
  Youtube,
  Twitter,
  Hash,
  Users,
  Heart,
  MessageSquare,
  Zap
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface DiscoveredInfluencer {
  id: string;
  name: string;
  handle: string;
  platform: string;
  followers: number;
  engagementRate: number;
  avgViews: number;
  niche: string[];
  contentType: string[];
  verified: boolean;
  matchScore: number;
  recentGrowth: number;
  audienceQuality: number;
}

export function InfluencerDiscovery() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState({
    minFollowers: 10000,
    maxFollowers: 500000,
    minEngagement: 3,
    platforms: ['instagram', 'tiktok', 'youtube'],
    niches: [] as string[],
    verifiedOnly: false
  });
  const [discoveredInfluencers, setDiscoveredInfluencers] = useState<DiscoveredInfluencer[]>([]);
  const [selectedInfluencers, setSelectedInfluencers] = useState<string[]>([]);

  // Simulated discovery results
  const mockDiscovery: DiscoveredInfluencer[] = [
    {
      id: '1',
      name: 'Emma Wilson',
      handle: '@emmacreates',
      platform: 'tiktok',
      followers: 87000,
      engagementRate: 12.5,
      avgViews: 250000,
      niche: ['lifestyle', 'fashion'],
      contentType: ['short-form', 'tutorials'],
      verified: true,
      matchScore: 95,
      recentGrowth: 23,
      audienceQuality: 88
    },
    {
      id: '2',
      name: 'Alex Rivera',
      handle: '@alextech',
      platform: 'youtube',
      followers: 156000,
      engagementRate: 7.8,
      avgViews: 85000,
      niche: ['tech', 'productivity'],
      contentType: ['reviews', 'tutorials'],
      verified: false,
      matchScore: 88,
      recentGrowth: 15,
      audienceQuality: 92
    },
    {
      id: '3',
      name: 'Sophie Chen',
      handle: '@sophiefitness',
      platform: 'instagram',
      followers: 42000,
      engagementRate: 9.2,
      avgViews: 35000,
      niche: ['fitness', 'wellness'],
      contentType: ['reels', 'posts'],
      verified: false,
      matchScore: 82,
      recentGrowth: 31,
      audienceQuality: 85
    }
  ];

  const handleSearch = async () => {
    setIsSearching(true);
    
    // Simulate API call
    setTimeout(() => {
      setDiscoveredInfluencers(mockDiscovery);
      setIsSearching(false);
      toast.success(`Found ${mockDiscovery.length} matching influencers!`);
    }, 2000);
  };

  const handleAddToOutreach = () => {
    if (selectedInfluencers.length === 0) {
      toast.error('Please select at least one influencer');
      return;
    }
    
    toast.success(`Added ${selectedInfluencers.length} influencers to outreach list`);
    setSelectedInfluencers([]);
  };

  const toggleInfluencerSelection = (id: string) => {
    setSelectedInfluencers(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return <Instagram className="h-4 w-4" />;
      case 'youtube': return <Youtube className="h-4 w-4" />;
      case 'tiktok': return <span className="text-xs font-bold">TT</span>;
      case 'twitter': return <Twitter className="h-4 w-4" />;
      default: return null;
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 80) return 'text-blue-600 bg-blue-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  const popularNiches = [
    'lifestyle', 'fashion', 'beauty', 'tech', 'gaming',
    'fitness', 'food', 'travel', 'education', 'comedy'
  ];

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI-Powered Influencer Discovery
          </CardTitle>
          <CardDescription>
            Find perfect influencers for your brand using advanced AI matching
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search Input */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Describe your ideal influencer (e.g., 'tech YouTubers who review AI tools')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button 
              onClick={handleSearch}
              disabled={isSearching}
              className="gap-2"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Discover
                </>
              )}
            </Button>
          </div>

          {/* Filters */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Filters</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Follower Range */}
              <div className="space-y-2">
                <Label className="text-sm">Follower Range</Label>
                <div className="px-2">
                  <Slider
                    min={1000}
                    max={1000000}
                    step={1000}
                    value={[filters.minFollowers, filters.maxFollowers]}
                    onValueChange={([min, max]) => 
                      setFilters({ ...filters, minFollowers: min, maxFollowers: max })
                    }
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{(filters.minFollowers / 1000).toFixed(0)}K</span>
                    <span>{(filters.maxFollowers / 1000).toFixed(0)}K</span>
                  </div>
                </div>
              </div>

              {/* Engagement Rate */}
              <div className="space-y-2">
                <Label className="text-sm">Min Engagement Rate</Label>
                <div className="px-2">
                  <Slider
                    min={1}
                    max={20}
                    step={0.5}
                    value={[filters.minEngagement]}
                    onValueChange={([value]) => 
                      setFilters({ ...filters, minEngagement: value })
                    }
                    className="mt-2"
                  />
                  <div className="text-center text-xs text-muted-foreground mt-1">
                    {filters.minEngagement}%
                  </div>
                </div>
              </div>

              {/* Verified Only */}
              <div className="space-y-2">
                <Label className="text-sm">Options</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Switch
                    checked={filters.verifiedOnly}
                    onCheckedChange={(checked) => 
                      setFilters({ ...filters, verifiedOnly: checked })
                    }
                  />
                  <Label className="text-sm font-normal">Verified accounts only</Label>
                </div>
              </div>
            </div>

            {/* Niches */}
            <div className="space-y-2">
              <Label className="text-sm">Popular Niches</Label>
              <div className="flex flex-wrap gap-2">
                {popularNiches.map((niche) => (
                  <Badge
                    key={niche}
                    variant={filters.niches.includes(niche) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      setFilters({
                        ...filters,
                        niches: filters.niches.includes(niche)
                          ? filters.niches.filter(n => n !== niche)
                          : [...filters.niches, niche]
                      });
                    }}
                  >
                    {niche}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {discoveredInfluencers.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Discovered Influencers</CardTitle>
                <CardDescription>
                  {discoveredInfluencers.length} influencers match your criteria
                </CardDescription>
              </div>
              <Button
                onClick={handleAddToOutreach}
                disabled={selectedInfluencers.length === 0}
                className="gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Add {selectedInfluencers.length || ''} to Outreach
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <AnimatePresence>
                <div className="space-y-3">
                  {discoveredInfluencers.map((influencer, index) => (
                    <motion.div
                      key={influencer.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedInfluencers.includes(influencer.id)
                            ? 'border-purple-500 bg-purple-50'
                            : 'hover:border-gray-300'
                        }`}
                        onClick={() => toggleInfluencerSelection(influencer.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback>
                                {influencer.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="space-y-2">
                              <div>
                                <p className="font-medium flex items-center gap-2">
                                  {influencer.name}
                                  {influencer.verified && (
                                    <CheckCircle2 className="h-4 w-4 text-blue-500" />
                                  )}
                                </p>
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                  {getPlatformIcon(influencer.platform)}
                                  {influencer.handle}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm">
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {(influencer.followers / 1000).toFixed(0)}K
                                </span>
                                <span className="flex items-center gap-1">
                                  <Heart className="h-3 w-3" />
                                  {influencer.engagementRate}%
                                </span>
                                <span className="flex items-center gap-1">
                                  <TrendingUp className="h-3 w-3" />
                                  +{influencer.recentGrowth}%
                                </span>
                              </div>

                              <div className="flex gap-2">
                                {influencer.niche.map((n) => (
                                  <Badge key={n} variant="secondary" className="text-xs">
                                    {n}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="text-right space-y-2">
                            <Badge className={`${getMatchScoreColor(influencer.matchScore)} gap-1`}>
                              <Sparkles className="h-3 w-3" />
                              {influencer.matchScore}% match
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                              Audience quality: {influencer.audienceQuality}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isSearching && discoveredInfluencers.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Discover Your Perfect Influencers</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Use AI to find influencers who match your brand values and have engaged audiences
              ready to love your product.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}