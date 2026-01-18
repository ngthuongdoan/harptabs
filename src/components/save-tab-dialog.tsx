"use client";

import { useEffect, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SavedTabsManager } from '@/lib/saved-tabs';
import { useToast } from '@/hooks/use-toast';
import { type HarmonicaType } from '@/lib/harmonica';

interface SaveTabDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holeHistory: string;
  noteHistory: string;
  harmonicaType: HarmonicaType;
  editingTab?: {
    id: string;
    title: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    genre: string;
    key: string;
    harmonicaType: HarmonicaType;
  } | null;
}

export default function SaveTabDialog({
  open,
  onOpenChange,
  holeHistory,
  noteHistory,
  harmonicaType,
  editingTab
}: SaveTabDialogProps) {
  const [title, setTitle] = useState(editingTab?.title || '');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced' | ''>(editingTab?.difficulty || '');
  const [genre, setGenre] = useState(editingTab?.genre || '');
  const [key, setKey] = useState(editingTab?.key || '');
  const [selectedHarmonicaType, setSelectedHarmonicaType] = useState<HarmonicaType>(editingTab?.harmonicaType || harmonicaType);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setTitle(editingTab?.title || '');
      setDifficulty(editingTab?.difficulty || '');
      setGenre(editingTab?.genre || '');
      setKey(editingTab?.key || '');
      setSelectedHarmonicaType(editingTab?.harmonicaType || harmonicaType);
    }
  }, [editingTab, harmonicaType, open]);

  const isFormValid = Boolean(
    title.trim()
      && difficulty
      && selectedHarmonicaType
      && key.trim()
      && genre.trim()
  );

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for your tab.",
        variant: "destructive"
      });
      return;
    }

    if (!difficulty) {
      toast({
        title: "Error",
        description: "Please select a difficulty level.",
        variant: "destructive"
      });
      return;
    }

    if (!selectedHarmonicaType) {
      toast({
        title: "Error",
        description: "Please select a harmonica type.",
        variant: "destructive"
      });
      return;
    }

    if (!key.trim()) {
      toast({
        title: "Error",
        description: "Please enter a key.",
        variant: "destructive"
      });
      return;
    }

    if (!genre.trim()) {
      toast({
        title: "Error",
        description: "Please enter a genre.",
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
        result = await SavedTabsManager.updateTab(
          editingTab.id,
          title.trim(),
          holeHistory,
          noteHistory,
          selectedHarmonicaType,
          difficulty,
          key.trim(),
          genre.trim()
        );
      } else {
        result = await SavedTabsManager.saveTab(
          title.trim(),
          holeHistory,
          noteHistory,
          selectedHarmonicaType,
          difficulty,
          key.trim(),
          genre.trim()
        );
      }

      if (result) {
        toast({
          title: "Success",
          description: editingTab ? "Tab updated successfully!" : "Tab saved successfully!"
        });
        onOpenChange(false);
        setTitle('');
        setDifficulty('');
        setGenre('');
        setKey('');
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
  };

  const handleClose = () => {
    if (!editingTab) {
      setTitle('');
      setDifficulty('');
      setGenre('');
      setKey('');
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="difficulty" className="text-right">
              Difficulty
            </Label>
            <Select value={difficulty} onValueChange={(value) => setDifficulty(value as 'Beginner' | 'Intermediate' | 'Advanced')}>
              <SelectTrigger id="difficulty" className="col-span-3">
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="harmonica-type" className="text-right">
              Harmonica Type
            </Label>
            <Select value={selectedHarmonicaType} onValueChange={(value) => setSelectedHarmonicaType(value as HarmonicaType)}>
              <SelectTrigger id="harmonica-type" className="col-span-3">
                <SelectValue placeholder="Select harmonica type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tremolo">Tremolo (24-hole)</SelectItem>
                <SelectItem value="diatonic">Diatonic (10-hole)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="key" className="text-right">
              Key
            </Label>
            <Input
              id="key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Enter key (e.g., C, Gm)"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="genre" className="text-right">
              Genre
            </Label>
            <Input
              id="genre"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="Enter genre"
              className="col-span-3"
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
          <Button onClick={handleSave} disabled={isSaving || !isFormValid}>
            {isSaving ? 'Saving...' : (editingTab ? 'Update' : 'Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
