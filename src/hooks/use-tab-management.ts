import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { SavedTab } from '../../lib/db';

export function useTabManagement(apiKey?: string | null) {
  const [viewingTab, setViewingTab] = useState<SavedTab | null>(null);
  const { toast } = useToast();

  const handleView = useCallback((tab: SavedTab) => {
    setViewingTab(tab);
  }, []);

  const handleCloseView = useCallback(() => {
    setViewingTab(null);
  }, []);

  const handleDelete = useCallback(async (tab: SavedTab) => {
    if (!apiKey) {
      toast({
        title: "Error",
        description: "Admin access required to delete tabs.",
        variant: "destructive"
      });
      return;
    }
    if (!confirm(`Are you sure you want to delete the tab "${tab.title}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const response = await fetch(`/api/tabs/${tab.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        }
      });

      if (!response.ok) throw new Error('Failed to delete tab');
      toast({
        title: "Deleted",
        description: `The tab "${tab.title}" has been deleted.`,
      });
      if (viewingTab?.id === tab.id) {
        handleCloseView();
      }
    }
    catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the tab.",
        variant: "destructive"
      });
    }
  }, [apiKey, toast, viewingTab, handleCloseView]);

  return {
    viewingTab,
    handleView,
    handleCloseView,
    handleDelete
  };
}
