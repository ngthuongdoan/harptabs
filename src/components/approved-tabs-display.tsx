"use client";

import { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { useTabViewTracking } from '@/hooks/use-tab-view-tracking';
import { Eye, Pencil } from 'lucide-react';
import { TabCard, TabTypeBadge } from '@/components/tab-card';
import { TabContentView } from '@/components/tab-content-view';
import { formatDateShort } from '@/lib/tab-utils';
import type { SavedTab } from '../../lib/db';
import { convertDiatonicToTremolo, convertTremoloToDiatonic, type HarmonicaType } from '@/lib/harmonica';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ApprovedTabsDisplayProps {
  apiKey?: string | null;
}

export default function ApprovedTabsDisplay({ apiKey }: ApprovedTabsDisplayProps) {
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
  const { toast } = useToast();
  const { trackView } = useTabViewTracking();

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
    setSelectedTab(tab);
    setViewHarmonicaType(tab.harmonicaType);

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
    if (!apiKey) {
      toast({
        title: "Error",
        description: "Admin access required to edit tabs.",
        variant: "destructive"
      });
      return;
    }
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

  const activeViewType = selectedTab ? (viewHarmonicaType ?? selectedTab.harmonicaType) : null;
  const displayData = selectedTab && activeViewType
    ? getTabDisplayData(selectedTab, activeViewType)
    : null;

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tabs.map((tab) => (
          <div key={tab.id} className="space-y-2">
            <TabCard
              tab={tab}
              dateFormatter={formatDateShort}
              additionalBadges={
                <Badge variant="secondary">Approved</Badge>
              }
              previewMode={true}
            />
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => handleViewTab(tab)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Full Tab
            </Button>
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
                      Created on {formatDateShort(selectedTab.createdAt)}
                    </DialogDescription>
                  </div>
                  <TabTypeBadge type={selectedTab.harmonicaType} />
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
                {apiKey && (
                  <Button
                    variant="default"
                    onClick={() => openEditDialog(selectedTab)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Tab
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Approved Tab</DialogTitle>
            <DialogDescription>
              Update the title or contents to correct the public tab.
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
    </div>
  );
}
