
"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import HarmonicaDiagram from './harmonica-diagram';
import { HARMONICA_KEYS, getHarmonicaLayout, findTabFromNote, generateNoteOptions, type HarmonicaKey, type Note, type HoleAction } from '@/lib/harmonica';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { CornerDownLeft, Trash2 } from 'lucide-react';

type Mode = "noteToTab" | "tabToNote";
type HistoryItem = { hole: string; note: string };

export default function HarpNavigator() {
  const [key, setKey] = useState<HarmonicaKey>('C');
  const [mode, setMode] = useState<Mode>("noteToTab");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedHoleInfo, setSelectedHoleInfo] = useState<{ hole: number; action: HoleAction } | null>(null);
  const [history, setHistory] = useState<HistoryItem[][]>([[]]);

  const layout = useMemo(() => getHarmonicaLayout(key), [key]);
  const noteOptions = useMemo(() => generateNoteOptions(), []);

  const handleKeyChange = (newKey: string) => {
    const validKey = newKey as HarmonicaKey;
    setKey(validKey);
    setSelectedNote(null);
    setSelectedHoleInfo(null);
    setHistory([[]]);
  };

  const handleNoteSelect = (note: Note) => {
    setSelectedNote(note);
    const tab = findTabFromNote(layout, note);
    setSelectedHoleInfo(tab);
    if (tab) {
        const displayString = `${tab.hole}`;
        addToHistory({hole: displayString, note});
    }
  };

  const handleHoleSelect = (hole: number, action: HoleAction) => {
    setSelectedHoleInfo({ hole, action });
    const note = layout[hole]?.note;
    setSelectedNote(note || null);
    
    if (note) {
        const displayString = `${hole}`;
        addToHistory({hole: displayString, note});
    }
  };
  
  const addToHistory = (item: HistoryItem) => {
      setHistory(prev => {
          const newHistory = [...prev];
          const lastLine = newHistory[newHistory.length - 1];
          lastLine.push(item);
          return newHistory;
      });
  };

  const handleNewLine = () => {
      setHistory(prev => {
          const lastLine = prev[prev.length - 1];
          if(lastLine.length > 0) {
            return [...prev, []];
          }
          return prev;
      });
  };

  const handleClearHistory = () => {
      setHistory([[]]);
  };

  const ResultDisplay = () => {
    if (mode === 'noteToTab' && selectedNote) {
      return (
        <div className="text-center">
          <p className="text-lg">Note: <span className="font-bold font-headline text-primary">{selectedNote}</span></p>
          <p className="text-lg">Tab: 
            {selectedHoleInfo ? (
              <span className="font-bold font-headline text-accent">{selectedHoleInfo.hole} {selectedHoleInfo.action}</span>
            ) : (
              <span className="text-muted-foreground"> (Not available on this harp)</span>
            )}
          </p>
        </div>
      );
    }
    if (mode === 'tabToNote' && selectedHoleInfo) {
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
    return <p className="text-center text-muted-foreground">Select a note or click on a harmonica hole.</p>;
  };
  
  return (
    <Card className="w-full shadow-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-headline">HarpTab Navigator</CardTitle>
        <CardDescription>Your interactive guide to the diatonic harmonica.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="flex flex-col gap-2">
                <Label htmlFor="key-select">Harmonica Key</Label>
                <Select value={key} onValueChange={handleKeyChange}>
                  <SelectTrigger id="key-select" className="w-full">
                    <SelectValue placeholder="Select Key" />
                  </SelectTrigger>
                  <SelectContent>
                    {HARMONICA_KEYS.map((k) => (
                      <SelectItem key={k} value={k}>Key of {k}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
            <div className="h-full flex items-end">
              <Tabs value={mode} onValueChange={(v) => {
                setMode(v as Mode);
                setSelectedNote(null);
                setSelectedHoleInfo(null);
              }} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="noteToTab">Note to Tab</TabsTrigger>
                  <TabsTrigger value="tabToNote">Tab to Note</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          
          <Separator />

          <div className="min-h-[80px] flex items-center justify-center p-4 bg-background/50 rounded-lg">
             {mode === 'noteToTab' ? (
                <div className="w-full flex flex-col gap-2">
                  <Label htmlFor="note-select">Select a Musical Note</Label>
                  <Select onValueChange={(v) => handleNoteSelect(v as Note)} value={selectedNote ?? undefined}>
                    <SelectTrigger id="note-select" className="w-full">
                      <SelectValue placeholder="Choose a note..." />
                    </SelectTrigger>
                    <SelectContent>
                      {noteOptions.map((n) => (
                        <SelectItem key={n} value={n}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <p className="text-center text-muted-foreground">Click on a hole in the diagram below to see the note.</p>
              )}
          </div>
          
          <HarmonicaDiagram 
            layout={layout}
            selectedHoleInfo={selectedHoleInfo}
            onHoleSelect={handleHoleSelect}
          />

          <Separator />

          <div className="flex flex-col gap-4">
              <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-lg font-medium">Tab History</CardTitle>
                      <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={handleNewLine}>
                              <CornerDownLeft className="h-4 w-4 mr-2" />
                              New Line
                          </Button>
                          <Button variant="destructive" size="sm" onClick={handleClearHistory} disabled={history.length === 1 && history[0].length === 0}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Clear
                          </Button>
                      </div>
                  </CardHeader>
                  <CardContent>
                      <div className="p-4 bg-background/50 rounded-lg min-h-[60px] text-lg font-mono">
                          {(history.length === 1 && history[0].length === 0) && (
                              <p className="text-muted-foreground text-sm">Your clicked tabs will appear here.</p>
                          )}
                          <div className="grid grid-cols-2 gap-8">
                            <div>
                                <h3 className="font-semibold text-sm uppercase text-muted-foreground tracking-wider mb-2">Hole</h3>
                                {history.map((line, lineIndex) => (
                                    <div key={`hole-line-${lineIndex}`} className="flex flex-wrap items-center min-h-[28px]">
                                        {line.map((item, itemIndex) => (
                                            <span key={`hole-item-${itemIndex}`} className="mr-4">{item.hole}</span>
                                        ))}
                                    </div>
                                ))}
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm uppercase text-muted-foreground tracking-wider mb-2">Note</h3>
                                {history.map((line, lineIndex) => (
                                    <div key={`note-line-${lineIndex}`} className="flex flex-wrap items-center min-h-[28px]">
                                        {line.map((item, itemIndex) => (
                                            <span key={`note-item-${itemIndex}`} className="mr-4">{item.note}</span>
                                        ))}
                                    </div>
                                ))}
                            </div>
                          </div>
                      </div>
                  </CardContent>
              </Card>
          </div>
          
          <Separator />
          
          <div className="min-h-[80px] flex items-center justify-center p-4 bg-background/50 rounded-lg">
            <ResultDisplay />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
