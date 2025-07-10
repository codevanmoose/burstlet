import { create } from 'zustand';
import type { Content } from '@/types/content';

interface ContentFilters {
  search: string;
  type: 'all' | 'video' | 'blog' | 'social';
  status: 'all' | 'draft' | 'published' | 'scheduled';
  platform: 'all' | 'youtube' | 'tiktok' | 'instagram' | 'twitter';
  dateRange: { start: Date | null; end: Date | null };
}

interface ContentState {
  // Content cache
  contentCache: Map<string, Content>;
  
  // Selection state
  selectedContent: Set<string>;
  isSelecting: boolean;
  
  // Filters
  filters: ContentFilters;
  
  // View preferences
  viewMode: 'table' | 'grid' | 'calendar';
  sortBy: 'createdAt' | 'updatedAt' | 'title' | 'performance';
  sortOrder: 'asc' | 'desc';
  
  // Actions
  setContent: (content: Content[]) => void;
  updateContent: (id: string, updates: Partial<Content>) => void;
  removeContent: (ids: string[]) => void;
  
  // Selection
  toggleSelection: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  setSelecting: (selecting: boolean) => void;
  
  // Filters
  setFilter: <K extends keyof ContentFilters>(key: K, value: ContentFilters[K]) => void;
  resetFilters: () => void;
  
  // View preferences
  setViewMode: (mode: ContentState['viewMode']) => void;
  setSortBy: (field: ContentState['sortBy']) => void;
  setSortOrder: (order: ContentState['sortOrder']) => void;
  
  // Helpers
  getSelectedContent: () => Content[];
  getFilteredContent: (content: Content[]) => Content[];
}

const defaultFilters: ContentFilters = {
  search: '',
  type: 'all',
  status: 'all',
  platform: 'all',
  dateRange: { start: null, end: null },
};

export const useContentStore = create<ContentState>((set, get) => ({
  contentCache: new Map(),
  selectedContent: new Set(),
  isSelecting: false,
  filters: defaultFilters,
  viewMode: 'table',
  sortBy: 'createdAt',
  sortOrder: 'desc',

  setContent: (content) => {
    const cache = new Map();
    content.forEach((item) => cache.set(item.id, item));
    set({ contentCache: cache });
  },

  updateContent: (id, updates) => {
    set((state) => {
      const cache = new Map(state.contentCache);
      const existing = cache.get(id);
      if (existing) {
        cache.set(id, { ...existing, ...updates });
      }
      return { contentCache: cache };
    });
  },

  removeContent: (ids) => {
    set((state) => {
      const cache = new Map(state.contentCache);
      const selected = new Set(state.selectedContent);
      ids.forEach((id) => {
        cache.delete(id);
        selected.delete(id);
      });
      return { contentCache: cache, selectedContent: selected };
    });
  },

  toggleSelection: (id) => {
    set((state) => {
      const selected = new Set(state.selectedContent);
      if (selected.has(id)) {
        selected.delete(id);
      } else {
        selected.add(id);
      }
      return { selectedContent: selected };
    });
  },

  selectAll: (ids) => {
    set({ selectedContent: new Set(ids) });
  },

  clearSelection: () => {
    set({ selectedContent: new Set() });
  },

  setSelecting: (selecting) => {
    set({ isSelecting: selecting });
    if (!selecting) {
      set({ selectedContent: new Set() });
    }
  },

  setFilter: (key, value) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    }));
  },

  resetFilters: () => {
    set({ filters: defaultFilters });
  },

  setViewMode: (mode) => {
    set({ viewMode: mode });
  },

  setSortBy: (field) => {
    set({ sortBy: field });
  },

  setSortOrder: (order) => {
    set({ sortOrder: order });
  },

  getSelectedContent: () => {
    const state = get();
    return Array.from(state.selectedContent)
      .map((id) => state.contentCache.get(id))
      .filter((content): content is Content => !!content);
  },

  getFilteredContent: (content) => {
    const { filters } = get();
    
    return content.filter((item) => {
      // Search filter
      if (filters.search && !item.title.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      
      // Type filter
      if (filters.type !== 'all' && item.type !== filters.type) {
        return false;
      }
      
      // Status filter
      if (filters.status !== 'all' && item.status !== filters.status) {
        return false;
      }
      
      // Platform filter
      if (filters.platform !== 'all' && !item.platforms?.includes(filters.platform)) {
        return false;
      }
      
      // Date range filter
      if (filters.dateRange.start || filters.dateRange.end) {
        const itemDate = new Date(item.createdAt);
        if (filters.dateRange.start && itemDate < filters.dateRange.start) {
          return false;
        }
        if (filters.dateRange.end && itemDate > filters.dateRange.end) {
          return false;
        }
      }
      
      return true;
    });
  },
}));