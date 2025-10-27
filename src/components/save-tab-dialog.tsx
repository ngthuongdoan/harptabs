"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SavedTabsManager } from '@/lib/saved-tabs';
import { useToast } from '@/hooks/use-toast';

interface SaveTabDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holeHistory: string;
  noteHistory: string;
  editingTab?: { id: string; title: string } | null;
}

export default function SaveTabDialog({
  open,
  onOpenChange,
  holeHistory,
  noteHistory,
  editingTab
}: SaveTabDialogProps) {
  const [title, setTitle] = useState(editingTab?.title || '');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for your tab.",
        variant: "destructive"
      });
      return;
    }

    if (!holeHistory.trim() && !noteHistory.trim()) {
      toast({
        title: "Error",
        description: "No tab data to save. Please create some notes first.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    try {
      let result;
      if (editingTab) {
        result = await SavedTabsManager.updateTab(editingTab.id, title.trim(), holeHistory, noteHistory);
      } else {
        result = await SavedTabsManager.saveTab(title.trim(), holeHistory, noteHistory);
      }

      if (result) {
        toast({
          title: "Success",
          description: editingTab ? "Tab updated successfully!" : "Tab saved successfully!"
        });
        onOpenChange(false);
        setTitle('');
      } else {
        throw new Error('Save operation failed');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: "Failed to save tab. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  }; const handleClose = () => {
    if (!editingTab) {
      setTitle('');
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {editingTab ? 'Update Tab' : 'Save Tab'}
          </DialogTitle>
          <DialogDescription>
            {editingTab
              ? 'Update your harmonica tab with a new title or content.'
              : 'Give your harmonica tab a title to save it locally.'
            }
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter tab title..."
              className="col-span-3"
              autoFocus
            />
          </div>
          <div className="text-sm text-muted-foreground">
            <p>Preview:</p>
            <div className="mt-2 p-3 bg-muted rounded-md">
              <div className="font-mono text-xs">
                <div className="mb-2">
                  <span className="font-semibold">Holes:</span> {holeHistory || '(empty)'}
                </div>
                <div>
                  <span className="font-semibold">Notes:</span> {noteHistory || '(empty)'}
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : (editingTab ? 'Update' : 'Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}