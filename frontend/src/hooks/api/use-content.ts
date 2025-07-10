import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { contentApi } from '@/lib/api';
import type { CreateContentRequest, UpdateContentRequest, Content } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export function useContent(id: string | undefined) {
  return useQuery({
    queryKey: ['content', id],
    queryFn: () => contentApi.getById(id!),
    enabled: !!id,
  });
}

export function useContents(params?: {
  type?: string;
  status?: string;
  tag?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  return useQuery({
    queryKey: ['contents', params],
    queryFn: () => contentApi.getAll(params),
  });
}

export function useCreateContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateContentRequest) => contentApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contents'] });
      toast({
        title: 'Content created',
        description: 'Your content has been created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create content',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContentRequest }) => 
      contentApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['content', id] });
      queryClient.invalidateQueries({ queryKey: ['contents'] });
      toast({
        title: 'Content updated',
        description: 'Your content has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update content',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => contentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contents'] });
      toast({
        title: 'Content deleted',
        description: 'Your content has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete content',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });
}

export function usePublishContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, platforms }: { id: string; platforms?: string[] }) => 
      contentApi.publish(id, platforms),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['content', id] });
      queryClient.invalidateQueries({ queryKey: ['contents'] });
      toast({
        title: 'Content published',
        description: 'Your content has been published successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to publish content',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });
}

export function useScheduleContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, scheduledAt, platforms }: { 
      id: string; 
      scheduledAt: string; 
      platforms?: string[] 
    }) => contentApi.schedule(id, scheduledAt, platforms),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['content', id] });
      queryClient.invalidateQueries({ queryKey: ['contents'] });
      toast({
        title: 'Content scheduled',
        description: 'Your content has been scheduled successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to schedule content',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });
}

export function useContentTemplates(type?: string) {
  return useQuery({
    queryKey: ['content-templates', type],
    queryFn: () => contentApi.getTemplates(type),
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ contentId, name, description }: {
      contentId: string;
      name: string;
      description?: string;
    }) => contentApi.createTemplate(contentId, name, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-templates'] });
      toast({
        title: 'Template created',
        description: 'Your template has been created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create template',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });
}

export function useBulkActions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const bulkUpdate = useMutation({
    mutationFn: ({ ids, updates }: { ids: string[]; updates: UpdateContentRequest }) => 
      contentApi.bulkUpdate(ids, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contents'] });
      toast({
        title: 'Content updated',
        description: 'Selected content has been updated successfully.',
      });
    },
  });

  const bulkDelete = useMutation({
    mutationFn: (ids: string[]) => contentApi.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contents'] });
      toast({
        title: 'Content deleted',
        description: 'Selected content has been deleted successfully.',
      });
    },
  });

  const bulkPublish = useMutation({
    mutationFn: ({ ids, platforms }: { ids: string[]; platforms?: string[] }) => 
      contentApi.bulkPublish(ids, platforms),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contents'] });
      toast({
        title: 'Content published',
        description: 'Selected content has been published successfully.',
      });
    },
  });

  return { bulkUpdate, bulkDelete, bulkPublish };
}