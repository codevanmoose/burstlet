'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  UserPlus,
  Video,
  TrendingUp,
  DollarSign,
  Share2,
  Zap,
  Star,
  Gift,
  Eye,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ActivityEvent {
  id: string;
  type: 'signup' | 'video_created' | 'viral_milestone' | 'revenue' | 'referral' | 'upgrade';
  user: {
    name: string;
    avatar?: string;
  };
  message: string;
  details?: string;
  timestamp: Date;
  value?: number;
  icon: any;
  color: string;
}

export function LiveActivityFeed() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [isPaused, setPaused] = useState(false);

  // Event templates for realistic simulation
  const eventTemplates = [
    {
      type: 'signup' as const,
      messages: [
        { user: 'Emma S.', message: 'just signed up', details: 'via Product Hunt' },
        { user: 'Mike R.', message: 'started free trial', details: 'referred by Sarah' },
        { user: 'Jessica L.', message: 'joined Burstlet', details: 'from Instagram ad' },
      ],
      icon: UserPlus,
      color: 'text-blue-600 bg-blue-50'
    },
    {
      type: 'video_created' as const,
      messages: [
        { user: 'Alex K.', message: 'created a video', details: 'MrBeast Challenge template' },
        { user: 'Sophie M.', message: 'generated 5 videos', details: 'Bulk creation' },
        { user: 'David P.', message: 'made first video', details: 'Satisfying Loop template' },
      ],
      icon: Video,
      color: 'text-purple-600 bg-purple-50'
    },
    {
      type: 'viral_milestone' as const,
      messages: [
        { user: 'Chris T.', message: 'video hit 1M views!', details: 'on TikTok', value: 1000000 },
        { user: 'Lisa W.', message: 'reached 100K followers', details: 'using Burstlet videos', value: 100000 },
        { user: 'Ryan H.', message: 'video went viral!', details: '5.2M views in 24h', value: 5200000 },
      ],
      icon: TrendingUp,
      color: 'text-green-600 bg-green-50'
    },
    {
      type: 'revenue' as const,
      messages: [
        { user: 'Tom B.', message: 'upgraded to Pro', details: '$99/month', value: 99 },
        { user: 'Amy L.', message: 'subscribed to Starter', details: '$29/month', value: 29 },
        { user: 'Enterprise Co.', message: 'signed Enterprise deal', details: '$299/month', value: 299 },
      ],
      icon: DollarSign,
      color: 'text-emerald-600 bg-emerald-50'
    },
    {
      type: 'referral' as const,
      messages: [
        { user: 'Sarah M.', message: 'referred 3 friends', details: 'Earned 1 month free' },
        { user: 'Mark D.', message: 'invited team members', details: '5 people joined' },
        { user: 'Nina R.', message: 'shared referral code', details: '12 signups!' },
      ],
      icon: Gift,
      color: 'text-pink-600 bg-pink-50'
    }
  ];

  // Generate random event
  const generateEvent = (): ActivityEvent => {
    const template = eventTemplates[Math.floor(Math.random() * eventTemplates.length)];
    const message = template.messages[Math.floor(Math.random() * template.messages.length)];
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      type: template.type,
      user: {
        name: message.user,
        avatar: undefined
      },
      message: message.message,
      details: message.details,
      timestamp: new Date(),
      value: message.value,
      icon: template.icon,
      color: template.color
    };
  };

  // Simulate real-time events
  useEffect(() => {
    if (isPaused) return;

    // Add initial events
    const initialEvents = Array.from({ length: 5 }, generateEvent);
    setEvents(initialEvents);

    // Add new events periodically
    const interval = setInterval(() => {
      const newEvent = generateEvent();
      setEvents(prev => [newEvent, ...prev].slice(0, 50)); // Keep last 50 events
    }, Math.random() * 3000 + 2000); // Random interval between 2-5 seconds

    return () => clearInterval(interval);
  }, [isPaused]);

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getEventIcon = (event: ActivityEvent) => {
    const Icon = event.icon;
    return (
      <div className={cn("p-2 rounded-lg", event.color)}>
        <Icon className="h-4 w-4" />
      </div>
    );
  };

  // Summary stats
  const stats = {
    totalEvents: events.length,
    signups: events.filter(e => e.type === 'signup').length,
    revenue: events.filter(e => e.type === 'revenue').reduce((sum, e) => sum + (e.value || 0), 0),
    viral: events.filter(e => e.type === 'viral_milestone').length
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Live Activity
              {!isPaused && (
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </CardTitle>
            <CardDescription>
              Real-time user actions and milestones
            </CardDescription>
          </div>
          <button
            onClick={() => setPaused(!isPaused)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 p-4 border-b">
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.signups}</p>
            <p className="text-xs text-muted-foreground">New Users</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">${stats.revenue}</p>
            <p className="text-xs text-muted-foreground">Revenue</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.viral}</p>
            <p className="text-xs text-muted-foreground">Viral Hits</p>
          </div>
        </div>

        {/* Activity Feed */}
        <ScrollArea className="h-[400px]">
          <AnimatePresence>
            <div className="p-4 space-y-3">
              {events.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-start gap-3"
                >
                  {getEventIcon(event)}
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">{event.user.name}</span>
                      {' '}
                      <span className="text-muted-foreground">{event.message}</span>
                    </p>
                    {event.details && (
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        {event.details}
                        {event.value && event.type === 'viral_milestone' && (
                          <Badge variant="secondary" className="text-xs">
                            <Eye className="h-3 w-3 mr-1" />
                            {(event.value / 1000000).toFixed(1)}M
                          </Badge>
                        )}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(event.timestamp)}
                  </span>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        </ScrollArea>

        {/* Milestones Alert */}
        {events.some(e => e.type === 'viral_milestone' && e.timestamp.getTime() > Date.now() - 60000) && (
          <div className="p-4 border-t bg-gradient-to-r from-purple-50 to-pink-50">
            <div className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 text-purple-600" />
              <span className="font-medium">Viral Alert!</span>
              <span className="text-muted-foreground">
                3 videos went viral in the last hour
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}