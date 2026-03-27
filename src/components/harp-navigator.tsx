
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { convertDiatonicToTremolo, convertTremoloToDiatonic, getHarmonicaLayout, type HarmonicaType, type HoleAction, isDiatonicLayout, isTremoloLayout, type Note } from '@/lib/harmonica';
import type { SavedTab } from '../../lib/db';
import { ArrowRightLeft, Clipboard, CornerDownLeft, Delete, Redo2, Save, Trash2, Undo2 } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import HarmonicaDiagram from './harmonica-diagram';
import SaveTabDialog from './save-tab-dialog';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';

interface HarpNavigatorProps {
  tab?: SavedTab;
  mode?: 'create' | 'edit';
}
export default function HarpNavigator({ tab, mode = "create" }: HarpNavigatorProps) {
  const [harmonicaType, setHarmonicaType] = useState<HarmonicaType>(tab?.harmonicaType || 'tremolo');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedHoleInfo, setSelectedHoleInfo] = useState<{ hole: number; action: HoleAction } | null>(null);
  const [holeHistory, setHoleHistory] = useState<string>(tab?.holeHistory || '');
  const [noteHistory, setNoteHistory] = useState<string>(tab?.noteHistory || '');
  const [undoStack, setUndoStack] = useState<Array<{ holeHistory: string; noteHistory: string; harmonicaType: HarmonicaType }>>([]);
  const [redoStack, setRedoStack] = useState<Array<{ holeHistory: string; noteHistory: string; harmonicaType: HarmonicaType }>>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  // const [savedTabsDialogOpen, setSavedTabsDialogOpen] = useState(false);
  const { toast } = useToast();

  const layout = useMemo(() => getHarmonicaLayout(harmonicaType), [harmonicaType]);
  const processingRef = useRef(false);
  const holeTextareaRef = useRef<HTMLTextAreaElement>(null);

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

  const insertTokenAtCursor = useCallback((value: string, token: string) => {
    const textarea = holeTextareaRef.current;

    if (!textarea) {
      return appendToken(value, token);
    }

    const selectionStart = textarea.selectionStart ?? value.length;
    const selectionEnd = textarea.selectionEnd ?? value.length;
    const before = value.slice(0, selectionStart);
    const after = value.slice(selectionEnd);

    const needsLeadingSpace = before.length > 0 && !before.endsWith(' ') && !before.endsWith('\n');
    const needsTrailingSpace = after.length > 0 && !after.startsWith(' ') && !after.startsWith('\n');
    const insertedToken = `${needsLeadingSpace ? ' ' : ''}${token}${needsTrailingSpace ? ' ' : ''}`;

    return {
      nextValue: `${before}${insertedToken}${after}`,
      nextCursor: before.length + insertedToken.length,
    };
  }, []);

  const focusHoleTextarea = useCallback((cursorStart: number, cursorEnd = cursorStart) => {
    requestAnimationFrame(() => {
      if (!holeTextareaRef.current) return;
      holeTextareaRef.current.focus();
      holeTextareaRef.current.setSelectionRange(cursorStart, cursorEnd);
    });
  }, []);

  const insertTextAtCursor = useCallback((value: string, text: string) => {
    const textarea = holeTextareaRef.current;

    if (!textarea) {
      return {
        nextValue: `${value}${text}`,
        nextCursor: value.length + text.length,
      };
    }

    const selectionStart = textarea.selectionStart ?? value.length;
    const selectionEnd = textarea.selectionEnd ?? value.length;
    const nextValue = `${value.slice(0, selectionStart)}${text}${value.slice(selectionEnd)}`;
    const nextCursor = selectionStart + text.length;

    return { nextValue, nextCursor };
  }, []);

  const removePreviousTokenAtCursor = useCallback((value: string) => {
    const textarea = holeTextareaRef.current;

    if (!textarea) {
      const nextValue = removeLastEntry(value);
      return {
        nextValue,
        nextCursor: nextValue.length,
      };
    }

    const selectionStart = textarea.selectionStart ?? value.length;
    const selectionEnd = textarea.selectionEnd ?? value.length;

    if (selectionStart !== selectionEnd) {
      return {
        nextValue: `${value.slice(0, selectionStart)}${value.slice(selectionEnd)}`,
        nextCursor: selectionStart,
      };
    }

    if (selectionStart === 0) {
      return {
        nextValue: value,
        nextCursor: 0,
      };
    }

    const beforeCursor = value.slice(0, selectionStart);
    const afterCursor = value.slice(selectionStart);

    if (beforeCursor.endsWith('\n')) {
      return {
        nextValue: `${beforeCursor.slice(0, -1)}${afterCursor}`,
        nextCursor: selectionStart - 1,
      };
    }

    const beforeWithoutTrailingSpaces = beforeCursor.replace(/[ \t]+$/, '');
    const lastTokenMatch = beforeWithoutTrailingSpaces.match(/\S+$/);

    if (!lastTokenMatch) {
      return {
        nextValue: `${beforeWithoutTrailingSpaces}${afterCursor}`,
        nextCursor: beforeWithoutTrailingSpaces.length,
      };
    }

    const tokenStart = beforeWithoutTrailingSpaces.length - lastTokenMatch[0].length;
    const separatorMatch = beforeWithoutTrailingSpaces.slice(0, tokenStart).match(/[ \t]+$/);
    const rangeStart = separatorMatch ? tokenStart - separatorMatch[0].length : tokenStart;

    return {
      nextValue: `${value.slice(0, rangeStart)}${afterCursor}`,
      nextCursor: rangeStart,
    };
  }, []);

  const getInvalidHoleTokens = useCallback((text: string) => {
    const invalidTokens: string[] = [];

    for (const line of text.split('\n')) {
      const tokens = line.trim().split(/\s+/).filter(Boolean);

      for (const token of tokens) {
        if (isDiatonicLayout(layout)) {
          const match = token.match(/^([+-])(\d+)$/);
          if (!match) {
            invalidTokens.push(token);
            continue;
          }

          const hole = parseInt(match[2], 10);
          if (!layout[hole]) {
            invalidTokens.push(token);
          }
          continue;
        }

        if (isTremoloLayout(layout)) {
          if (!/^\d+$/.test(token)) {
            invalidTokens.push(token);
            continue;
          }

          const hole = parseInt(token, 10);
          if (!layout[hole]) {
            invalidTokens.push(token);
          }
        }
      }
    }

    return invalidTokens;
  }, [layout]);

  const invalidHoleTokens = useMemo(
    () => getInvalidHoleTokens(holeHistory),
    [getInvalidHoleTokens, holeHistory]
  );

  const handleNewLine = () => {
    const insertion = insertTextAtCursor(holeHistory, '\n');

    applyEdit({
      holeHistory: insertion.nextValue,
      noteHistory: convertHoleToNotes(insertion.nextValue),
      harmonicaType
    });

    focusHoleTextarea(insertion.nextCursor);
  };

  const handleBackspace = () => {
    const removal = removePreviousTokenAtCursor(holeHistory);

    if (removal.nextValue === holeHistory) {
      return;
    }

    applyEdit({
      holeHistory: removal.nextValue,
      noteHistory: convertHoleToNotes(removal.nextValue),
      harmonicaType
    });

    focusHoleTextarea(removal.nextCursor);
  };

  const handleHoleSelect = useCallback((hole: number, action: HoleAction) => {
    // Prevent multiple rapid calls
    if (processingRef.current) {
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
      const insertion = insertTokenAtCursor(holeHistory, holeNotation);
      const nextHoleHistory = typeof insertion === 'string' ? insertion : insertion.nextValue;

      applyEdit({
        holeHistory: nextHoleHistory,
        noteHistory: convertHoleToNotes(nextHoleHistory),
        harmonicaType
      });

      if (typeof insertion !== 'string') {
        focusHoleTextarea(insertion.nextCursor);
      }
    }

    // Reset the flag after a short delay
    setTimeout(() => {
      processingRef.current = false;
    }, 50);
  }, [layout, applyEdit, convertHoleToNotes, focusHoleTextarea, holeHistory, harmonicaType, insertTokenAtCursor]);



  const handleClearHistory = () => {
    applyEdit({
      holeHistory: '',
      noteHistory: '',
      harmonicaType
    });
  };

  const handleHoleHistoryChange = (value: string) => {
    applyEdit({
      holeHistory: value,
      noteHistory: convertHoleToNotes(value),
      harmonicaType
    });
  };

  const handleNoteHistoryChange = (value: string) => {
    applyEdit({
      holeHistory,
      noteHistory: value,
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

  function convertHoleToNotes(holeText: string): string {
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
  }

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

  return (
    <Card className="w-full shadow-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-headline">
          {mode === 'edit' ? 'Edit Tab' : 'HarpTab Navigator'}
        </CardTitle>
        <CardDescription>
          {mode === 'edit' ? `Editing: ${tab?.title ?? 'tab'}` : 'Your interactive guide to the harmonica.'}
        </CardDescription>
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
                  <Textarea
                    ref={holeTextareaRef}
                    value={holeHistory}
                    onChange={(event) => handleHoleHistoryChange(event.target.value)}
                    placeholder={harmonicaType === 'diatonic' ? '+4 -4 +5' : '3 4 5'}
                    className="min-h-[180px] resize-y bg-background/50 font-mono text-sm md:text-base"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Edit the tab directly or keep using the harmonica diagram. Hole notation is the main synced source.
                  </p>
                  {invalidHoleTokens.length > 0 && (
                    <p className="mt-2 text-xs text-destructive">
                      Invalid tokens: {invalidHoleTokens.join(', ')}
                    </p>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-sm uppercase text-muted-foreground tracking-wider mb-2">Note Letters</h3>
                  <Textarea
                    value={noteHistory}
                    onChange={(event) => handleNoteHistoryChange(event.target.value)}
                    placeholder="C5 D5 E5"
                    className="min-h-[180px] resize-y bg-background/50 font-mono text-sm md:text-base"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Notes sync when hole notation changes, and can also be adjusted directly as plain text.
                  </p>
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
        editingTab={mode === 'edit' && tab ? {
          id: tab.id,
          title: tab.title,
          difficulty: tab.difficulty,
          genre: tab.genre,
          key: tab.key,
          harmonicaType: tab.harmonicaType,
          youtubeLink: tab.youtubeLink,
        } : null}
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
