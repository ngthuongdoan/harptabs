"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import Script from "next/script";
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
import { useForm } from "@tanstack/react-form";
import { SavedTabsManager } from '@/lib/saved-tabs';
import { useToast } from '@/hooks/use-toast';
import { type HarmonicaType } from '@/lib/harmonica';
import { fetchMusicLookup, type MusicLookupResult } from "@/lib/music-lookup";

type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

type SaveTabFormValues = {
  musicTitle: string;
  singer: string;
  difficulty: DifficultyLevel | '';
  harmonicaType: HarmonicaType;
};

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
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [turnstileReady, setTurnstileReady] = useState(false);
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupResults, setLookupResults] = useState<MusicLookupResult[]>([]);
  const [selectedLookupIndex, setSelectedLookupIndex] = useState<number | null>(null);
  const captchaContainerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const lookupAbortRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  const requiresCaptcha = !editingTab;

  const getDefaultValues = useCallback(
    (): SaveTabFormValues => ({
      musicTitle: editingTab?.title ?? '',
      singer: '',
      difficulty: editingTab?.difficulty ?? '',
      harmonicaType: editingTab?.harmonicaType ?? harmonicaType
    }),
    [editingTab, harmonicaType]
  );

  const form = useForm({
    defaultValues: getDefaultValues(),
    onSubmit: async ({ value }) => {
      if (!value.musicTitle.trim()) {
        toast({
          title: "Error",
          description: "Please enter a music title for your tab.",
          variant: "destructive"
        });
        return;
      }

      if (!value.difficulty) {
        toast({
          title: "Error",
          description: "Please select a difficulty level.",
          variant: "destructive"
        });
        return;
      }

      if (!value.harmonicaType) {
        toast({
          title: "Error",
          description: "Please select a harmonica type.",
          variant: "destructive"
        });
        return;
      }

      if (requiresCaptcha && !captchaToken) {
        toast({
          title: "Error",
          description: "Please complete the captcha.",
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

      try {
        let result;
        if (editingTab) {
          result = await SavedTabsManager.updateTab(
            editingTab.id,
            value.musicTitle.trim(),
            holeHistory,
            noteHistory,
            value.harmonicaType,
            value.difficulty
          );
        } else {
          result = await SavedTabsManager.saveTab(
            value.musicTitle.trim(),
            holeHistory,
            noteHistory,
            value.harmonicaType,
            value.difficulty,
            '',
            '',
            captchaToken
          );
        }

        if (result) {
          toast({
            title: "Success",
            description: editingTab ? "Tab updated successfully!" : "Tab saved successfully!"
          });
          handleClose();
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
      }
    }
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    form.reset(getDefaultValues());
    setLookupResults([]);
    setSelectedLookupIndex(null);
    setLookupError(null);
    setCaptchaToken(null);
    setCaptchaError(null);
  }, [form, getDefaultValues, open]);

  useEffect(() => {
    return () => {
      lookupAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const turnstile = (window as Window & { turnstile?: { render: (container: HTMLElement, options: Record<string, unknown>) => string; remove: (widgetId: string) => void; } }).turnstile;
    if (!open || !requiresCaptcha) {
      if (widgetIdRef.current && turnstile) {
        turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
      setCaptchaToken(null);
      return;
    }

    if (!turnstileSiteKey) {
      setCaptchaError('Captcha is not configured.');
      return;
    }

    if (!turnstile || !turnstileReady || !captchaContainerRef.current || widgetIdRef.current) {
      return;
    }

    widgetIdRef.current = turnstile.render(captchaContainerRef.current, {
      sitekey: turnstileSiteKey,
      callback: (token: string) => {
        setCaptchaToken(token);
        setCaptchaError(null);
      },
      'expired-callback': () => setCaptchaToken(null),
      'error-callback': () => {
        setCaptchaToken(null);
        setCaptchaError('Captcha verification failed. Please try again.');
      }
    });
  }, [open, requiresCaptcha, turnstileReady, turnstileSiteKey]);

  const handleClose = () => {
    if (!editingTab) {
      form.reset(getDefaultValues());
    }
    setLookupResults([]);
    setSelectedLookupIndex(null);
    setLookupError(null);
    if (!editingTab) {
      setCaptchaToken(null);
    }
    onOpenChange(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }
    handleClose();
  };

  const handleLookup = async () => {
    const { musicTitle, singer } = form.state.values;
    const trimmedTitle = musicTitle.trim();
    const trimmedSinger = singer.trim();

    if (!trimmedTitle || !trimmedSinger) {
      toast({
        title: "Missing info",
        description: "Enter both a music title and singer to look it up.",
        variant: "destructive"
      });
      return;
    }

    lookupAbortRef.current?.abort();
    const controller = new AbortController();
    lookupAbortRef.current = controller;

    setIsLookupLoading(true);
    setLookupError(null);
    setSelectedLookupIndex(null);
    setLookupResults([]);

    try {
      const response = await fetchMusicLookup(
        { title: trimmedTitle, artist: trimmedSinger },
        { signal: controller.signal }
      );

      setLookupResults(response.results);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setLookupError("Music lookup failed. Please try again.");
      }
    } finally {
      setIsLookupLoading(false);
    }
  };

  const handleSelectLookupResult = (result: MusicLookupResult, index: number) => {
    setSelectedLookupIndex(index);
    if (result.title) {
      form.setFieldValue('musicTitle', result.title);
    }
    if (result.artist) {
      form.setFieldValue('singer', result.artist);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        {requiresCaptcha && (
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            async
            defer
            onLoad={() => setTurnstileReady(true)}
          />
        )}
        <DialogHeader>
          <DialogTitle>
            {editingTab ? 'Update Tab' : 'Save Tab'}
          </DialogTitle>
          <DialogDescription>
            {editingTab
              ? 'Update your harmonica tab with a new music title or content.'
              : 'Use the music title as your tab title when saving.'
            }
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="music-title" className="text-right">
                Music Title
              </Label>
              <form.Field
                name="musicTitle"
                children={(field) => (
                  <Input
                    id="music-title"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Song name for lookup"
                    className="col-span-3"
                    autoFocus
                  />
                )}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="singer" className="text-right">
                Singer
              </Label>
              <div className="col-span-3 flex gap-2">
                <form.Field
                  name="singer"
                  children={(field) => (
                    <Input
                      id="singer"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Artist name"
                    />
                  )}
                />
                <Button type="button" variant="secondary" onClick={handleLookup} disabled={isLookupLoading}>
                  {isLookupLoading ? "Looking..." : "Lookup"}
                </Button>
              </div>
            </div>
            {(lookupError || lookupResults.length > 0) && (
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-right text-xs text-muted-foreground">Lookup</span>
                <div className="col-span-3 text-xs">
                  {lookupError && <p className="text-destructive">{lookupError}</p>}
                  {!lookupError && lookupResults.length > 0 && (
                    <p className="text-muted-foreground">Select the correct result below.</p>
                  )}
                </div>
              </div>
            )}
            {lookupResults.length > 0 && (
              <div className="grid grid-cols-4 gap-4">
                <span className="text-right text-xs text-muted-foreground pt-2">Results</span>
                <div className="col-span-3 space-y-2">
                  {lookupResults.map((result, index) => {
                    const isSelected = selectedLookupIndex === index;
                    return (
                      <button
                        key={`${result.title ?? 'title'}-${result.artist ?? 'artist'}-${index}`}
                        type="button"
                        onClick={() => handleSelectLookupResult(result, index)}
                        className={`w-full rounded-md border px-3 py-2 text-left text-sm transition ${isSelected ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          {result.image ? (
                            <img
                              src={result.image}
                              alt={result.title ?? "Album artwork"}
                              className="h-10 w-10 rounded object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-muted" />
                          )}
                          <div>
                            <p className="font-medium">{result.title ?? "Unknown title"}</p>
                            <p className="text-xs text-muted-foreground">{result.artist ?? "Unknown artist"}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="difficulty" className="text-right">
                Difficulty
              </Label>
              <form.Field
                name="difficulty"
                children={(field) => (
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value as DifficultyLevel)}
                  >
                    <SelectTrigger id="difficulty" className="col-span-3">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="harmonica-type" className="text-right">
                Harmonica Type
              </Label>
              <form.Field
                name="harmonicaType"
                children={(field) => (
                  <Select value={field.state.value} onValueChange={(value) => field.handleChange(value as HarmonicaType)}>
                    <SelectTrigger id="harmonica-type" className="col-span-3">
                      <SelectValue placeholder="Select harmonica type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tremolo">Tremolo (24-hole)</SelectItem>
                      <SelectItem value="diatonic">Diatonic (10-hole)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            {requiresCaptcha && (
              <div className="space-y-2 overflow-hidden">
                <div ref={captchaContainerRef} />
                {captchaError && (
                  <p className="text-xs text-destructive">{captchaError}</p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <form.Subscribe
              selector={(state) => ({
                values: state.values,
                isSubmitting: state.isSubmitting
              })}
              children={({ values, isSubmitting }) => {
                const isFormValid = Boolean(
                  values.musicTitle.trim()
                  && values.difficulty
                  && values.harmonicaType
                  && (!requiresCaptcha || captchaToken)
                );

                return (
                  <div className="flex flex-col w-full gap-2">
                    <Button type="submit" disabled={isSubmitting || !isFormValid}>
                      {isSubmitting ? 'Saving...' : (editingTab ? 'Update' : 'Save')}
                    </Button>
                    <Button variant="outline" type="button" onClick={handleClose} disabled={isSubmitting}>
                      Cancel
                    </Button>
                  </div>
                );
              }}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
