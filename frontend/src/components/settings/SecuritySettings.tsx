"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, Smartphone, Key, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useProfile, useChangePassword, useEnableTwoFactor, useDisableTwoFactor } from '@/hooks/api/use-auth';
import { toast } from '@/hooks/use-toast';
import Image from 'next/image';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function SecuritySettings() {
  const { data: profile } = useProfile();
  const changePassword = useChangePassword();
  const enableTwoFactor = useEnableTwoFactor();
  const disableTwoFactor = useDisableTwoFactor();

  const [show2FADialog, setShow2FADialog] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      await changePassword.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      reset();
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleEnable2FA = async () => {
    try {
      const result = await enableTwoFactor.mutateAsync();
      setQrCode(result.qrCode);
      setSecret(result.secret);
      setShow2FADialog(true);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationCode) {
      toast({
        title: 'Code required',
        description: 'Please enter the verification code',
        variant: 'destructive',
      });
      return;
    }

    try {
      // TODO: Call verify endpoint
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      setShow2FADialog(false);
      setVerificationCode('');
      toast({
        title: '2FA enabled',
        description: 'Two-factor authentication has been enabled successfully',
      });
    } catch (error) {
      toast({
        title: 'Verification failed',
        description: 'Invalid verification code',
        variant: 'destructive',
      });
    }
  };

  const handleDisable2FA = async () => {
    if (!disableCode) {
      toast({
        title: 'Code required',
        description: 'Please enter your 2FA code to disable',
        variant: 'destructive',
      });
      return;
    }

    try {
      await disableTwoFactor.mutateAsync(disableCode);
      setDisableCode('');
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <div className="space-y-6">
      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password regularly to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                {...register('currentPassword')}
                placeholder="Enter your current password"
              />
              {errors.currentPassword && (
                <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                {...register('newPassword')}
                placeholder="Enter your new password"
              />
              {errors.newPassword && (
                <p className="text-sm text-destructive">{errors.newPassword.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword')}
                placeholder="Confirm your new password"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Alert>
              <Key className="h-4 w-4" />
              <AlertDescription>
                Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end">
              <Button type="submit" disabled={changePassword.isPending}>
                {changePassword.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Change Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className={`h-8 w-8 ${profile?.twoFactorEnabled ? 'text-green-600' : 'text-muted-foreground'}`} />
              <div>
                <p className="font-medium">
                  2FA is {profile?.twoFactorEnabled ? 'enabled' : 'disabled'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {profile?.twoFactorEnabled 
                    ? 'Your account is protected with two-factor authentication'
                    : 'Enable 2FA to secure your account with an authenticator app'
                  }
                </p>
              </div>
            </div>
            {profile?.twoFactorEnabled ? (
              <Badge variant="secondary" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Active
              </Badge>
            ) : (
              <Badge variant="outline">Inactive</Badge>
            )}
          </div>

          {profile?.twoFactorEnabled ? (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Disabling 2FA will make your account less secure. You'll need your authenticator app to disable it.
                </AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                />
                <Button 
                  variant="destructive"
                  onClick={handleDisable2FA}
                  disabled={disableTwoFactor.isPending || !disableCode}
                >
                  {disableTwoFactor.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Disable 2FA
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-end">
              <Button onClick={handleEnable2FA} disabled={enableTwoFactor.isPending}>
                {enableTwoFactor.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Enable 2FA
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2FA Setup Dialog */}
      <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set up Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan this QR code with your authenticator app or enter the secret manually
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {qrCode && (
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <Image
                  src={qrCode}
                  alt="2FA QR Code"
                  width={200}
                  height={200}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Manual entry key:</p>
              <code className="block p-2 bg-muted rounded text-xs break-all">
                {secret}
              </code>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verificationCode">Verification Code</Label>
              <Input
                id="verificationCode"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShow2FADialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleVerify2FA}>
              Verify & Enable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}