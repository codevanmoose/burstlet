import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface GenerationJob {
  id: string;
  type: 'video' | 'blog' | 'social';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  title: string;
  prompt?: string;
  result?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  estimatedTime?: number; // in seconds
  cost?: number;
  platform?: string;
}

interface GenerationState {
  // Active generations
  activeJobs: GenerationJob[];
  completedJobs: GenerationJob[];
  
  // Job management
  addJob: (job: Omit<GenerationJob, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateJob: (id: string, updates: Partial<GenerationJob>) => void;
  removeJob: (id: string) => void;
  clearCompleted: () => void;
  
  // Status tracking
  getJob: (id: string) => GenerationJob | undefined;
  getActiveJobsCount: () => number;
  getJobsByType: (type: GenerationJob['type']) => GenerationJob[];
  
  // Real-time updates
  subscribeToJob: (id: string, callback: (job: GenerationJob) => void) => () => void;
}

export const useGenerationStore = create<GenerationState>()(
  subscribeWithSelector((set, get) => ({
    activeJobs: [],
    completedJobs: [],

    addJob: (jobData) => {
      const id = `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newJob: GenerationJob = {
        ...jobData,
        id,
        status: 'queued',
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      set((state) => ({
        activeJobs: [...state.activeJobs, newJob],
      }));
      
      return id;
    },

    updateJob: (id, updates) => {
      set((state) => {
        const activeIndex = state.activeJobs.findIndex((job) => job.id === id);
        const completedIndex = state.completedJobs.findIndex((job) => job.id === id);
        
        if (activeIndex !== -1) {
          const updatedJob = {
            ...state.activeJobs[activeIndex],
            ...updates,
            updatedAt: new Date(),
          };
          
          // Move to completed if status is completed or failed
          if (updatedJob.status === 'completed' || updatedJob.status === 'failed') {
            return {
              activeJobs: state.activeJobs.filter((job) => job.id !== id),
              completedJobs: [updatedJob, ...state.completedJobs].slice(0, 50), // Keep last 50
            };
          }
          
          // Update in active jobs
          const newActiveJobs = [...state.activeJobs];
          newActiveJobs[activeIndex] = updatedJob;
          return { activeJobs: newActiveJobs };
        }
        
        if (completedIndex !== -1) {
          const newCompletedJobs = [...state.completedJobs];
          newCompletedJobs[completedIndex] = {
            ...newCompletedJobs[completedIndex],
            ...updates,
            updatedAt: new Date(),
          };
          return { completedJobs: newCompletedJobs };
        }
        
        return state;
      });
    },

    removeJob: (id) => {
      set((state) => ({
        activeJobs: state.activeJobs.filter((job) => job.id !== id),
        completedJobs: state.completedJobs.filter((job) => job.id !== id),
      }));
    },

    clearCompleted: () => {
      set({ completedJobs: [] });
    },

    getJob: (id) => {
      const state = get();
      return (
        state.activeJobs.find((job) => job.id === id) ||
        state.completedJobs.find((job) => job.id === id)
      );
    },

    getActiveJobsCount: () => {
      return get().activeJobs.length;
    },

    getJobsByType: (type) => {
      const state = get();
      return [
        ...state.activeJobs.filter((job) => job.type === type),
        ...state.completedJobs.filter((job) => job.type === type),
      ];
    },

    subscribeToJob: (id, callback) => {
      return useGenerationStore.subscribe(
        (state) => state.getJob(id),
        (job) => {
          if (job) callback(job);
        }
      );
    },
  }))
);

// Helper hook for real-time job updates
export function useGenerationJob(id: string | null) {
  const job = useGenerationStore((state) => (id ? state.getJob(id) : undefined));
  return job;
}

// Helper hook for active jobs count
export function useActiveGenerationsCount() {
  return useGenerationStore((state) => state.activeJobs.length);
}