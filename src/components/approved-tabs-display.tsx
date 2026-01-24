"use client";

import { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { useTabViewTracking } from '@/hooks/use-tab-view-tracking';
import { useTabManagement } from '@/hooks/use-tab-management';
import { Eye, Pencil } from 'lucide-react';
import { TabCard } from '@/components/tab-card';
import { TabViewDialog } from '@/components/tab-view-dialog';
import { TabEditDialog } from '@/components/tab-edit-dialog';
import { ResponsiveTabGrid } from '@/components/responsive-tab-grid';
import { formatDateShort } from '@/lib/tab-utils';
import type { SavedTab } from '../../lib/db';

interface ApprovedTabsDisplayProps {
  apiKey?: string | null;
}

export default function ApprovedTabsDisplay({ apiKey }: ApprovedTabsDisplayProps) {
  const [tabs, setTabs] = useState<SavedTab[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { trackView } = useTabViewTracking();
  const {
    editingTab,
    viewingTab,
    handleEdit,
    handleView,
    handleCloseView,
    handleCloseEdit,
    saveEdit
  } = useTabManagement(apiKey);

  useEffect(() => {
    loadApprovedTabs();
  }, []);

  const loadApprovedTabs = async () => {
    try {
      const response = await fetch('/api/tabs');
      if (!response.ok) throw new Error('Failed to fetch tabs');
      const data = await response.json();
      setTabs(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load tabs.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewTab = async (tab: SavedTab) => {
    handleView(tab);

    // Track view - updates database and session storage
    const tracked = await trackView(tab.id);

    // Update local state to reflect new view count
    if (tracked) {
      setTabs(prevTabs =>
        prevTabs.map(t =>
          t.id === tab.id
            ? { ...t, viewCount: t.viewCount + 1 }
            : t
        )
      );
    }
  };

  const handleSaveEdit = async (data: Parameters<typeof saveEdit>[1]) => {
    if (!editingTab) return;

    const updatedTab = await saveEdit(editingTab.id, data);
    if (updatedTab) {
      setTabs((prevTabs) => prevTabs.map((tab) => (tab.id === updatedTab.id ? updatedTab : tab)));
      if (viewingTab?.id === updatedTab.id) {
        handleView(updatedTab);
      }
      handleCloseEdit();
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading tabs...</p>
      </div>
    );
  }

  if (tabs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-muted-foreground mb-2">No tabs available yet</p>
        <p className="text-sm text-muted-foreground">Be the first to create a harmonica tab!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ResponsiveTabGrid>
        {tabs.map((tab) => (
          <TabCard
            key={tab.id}
            tab={tab}
            dateFormatter={formatDateShort}
            additionalBadges={
              <Badge variant="secondary">Approved</Badge>
            }
          >
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => handleViewTab(tab)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Full Tab
            </Button>
          </TabCard>
        ))}
      </ResponsiveTabGrid>

      <TabViewDialog
        tab={viewingTab}
        open={!!viewingTab}
        onOpenChange={(open) => !open && handleCloseView()}
        dateFormatter={formatDateShort}
        additionalBadges={<Badge variant="secondary">Approved</Badge>}
      >
        <Button variant="outline" onClick={handleCloseView}>
          Close
        </Button>
        {apiKey && viewingTab && (
          <Button variant="default" onClick={() => handleEdit(viewingTab)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Tab
          </Button>
        )}
      </TabViewDialog>

      {editingTab && (
        <TabEditDialog
          open={!!editingTab}
          onOpenChange={(open) => !open && handleCloseEdit()}
          title={editingTab.title}
          holeHistory={editingTab.holeHistory}
          noteHistory={editingTab.noteHistory}
          harmonicaType={editingTab.harmonicaType}
          onSave={handleSaveEdit}
          dialogTitle="Edit Approved Tab"
          dialogDescription="Update the title or contents to correct the public tab."
        />
      )}
    </div>
  );
}
