import { ScrollArea } from "@/components/ui/scroll-area";

interface TabContentViewProps {
  holeHistory: string;
  noteHistory: string;
  lyrics?: string;
  className?: string;
  height?: string;
  previewMode?: boolean;
  viewMode?: "simple" | "detail";
}

interface TabLineGroup {
  holeLine: string;
  noteLine: string;
  lyricLine: string;
}

function getTabLineGroups(holeHistory: string, noteHistory: string, lyrics?: string): TabLineGroup[] {
  const holeLines = (holeHistory || "").split("\n");
  const noteLines = (noteHistory || "").split("\n");
  const lyricLines = (lyrics || "").split("\n");
  const maxLines = Math.max(holeLines.length, noteLines.length);

  if (maxLines === 0) {
    return [];
  }

  return Array.from({ length: maxLines }, (_, index) => ({
    holeLine: holeLines[index] ?? "",
    noteLine: noteLines[index] ?? "",
    lyricLine: lyricLines[index] ?? "",
  }));
}

export function TabContentView({
  holeHistory,
  noteHistory,
  lyrics = "",
  className = "",
  height = "h-32",
  previewMode = false,
  viewMode = "simple",
}: TabContentViewProps) {
  if (previewMode) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
        <div>
          <h3 className="font-semibold text-sm uppercase text-muted-foreground tracking-wider mb-2">
            Hole Numbers
          </h3>
          <ScrollArea className={height}>
            <pre className="p-2 bg-background/50 rounded-lg text-sm font-mono whitespace-nowrap overflow-x-auto">
              {holeHistory?.split("\n")[0] || "No content"}
            </pre>
          </ScrollArea>
        </div>
        <div>
          <h3 className="font-semibold text-sm uppercase text-muted-foreground tracking-wider mb-2">
            Note Letters
          </h3>
          <ScrollArea className={height}>
            <pre className="p-2 bg-background/50 rounded-lg text-sm font-mono whitespace-nowrap overflow-x-auto">
              {noteHistory?.split("\n")[0] || "No content"}
            </pre>
          </ScrollArea>
        </div>
        {lyrics && (
          <div>
            <h3 className="font-semibold text-sm uppercase text-muted-foreground tracking-wider mb-2">
              Lyrics
            </h3>
            <ScrollArea className={height}>
              <div className="p-2 bg-background/50 rounded-lg text-sm whitespace-pre-wrap">
                {lyrics.split("\n")[0]}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    );
  }

  if (viewMode === "simple") {
    return (
      <ScrollArea className={`${height} ${className}`}>
        {holeHistory ? (
          <pre className="rounded-xl border border-border/60 bg-background/40 p-3 whitespace-pre-wrap break-words font-mono text-sm">
            {holeHistory}
          </pre>
        ) : (
          <div className="rounded-lg border border-dashed border-border/70 bg-background/40 p-4 text-sm text-muted-foreground">
            No content
          </div>
        )}
      </ScrollArea>
    );
  }

  const lineGroups = getTabLineGroups(holeHistory, noteHistory, lyrics);

  return (
    <ScrollArea className={`${height} ${className}`}>
      <div className="space-y-3">
        {lineGroups.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/70 bg-background/40 p-4 text-sm text-muted-foreground">
            No content
          </div>
        ) : (
          lineGroups.map((group, index) => (
            <div
              key={`${index}-${group.holeLine}-${group.noteLine}-${group.lyricLine}`}
              className="rounded-xl border border-border/60 bg-background/40 p-3"
            >
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,1fr)]">
                <div>
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Hole Numbers
                  </h3>
                  <pre className="whitespace-pre-wrap break-words font-mono text-sm">
                    {group.holeLine || " "}
                  </pre>
                </div>
                <div>
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Note Letters
                  </h3>
                  <pre className="whitespace-pre-wrap break-words font-mono text-sm">
                    {group.noteLine || " "}
                  </pre>
                </div>
                {group.lyricLine && (
                  <div>
                    <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Lyrics
                    </h3>
                    <div className="whitespace-pre-wrap break-words text-sm leading-6">
                      {group.lyricLine}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
}

interface TabPreviewProps {
  holeHistory: string;
  height?: string;
}

export function TabPreview({ holeHistory, height = "h-20" }: TabPreviewProps) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground mb-1">Preview:</p>
      <ScrollArea className={height}>
        <pre className="text-xs font-mono bg-background/50 p-2 rounded">
          {holeHistory.split('\n')[0] || 'No content'}
        </pre>
      </ScrollArea>
    </div>
  );
}
