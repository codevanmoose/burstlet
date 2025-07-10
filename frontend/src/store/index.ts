// Re-export all stores
export { useUserStore } from './userStore';
export { useAppStore } from './appStore';
export { useGenerationStore, useGenerationJob, useActiveGenerationsCount } from './generationStore';
export { useContentStore } from './contentStore';

// Combined store hooks for common use cases
import { useUserStore } from './userStore';
import { useAppStore } from './appStore';
import { useGenerationStore } from './generationStore';
import { useContentStore } from './contentStore';
import { useEffect } from 'react';

// Hook to initialize stores with data
export function useInitializeStores() {
  const setUser = useUserStore((state) => state.setUser);
  const setLoading = useUserStore((state) => state.setLoading);
  
  useEffect(() => {
    // This would be called after authentication to set the user
    // For now, just set loading to false
    setLoading(false);
  }, [setLoading]);
}

// Hook for notification management
export function useNotifications() {
  const notifications = useAppStore((state) => state.notifications);
  const unreadCount = useAppStore((state) => state.unreadCount);
  const addNotification = useAppStore((state) => state.addNotification);
  const markAsRead = useAppStore((state) => state.markAsRead);
  const markAllAsRead = useAppStore((state) => state.markAllAsRead);
  const removeNotification = useAppStore((state) => state.removeNotification);
  
  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
  };
}

// Hook for theme management
export function useTheme() {
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  
  useEffect(() => {
    // Apply theme to document
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);
  
  return { theme, setTheme };
}

// Hook for sidebar state
export function useSidebar() {
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
  const setSidebarCollapsed = useAppStore((state) => state.setSidebarCollapsed);
  
  return {
    sidebarOpen,
    sidebarCollapsed,
    toggleSidebar,
    setSidebarOpen,
    setSidebarCollapsed,
  };
}

// Hook for global loading states
export function useGlobalLoading() {
  const isGenerating = useAppStore((state) => state.isGenerating);
  const isUploading = useAppStore((state) => state.isUploading);
  const activeJobsCount = useGenerationStore((state) => state.activeJobs.length);
  
  return {
    isGenerating,
    isUploading,
    activeJobsCount,
    isLoading: isGenerating || isUploading || activeJobsCount > 0,
  };
}

// Hook for content selection
export function useContentSelection() {
  const selectedContent = useContentStore((state) => state.selectedContent);
  const isSelecting = useContentStore((state) => state.isSelecting);
  const toggleSelection = useContentStore((state) => state.toggleSelection);
  const selectAll = useContentStore((state) => state.selectAll);
  const clearSelection = useContentStore((state) => state.clearSelection);
  const setSelecting = useContentStore((state) => state.setSelecting);
  const getSelectedContent = useContentStore((state) => state.getSelectedContent);
  
  return {
    selectedIds: Array.from(selectedContent),
    selectedCount: selectedContent.size,
    isSelecting,
    toggleSelection,
    selectAll,
    clearSelection,
    setSelecting,
    getSelectedContent,
  };
}

// Type exports
export type { GenerationJob } from './generationStore';
export type { Notification } from './appStore';