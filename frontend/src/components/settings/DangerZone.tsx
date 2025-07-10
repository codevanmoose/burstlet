"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, Download, Trash2, Loader2 } from 'lucide-react';
import { useDeleteAccount } from '@/hooks/api/use-auth';
import { toast } from '@/hooks/use-toast';

export default function DangerZone() {
  const router = useRouter();
  const deleteAccount = useDeleteAccount();
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      // TODO: Call API to export data
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      // Simulate download
      const data = {
        profile: { /* user data */ },
        content: { /* generated content */ },
        settings: { /* user settings */ },
        exportedAt: new Date().toISOString(),
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `burstlet-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Data exported',
        description: 'Your data has been downloaded successfully',
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Failed to export your data',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast({
        title: 'Confirmation required',
        description: 'Please type DELETE to confirm',
        variant: 'destructive',
      });
      return;
    }

    if (!deletePassword) {
      toast({
        title: 'Password required',
        description: 'Please enter your password to confirm deletion',
        variant: 'destructive',
      });
      return;
    }

    try {
      await deleteAccount.mutateAsync(deletePassword);
      
      // Clear auth tokens and redirect
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      
      router.push('/login');
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <div className="space-y-6">
      {/* Data Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Your Data
          </CardTitle>
          <CardDescription>
            Download all your data including generated content, settings, and account information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Your export will include:
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Profile information and settings</li>
                <li>Generated videos, blogs, and social posts</li>
                <li>Analytics and performance data</li>
                <li>API configurations (keys excluded)</li>
                <li>Content templates and schedules</li>
              </ul>
            </AlertDescription>
          </Alert>
          
          <div className="flex justify-end">
            <Button onClick={handleExportData} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete Account
          </CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> This action is irreversible. Once you delete your account:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All your generated content will be permanently deleted</li>
                <li>Your subscriptions will be cancelled immediately</li>
                <li>You will lose access to all platform integrations</li>
                <li>Your data cannot be recovered</li>
              </ul>
            </AlertDescription>
          </Alert>
          
          <div className="flex justify-end">
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Account Permanently?
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. All your data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                You are about to permanently delete your Burstlet account. This includes all your:
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>Generated videos and content</li>
                  <li>Platform connections and OAuth tokens</li>
                  <li>Analytics and performance data</li>
                  <li>Templates and scheduled posts</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="deleteConfirmation">
                Type <strong>DELETE</strong> to confirm
              </Label>
              <Input
                id="deleteConfirmation"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Type DELETE"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deletePassword">Enter your password</Label>
              <Input
                id="deletePassword"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Your account password"
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteConfirmation('');
                setDeletePassword('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteAccount.isPending || deleteConfirmation !== 'DELETE' || !deletePassword}
            >
              {deleteAccount.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Account'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}