import { ScrollArea } from "@/components/ui/scroll-area";

interface TabContentViewProps {
  holeHistory: string;
  noteHistory: string;
  className?: string;
  height?: string;
  previewMode?: boolean;
}

export function TabContentView({
  holeHistory,
  noteHistory,
  className = "",
  height = "h-32",
  previewMode = false
}: TabContentViewProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      <div>
        <h3 className="font-semibold text-sm uppercase text-muted-foreground tracking-wider mb-2">
          Hole Numbers
        </h3>
        <ScrollArea className={height}>
          <pre className={`p-2 bg-background/50 rounded-lg text-sm font-mono ${previewMode ? 'whitespace-nowrap overflow-x-auto' : 'whitespace-pre-wrap'
            }`}>
            {previewMode ? (holeHistory?.split('\n')[0] || 'No content') : (holeHistory || 'No content')}
          </pre>
        </ScrollArea>
      </div>
      <div>
        <h3 className="font-semibold text-sm uppercase text-muted-foreground tracking-wider mb-2">
          Note Letters
        </h3>
        <ScrollArea className={height}>
          <pre className={`p-2 bg-background/50 rounded-lg text-sm font-mono ${previewMode ? 'whitespace-nowrap overflow-x-auto' : 'whitespace-pre-wrap'
            }`}>
            {previewMode ? (noteHistory?.split('\n')[0] || 'No content') : (noteHistory || 'No content')}
          </pre>
        </ScrollArea>
      </div>
    </div>
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
