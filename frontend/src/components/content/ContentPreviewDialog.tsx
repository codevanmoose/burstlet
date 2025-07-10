'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Content } from '@/lib/api/content';
import { Video, FileText, Image, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface ContentPreviewDialogProps {
  content: Content | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const typeIcons = {
  VIDEO: <Video className="h-5 w-5" />,
  BLOG: <FileText className="h-5 w-5" />,
  SOCIAL: <Image className="h-5 w-5" />,
};

export default function ContentPreviewDialog({
  content,
  open,
  onOpenChange,
}: ContentPreviewDialogProps) {
  if (!content) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-muted">
              {typeIcons[content.type]}
            </div>
            {content.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Metadata */}
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <Badge variant="outline" className="capitalize">
              {content.type.toLowerCase()}
            </Badge>
            <span>•</span>
            <span>Created {formatDistanceToNow(new Date(content.createdAt), { addSuffix: true })}</span>
            {content.platforms && content.platforms.length > 0 && (
              <>
                <span>•</span>
                <div className="flex gap-1">
                  {content.platforms.map((platform) => (
                    <Badge key={platform} variant="secondary" className="text-xs">
                      {platform}
                    </Badge>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Description */}
          {content.description && (
            <div>
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-muted-foreground">{content.description}</p>
            </div>
          )}

          {/* Content */}
          <div>
            <h3 className="font-medium mb-4">Content</h3>
            
            {content.type === 'VIDEO' && (content.videoUrl || content.mediaUrl) && (
              <div className="space-y-4">
                <video
                  src={content.videoUrl || content.mediaUrl}
                  controls
                  className="w-full rounded-lg"
                  poster={content.thumbnailUrl}
                />
                {content.thumbnailUrl && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Image className="h-4 w-4" />
                    <a 
                      href={content.thumbnailUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:underline"
                    >
                      View thumbnail
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {content.type === 'BLOG' && content.content && (
              <div className="prose prose-sm max-w-none">
                <div
                  className="whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: content.content }}
                />
              </div>
            )}

            {content.type === 'SOCIAL' && (
              <div className="space-y-4">
                {content.content && (
                  <div className="p-4 border rounded-lg">
                    <p className="whitespace-pre-wrap">{content.content}</p>
                  </div>
                )}
                {content.mediaUrl && (
                  <div>
                    {content.mediaUrl.includes('video') ? (
                      <video src={content.mediaUrl} controls className="w-full max-w-md rounded-lg" />
                    ) : (
                      <img src={content.mediaUrl} alt="Social media content" className="w-full max-w-md rounded-lg" />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tags */}
          {content.tags && content.tags.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {content.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Schedule Info */}
          {content.scheduledAt && (
            <div>
              <h3 className="font-medium mb-2">Scheduled</h3>
              <p className="text-muted-foreground">
                {new Date(content.scheduledAt).toLocaleString()}
              </p>
            </div>
          )}

          {/* Published URLs */}
          {content.publishedUrls && Object.keys(content.publishedUrls).length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Published Links</h3>
              <div className="space-y-2">
                {Object.entries(content.publishedUrls).map(([platform, url]) => (
                  <div key={platform} className="flex items-center justify-between">
                    <Badge variant="outline" className="capitalize">
                      {platform}
                    </Badge>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={url as string} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}