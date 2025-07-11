export interface Content {
  id: string;
  title: string;
  type: 'video' | 'blog' | 'social';
  status: 'draft' | 'published' | 'scheduled';
  platforms?: string[];
  content?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  scheduledFor?: string;
  performance?: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
  };
}

export interface ContentFilters {
  search?: string;
  type?: 'all' | 'video' | 'blog' | 'social';
  status?: 'all' | 'draft' | 'published' | 'scheduled';
  platform?: 'all' | 'youtube' | 'tiktok' | 'instagram' | 'twitter';
  dateRange?: {
    start: Date | null;
    end: Date | null;
  };
}