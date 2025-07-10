'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Content } from '@/lib/api/content';

interface EditContentDialogProps {
  content: Content | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditContentDialog({
  content,
  open,
  onOpenChange,
}: EditContentDialogProps) {
  if (!content) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Content</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Content editing functionality coming soon...
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}