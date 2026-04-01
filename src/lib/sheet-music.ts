import { z } from "zod";

export const SHEET_MUSIC_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export const sheetMusicClefSchema = z.enum(["treble", "bass", "unknown"]);
export const sheetMusicConfidenceSchema = z.enum(["high", "medium", "low"]);

export const sheetMusicParseSchema = z.object({
  noteHistory: z.string(),
  notes: z.array(z.string()),
  clef: sheetMusicClefSchema,
  confidence: sheetMusicConfidenceSchema,
  warnings: z.array(z.string()),
});

export type SheetMusicParseResult = z.infer<typeof sheetMusicParseSchema>;
export type SheetMusicClef = z.infer<typeof sheetMusicClefSchema>;
export type SheetMusicConfidence = z.infer<typeof sheetMusicConfidenceSchema>;

export const SHEET_MUSIC_WARNING_TAGS = {
  multiStaff: "UNSUPPORTED_MULTISTAFF",
  polyphony: "UNSUPPORTED_POLYPHONY",
  unreadable: "UNREADABLE_IMAGE",
  unknownClef: "UNKNOWN_CLEF",
} as const;

const SHARP_SCALE = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const NATURAL_INDEX: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

const NOTE_TOKEN_PATTERN = /^([A-Ga-g])([#b♯♭]?)(-?\d+)$/;

function normalizeWhitespace(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n");
}

export function normalizeNoteToken(token: string): string {
  const trimmed = token.trim();
  const match = trimmed.match(NOTE_TOKEN_PATTERN);

  if (!match) {
    return trimmed;
  }

  const [, rawLetter, rawAccidental, rawOctave] = match;
  const letter = rawLetter.toUpperCase();
  const accidental = rawAccidental.replace("♯", "#").replace("♭", "b");
  let octave = Number.parseInt(rawOctave, 10);
  let noteIndex = NATURAL_INDEX[letter];

  if (accidental === "#") {
    noteIndex += 1;
  } else if (accidental === "b") {
    noteIndex -= 1;
  }

  while (noteIndex < 0) {
    noteIndex += 12;
    octave -= 1;
  }

  while (noteIndex > 11) {
    noteIndex -= 12;
    octave += 1;
  }

  return `${SHARP_SCALE[noteIndex]}${octave}`;
}

export function normalizeNoteHistory(noteHistory: string): string {
  return normalizeWhitespace(noteHistory)
    .split("\n")
    .map((line) =>
      line
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(normalizeNoteToken)
        .join(" ")
    )
    .join("\n")
    .trim();
}

export function extractNormalizedNotes(noteHistory: string): string[] {
  return normalizeNoteHistory(noteHistory)
    .split(/\s+/)
    .filter((token) => NOTE_TOKEN_PATTERN.test(token));
}

export function dedupeWarnings(warnings: string[]): string[] {
  return Array.from(
    new Set(
      warnings
        .map((warning) => warning.trim())
        .filter(Boolean)
    )
  );
}

export function hasUnsupportedSheetMusicWarning(warnings: string[]): boolean {
  return warnings.some(
    (warning) =>
      warning.includes(SHEET_MUSIC_WARNING_TAGS.multiStaff) ||
      warning.includes(SHEET_MUSIC_WARNING_TAGS.polyphony) ||
      warning.includes(SHEET_MUSIC_WARNING_TAGS.unreadable)
  );
}

export function getSheetMusicRejectionMessage(warnings: string[]): string {
  if (warnings.some((warning) => warning.includes(SHEET_MUSIC_WARNING_TAGS.multiStaff))) {
    return "This image appears to contain multiple staves or lines. v1 only supports one melody line at a time.";
  }

  if (warnings.some((warning) => warning.includes(SHEET_MUSIC_WARNING_TAGS.polyphony))) {
    return "This image appears to contain chords or multiple simultaneous notes. v1 only supports a single-note melody.";
  }

  if (warnings.some((warning) => warning.includes(SHEET_MUSIC_WARNING_TAGS.unreadable))) {
    return "The image could not be read reliably. Try a clearer, closer photo or screenshot.";
  }

  return "The uploaded sheet music could not be parsed reliably.";
}
