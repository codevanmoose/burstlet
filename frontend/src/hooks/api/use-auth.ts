import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import type { User } from '@/lib/api/auth';

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: authApi.getProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], data);
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update failed',
        description: error.response?.data?.message || 'Failed to update profile',
        variant: 'destructive',
      });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      toast({
        title: 'Password changed',
        description: 'Your password has been changed successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Password change failed',
        description: error.response?.data?.message || 'Failed to change password',
        variant: 'destructive',
      });
    },
  });
}

export function useEnableTwoFactor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.enableTwoFactor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: any) => {
      toast({
        title: '2FA setup failed',
        description: error.response?.data?.message || 'Failed to enable 2FA',
        variant: 'destructive',
      });
    },
  });
}

export function useDisableTwoFactor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.disableTwoFactor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({
        title: '2FA disabled',
        description: 'Two-factor authentication has been disabled.',
      });
    },
    onError: (error: any) => {
      toast({
        title: '2FA disable failed',
        description: error.response?.data?.message || 'Failed to disable 2FA',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: authApi.deleteAccount,
    onSuccess: () => {
      // Redirect will be handled by the component
      toast({
        title: 'Account deleted',
        description: 'Your account has been permanently deleted.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Deletion failed',
        description: error.response?.data?.message || 'Failed to delete account',
        variant: 'destructive',
      });
    },
  });
}