"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { HarmonicaType } from '@/lib/harmonica';

interface TabEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  holeHistory: string;
  noteHistory: string;
  harmonicaType: HarmonicaType;
  onSave: (data: {
    title: string;
    holeHistory: string;
    noteHistory: string;
    harmonicaType: HarmonicaType;
  }) => Promise<void>;
  dialogTitle?: string;
  dialogDescription?: string;
}

export function TabEditDialog({
  open,
  onOpenChange,
  title: initialTitle,
  holeHistory: initialHoleHistory,
  noteHistory: initialNoteHistory,
  harmonicaType: initialHarmonicaType,
  onSave,
  dialogTitle = "Edit Tab",
  dialogDescription = "Update the title or contents."
}: TabEditDialogProps) {
  const [title, setTitle] = useState(initialTitle);
  const [holeHistory, setHoleHistory] = useState(initialHoleHistory);
  const [noteHistory, setNoteHistory] = useState(initialNoteHistory);
  const [harmonicaType, setHarmonicaType] = useState<HarmonicaType>(initialHarmonicaType);
  const [isSaving, setIsSaving] = useState(false);

  // Update state when props change
  useEffect(() => {
    setTitle(initialTitle);
    setHoleHistory(initialHoleHistory);
    setNoteHistory(initialNoteHistory);
    setHarmonicaType(initialHarmonicaType);
  }, [initialTitle, initialHoleHistory, initialNoteHistory, initialHarmonicaType, open]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        title: title.trim(),
        holeHistory,
        noteHistory,
        harmonicaType
      });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-full sm:max-w-[600px] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
            <Label htmlFor="tab-title" className="sm:text-right">
              Title
            </Label>
            <Input
              id="tab-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="sm:col-span-3"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
            <Label htmlFor="tab-holes" className="sm:text-right sm:pt-2">
              Holes
            </Label>
            <Textarea
              id="tab-holes"
              value={holeHistory}
              onChange={(event) => setHoleHistory(event.target.value)}
              className="sm:col-span-3 min-h-[120px] sm:min-h-[140px] text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
            <Label htmlFor="tab-notes" className="sm:text-right sm:pt-2">
              Notes
            </Label>
            <Textarea
              id="tab-notes"
              value={noteHistory}
              onChange={(event) => setNoteHistory(event.target.value)}
              className="sm:col-span-3 min-h-[120px] sm:min-h-[140px] text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
            <Label htmlFor="tab-type" className="sm:text-right">
              Type
            </Label>
            <Select value={harmonicaType} onValueChange={(value: HarmonicaType) => setHarmonicaType(value)}>
              <SelectTrigger id="tab-type" className="sm:col-span-3">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tremolo">Tremolo</SelectItem>
                <SelectItem value="diatonic">Diatonic</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
