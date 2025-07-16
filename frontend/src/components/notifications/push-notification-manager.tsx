'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bell,
  BellOff,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Users,
  Gift,
  Zap,
  Clock,
  Smartphone,
  Monitor,
  Mail,
  Volume2,
  Eye,
  Heart,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationPreference {
  id: string;
  category: string;
  name: string;
  description: string;
  channels: {
    push: boolean;
    email: boolean;
    inApp: boolean;
  };
  icon: any;
  color: string;
}

interface NotificationEvent {
  id: string;
  type: string;
  title: string;
  body: string;
  icon: any;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    url: string;
  };
}

export function PushNotificationManager() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    {
      id: 'milestones',
      category: 'Achievements',
      name: 'Viral Milestones',
      description: 'When your videos hit view milestones',
      channels: { push: true, email: true, inApp: true },
      icon: TrendingUp,
      color: 'text-green-600'
    },
    {
      id: 'revenue',
      category: 'Business',
      name: 'Revenue Updates',
      description: 'New subscriptions and earnings',
      channels: { push: true, email: false, inApp: true },
      icon: DollarSign,
      color: 'text-emerald-600'
    },
    {
      id: 'referrals',
      category: 'Growth',
      name: 'Referral Activity',
      description: 'When friends use your referral code',
      channels: { push: true, email: true, inApp: true },
      icon: Gift,
      color: 'text-pink-600'
    },
    {
      id: 'engagement',
      category: 'Engagement',
      name: 'Audience Engagement',
      description: 'Comments, likes, and shares on your content',
      channels: { push: false, email: false, inApp: true },
      icon: Heart,
      color: 'text-red-600'
    },
    {
      id: 'features',
      category: 'Product',
      name: 'New Features',
      description: 'Product updates and new templates',
      channels: { push: true, email: true, inApp: true },
      icon: Zap,
      color: 'text-purple-600'
    },
    {
      id: 'reminders',
      category: 'Engagement',
      name: 'Smart Reminders',
      description: 'Optimal posting times and content suggestions',
      channels: { push: true, email: false, inApp: true },
      icon: Clock,
      color: 'text-blue-600'
    }
  ]);

  const [recentNotifications, setRecentNotifications] = useState<NotificationEvent[]>([
    {
      id: '1',
      type: 'milestones',
      title: '🎉 Your video hit 1M views!',
      body: '"AI Breaks Reality" just passed 1 million views on TikTok',
      icon: TrendingUp,
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      read: false,
      action: {
        label: 'View Analytics',
        url: '/dashboard/analytics'
      }
    },
    {
      id: '2',
      type: 'referrals',
      title: '3 friends joined with your code!',
      body: 'You earned 1 month free. Keep sharing to earn more.',
      icon: Gift,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      read: true,
      action: {
        label: 'View Referrals',
        url: '/dashboard/referrals'
      }
    },
    {
      id: '3',
      type: 'features',
      title: 'New Template: Story Time',
      body: 'Users are getting 10M+ views with this viral format',
      icon: Zap,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      read: true,
      action: {
        label: 'Try Template',
        url: '/dashboard/generate'
      }
    }
  ]);

  useEffect(() => {
    // Check notification permission
    if ('Notification' in window) {
      setPermission(Notification.permission);
      setIsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Your browser doesn't support notifications');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      setIsEnabled(permission === 'granted');
      
      if (permission === 'granted') {
        toast.success('Push notifications enabled!');
        // Show test notification
        new Notification('Welcome to Burstlet! 🚀', {
          body: 'You'll now receive important updates about your content.',
          icon: '/icon-192x192.png'
        });
      } else {
        toast.error('Please enable notifications in your browser settings');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
    }
  };

  const updatePreference = (id: string, channel: 'push' | 'email' | 'inApp', value: boolean) => {
    setPreferences(prev => prev.map(pref => {
      if (pref.id === id) {
        return {
          ...pref,
          channels: {
            ...pref.channels,
            [channel]: value
          }
        };
      }
      return pref;
    }));
    toast.success('Preferences updated');
  };

  const sendTestNotification = (type: string) => {
    const pref = preferences.find(p => p.id === type);
    if (!pref || !isEnabled) return;

    const notifications: Record<string, { title: string; body: string }> = {
      milestones: {
        title: '🚀 Test: Video went viral!',
        body: 'Your video just hit 2.5M views on TikTok'
      },
      revenue: {
        title: '💰 Test: New subscriber!',
        body: 'Sarah just subscribed to Pro plan ($99/mo)'
      },
      referrals: {
        title: '🎁 Test: Referral success!',
        body: 'Mike used your code - you earned rewards!'
      }
    };

    const notification = notifications[type];
    if (notification) {
      new Notification(notification.title, {
        body: notification.body,
        icon: '/icon-192x192.png'
      });
    }
  };

  const markAsRead = (id: string) => {
    setRecentNotifications(prev => prev.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const groupedPreferences = preferences.reduce((acc, pref) => {
    if (!acc[pref.category]) acc[pref.category] = [];
    acc[pref.category].push(pref);
    return acc;
  }, {} as Record<string, NotificationPreference[]>);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
        <p className="text-muted-foreground">
          Manage how you receive updates about your content
        </p>
      </div>

      {/* Permission Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Push Notifications
            {isEnabled ? (
              <Badge className="gap-1 bg-green-100 text-green-700">
                <Bell className="h-3 w-3" />
                Enabled
              </Badge>
            ) : (
              <Badge className="gap-1" variant="secondary">
                <BellOff className="h-3 w-3" />
                Disabled
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Get instant alerts when important events happen
          </CardDescription>
        </CardHeader>
        <CardContent>
          {permission === 'default' ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enable push notifications to get real-time updates about:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  When your videos go viral
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  New subscribers and revenue
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Referral rewards earned
                </li>
              </ul>
              <Button onClick={requestPermission} className="gap-2">
                <Bell className="h-4 w-4" />
                Enable Notifications
              </Button>
            </div>
          ) : permission === 'denied' ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Notifications Blocked</p>
                  <p className="text-xs text-muted-foreground">
                    Please enable notifications in your browser settings to receive updates.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                Push notifications are active
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => sendTestNotification('milestones')}
                >
                  Send Test Notification
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="preferences" className="space-y-4">
        <TabsList>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
        </TabsList>

        <TabsContent value="preferences" className="space-y-4">
          {Object.entries(groupedPreferences).map(([category, prefs]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-lg">{category}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {prefs.map(pref => {
                  const Icon = pref.icon;
                  return (
                    <div key={pref.id} className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-gray-100 ${pref.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{pref.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {pref.description}
                          </p>
                        </div>
                      </div>
                      <div className="ml-11 flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={pref.channels.push}
                            onCheckedChange={(checked) => updatePreference(pref.id, 'push', checked)}
                            disabled={!isEnabled}
                          />
                          <Label className="text-sm flex items-center gap-1">
                            <Smartphone className="h-3 w-3" />
                            Push
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={pref.channels.email}
                            onCheckedChange={(checked) => updatePreference(pref.id, 'email', checked)}
                          />
                          <Label className="text-sm flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            Email
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={pref.channels.inApp}
                            onCheckedChange={(checked) => updatePreference(pref.id, 'inApp', checked)}
                          />
                          <Label className="text-sm flex items-center gap-1">
                            <Monitor className="h-3 w-3" />
                            In-App
                          </Label>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
              <CardDescription>
                Your latest updates and alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <AnimatePresence>
                  <div className="space-y-3">
                    {recentNotifications.map((notification) => {
                      const Icon = notification.icon;
                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={cn(
                            "p-3 rounded-lg border cursor-pointer transition-colors",
                            notification.read ? "bg-gray-50" : "bg-blue-50 border-blue-200"
                          )}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-white">
                              <Icon className="h-4 w-4 text-gray-600" />
                            </div>
                            <div className="flex-1 space-y-1">
                              <p className="font-medium text-sm">{notification.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {notification.body}
                              </p>
                              {notification.action && (
                                <Button 
                                  variant="link" 
                                  size="sm" 
                                  className="h-auto p-0 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Navigate to action URL
                                  }}
                                >
                                  {notification.action.label} →
                                </Button>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(notification.timestamp)}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </AnimatePresence>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Push Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Real-time alerts on your device
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Instant delivery
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Works offline
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Rich media support
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Detailed updates in your inbox
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Weekly summaries
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Detailed analytics
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Actionable insights
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  In-App Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Updates within Burstlet
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Notification center
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Historical view
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Rich interactions
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Utility function
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// Import missing utility
import { cn } from '@/lib/utils';