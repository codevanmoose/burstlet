'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Video, FileText, Share2 } from 'lucide-react';

interface CreateContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateContentDialog({
  open,
  onOpenChange,
}: CreateContentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Content</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Choose what type of content you'd like to create:
          </p>
          
          <div className="grid gap-3">
            <Button 
              variant="outline" 
              className="flex items-center justify-start gap-3 h-auto p-4"
              onClick={() => {
                onOpenChange(false);
                // Navigate to generate page with video tab
                window.location.href = '/dashboard/generate?tab=video';
              }}
            >
              <Video className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Video</div>
                <div className="text-sm text-muted-foreground">AI-generated videos with audio</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex items-center justify-start gap-3 h-auto p-4"
              onClick={() => {
                onOpenChange(false);
                // Navigate to generate page with blog tab
                window.location.href = '/dashboard/generate?tab=blog';
              }}
            >
              <FileText className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Blog Post</div>
                <div className="text-sm text-muted-foreground">SEO-optimized articles</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex items-center justify-start gap-3 h-auto p-4"
              onClick={() => {
                onOpenChange(false);
                // Navigate to generate page with social tab
                window.location.href = '/dashboard/generate?tab=social';
              }}
            >
              <Share2 className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Social Media</div>
                <div className="text-sm text-muted-foreground">Posts for all platforms</div>
              </div>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}