"use client";

import { useState } from "react";

import HarpNavigator, { type HarpNavigatorDraft } from "@/components/harp-workbench/harp-navigator";
import SheetMusicImportDialog from "@/components/tabs/editor/sheet-music-import-dialog";
import { useAdmin } from '@/contexts/admin-context';

export default function CreateTabPageClient() {
  const [draft, setDraft] = useState<HarpNavigatorDraft | undefined>(undefined);
  const [draftVersion, setDraftVersion] = useState(0);
  const { isAdmin } = useAdmin();

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
      {isAdmin &&
        <div className="flex justify-end">
          <SheetMusicImportDialog onImport={handleImport} />
        </div>
      }
      <HarpNavigator draft={draft} draftVersion={draftVersion} />
    </div>
  );
}
