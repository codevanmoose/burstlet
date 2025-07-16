'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Gift,
  Users,
  Copy,
  Share2,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Twitter,
  Linkedin,
  Mail,
  Zap,
  Crown,
  Star
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  earnings: number;
  nextReward: {
    referralsNeeded: number;
    reward: string;
  };
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export function ReferralDashboard() {
  const [referralCode, setReferralCode] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    activeReferrals: 0,
    earnings: 0,
    nextReward: {
      referralsNeeded: 3,
      reward: '1 month free'
    },
    tier: 'bronze'
  });

  useEffect(() => {
    // Generate unique referral code
    const code = `BURST${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setReferralCode(code);
    setReferralLink(`https://burstlet.com/signup?ref=${code}`);
    
    // Simulate fetching user stats
    // In production, this would be an API call
    setStats({
      totalReferrals: 7,
      activeReferrals: 5,
      earnings: 145,
      nextReward: {
        referralsNeeded: 3,
        reward: '3 months free + Pro features'
      },
      tier: 'silver'
    });
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const shareOnSocial = (platform: string) => {
    const message = `I'm creating viral content with Burstlet AI! Use my code ${referralCode} to get 50% off your first month 🚀`;
    const encodedMessage = encodeURIComponent(message);
    const encodedLink = encodeURIComponent(referralLink);

    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedLink}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedLink}`,
      email: `mailto:?subject=Get%2050%25%20off%20Burstlet%20AI&body=${encodedMessage}%0A%0A${encodedLink}`
    };

    window.open(urls[platform as keyof typeof urls], '_blank');
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'bronze': return <Star className="h-5 w-5 text-orange-600" />;
      case 'silver': return <Star className="h-5 w-5 text-gray-400" />;
      case 'gold': return <Crown className="h-5 w-5 text-yellow-500" />;
      case 'platinum': return <Crown className="h-5 w-5 text-purple-500" />;
      default: return null;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'bg-orange-100 text-orange-800';
      case 'silver': return 'bg-gray-100 text-gray-800';
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'platinum': return 'bg-purple-100 text-purple-800';
      default: return '';
    }
  };

  const rewards = [
    { referrals: 3, reward: '1 month free', icon: Gift },
    { referrals: 10, reward: '3 months free + Pro features', icon: Zap },
    { referrals: 25, reward: '6 months free + Enterprise features', icon: Crown },
    { referrals: 50, reward: 'Lifetime Pro access', icon: Star },
  ];

  const referralProgress = (stats.totalReferrals / 10) * 100;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Referral Program</h2>
        <p className="text-muted-foreground">
          Invite friends and earn free months of Burstlet
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReferrals}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeReferrals}</div>
            <p className="text-xs text-muted-foreground">
              Currently subscribed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.earnings}</div>
            <p className="text-xs text-muted-foreground">
              In free subscription value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Tier</CardTitle>
            {getTierIcon(stats.tier)}
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge className={getTierColor(stats.tier)}>
                {stats.tier.charAt(0).toUpperCase() + stats.tier.slice(1)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.nextReward.referralsNeeded} more for next tier
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="share" className="space-y-4">
        <TabsList>
          <TabsTrigger value="share">Share & Earn</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="share" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Referral Link</CardTitle>
              <CardDescription>
                Share this link to earn rewards when friends sign up
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={referralLink}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button 
                  onClick={() => copyToClipboard(referralLink)}
                  variant="outline"
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Referral Code:</span>
                <Badge variant="secondary" className="font-mono text-lg px-3 py-1">
                  {referralCode}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(referralCode)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>

              <div className="pt-4 space-y-2">
                <p className="text-sm font-medium">Share on social media</p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => shareOnSocial('twitter')}
                    className="gap-2"
                    variant="outline"
                  >
                    <Twitter className="h-4 w-4" />
                    Twitter
                  </Button>
                  <Button
                    onClick={() => shareOnSocial('linkedin')}
                    className="gap-2"
                    variant="outline"
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </Button>
                  <Button
                    onClick={() => shareOnSocial('email')}
                    className="gap-2"
                    variant="outline"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-purple-600" />
                Special Offer Active!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-purple-700">
                Your friends get <strong>50% off their first month</strong> when they use your code.
                You earn <strong>1 free month</strong> for every 3 friends who subscribe!
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reward Milestones</CardTitle>
              <CardDescription>
                Unlock amazing rewards as you refer more friends
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress to next reward</span>
                  <span className="font-medium">
                    {stats.totalReferrals} / 10 referrals
                  </span>
                </div>
                <Progress value={referralProgress} className="h-2" />
              </div>

              <div className="space-y-4">
                {rewards.map((reward, index) => {
                  const isUnlocked = stats.totalReferrals >= reward.referrals;
                  const Icon = reward.icon;
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className={`flex items-center gap-4 p-4 rounded-lg border ${
                        isUnlocked ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                      }`}>
                        <div className={`p-3 rounded-full ${
                          isUnlocked ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <Icon className={`h-6 w-6 ${
                            isUnlocked ? 'text-green-600' : 'text-gray-400'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{reward.reward}</p>
                            {isUnlocked && (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {reward.referrals} successful referrals
                          </p>
                        </div>
                        {!isUnlocked && (
                          <Badge variant="outline">
                            {reward.referrals - stats.totalReferrals} more needed
                          </Badge>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Referrers This Month</CardTitle>
              <CardDescription>
                See how you rank against other Burstlet ambassadors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { rank: 1, name: 'Sarah M.', referrals: 47, tier: 'platinum' },
                  { rank: 2, name: 'Mike R.', referrals: 32, tier: 'gold' },
                  { rank: 3, name: 'Jessica L.', referrals: 28, tier: 'gold' },
                  { rank: 4, name: 'You', referrals: stats.totalReferrals, tier: stats.tier, isYou: true },
                  { rank: 5, name: 'David K.', referrals: 6, tier: 'bronze' },
                ].map((user) => (
                  <div
                    key={user.rank}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      user.isYou ? 'bg-purple-50 border border-purple-200' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        user.rank <= 3 ? 'bg-yellow-100 text-yellow-700 font-bold' : 'bg-gray-100'
                      }`}>
                        {user.rank}
                      </div>
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          {user.name}
                          {user.isYou && <Badge variant="secondary" className="text-xs">You</Badge>}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user.referrals} referrals
                        </p>
                      </div>
                    </div>
                    <Badge className={getTierColor(user.tier)}>
                      {user.tier.charAt(0).toUpperCase() + user.tier.slice(1)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}