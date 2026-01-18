
"use client";

import { useState, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import HarmonicaDiagram from './harmonica-diagram';
import { getHarmonicaLayout, type Note, type HoleAction, type HarmonicaType, isDiatonicLayout, isTremoloLayout, convertDiatonicToTremolo, convertTremoloToDiatonic } from '@/lib/harmonica';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { CornerDownLeft, Trash2, Delete, Save, FolderOpen, ArrowRightLeft, Clipboard, Undo2, Redo2 } from 'lucide-react';
import SaveTabDialog from './save-tab-dialog';
import SavedTabsManagerDialog from './saved-tabs-manager';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function HarpNavigator() {
  const [harmonicaType, setHarmonicaType] = useState<HarmonicaType>('tremolo');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedHoleInfo, setSelectedHoleInfo] = useState<{ hole: number; action: HoleAction } | null>(null);
  const [holeHistory, setHoleHistory] = useState<string>('');
  const [noteHistory, setNoteHistory] = useState<string>('');
  const [undoStack, setUndoStack] = useState<Array<{ holeHistory: string; noteHistory: string; harmonicaType: HarmonicaType }>>([]);
  const [redoStack, setRedoStack] = useState<Array<{ holeHistory: string; noteHistory: string; harmonicaType: HarmonicaType }>>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  // const [savedTabsDialogOpen, setSavedTabsDialogOpen] = useState(false);
  const { toast } = useToast();

  const layout = useMemo(() => getHarmonicaLayout(harmonicaType), [harmonicaType]);
  const processingRef = useRef(false);
  const holeScrollRef = useRef<HTMLDivElement>(null);
  const noteScrollRef = useRef<HTMLDivElement>(null);
  const isSyncingScroll = useRef(false);

  const getCurrentState = useCallback(() => ({
    holeHistory,
    noteHistory,
    harmonicaType
  }), [holeHistory, noteHistory, harmonicaType]);

  const applyState = useCallback((state: { holeHistory: string; noteHistory: string; harmonicaType: HarmonicaType }) => {
    setHoleHistory(state.holeHistory);
    setNoteHistory(state.noteHistory);
    setHarmonicaType(state.harmonicaType);
  }, []);

  const applyEdit = useCallback((nextState: { holeHistory: string; noteHistory: string; harmonicaType: HarmonicaType }) => {
    setUndoStack(prev => [...prev, getCurrentState()]);
    setRedoStack([]);
    applyState(nextState);
  }, [applyState, getCurrentState]);

  const appendToken = (prev: string, token: string) => {
    if (!prev) return token;
    if (prev.endsWith('\n')) return prev + token;
    return `${prev} ${token}`;
  };

  const removeLastEntry = (prev: string) => {
    if (!prev) return prev;
    if (prev.endsWith('\n')) {
      return prev.slice(0, -1);
    }
    const lastSpaceIndex = prev.lastIndexOf(' ');
    if (lastSpaceIndex === -1) {
      return '';
    }
    return prev.slice(0, lastSpaceIndex);
  };

  const handleNewLine = () => {
    if (holeHistory || noteHistory) {
      applyEdit({
        holeHistory: `${holeHistory}\n`,
        noteHistory: `${noteHistory}\n`,
        harmonicaType
      });
    }
  };

  const handleBackspace = () => {
    applyEdit({
      holeHistory: removeLastEntry(holeHistory),
      noteHistory: removeLastEntry(noteHistory),
      harmonicaType
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

    let note: Note | null = null;
    let holeNotation: string;

    // Get note based on layout type
    if (isDiatonicLayout(layout)) {
      note = layout[hole]?.[action];
      // For diatonic: use + for blow, - for draw
      holeNotation = action === 'blow' ? `+${hole}` : `-${hole}`;
    } else if (isTremoloLayout(layout)) {
      note = layout[hole]?.note;
      // For tremolo: just use the hole number
      holeNotation = hole.toString();
    } else {
      holeNotation = hole.toString();
    }

    setSelectedHoleInfo({ hole, action });
    setSelectedNote(note || null);
    if (note) {
      applyEdit({
        holeHistory: appendToken(holeHistory, holeNotation),
        noteHistory: appendToken(noteHistory, note),
        harmonicaType
      });
    }

    // Reset the flag after a short delay
    setTimeout(() => {
      processingRef.current = false;
    }, 50);
  }, [layout, applyEdit, holeHistory, noteHistory, harmonicaType]);



  const handleClearHistory = () => {
    applyEdit({
      holeHistory: '',
      noteHistory: '',
      harmonicaType
    });
  };

  const handleConvertTab = () => {
    if (!holeHistory) {
      toast({
        title: "No tab to convert",
        description: "Please create a tab first before converting.",
        variant: "destructive"
      });
      return;
    }

    const targetType = harmonicaType === 'diatonic' ? 'tremolo' : 'diatonic';
    const result = harmonicaType === 'diatonic'
      ? convertDiatonicToTremolo(holeHistory)
      : convertTremoloToDiatonic(holeHistory);

    if (result.success || result.convertedTab) {
      applyEdit({
        holeHistory: result.convertedTab,
        noteHistory,
        harmonicaType: targetType
      });
      
      toast({
        title: "Tab converted!",
        description: `Converted from ${harmonicaType} to ${targetType} notation.`,
      });

      if (result.warnings.length > 0) {
        toast({
          title: "Conversion warnings",
          description: result.warnings.join(', '),
          variant: "default"
        });
      }
    } else {
      toast({
        title: "Conversion failed",
        description: result.errors.join(', '),
        variant: "destructive"
      });
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        toast({
          title: "Nothing to paste",
          description: "Clipboard is empty.",
          variant: "destructive"
        });
        return;
      }

      // Clean the text: split by lines, process each line
      const cleanedLines = text.split('\n')
        .map(line => {
          // Keep only valid characters: digits, +/-, note letters (A-G), #, b, ♯, ♭, and spaces
          return line.replace(/[^0-9+\-A-Ga-g#b♯♭\s]/g, '').trim();
        })
        .filter(line => line.length > 0); // Remove empty lines

      if (cleanedLines.length === 0) {
        toast({
          title: "Nothing to paste",
          description: "No valid content found after cleaning.",
          variant: "destructive"
        });
        return;
      }

      const cleanedText = cleanedLines.join('\n');

      // Detect if pasted content is hole notation or note letters
      const hasHoleNotation = /[\+\-]?\d+/.test(cleanedText);
      const hasNoteLetters = /[A-Ga-g][#b♯♭]?/.test(cleanedText);

      if (hasHoleNotation && !hasNoteLetters) {
        // It's hole notation - convert to notes
        const convertedNotes = convertHoleToNotes(cleanedText);
        applyEdit({
          holeHistory: cleanedText,
          noteHistory: convertedNotes,
          harmonicaType
        });
        toast({
          title: "Tab pasted!",
          description: "Hole notation pasted and converted to notes.",
        });
      } else if (hasNoteLetters && !hasHoleNotation) {
        // It's note notation - paste to note history
        applyEdit({
          holeHistory: '',
          noteHistory: cleanedText,
          harmonicaType
        });
        toast({
          title: "Notes pasted!",
          description: "Note letters pasted successfully.",
        });
      } else if (hasHoleNotation && hasNoteLetters) {
        // Mixed content - try to parse both
        applyEdit({
          holeHistory: cleanedText,
          noteHistory: cleanedText,
          harmonicaType
        });
        toast({
          title: "Content pasted!",
          description: "Mixed content detected. Please review and adjust as needed.",
        });
      } else {
        toast({
          title: "Unrecognized format",
          description: "The pasted content doesn't appear to be a valid tab.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Paste failed",
        description: "Unable to access clipboard. Please try again.",
        variant: "destructive"
      });
    }
  };

  const convertHoleToNotes = (holeText: string): string => {
    const lines = holeText.split('\n');
    const noteLines = lines.map(line => {
      const tokens = line.split(/\s+/);
      const notes = tokens.map(token => {
        if (!token) return '';

        // Parse hole notation
        let hole: number;
        let action: HoleAction = 'blow';

        if (token.startsWith('+')) {
          hole = parseInt(token.substring(1));
          action = 'blow';
        } else if (token.startsWith('-')) {
          hole = parseInt(token.substring(1));
          action = 'draw';
        } else {
          hole = parseInt(token);
          // For tremolo, there's only one action (note)
          action = 'blow';
        }

        if (isNaN(hole)) return token;

        // Get note from layout
        let note: Note | null = null;
        if (isDiatonicLayout(layout)) {
          note = layout[hole]?.[action];
        } else if (isTremoloLayout(layout)) {
          note = layout[hole]?.note;
        }

        return note || token;
      });
      return notes.join(' ');
    });
    return noteLines.join('\n');
  };

  const handleLoadTab = (holeHistory: string, noteHistory: string) => {
    applyEdit({
      holeHistory,
      noteHistory,
      harmonicaType
    });
  };

  const handleUndo = () => {
    setUndoStack(prev => {
      if (prev.length === 0) return prev;
      const previousState = prev[prev.length - 1];
      setRedoStack(next => [...next, getCurrentState()]);
      applyState(previousState);
      return prev.slice(0, -1);
    });
  };

  const handleRedo = () => {
    setRedoStack(prev => {
      if (prev.length === 0) return prev;
      const nextState = prev[prev.length - 1];
      setUndoStack(next => [...next, getCurrentState()]);
      applyState(nextState);
      return prev.slice(0, -1);
    });
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

  return (
    <Card className="w-full shadow-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-headline">HarpTab Navigator</CardTitle>
        <CardDescription>Your interactive guide to the harmonica.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3">
          <p className="text-center text-muted-foreground">Select harmonica type and click on a hole to see the note.</p>
          <div className="flex items-center gap-3">
            <label htmlFor="harmonica-type" className="text-sm font-medium">Harmonica Type:</label>
            <Select value={harmonicaType} onValueChange={(value: HarmonicaType) => {
              applyEdit({
                holeHistory,
                noteHistory,
                harmonicaType: value
              });
              setSelectedHoleInfo(null);
              setSelectedNote(null);
            }}>
              <SelectTrigger id="harmonica-type" className="w-[180px]">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tremolo">Tremolo (24-hole)</SelectItem>
                <SelectItem value="diatonic">Diatonic (10-hole)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

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
                {/* <Button variant="outline" size="sm" onClick={() => setSavedTabsDialogOpen(true)} className="flex-1 sm:flex-none">
                  <FolderOpen className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Saved Tabs</span>
                </Button> */}
                <Button variant="outline" size="sm" onClick={handlePaste} className="flex-1 sm:flex-none">
                  <Clipboard className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Paste</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSaveDialogOpen(true)} disabled={!holeHistory && !noteHistory} className="flex-1 sm:flex-none">
                  <Save className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Save</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleConvertTab} disabled={!holeHistory} className="flex-1 sm:flex-none">
                  <ArrowRightLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Convert</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleUndo} disabled={undoStack.length === 0} className="flex-1 sm:flex-none">
                  <Undo2 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Undo</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleRedo} disabled={redoStack.length === 0} className="flex-1 sm:flex-none">
                  <Redo2 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Redo</span>
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
        harmonicaType={harmonicaType}
      />
      {/*
      <SavedTabsManagerDialog
        open={savedTabsDialogOpen}
        onOpenChange={setSavedTabsDialogOpen}
        onLoadTab={handleLoadTab}
      /> */}
    </Card>
  );
}
