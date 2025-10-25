"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import HarmonicaDiagram from './harmonica-diagram';
import { HARMONICA_KEYS, getHarmonicaLayout, findTabFromNote, generateNoteOptions, type HarmonicaKey, type Note, type HoleAction } from '@/lib/harmonica';
import { Separator } from './ui/separator';

type Mode = "noteToTab" | "tabToNote";

export default function HarpNavigator() {
  const [key, setKey] = useState<HarmonicaKey>('C');
  const [mode, setMode] = useState<Mode>("noteToTab");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedHoleInfo, setSelectedHoleInfo] = useState<{ hole: number; action: HoleAction } | null>(null);

  const layout = useMemo(() => getHarmonicaLayout(key), [key]);
  const noteOptions = useMemo(() => generateNoteOptions(), []);

  const handleKeyChange = (newKey: string) => {
    const validKey = newKey as HarmonicaKey;
    setKey(validKey);
    setSelectedNote(null);
    setSelectedHoleInfo(null);
  };

  const handleNoteSelect = (note: Note) => {
    setSelectedNote(note);
    const tab = findTabFromNote(layout, note);
    setSelectedHoleInfo(tab);
  };

  const handleHoleSelect = (hole: number, action: HoleAction) => {
    setSelectedHoleInfo({ hole, action });
    const note = layout[hole]?.note;
    setSelectedNote(note || null);
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
    <Card className="w-full max-w-7xl shadow-2xl">
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
                  <Select onValueChange={handleNoteSelect} value={selectedNote ?? undefined}>
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
          
          <div className="min-h-[80px] flex items-center justify-center p-4 bg-background/50 rounded-lg">
            <ResultDisplay />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
