'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebar, useActiveGenerationsCount } from '@/store';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Home,
  FileText,
  Sparkles,
  BarChart3,
  Settings,
  CreditCard,
  Users,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Gift,
  Mail,
  TrendingUp,
  Flask,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const sidebarItems = [
  {
    title: 'Overview',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: 'Content',
    href: '/dashboard/content',
    icon: FileText,
  },
  {
    title: 'Generate',
    href: '/dashboard/generate',
    icon: Sparkles,
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    title: 'Growth',
    href: '/dashboard/growth',
    icon: TrendingUp,
  },
  {
    title: 'Experiments',
    href: '/dashboard/experiments',
    icon: Flask,
  },
  {
    title: 'Influencers',
    href: '/dashboard/influencers',
    icon: Users,
  },
  {
    title: 'Email Campaigns',
    href: '/dashboard/emails',
    icon: Mail,
  },
  {
    title: 'Calendar',
    href: '/dashboard/calendar',
    icon: Calendar,
  },
  {
    title: 'Team',
    href: '/dashboard/team',
    icon: Users,
  },
  {
    title: 'Referrals',
    href: '/dashboard/referrals',
    icon: Gift,
  },
  {
    title: 'Billing',
    href: '/dashboard/billing',
    icon: CreditCard,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, setSidebarCollapsed } = useSidebar();
  const activeGenerations = useActiveGenerationsCount();

  return (
    <aside className={cn(
      "border-r bg-gray-50/40 dark:bg-gray-900/40 transition-all duration-300",
      sidebarCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex h-full flex-col">
        <div className="flex h-14 items-center justify-between px-4 border-b">
          {!sidebarCollapsed && (
            <h2 className="text-lg font-semibold">Burstlet</h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="h-8 w-8"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <nav className="flex-1 space-y-1 p-2">
          <TooltipProvider delayDuration={0}>
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || 
                (item.href !== '/dashboard' && pathname?.startsWith(item.href));
              const showGenerationBadge = item.href === '/dashboard/generate' && activeGenerations > 0;
              
              const linkContent = (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-gray-100 dark:hover:bg-gray-800',
                    isActive
                      ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50'
                      : 'text-gray-600 dark:text-gray-400',
                    sidebarCollapsed && 'justify-center'
                  )}
                >
                  <div className="relative">
                    <Icon className="h-4 w-4" />
                    {showGenerationBadge && (
                      <div className="absolute -top-1 -right-1">
                        <Badge variant="default" className="h-4 w-4 p-0 flex items-center justify-center">
                          <Loader2 className="h-3 w-3 animate-spin" />
                        </Badge>
                      </div>
                    )}
                  </div>
                  {!sidebarCollapsed && (
                    <span className="flex-1 flex items-center justify-between">
                      {item.title}
                      {showGenerationBadge && (
                        <Badge variant="secondary" className="ml-auto">
                          {activeGenerations}
                        </Badge>
                      )}
                    </span>
                  )}
                </Link>
              );
              
              if (sidebarCollapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      {linkContent}
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{item.title}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }
              
              return linkContent;
            })}
          </TooltipProvider>
        </nav>
        
        {/* Referral Promo Banner */}
        {!sidebarCollapsed && (
          <div className="border-t p-4">
            <Link href="/dashboard/referrals">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg p-3 cursor-pointer hover:opacity-90 transition-opacity">
                <div className="flex items-center gap-2 mb-1">
                  <Gift className="h-4 w-4" />
                  <span className="font-semibold text-sm">Earn Free Months!</span>
                </div>
                <p className="text-xs opacity-90">
                  Refer 3 friends, get 1 month free
                </p>
              </div>
            </Link>
          </div>
        )}
        
        {/* Generation Status Footer */}
        {activeGenerations > 0 && !sidebarCollapsed && (
          <div className="border-t p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{activeGenerations} generation{activeGenerations > 1 ? 's' : ''} in progress</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}