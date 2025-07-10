'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useGenerationJobs } from '@/hooks/api/use-generation';
import { formatDistanceToNow } from 'date-fns';
import { 
  Video, 
  FileText, 
  Share2, 
  Download, 
  Eye, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Loader2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { GenerationJob } from '@/lib/api/generation';

type GenerationStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
type GenerationType = 'VIDEO' | 'BLOG' | 'SOCIAL' | 'SCRIPT';

export default function GenerationHistory() {
  const { data: history, isLoading, refetch } = useGenerationJobs();
  const [selectedGeneration, setSelectedGeneration] = useState<GenerationJob | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const typeIcons: Record<GenerationType, JSX.Element> = {
    VIDEO: <Video className="h-4 w-4" />,
    BLOG: <FileText className="h-4 w-4" />,
    SOCIAL: <Share2 className="h-4 w-4" />,
    SCRIPT: <FileText className="h-4 w-4" />,
  };

  const statusIcons: Record<GenerationStatus, JSX.Element> = {
    PENDING: <Clock className="h-4 w-4" />,
    PROCESSING: <Loader2 className="h-4 w-4 animate-spin" />,
    COMPLETED: <CheckCircle className="h-4 w-4" />,
    FAILED: <XCircle className="h-4 w-4" />,
  };

  const statusColors: Record<GenerationStatus, 'secondary' | 'default' | 'success' | 'destructive'> = {
    PENDING: 'secondary',
    PROCESSING: 'default',
    COMPLETED: 'success',
    FAILED: 'destructive',
  };

  const handlePreview = (generation: GenerationJob) => {
    setSelectedGeneration(generation);
    setPreviewOpen(true);
  };

  const handleDownload = (generation: GenerationJob) => {
    // Implement download functionality based on generation type
    if (generation.type === 'VIDEO' && generation.result?.url) {
      window.open(generation.result.url, '_blank');
    } else if (generation.type === 'BLOG' && generation.result?.content) {
      const blob = new Blob([generation.result.content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `blog-${generation.id}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Generation History</CardTitle>
          <CardDescription>Your recent AI-generated content</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const generations = history?.jobs || [];
  const activeGenerations = generations.filter((g: GenerationJob) => g.status === 'PENDING' || g.status === 'PROCESSING');

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Generation History</CardTitle>
            <CardDescription>Your recent AI-generated content</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {activeGenerations.length > 0 && (
            <div className="mb-6 space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Active Generations</h3>
              {activeGenerations.map((generation: GenerationJob) => (
                <div
                  key={generation.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    {statusIcons[generation.status]}
                    <span className="text-sm">{generation.prompt.substring(0, 50)}...</span>
                  </div>
                  <Badge variant={statusColors[generation.status]}>
                    {generation.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-4">
            {generations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No generations yet. Create your first content above!
              </div>
            ) : (
              generations.map((generation: GenerationJob) => (
                <div
                  key={generation.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                      {typeIcons[generation.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">
                          {generation.prompt.substring(0, 60)}...
                        </h4>
                        <Badge variant={statusColors[generation.status]} className="flex items-center gap-1">
                          {statusIcons[generation.status]}
                          {generation.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatDistanceToNow(new Date(generation.createdAt))} ago</span>
                        <span>•</span>
                        <span>${(generation.metadata?.cost || 0).toFixed(2)}</span>
                        {generation.metadata?.platform && (
                          <>
                            <span>•</span>
                            <span className="capitalize">{generation.metadata.platform}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {generation.status === 'COMPLETED' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(generation)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(generation)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generation Preview</DialogTitle>
            <DialogDescription>
              {selectedGeneration?.type === 'VIDEO' ? 'Video Preview' : 
               selectedGeneration?.type === 'BLOG' ? 'Blog Post Preview' :
               'Social Media Post Preview'}
            </DialogDescription>
          </DialogHeader>
          {selectedGeneration && (
            <div className="mt-4">
              {selectedGeneration.type === 'VIDEO' && selectedGeneration.result?.url && (
                <video
                  src={selectedGeneration.result.url}
                  controls
                  className="w-full rounded-lg"
                />
              )}
              {selectedGeneration.type === 'BLOG' && selectedGeneration.result?.content && (
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans">
                    {selectedGeneration.result.content}
                  </pre>
                </div>
              )}
              {selectedGeneration.type === 'SOCIAL' && selectedGeneration.result?.text && (
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <p className="whitespace-pre-wrap">{selectedGeneration.result.text}</p>
                  </div>
                  {selectedGeneration.result.hashtags && (
                    <div className="flex flex-wrap gap-2">
                      {selectedGeneration.result.hashtags.map((tag: string, i: number) => (
                        <Badge key={i} variant="secondary">#{tag}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}