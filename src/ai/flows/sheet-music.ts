import { z } from "genkit";

import { ai } from "@/ai/genkit";
import {
  dedupeWarnings,
  extractNormalizedNotes,
  normalizeNoteHistory,
  sheetMusicParseSchema,
  SHEET_MUSIC_WARNING_TAGS,
} from "@/lib/sheet-music";

const sheetMusicParseInputSchema = z.object({
  photoDataUri: z.string(),
  contentType: z.string(),
  fileName: z.string().optional(),
});

export const extractSheetMusicNotesFlow = ai.defineFlow(
  {
    name: "extractSheetMusicNotesFlow",
    inputSchema: sheetMusicParseInputSchema,
    outputSchema: sheetMusicParseSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      system: `You read photographed or screenshotted sheet music and extract only pitch names with octave numbers.

Strict rules:
- Support only a single melodic line from one visible staff at a time.
- Reject chords, polyphony, grand staff piano layouts, ensemble scores, and multiple simultaneous voices.
- Extract pitch names only, such as C4, D#4, Bb3. Do not include durations, rests, barlines, lyrics, fingerings, or commentary.
- If you see flats, you may output flats, but keep octave numbers.
- Do not guess hidden, blurry, cropped, or ambiguous notes.
- If the image is unsupported or unreadable, return an empty note list and add one or more warning tags:
  - ${SHEET_MUSIC_WARNING_TAGS.multiStaff}
  - ${SHEET_MUSIC_WARNING_TAGS.polyphony}
  - ${SHEET_MUSIC_WARNING_TAGS.unreadable}
  - ${SHEET_MUSIC_WARNING_TAGS.unknownClef}
- Keep warnings short and actionable.
- noteHistory should be notes separated by spaces, with line breaks only if the melody clearly spans multiple visual lines of the same single staff.`,
      prompt: [
        {
          media: {
            url: input.photoDataUri,
            contentType: input.contentType,
          },
        },
        {
          text: `Extract the melody notes from this sheet music image. File name: ${input.fileName ?? "unknown"}`,
        },
      ],
      output: {
        schema: sheetMusicParseSchema,
      },
    });

    if (!output) {
      throw new Error("The model did not return structured output.");
    }

    const normalizedNoteHistory = normalizeNoteHistory(
      output.noteHistory || output.notes.join(" ")
    );
    const normalizedNotes = extractNormalizedNotes(normalizedNoteHistory);
    const warnings = dedupeWarnings(output.warnings);

    return {
      noteHistory: normalizedNoteHistory,
      notes: normalizedNotes,
      clef: output.clef,
      confidence:
        normalizedNotes.length > 0
          ? output.confidence
          : "low",
      warnings:
        normalizedNotes.length > 0
          ? warnings
          : dedupeWarnings([
              ...warnings,
              SHEET_MUSIC_WARNING_TAGS.unreadable,
            ]),
    };
  }
);
