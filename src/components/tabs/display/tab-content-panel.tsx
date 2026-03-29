"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TabContentView } from "@/components/tabs/display/tab-content-view";

interface TabContentPanelProps {
  holeHistory: string;
  noteHistory: string;
  lyrics?: string;
  className?: string;
  height?: string;
  defaultViewMode?: "simple" | "detail";
}

export function TabContentPanel({
  holeHistory,
  noteHistory,
  lyrics = "",
  className = "",
  height,
  defaultViewMode = "simple",
}: TabContentPanelProps) {
  const [viewMode, setViewMode] = useState<"simple" | "detail">(defaultViewMode);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs md:text-sm text-muted-foreground">Mode:</span>
        <Button
          variant={viewMode === "simple" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("simple")}
        >
          Simple
        </Button>
        <Button
          variant={viewMode === "detail" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("detail")}
        >
          Detail
        </Button>
      </div>

      <TabContentView
        holeHistory={holeHistory}
        noteHistory={noteHistory}
        lyrics={lyrics}
        className={className}
        height={height}
        viewMode={viewMode}
      />
    </div>
  );
}
