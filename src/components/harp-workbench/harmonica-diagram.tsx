import { cn } from "@/lib/utils";
import { type HarmonicaLayout, type HoleAction, isDiatonicLayout, isTremoloLayout, type DiatonicLayout, type TremoloLayout } from "@/lib/harmonica";

type HarmonicaDiagramProps = {
  layout: HarmonicaLayout;
  selectedHoleInfo: { hole: number; action: HoleAction } | null;
  onHoleSelect?: (hole: number, action: HoleAction) => void;
};

export default function HarmonicaDiagram({ layout, selectedHoleInfo, onHoleSelect }: HarmonicaDiagramProps) {
  const holes = Object.keys(layout).map(Number).sort((a, b) => a - b);

  const formatNote = (note: string) => {
    const noteName = note.replace(/\d/g, '');
    const octave = note.match(/\d/);
    return (
      <>
        {noteName}
        {octave && <sub className="text-[9px] opacity-60">{octave}</sub>}
      </>
    );
  };

  // Render diatonic harmonica (10 holes, blow and draw per hole)
  if (isDiatonicLayout(layout)) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex flex-col gap-3 p-4 rounded-xl border-2 border-primary/30 bg-gradient-to-b from-card to-background shadow-lg">
          {/* Header */}
          <div className="text-center">
            <h3 className="text-sm font-semibold text-muted-foreground">10-Hole Diatonic Harmonica (Key of C)</h3>
          </div>

          {/* Harmonica body */}
          <div className="flex gap-1 p-3 rounded-lg bg-gradient-to-b from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-800 shadow-inner border border-slate-400 dark:border-slate-600">
            {holes.map((holeNumber) => {
              const holeInfo = layout[holeNumber];
              const isBlowSelected = selectedHoleInfo?.hole === holeNumber && selectedHoleInfo?.action === 'blow';
              const isDrawSelected = selectedHoleInfo?.hole === holeNumber && selectedHoleInfo?.action === 'draw';
              const isClickable = !!onHoleSelect;

              return (
                <div key={`hole-${holeNumber}`} className="flex-1 flex flex-col gap-0.5">
                  {/* Blow note (top) */}
                  <div
                    onClick={() => onHoleSelect?.(holeNumber, 'blow')}
                    className={cn(
                      "relative flex items-center justify-center h-12 rounded-t-md border border-primary/30 bg-gradient-to-b from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40 transition-all duration-200",
                      isClickable && "cursor-pointer hover:from-amber-200 hover:to-amber-300 dark:hover:from-amber-800/60 dark:hover:to-amber-700/60",
                      isBlowSelected && "ring-2 ring-primary shadow-lg scale-105 z-10 bg-primary/20"
                    )}
                    aria-label={`Hole ${holeNumber} blow: ${holeInfo.blow}`}
                    title={`Blow: ${holeInfo.blow}`}
                  >
                    <span className="font-bold text-base">
                      {formatNote(holeInfo.blow)}
                    </span>
                    <span className="absolute top-0.5 right-1 text-[8px] opacity-40">↑</span>
                  </div>

                  {/* Hole divider/body */}
                  <div className="h-8 bg-gradient-to-b from-slate-500 to-slate-600 dark:from-slate-600 dark:to-slate-700 rounded-sm border-x border-slate-600 dark:border-slate-500 flex items-center justify-center shadow-inner">
                    <span className="text-xs font-bold text-white drop-shadow-md">{holeNumber}</span>
                  </div>

                  {/* Draw note (bottom) */}
                  <div
                    onClick={() => onHoleSelect?.(holeNumber, 'draw')}
                    className={cn(
                      "relative flex items-center justify-center h-12 rounded-b-md border border-primary/30 bg-gradient-to-b from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 transition-all duration-200",
                      isClickable && "cursor-pointer hover:from-blue-200 hover:to-blue-300 dark:hover:from-blue-800/60 dark:hover:to-blue-700/60",
                      isDrawSelected && "ring-2 ring-primary shadow-lg scale-105 z-10 bg-primary/20"
                    )}
                    aria-label={`Hole ${holeNumber} draw: ${holeInfo.draw}`}
                    title={`Draw: ${holeInfo.draw}`}
                  >
                    <span className="font-bold text-base">
                      {formatNote(holeInfo.draw)}
                    </span>
                    <span className="absolute bottom-0.5 right-1 text-[8px] opacity-40">↓</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-b from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40 border border-primary/30"></div>
              <span>Blow (exhale) ↑</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-b from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 border border-primary/30"></div>
              <span>Draw (inhale) ↓</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render tremolo harmonica (24 holes, single action per hole)
  if (isTremoloLayout(layout)) {
    const holeWidth = `min-w-[2.5rem] w-full`;

    return (
      <div className="w-full">
        <div className="flex flex-col gap-3 p-4 rounded-xl border-2 border-primary/30 bg-gradient-to-b from-card to-background shadow-lg">
          <div className="text-center">
            <h3 className="text-sm font-semibold text-muted-foreground">24-Hole Tremolo Harmonica (Key of C)</h3>
          </div>

          <div className="flex rounded-lg border-2 border-primary/50 bg-gradient-to-b from-card to-background shadow-inner bg-primary/20 p-1 gap-1 overflow-x-auto">
            {holes.map((holeNumber) => {
              const holeInfo = layout[holeNumber];
              const isSelected = selectedHoleInfo?.hole === holeNumber && selectedHoleInfo?.action === holeInfo.action;
              const isClickable = !!onHoleSelect;
              const bgColor = holeInfo.action === 'blow'
                ? 'bg-amber-50 dark:bg-amber-950/30'
                : 'bg-blue-50 dark:bg-blue-950/30';
              const hoverColor = 'group-hover:bg-accent/20';
              const selectedColor = 'bg-accent text-accent-foreground scale-105 shadow-lg z-10';

              return (
                <div key={`hole-${holeNumber}`} className={cn("flex flex-col items-center group", holeWidth)}>
                  <div
                    onClick={() => onHoleSelect?.(holeNumber, holeInfo.action)}
                    className={cn(
                      "relative flex items-center justify-center w-full h-16 rounded-md border border-primary/30 transition-all duration-300",
                      bgColor,
                      isClickable && `cursor-pointer ${hoverColor}`,
                      isSelected && selectedColor
                    )}
                    aria-label={`Hole ${holeNumber} ${holeInfo.action}: ${holeInfo.note}`}
                  >
                    <span className="absolute top-1 left-1 text-[10px] font-bold opacity-70 font-headline">{holeNumber}</span>
                    <span className="font-bold font-headline text-lg">
                      {formatNote(holeInfo.note)}
                    </span>
                    <span className="absolute bottom-1 text-[10px] opacity-50">{holeInfo.action === 'blow' ? '↑' : '↓'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
