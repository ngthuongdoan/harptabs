"use client";

import { useMemo, useRef, useState } from "react";
import { AlertCircle, Loader2, Music2, Upload } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  normalizeNoteHistory,
  SHEET_MUSIC_MAX_FILE_SIZE_BYTES,
  type SheetMusicConfidence,
  type SheetMusicClef,
} from "@/lib/sheet-music";

type SheetMusicImportResponse = {
  noteHistory: string;
  notes: string[];
  clef: SheetMusicClef;
  confidence: SheetMusicConfidence;
  warnings: string[];
};

interface SheetMusicImportDialogProps {
  onImport: (noteHistory: string) => void;
}

const CONFIDENCE_VARIANTS: Record<SheetMusicConfidence, "default" | "secondary" | "destructive"> = {
  high: "default",
  medium: "secondary",
  low: "destructive",
};

export default function SheetMusicImportDialog({ onImport }: SheetMusicImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [result, setResult] = useState<SheetMusicImportResponse | null>(null);
  const [reviewedNoteHistory, setReviewedNoteHistory] = useState("");

  const noteCount = useMemo(() => {
    if (!reviewedNoteHistory.trim()) return 0;
    return normalizeNoteHistory(reviewedNoteHistory)
      .split(/\s+/)
      .filter(Boolean).length;
  }, [reviewedNoteHistory]);

  const resetState = () => {
    setFile(null);
    setError(null);
    setWarnings([]);
    setResult(null);
    setReviewedNoteHistory("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetState();
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError("Choose a sheet music image first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsAnalyzing(true);
    setError(null);
    setWarnings([]);

    try {
      const response = await fetch("/api/ai/sheet-music", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(typeof payload?.error === "string" ? payload.error : "Unable to parse this image.");
        setWarnings(Array.isArray(payload?.warnings) ? payload.warnings : []);
        setResult(null);
        setReviewedNoteHistory("");
        return;
      }

      setResult(payload);
      setWarnings(Array.isArray(payload?.warnings) ? payload.warnings : []);
      setReviewedNoteHistory(payload.noteHistory ?? "");
    } catch (fetchError) {
      setError("The upload failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLoadIntoEditor = () => {
    const normalized = normalizeNoteHistory(reviewedNoteHistory);

    if (!normalized) {
      setError("Add at least one note before importing.");
      return;
    }

    onImport(normalized);
    toast({
      title: "Notes loaded into editor",
      description: "Review and continue editing in the note panel.",
    });
    setOpen(false);
    resetState();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Music2 className="mr-2 h-4 w-4" />
          Import Sheet Music
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Sheet Music</DialogTitle>
          <DialogDescription>
            Upload one clear photo or screenshot of a single melody line. v1 reads pitch names only.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-dashed border-border p-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const nextFile = event.target.files?.[0] ?? null;
                setFile(nextFile);
                setError(null);
                setWarnings([]);
                setResult(null);
                setReviewedNoteHistory("");
              }}
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{file?.name ?? "No image selected"}</p>
                <p className="text-sm text-muted-foreground">
                  JPG, PNG, WebP. Max {(SHEET_MUSIC_MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(0)} MB.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Choose Image
                </Button>
                <Button type="button" onClick={handleAnalyze} disabled={!file || isAnalyzing}>
                  {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Analyze
                </Button>
              </div>
            </div>
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Import failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {result ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={CONFIDENCE_VARIANTS[result.confidence]}>
                  Confidence: {result.confidence}
                </Badge>
                <Badge variant="outline">Clef: {result.clef}</Badge>
                <Badge variant="outline">{noteCount} note{noteCount === 1 ? "" : "s"}</Badge>
              </div>

              {warnings.length > 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Review warnings</AlertTitle>
                  <AlertDescription>{warnings.join(" ")}</AlertDescription>
                </Alert>
              ) : null}

              <div className="space-y-2">
                <p className="text-sm font-medium">Review extracted notes before loading</p>
                <Textarea
                  value={reviewedNoteHistory}
                  onChange={(event) => setReviewedNoteHistory(event.target.value)}
                  placeholder="C4 D4 E4"
                  className="min-h-[180px] font-mono"
                />
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleLoadIntoEditor}
            disabled={!result || !reviewedNoteHistory.trim()}
          >
            Load into Editor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
