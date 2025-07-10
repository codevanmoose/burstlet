'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const recentContent = [
  {
    id: 1,
    title: 'How to Use AI for Content Creation',
    platform: 'YouTube',
    views: '12.4K',
    time: '2 hours ago',
    thumbnail: '/api/placeholder/100/100',
  },
  {
    id: 2,
    title: '10 Tips for Growing on TikTok',
    platform: 'TikTok',
    views: '8.2K',
    time: '5 hours ago',
    thumbnail: '/api/placeholder/100/100',
  },
  {
    id: 3,
    title: 'The Future of Social Media Marketing',
    platform: 'Instagram',
    views: '5.1K',
    time: '1 day ago',
    thumbnail: '/api/placeholder/100/100',
  },
  {
    id: 4,
    title: 'AI Tools Every Creator Needs',
    platform: 'Twitter',
    views: '3.8K',
    time: '2 days ago',
    thumbnail: '/api/placeholder/100/100',
  },
  {
    id: 5,
    title: 'Building Your Personal Brand',
    platform: 'YouTube',
    views: '15.2K',
    time: '3 days ago',
    thumbnail: '/api/placeholder/100/100',
  },
];

export function RecentContent() {
  return (
    <div className="space-y-8">
      {recentContent.map((content) => (
        <div key={content.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src={content.thumbnail} alt={content.title} />
            <AvatarFallback>{content.platform[0]}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{content.title}</p>
            <p className="text-sm text-muted-foreground">
              {content.platform} · {content.views} views
            </p>
          </div>
          <div className="ml-auto font-medium text-sm text-muted-foreground">
            {content.time}
          </div>
        </div>
      ))}
    </div>
  );
}