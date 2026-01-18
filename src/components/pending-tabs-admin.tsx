"use client";

import { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { Check, X, Eye, Pencil } from 'lucide-react';
import { TabCard, TabTypeBadge } from '@/components/tab-card';
import { TabContentView } from '@/components/tab-content-view';
import { formatDate } from '@/lib/tab-utils';
import { convertDiatonicToTremolo, convertTremoloToDiatonic, type HarmonicaType } from '@/lib/harmonica';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { SavedTab } from '../../lib/db';

interface PendingTabsAdminProps {
  apiKey: string;
}

export default function PendingTabsAdmin({ apiKey }: PendingTabsAdminProps) {
  const [tabs, setTabs] = useState<SavedTab[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<SavedTab | null>(null);
  const [viewHarmonicaType, setViewHarmonicaType] = useState<HarmonicaType | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editHoleHistory, setEditHoleHistory] = useState('');
  const [editNoteHistory, setEditNoteHistory] = useState('');
  const [editHarmonicaType, setEditHarmonicaType] = useState<HarmonicaType>('tremolo');
  const [isSaving, setIsSaving] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [actionTab, setActionTab] = useState<SavedTab | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const { toast } = useToast();

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
    setSelectedTab(tab);
    setViewHarmonicaType(tab.harmonicaType);
  };

  const openEditDialog = (tab: SavedTab) => {
    setEditTitle(tab.title);
    setEditHoleHistory(tab.holeHistory);
    setEditNoteHistory(tab.noteHistory);
    setEditHarmonicaType(tab.harmonicaType);
    setEditDialogOpen(true);
  };

  const getTabDisplayData = (tab: SavedTab, targetType: HarmonicaType) => {
    if (targetType === tab.harmonicaType) {
      return {
        holeHistory: tab.holeHistory,
        errors: [] as string[],
        warnings: [] as string[],
        isConverted: false,
        usedFallback: false,
      };
    }

    const result = tab.harmonicaType === 'diatonic'
      ? convertDiatonicToTremolo(tab.holeHistory)
      : convertTremoloToDiatonic(tab.holeHistory);

    const hasConvertedTab = Boolean(result.convertedTab);
    return {
      holeHistory: hasConvertedTab ? result.convertedTab : tab.holeHistory,
      errors: result.errors,
      warnings: result.warnings,
      isConverted: true,
      usedFallback: !hasConvertedTab,
    };
  };

  const handleSaveEdit = async () => {
    if (!selectedTab) return;
    if (!editTitle.trim()) {
      toast({
        title: "Error",
        description: "Title is required.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/tabs/${selectedTab.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          title: editTitle.trim(),
          holeHistory: editHoleHistory,
          noteHistory: editNoteHistory,
          harmonicaType: editHarmonicaType
        })
      });

      if (!response.ok) throw new Error('Failed to update tab');
      const updatedTab = await response.json();
      setTabs((prevTabs) => prevTabs.map((tab) => (tab.id === updatedTab.id ? updatedTab : tab)));
      setSelectedTab(updatedTab);
      setEditDialogOpen(false);
      toast({
        title: "Success",
        description: "Tab updated successfully!"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update tab.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
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
      if (selectedTab?.id === actionTab.id) {
        setSelectedTab(null);
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

  const activeViewType = selectedTab ? (viewHarmonicaType ?? selectedTab.harmonicaType) : null;
  const displayData = selectedTab && activeViewType
    ? getTabDisplayData(selectedTab, activeViewType)
    : null;

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
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

        {tabs.map((tab) => (
          <div key={tab.id} className="space-y-2">
            <TabCard
              tab={tab}
              dateFormatter={(timestamp) => `Submitted on ${formatDate(timestamp)}`}
              className="relative"
              additionalBadges={
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                  Pending
                </Badge>
              }
              previewMode={true}
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewTab(tab)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Full Tab
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleReject(tab)}
              >
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleApprove(tab)}
              >
                <Check className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!selectedTab} onOpenChange={(open) => !open && setSelectedTab(null)}>
        <DialogContent className="max-w-full h-full md:max-w-4xl md:h-[90vh] flex flex-col">
          {selectedTab && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-2xl">{selectedTab.title}</DialogTitle>
                    <DialogDescription>
                      Submitted on {formatDate(selectedTab.createdAt)}
                    </DialogDescription>
                  </div>
                  <div className="flex gap-2">
                    <TabTypeBadge type={selectedTab.harmonicaType} />
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                      Pending
                    </Badge>
                  </div>
                </div>
              </DialogHeader>
              <div className="flex-1 overflow-auto">
                {selectedTab && displayData && (
                  <>
                    <div className="flex flex-col gap-2 mb-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-muted-foreground">View as:</span>
                        <Button
                          variant={activeViewType === 'diatonic' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setViewHarmonicaType('diatonic')}
                        >
                          Diatonic
                        </Button>
                        <Button
                          variant={activeViewType === 'tremolo' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setViewHarmonicaType('tremolo')}
                        >
                          Tremolo
                        </Button>
                        {activeViewType !== selectedTab.harmonicaType && (
                          <Badge variant="secondary">Converted</Badge>
                        )}
                      </div>
                      {displayData.isConverted && (displayData.errors.length > 0 || displayData.warnings.length > 0) && (
                        <p className="text-xs text-muted-foreground">
                          {displayData.usedFallback && 'Conversion failed; showing original tab. '}
                          {displayData.errors.length > 0 && `Errors: ${displayData.errors.join('; ')}. `}
                          {displayData.warnings.length > 0 && `Warnings: ${displayData.warnings.join('; ')}.`}
                        </p>
                      )}
                    </div>

                    <TabContentView
                      holeHistory={displayData.holeHistory}
                      noteHistory={selectedTab.noteHistory}
                      height="h-96"
                    />
                  </>
                )}
              </div>
              <DialogFooter className="flex-shrink-0 gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedTab(null)}
                >
                  Close
                </Button>
                <Button
                  variant="default"
                  onClick={() => openEditDialog(selectedTab)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Tab
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleReject(selectedTab)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  variant="default"
                  onClick={() => handleApprove(selectedTab)}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Pending Tab</DialogTitle>
            <DialogDescription>
              Update the title or contents before approving.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tab-title" className="text-right">
                Title
              </Label>
              <Input
                id="tab-title"
                value={editTitle}
                onChange={(event) => setEditTitle(event.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="tab-holes" className="text-right pt-2">
                Holes
              </Label>
              <Textarea
                id="tab-holes"
                value={editHoleHistory}
                onChange={(event) => setEditHoleHistory(event.target.value)}
                className="col-span-3 min-h-[140px]"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="tab-notes" className="text-right pt-2">
                Notes
              </Label>
              <Textarea
                id="tab-notes"
                value={editNoteHistory}
                onChange={(event) => setEditNoteHistory(event.target.value)}
                className="col-span-3 min-h-[140px]"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tab-type" className="text-right">
                Type
              </Label>
              <Select value={editHarmonicaType} onValueChange={(value: HarmonicaType) => setEditHarmonicaType(value)}>
                <SelectTrigger id="tab-type" className="col-span-3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tremolo">Tremolo</SelectItem>
                  <SelectItem value="diatonic">Diatonic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <AlertDialogContent>
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
                className="min-h-[120px]"
              />
            </div>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
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
