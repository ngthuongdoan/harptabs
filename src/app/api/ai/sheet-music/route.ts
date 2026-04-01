import { NextResponse } from "next/server";

import { extractSheetMusicNotesFlow } from "@/ai/flows/sheet-music";
import {
  getSheetMusicRejectionMessage,
  hasUnsupportedSheetMusicWarning,
  SHEET_MUSIC_MAX_FILE_SIZE_BYTES,
} from "@/lib/sheet-music";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "An image file is required." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image uploads are supported in v1." },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "The uploaded image is empty." },
        { status: 400 }
      );
    }

    if (file.size > SHEET_MUSIC_MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "The uploaded image is too large. Please keep it under 5 MB." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const photoDataUri = `data:${file.type};base64,${base64}`;

    const result = await extractSheetMusicNotesFlow({
      photoDataUri,
      contentType: file.type,
      fileName: file.name || undefined,
    });

    if (hasUnsupportedSheetMusicWarning(result.warnings) || result.notes.length === 0) {
      return NextResponse.json(
        {
          error: getSheetMusicRejectionMessage(result.warnings),
          warnings: result.warnings,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      noteHistory: result.noteHistory,
      notes: result.notes,
      clef: result.clef,
      confidence: result.confidence,
      warnings: result.warnings,
    });
  } catch (error) {
    console.error("Sheet music parsing failed:", error);
    return NextResponse.json(
      { error: "Failed to parse the uploaded sheet music image." },
      { status: 500 }
    );
  }
}
