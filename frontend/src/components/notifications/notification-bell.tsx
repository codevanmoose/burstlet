'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Settings, TrendingUp, DollarSign, Gift, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'milestone' | 'revenue' | 'referral' | 'feature';
  timestamp: Date;
  read: boolean;
  action?: string;
}

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Video went viral!',
      message: 'Your video hit 1M views on TikTok',
      type: 'milestone',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      read: false,
      action: '/dashboard/analytics'
    },
    {
      id: '2',
      title: 'New subscriber',
      message: 'Emma upgraded to Pro plan',
      type: 'revenue',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      read: false,
      action: '/dashboard/billing'
    },
    {
      id: '3',
      title: 'Referral success',
      message: '3 friends joined with your code',
      type: 'referral',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
      read: true,
      action: '/dashboard/referrals'
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Simulate new notifications
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.8) {
        const newNotifications = [
          {
            title: 'Milestone reached!',
            message: 'Your account hit 10K followers',
            type: 'milestone' as const
          },
          {
            title: 'Referral reward',
            message: 'You earned 1 month free',
            type: 'referral' as const
          },
          {
            title: 'New feature',
            message: 'Try the new Story Time template',
            type: 'feature' as const
          }
        ];

        const notification = newNotifications[Math.floor(Math.random() * newNotifications.length)];
        
        setNotifications(prev => [{
          id: Date.now().toString(),
          ...notification,
          timestamp: new Date(),
          read: false
        }, ...prev].slice(0, 10));
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'milestone': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'revenue': return <DollarSign className="h-4 w-4 text-emerald-600" />;
      case 'referral': return <Gift className="h-4 w-4 text-pink-600" />;
      case 'feature': return <Zap className="h-4 w-4 text-purple-600" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto p-0 text-xs"
              onClick={markAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No new notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex items-start gap-3 p-3 cursor-pointer",
                  !notification.read && "bg-blue-50"
                )}
                onClick={() => {
                  markAsRead(notification.id);
                  if (notification.action) {
                    router.push(notification.action);
                  }
                }}
              >
                <div className="mt-0.5">{getIcon(notification.type)}</div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-tight">
                    {notification.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTime(notification.timestamp)}
                  </p>
                </div>
                {!notification.read && (
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                )}
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="cursor-pointer"
          onClick={() => router.push('/dashboard/notifications')}
        >
          <Settings className="h-4 w-4 mr-2" />
          Notification Settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}