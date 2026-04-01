"use client";

import { useState } from "react";

import HarpNavigator, { type HarpNavigatorDraft } from "@/components/harp-workbench/harp-navigator";
import SheetMusicImportDialog from "@/components/tabs/editor/sheet-music-import-dialog";

export default function CreateTabPageClient() {
  const [draft, setDraft] = useState<HarpNavigatorDraft | undefined>(undefined);
  const [draftVersion, setDraftVersion] = useState(0);

  const handleImport = (noteHistory: string) => {
    setDraft({
      holeHistory: "",
      noteHistory,
      lyrics: "",
    });
    setDraftVersion((current) => current + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <SheetMusicImportDialog onImport={handleImport} />
      </div>
      <HarpNavigator draft={draft} draftVersion={draftVersion} />
    </div>
  );
}
