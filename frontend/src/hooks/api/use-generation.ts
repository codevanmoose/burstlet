import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { generationApi } from '@/lib/api';
import type { 
  VideoGenerationRequest, 
  BlogGenerationRequest, 
  SocialPostGenerationRequest,
  GenerationJob 
} from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export function useGenerateVideo() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: VideoGenerationRequest) => generationApi.generateVideo(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['generation-jobs'] });
      toast({
        title: 'Video generation started',
        description: 'Your video is being generated. This may take a few minutes.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Generation failed',
        description: error.message || 'Failed to start video generation',
        variant: 'destructive',
      });
    },
  });
}

export function useGenerateBlog() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: BlogGenerationRequest) => generationApi.generateBlog(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['generation-jobs'] });
      toast({
        title: 'Blog generation started',
        description: 'Your blog post is being generated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Generation failed',
        description: error.message || 'Failed to start blog generation',
        variant: 'destructive',
      });
    },
  });
}

export function useGenerateSocialPosts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: SocialPostGenerationRequest) => generationApi.generateSocialPosts(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['generation-jobs'] });
      toast({
        title: 'Social posts generation started',
        description: 'Your social media posts are being generated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Generation failed',
        description: error.message || 'Failed to start social posts generation',
        variant: 'destructive',
      });
    },
  });
}

export function useGenerationJob(jobId: string | undefined) {
  return useQuery({
    queryKey: ['generation-job', jobId],
    queryFn: () => generationApi.getJobStatus(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      // Poll while job is pending or processing
      if (query.state.data?.status === 'PENDING' || query.state.data?.status === 'PROCESSING') {
        return 2000; // Poll every 2 seconds
      }
      return false; // Stop polling
    },
  });
}

export function useGenerationJobs(params?: {
  type?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ['generation-jobs', params],
    queryFn: () => generationApi.getJobs(params),
  });
}

export function useCancelJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (jobId: string) => generationApi.cancelJob(jobId),
    onSuccess: (_, jobId) => {
      queryClient.invalidateQueries({ queryKey: ['generation-job', jobId] });
      queryClient.invalidateQueries({ queryKey: ['generation-jobs'] });
      toast({
        title: 'Job canceled',
        description: 'The generation job has been canceled.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to cancel',
        description: error.message || 'Failed to cancel the job',
        variant: 'destructive',
      });
    },
  });
}

export function useUsageStats() {
  return useQuery({
    queryKey: ['usage-stats'],
    queryFn: () => generationApi.getUsageStats(),
  });
}

export function useAudioCapabilities() {
  return useQuery({
    queryKey: ['audio-capabilities'],
    queryFn: () => generationApi.getAudioCapabilities(),
  });
}

export function useAvailableVoices(language?: string) {
  return useQuery({
    queryKey: ['available-voices', language],
    queryFn: () => generationApi.getAvailableVoices(language),
  });
}

export function useEstimateCost() {
  return useMutation({
    mutationFn: ({ type, params }: { type: 'video' | 'blog' | 'social'; params: any }) => 
      generationApi.estimateCost(type, params),
  });
}

export function useGenerateScript() {
  return useMutation({
    mutationFn: ({ prompt, duration }: { prompt: string; duration: number }) => 
      generationApi.generateScript(prompt, duration),
  });
}