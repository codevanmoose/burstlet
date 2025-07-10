'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTopContent } from '@/hooks/api/use-analytics';
import { formatNumber, formatPercentage, formatDate } from '@/lib/utils/format';
import { 
  Eye, 
  Heart, 
  Share2, 
  ExternalLink,
  Video,
  FileText,
  Image as ImageIcon,
  TrendingUp
} from 'lucide-react';

interface TopContentProps {
  dateRange: { from: Date; to: Date };
  platform: string;
  compact?: boolean;
}

const typeIcons = {
  VIDEO: Video,
  BLOG: FileText,
  SOCIAL: ImageIcon,
};

export function TopContent({ dateRange, platform, compact = false }: TopContentProps) {
  const { data: topContent, isLoading } = useTopContent({
    dateFrom: dateRange.from.toISOString(),
    dateTo: dateRange.to.toISOString(),
    platform: platform === 'all' ? undefined : platform,
    limit: compact ? 5 : 10,
  });

  if (isLoading) {
    return (
      <Card className={compact ? '' : 'lg:col-span-full'}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const content = topContent?.content || [];

  return (
    <Card className={compact ? '' : 'lg:col-span-full'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Top Performing Content
        </CardTitle>
        <CardDescription>
          Your best performing content {compact ? 'this period' : 'ranked by total engagement'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {content.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No content data available for this period.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {content.map((item, index) => {
              const Icon = typeIcons[item.type as keyof typeof typeIcons];
              
              return (
                <div
                  key={item.contentId}
                  className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  {/* Rank Badge */}
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {index + 1}
                  </div>

                  {/* Content Icon & Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded bg-muted">
                      {Icon && <Icon className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{item.title}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs capitalize">
                          {item.type.toLowerCase()}
                        </Badge>
                        <span>•</span>
                        <span>{formatDate(item.publishedAt)}</span>
                        {item.platforms && item.platforms.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="capitalize">{item.platforms[0]}</span>
                            {item.platforms.length > 1 && (
                              <span>+{item.platforms.length - 1}</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className={`flex items-center gap-4 ${compact ? 'text-sm' : ''}`}>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      <span>{formatNumber(item.totalViews || 0)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Heart className="h-4 w-4" />
                      <span>{formatNumber(item.totalLikes || 0)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Share2 className="h-4 w-4" />
                      <span>{formatNumber(item.totalShares || 0)}</span>
                    </div>
                  </div>

                  {/* Engagement Rate */}
                  <div className="text-right">
                    <div className="font-medium">
                      {formatPercentage(item.engagementRate || 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      engagement
                    </div>
                  </div>

                  {/* Actions */}
                  {!compact && (
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!compact && content.length > 0 && (
          <div className="mt-6 text-center">
            <Button variant="outline">
              View All Content
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}