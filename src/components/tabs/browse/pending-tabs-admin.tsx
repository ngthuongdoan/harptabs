"use client";

import { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useTabManagement } from '@/hooks/use-tab-management';
import { Check, X, Eye, Pencil } from 'lucide-react';
import { TabCard } from '@/components/tabs/display/tab-card';
import { TabViewDialog } from '@/components/tabs/display/tab-view-dialog';
import { ResponsiveTabGrid } from '@/components/tabs/browse/responsive-tab-grid';
import { formatDate } from '@/lib/tab-utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { SavedTab } from '../../../../lib/db';

interface PendingTabsAdminProps {
  apiKey: string;
}

export default function PendingTabsAdmin({ apiKey }: PendingTabsAdminProps) {
  const [tabs, setTabs] = useState<SavedTab[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [actionTab, setActionTab] = useState<SavedTab | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const router = useRouter();
  const { toast } = useToast();
  const {
    viewingTab,
    handleView,
    handleCloseView,
  } = useTabManagement(apiKey);

  useEffect(() => {
    loadPendingTabs();
  }, []);

  const loadPendingTabs = async () => {
    try {
      const response = await fetch('/api/tabs/pending', {
        headers: {
          'x-api-key': apiKey
        }
      });
      if (!response.ok) throw new Error('Failed to fetch pending tabs');
      const data = await response.json();
      setTabs(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load pending tabs.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (tab: SavedTab) => {
    setActionTab(tab);
    setActionType('approve');
    setActionDialogOpen(true);
    setRejectionReason('');
  };

  const handleReject = (tab: SavedTab) => {
    setActionTab(tab);
    setActionType('reject');
    setActionDialogOpen(true);
    setRejectionReason('');
  };

  const handleViewTab = (tab: SavedTab) => {
    handleView(tab);
  };

  const confirmAction = async () => {
    if (!actionTab || !actionType) return;

    try {
      if (actionType === 'approve') {
        const response = await fetch(`/api/tabs/${actionTab.id}/approve`, {
          method: 'POST',
          headers: {
            'x-api-key': apiKey
          }
        });
        if (!response.ok) throw new Error('Failed to approve tab');
        toast({
          title: "Success",
          description: `Tab "${actionTab.title}" has been approved!`
        });
      } else {
        const trimmedReason = rejectionReason.trim();
        if (!trimmedReason) {
          toast({
            title: "Rejection reason required",
            description: "Please add a rejection reason before rejecting the tab.",
            variant: "destructive"
          });
          return;
        }
        const response = await fetch(`/api/tabs/${actionTab.id}/reject`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
          },
          body: JSON.stringify({ reason: trimmedReason })
        });
        if (!response.ok) throw new Error('Failed to reject tab');
        toast({
          title: "Success",
          description: `Tab "${actionTab.title}" has been rejected.`
        });
      }
      if (viewingTab?.id === actionTab.id) {
        handleCloseView();
      }
      loadPendingTabs();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${actionType} tab.`,
        variant: "destructive"
      });
    } finally {
      setActionDialogOpen(false);
      setActionTab(null);
      setActionType(null);
      setRejectionReason('');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading pending tabs...</p>
      </div>
    );
  }

  if (tabs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-muted-foreground mb-2">No pending tabs</p>
        <p className="text-sm text-muted-foreground">All tabs have been reviewed!</p>
      </div>
    );
  }

  const pendingBadge = (
    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
      Pending
    </Badge>
  );

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold">Pending Tabs Review</h2>
            <p className="text-sm text-muted-foreground">
              {tabs.length} tab{tabs.length !== 1 ? 's' : ''} awaiting approval
            </p>
          </div>
          <Button variant="outline" onClick={loadPendingTabs}>
            Refresh
          </Button>
        </div>

        <ResponsiveTabGrid>
          {tabs.map((tab) => (
            <TabCard
              key={tab.id}
              tab={tab}
              dateFormatter={(timestamp) => `Submitted on ${formatDate(timestamp)}`}
              additionalBadges={pendingBadge}
            >
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="flex-1"
                  onClick={() => handleViewTab(tab)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  className="flex-1 sm:flex-initial"
                  onClick={() => handleReject(tab)}
                >
                  <X className="h-4 w-4 mr-2" />
                </Button>
                <Button
                  variant="default"
                  size="icon"
                  className="flex-1 sm:flex-initial"
                  onClick={() => handleApprove(tab)}
                >
                  <Check className="h-4 w-4 mr-2" />
                </Button>
              </div>
            </TabCard>
          ))}
        </ResponsiveTabGrid>
      </div>

      <TabViewDialog
        tab={viewingTab}
        open={!!viewingTab}
        onOpenChange={(open) => !open && handleCloseView()}
        dateFormatter={(timestamp) => `Submitted on ${formatDate(timestamp)}`}
        additionalBadges={pendingBadge}
      >
        <Button variant="outline" onClick={handleCloseView}>
          Close
        </Button>
        {viewingTab && (
          <>
            <Button variant="default" size="icon" onClick={() => router.push(`/edit/${viewingTab.id}`)}>
              <Pencil className="mr-2 h-4 w-4" />
            </Button>
            <Button variant="destructive" size="icon" onClick={() => handleReject(viewingTab)}>
              <X className="h-4 w-4 mr-2" />
            </Button>
            <Button variant="default" size="icon" onClick={() => handleApprove(viewingTab)}>
              <Check className="h-4 w-4 mr-2" />
            </Button>
          </>
        )}
      </TabViewDialog>

      <AlertDialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <AlertDialogContent className="max-w-full sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'approve' ? 'Approve Tab' : 'Reject Tab'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'approve'
                ? `Are you sure you want to approve "${actionTab?.title}"? This will make it visible to all users.`
                : `Are you sure you want to reject "${actionTab?.title}"? This will keep it hidden from public view.`
              }
            </AlertDialogDescription>
            {actionType === 'reject' && (
              <div className="mt-4 space-y-2">
                <Label htmlFor="rejection-reason">Rejection reason</Label>
                <Textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  placeholder="Explain why this tab was rejected."
                  className="min-h-[100px] sm:min-h-[120px]"
                />
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              disabled={actionType === 'reject' && !rejectionReason.trim()}
            >
              {actionType === 'approve' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
