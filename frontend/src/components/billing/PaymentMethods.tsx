'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CreditCard, Plus, Trash2, Star, Loader2 } from 'lucide-react';
import { 
  usePaymentMethods, 
  useRemovePaymentMethod, 
  useUpdateDefaultPaymentMethod,
  useAddPaymentMethod 
} from '@/hooks/useBilling';
import { format } from 'date-fns';

export function PaymentMethods() {
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  
  const { data: paymentMethods, isLoading } = usePaymentMethods();
  const { mutate: removeCard, isPending: isRemoving } = useRemovePaymentMethod();
  const { mutate: setDefault, isPending: isSettingDefault } = useUpdateDefaultPaymentMethod();
  const { mutate: addCard, isPending: isAdding } = useAddPaymentMethod();

  if (isLoading) {
    return <PaymentMethodsSkeleton />;
  }

  const cards = paymentMethods?.filter(pm => pm.type === 'card') || [];

  const handleDeleteCard = (id: string) => {
    removeCard(id);
    setCardToDelete(null);
  };

  const handleSetDefault = (id: string) => {
    setDefault(id);
  };

  const cardBrandIcons: Record<string, string> = {
    visa: '💳',
    mastercard: '💳',
    amex: '💳',
    discover: '💳',
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>
                Manage your cards and payment preferences
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddCard(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Card
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {cards.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No payment methods added yet</p>
              <Button variant="outline" onClick={() => setShowAddCard(true)}>
                Add your first card
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {cards.map((card) => (
                <div
                  key={card.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">
                      {cardBrandIcons[card.card?.brand || ''] || '💳'}
                    </div>
                    <div>
                      <p className="font-medium">
                        {card.card?.brand?.charAt(0).toUpperCase() + card.card?.brand?.slice(1)} •••• {card.card?.last4}
                      </p>
                      <p className="text-sm text-gray-600">
                        Expires {card.card?.expMonth}/{card.card?.expYear}
                      </p>
                    </div>
                    {card.isDefault && (
                      <Badge variant="secondary">
                        <Star className="w-3 h-3 mr-1" />
                        Default
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!card.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(card.id)}
                        disabled={isSettingDefault}
                      >
                        Set as Default
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCardToDelete(card.id)}
                      disabled={card.isDefault || isRemoving}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Card Dialog */}
      <Dialog open={showAddCard} onOpenChange={setShowAddCard}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>
              Add a new card to your account. You'll be redirected to Stripe's secure checkout.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-4">
                You'll be securely redirected to Stripe to add your payment method
              </p>
              <Button 
                onClick={() => {
                  // In a real implementation, this would use Stripe Elements
                  // or redirect to Stripe Checkout for adding a payment method
                  addCard({ paymentMethodId: 'pm_mock_' + Date.now() });
                  setShowAddCard(false);
                }}
                disabled={isAdding}
                className="w-full"
              >
                {isAdding && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Continue to Stripe
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCard(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!cardToDelete} onOpenChange={() => setCardToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Payment Method</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this payment method? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cardToDelete && handleDeleteCard(cardToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PaymentMethodsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-8 w-8 rounded" />
                <div>
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24 mt-1" />
                </div>
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}