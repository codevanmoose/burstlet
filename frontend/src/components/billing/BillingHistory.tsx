'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Download, FileText, CheckCircle, Clock, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useInvoices, useDownloadInvoice, useCancelSubscription, useReactivateSubscription, useSubscription } from '@/hooks/useBilling';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export function BillingHistory() {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  
  const { data: invoices, isLoading } = useInvoices({ limit: 50 });
  const { data: subscription } = useSubscription();
  const { mutate: downloadInvoice, isPending: isDownloading } = useDownloadInvoice();
  const { mutate: cancelSubscription, isPending: isCancelling } = useCancelSubscription();
  const { mutate: reactivateSubscription, isPending: isReactivating } = useReactivateSubscription();

  if (isLoading) {
    return <BillingHistorySkeleton />;
  }

  const statusConfig = {
    paid: { label: 'Paid', icon: CheckCircle, color: 'bg-green-500' },
    open: { label: 'Pending', icon: Clock, color: 'bg-yellow-500' },
    draft: { label: 'Draft', icon: FileText, color: 'bg-gray-500' },
    void: { label: 'Void', icon: XCircle, color: 'bg-red-500' },
    uncollectible: { label: 'Failed', icon: AlertCircle, color: 'bg-red-500' },
  };

  const handleCancelSubscription = () => {
    cancelSubscription(cancelReason);
    setShowCancelDialog(false);
    setCancelReason('');
  };

  return (
    <div className="space-y-6">
      {/* Subscription Management */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle>Subscription Management</CardTitle>
            <CardDescription>
              Manage your subscription status and billing preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            {subscription.cancelAtPeriodEnd ? (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    Your subscription is set to cancel on{' '}
                    {format(new Date(subscription.currentPeriodEnd), 'MMMM d, yyyy')}
                  </p>
                </div>
                <Button
                  onClick={() => reactivateSubscription()}
                  disabled={isReactivating}
                >
                  {isReactivating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Reactivate Subscription
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Your subscription will automatically renew on{' '}
                  {format(new Date(subscription.currentPeriodEnd), 'MMMM d, yyyy')}
                </p>
                <Button
                  variant="destructive"
                  onClick={() => setShowCancelDialog(true)}
                >
                  Cancel Subscription
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Invoice History */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
          <CardDescription>
            Download your invoices and view payment history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!invoices || invoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No invoices yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => {
                  const status = statusConfig[invoice.status];
                  const StatusIcon = status.icon;
                  
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.number || `INV-${invoice.id.slice(-8)}`}
                      </TableCell>
                      <TableCell>
                        {format(new Date(invoice.createdAt), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(invoice.amount / 100, invoice.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={status.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {invoice.status === 'paid' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadInvoice(invoice.id)}
                            disabled={isDownloading}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Cancel Subscription Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              We're sorry to see you go. Your subscription will remain active until the end of your current billing period.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="cancel-reason">
                Why are you cancelling? (optional)
              </Label>
              <Textarea
                id="cancel-reason"
                placeholder="Your feedback helps us improve..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="mt-2"
                rows={4}
              />
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 text-sm">
              <p className="font-medium mb-2">What happens next:</p>
              <ul className="space-y-1 text-gray-600">
                <li>• You'll have access until {subscription && format(new Date(subscription.currentPeriodEnd), 'MMMM d, yyyy')}</li>
                <li>• No further charges will be made</li>
                <li>• Your data will be preserved for 30 days</li>
                <li>• You can reactivate anytime before expiration</li>
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={isCancelling}
            >
              {isCancelling && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Cancel Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BillingHistorySkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}