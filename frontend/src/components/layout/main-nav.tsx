'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function MainNav() {
  const pathname = usePathname();

  return (
    <div className="mr-4 flex">
      <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
        <span className="font-bold">Burstlet</span>
      </Link>
      <nav className="flex items-center space-x-6 text-sm font-medium">
        <Link
          href="/dashboard"
          className={cn(
            'transition-colors hover:text-foreground/80',
            pathname === '/dashboard' ? 'text-foreground' : 'text-foreground/60'
          )}
        >
          Overview
        </Link>
        <Link
          href="/dashboard/content"
          className={cn(
            'transition-colors hover:text-foreground/80',
            pathname?.startsWith('/dashboard/content') ? 'text-foreground' : 'text-foreground/60'
          )}
        >
          Content
        </Link>
        <Link
          href="/dashboard/generate"
          className={cn(
            'transition-colors hover:text-foreground/80',
            pathname?.startsWith('/dashboard/generate') ? 'text-foreground' : 'text-foreground/60'
          )}
        >
          Generate
        </Link>
        <Link
          href="/dashboard/analytics"
          className={cn(
            'transition-colors hover:text-foreground/80',
            pathname?.startsWith('/dashboard/analytics') ? 'text-foreground' : 'text-foreground/60'
          )}
        >
          Analytics
        </Link>
      </nav>
    </div>
  );
}