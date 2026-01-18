import { useCallback } from 'react';

/**
 * Hook to track unique tab views using session storage
 * Prevents multiple view counts from the same session
 */
export function useTabViewTracking() {
  const trackView = useCallback(async (tabId: string): Promise<boolean> => {
    const viewedTabsKey = 'harptabs_viewed_tabs';
    
    try {
      const viewedTabs = JSON.parse(sessionStorage.getItem(viewedTabsKey) || '[]');
      
      // Check if this tab was already viewed in this session
      if (viewedTabs.includes(tabId)) {
        return false; // Already tracked
      }
      
      // Increment view count in database
      const response = await fetch(`/api/tabs/${tabId}/view`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to track view');
      }
      
      // Mark as viewed in this session
      viewedTabs.push(tabId);
      sessionStorage.setItem(viewedTabsKey, JSON.stringify(viewedTabs));
      
      return true; // Successfully tracked
    } catch (error) {
      console.error('Failed to track view:', error);
      return false;
    }
  }, []);
  
  const hasViewed = useCallback((tabId: string): boolean => {
    const viewedTabsKey = 'harptabs_viewed_tabs';
    const viewedTabs = JSON.parse(sessionStorage.getItem(viewedTabsKey) || '[]');
    return viewedTabs.includes(tabId);
  }, []);
  
  return { trackView, hasViewed };
}
