
"use client";

import { useState, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import HarmonicaDiagram from './harmonica-diagram';
import { getHarmonicaLayout, type Note, type HoleAction } from '@/lib/harmonica';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { CornerDownLeft, Trash2, Delete, Save, FolderOpen } from 'lucide-react';
import SaveTabDialog from './save-tab-dialog';
import SavedTabsManagerDialog from './saved-tabs-manager';

export default function HarpNavigator() {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedHoleInfo, setSelectedHoleInfo] = useState<{ hole: number; action: HoleAction } | null>(null);
  const [holeHistory, setHoleHistory] = useState<string>('');
  const [noteHistory, setNoteHistory] = useState<string>('');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [savedTabsDialogOpen, setSavedTabsDialogOpen] = useState(false);

  const layout = useMemo(() => getHarmonicaLayout(), []);
  const processingRef = useRef(false);
  const holeScrollRef = useRef<HTMLDivElement>(null);
  const noteScrollRef = useRef<HTMLDivElement>(null);
  const isSyncingScroll = useRef(false);

  const addToHistory = useCallback((hole: string, note: string) => {
    setHoleHistory(prev => {
      if (!prev) return hole;
      if (prev.endsWith('\n')) return prev + hole;
      return prev + ' ' + hole;
    });
    setNoteHistory(prev => {
      if (!prev) return note;
      if (prev.endsWith('\n')) return prev + note;
      return prev + ' ' + note;
    });
  }, []);

  const handleNewLine = () => {
    if (holeHistory || noteHistory) {
      setHoleHistory(prev => prev + '\n');
      setNoteHistory(prev => prev + '\n');
    }
  };

  const handleBackspace = () => {
    setHoleHistory(prev => {
      if (!prev) return prev;

      // If the string ends with a newline, remove it
      if (prev.endsWith('\n')) {
        return prev.slice(0, -1);
      }

      // Find the last space or start of string to remove the last entry
      const lastSpaceIndex = prev.lastIndexOf(' ');
      if (lastSpaceIndex === -1) {
        // No spaces found, clear the string
        return '';
      } else {
        // Remove everything after the last space
        return prev.slice(0, lastSpaceIndex);
      }
    });

    setNoteHistory(prev => {
      if (!prev) return prev;

      // If the string ends with a newline, remove it
      if (prev.endsWith('\n')) {
        return prev.slice(0, -1);
      }

      // Find the last space or start of string to remove the last entry
      const lastSpaceIndex = prev.lastIndexOf(' ');
      if (lastSpaceIndex === -1) {
        // No spaces found, clear the string
        return '';
      } else {
        // Remove everything after the last space
        return prev.slice(0, lastSpaceIndex);
      }
    });
  };

  const handleHoleSelect = useCallback((hole: number, action: HoleAction) => {
    console.log('handleHoleSelect called:', hole, action);

    // Prevent multiple rapid calls
    if (processingRef.current) {
      console.log('Call blocked - processing');
      return;
    }

    processingRef.current = true;

    const note = layout[hole]?.note;
    setSelectedHoleInfo({ hole, action });
    setSelectedNote(note || null);
    if (note) {
      addToHistory(hole.toString(), note);
    }

    // Reset the flag after a short delay
    setTimeout(() => {
      processingRef.current = false;
    }, 50);
  }, [addToHistory]);



  const handleClearHistory = () => {
    setHoleHistory('');
    setNoteHistory('');
  };

  const handleLoadTab = (holeHistory: string, noteHistory: string) => {
    setHoleHistory(holeHistory);
    setNoteHistory(noteHistory);
  };

  const handleHoleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isSyncingScroll.current) return;
    isSyncingScroll.current = true;

    if (noteScrollRef.current) {
      noteScrollRef.current.scrollTop = e.currentTarget.scrollTop;
      noteScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }

    requestAnimationFrame(() => {
      isSyncingScroll.current = false;
    });
  };

  const handleNoteScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isSyncingScroll.current) return;
    isSyncingScroll.current = true;

    if (holeScrollRef.current) {
      holeScrollRef.current.scrollTop = e.currentTarget.scrollTop;
      holeScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }

    requestAnimationFrame(() => {
      isSyncingScroll.current = false;
    });
  };

  const ResultDisplay = () => {
    if (selectedHoleInfo) {
      return (
        <div className="text-center">
          <p className="text-lg">Tab: <span className="font-bold font-headline text-accent">{selectedHoleInfo.hole} {selectedHoleInfo.action}</span></p>
          <p className="text-lg">Note:
            {selectedNote ? (
              <span className="font-bold font-headline text-primary">{selectedNote}</span>
            ) : (
              <span className="text-muted-foreground"> (Invalid selection)</span>
            )}
          </p>
        </div>
      );
    }
    return <p className="text-center text-muted-foreground">Click on a harmonica hole to see the note.</p>;
  };

  return (
    <Card className="w-full shadow-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-headline">HarpTab Navigator</CardTitle>
        <CardDescription>Your interactive guide to the diatonic harmonica.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <p className="text-center text-muted-foreground">Click on a hole in the diagram below to see the note.</p>

        <HarmonicaDiagram
          layout={layout}
          selectedHoleInfo={selectedHoleInfo}
          onHoleSelect={handleHoleSelect}
        />

        <Separator />

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 gap-3">
              <CardTitle className="text-lg font-medium">Tab History</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setSavedTabsDialogOpen(true)} className="flex-1 sm:flex-none">
                  <FolderOpen className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Saved Tabs</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSaveDialogOpen(true)} disabled={!holeHistory && !noteHistory} className="flex-1 sm:flex-none">
                  <Save className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Save</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleNewLine} disabled={!holeHistory && !noteHistory} className="flex-1 sm:flex-none">
                  <CornerDownLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">New Line</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleBackspace} disabled={!holeHistory && !noteHistory} className="flex-1 sm:flex-none">
                  <Delete className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Backspace</span>
                </Button>
                <Button variant="destructive" size="sm" onClick={handleClearHistory} disabled={!holeHistory && !noteHistory} className="flex-1 sm:flex-none">
                  <Trash2 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Clear</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <h3 className="font-semibold text-sm uppercase text-muted-foreground tracking-wider mb-2">Hole Numbers</h3>
                  <div
                    ref={holeScrollRef}
                    onScroll={handleHoleScroll}
                    className="p-4 bg-background/50 rounded-lg min-h-[60px] max-h-[200px] text-base md:text-lg font-mono overflow-y-auto"
                  >
                    {!holeHistory ? (
                      <p className="text-muted-foreground text-sm">Hole numbers will appear here.</p>
                    ) : (
                      <pre className="break-words whitespace-pre-wrap">{holeHistory}</pre>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-sm uppercase text-muted-foreground tracking-wider mb-2">Note Letters</h3>
                  <div
                    ref={noteScrollRef}
                    onScroll={handleNoteScroll}
                    className="p-4 bg-background/50 rounded-lg min-h-[60px] max-h-[200px] text-base md:text-lg font-mono overflow-y-auto"
                  >
                    {!noteHistory ? (
                      <p className="text-muted-foreground text-sm">Note letters will appear here.</p>
                    ) : (
                      <pre className="break-words whitespace-pre-wrap">{noteHistory}</pre>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Note Reading Guide</CardTitle>
              <CardDescription>Reference guide for reading musical notes on the staff</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <img
                  src="https://b3296444.smushcdn.com/3296444/wp-content/uploads/Complete-Edition-Note-Reading-Music-Workbook-Notes-Covered.png?lossy=1&strip=1&webp=0"
                  alt="Musical note reading guide showing treble clef notes on staff lines and spaces"
                  className="max-w-full h-auto rounded-lg border border-border/50"
                  loading="lazy"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>

      <SaveTabDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        holeHistory={holeHistory}
        noteHistory={noteHistory}
      />

      <SavedTabsManagerDialog
        open={savedTabsDialogOpen}
        onOpenChange={setSavedTabsDialogOpen}
        onLoadTab={handleLoadTab}
      />
    </Card>
  );
}
