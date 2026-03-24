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
      if (editingTab?.id === tab.id) {
        handleCloseEdit();
      }
    }
    catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the tab.",
        variant: "destructive"
      });
    }
  }, [apiKey, toast, viewingTab, editingTab, handleCloseView, handleCloseEdit]);

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
    saveEdit,
    handleDelete
  };
}
