import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { SavedTab } from '../../lib/db';
import type { HarmonicaType } from '@/lib/harmonica';

export function useTabManagement(apiKey?: string | null) {
  const [editingTab, setEditingTab] = useState<SavedTab | null>(null);
  const [viewingTab, setViewingTab] = useState<SavedTab | null>(null);
  const { toast } = useToast();

  const handleEdit = useCallback((tab: SavedTab) => {
    setEditingTab(tab);
  }, []);

  const handleView = useCallback((tab: SavedTab) => {
    setViewingTab(tab);
  }, []);

  const handleCloseView = useCallback(() => {
    setViewingTab(null);
  }, []);

  const handleCloseEdit = useCallback(() => {
    setEditingTab(null);
  }, []);

  const saveEdit = useCallback(async (
    tabId: string,
    data: {
      title: string;
      holeHistory: string;
      noteHistory: string;
      harmonicaType: HarmonicaType;
    }
  ): Promise<SavedTab | null> => {
    if (!apiKey) {
      toast({
        title: "Error",
        description: "Admin access required to edit tabs.",
        variant: "destructive"
      });
      return null;
    }

    if (!data.title.trim()) {
      toast({
        title: "Error",
        description: "Title is required.",
        variant: "destructive"
      });
      return null;
    }

    try {
      const response = await fetch(`/api/tabs/${tabId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('Failed to update tab');
      const updatedTab = await response.json();
      
      toast({
        title: "Success",
        description: "Tab updated successfully!"
      });
      
      return updatedTab;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update tab.",
        variant: "destructive"
      });
      return null;
    }
  }, [apiKey, toast]);

  return {
    editingTab,
    viewingTab,
    handleEdit,
    handleView,
    handleCloseView,
    handleCloseEdit,
    saveEdit
  };
}
