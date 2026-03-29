"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { useTabViewTracking } from '@/hooks/use-tab-view-tracking';
import { useTabManagement } from '@/hooks/use-tab-management';
import { Pencil, Trash } from 'lucide-react';
import { ApprovedTabsGrid } from '@/components/tabs/browse/approved-tabs-grid';
import type { SavedTab } from '../../../../lib/db';

interface ApprovedTabsDisplayProps {
  apiKey?: string | null;
}

let approvedTabsCache: SavedTab[] | null = null;
let approvedTabsRequest: Promise<SavedTab[]> | null = null;

export default function ApprovedTabsDisplay({ apiKey }: ApprovedTabsDisplayProps) {
  const [tabs, setTabs] = useState<SavedTab[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const { trackView } = useTabViewTracking();
  const {
    viewingTab,
    handleView,
    handleCloseView,
    handleDelete
  } = useTabManagement(apiKey);

  useEffect(() => {
    loadApprovedTabs();
  }, []);

  const loadApprovedTabs = async (forceRefresh = false) => {
    try {
      if (!forceRefresh && approvedTabsCache) {
        setTabs(approvedTabsCache);
        return;
      }

      if (!approvedTabsRequest || forceRefresh) {
        approvedTabsRequest = fetch('/api/tabs').then(async (response) => {
          if (!response.ok) {
            throw new Error('Failed to fetch tabs');
          }

          return response.json() as Promise<SavedTab[]>;
        });
      }

      const data = await approvedTabsRequest;
      approvedTabsCache = data;
      setTabs(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load tabs.",
        variant: "destructive"
      });
    } finally {
      approvedTabsRequest = null;
      setLoading(false);
    }
  };

  const handleViewTab = async (tab: SavedTab) => {
    handleView(tab);

    // Track view - updates database and session storage
    const tracked = await trackView(tab.id);

    // Update local state to reflect new view count
    if (tracked) {
      setTabs((prevTabs) => {
        const nextTabs = prevTabs.map((t) =>
          t.id === tab.id
            ? { ...t, viewCount: t.viewCount + 1 }
            : t
        );
        approvedTabsCache = nextTabs;
        return nextTabs;
      });
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
      <ApprovedTabsGrid
        tabs={tabs}
        selectedTab={viewingTab}
        onViewTab={handleViewTab}
        onCloseView={handleCloseView}
        dialogActions={(tab) =>
          apiKey ? (
            <>
              <Button variant="destructive" onClick={() => handleDelete(tab)}>
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </Button>
              <Button variant="default" onClick={() => router.push(`/edit/${tab.id}`)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Tab
              </Button>
            </>
          ) : null
        }
      />
    </div>
  );
}
