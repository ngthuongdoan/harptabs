import { cn } from "@/lib/utils";
import { type HarmonicaLayout, type HoleAction } from "@/lib/harmonica";

type HarmonicaDiagramProps = {
  layout: HarmonicaLayout;
  selectedHoleInfo: { hole: number; action: HoleAction } | null;
  onHoleSelect?: (hole: number, action: HoleAction) => void;
};

export default function HarmonicaDiagram({ layout, selectedHoleInfo, onHoleSelect }: HarmonicaDiagramProps) {
  const holes = Object.keys(layout).map(Number).sort((a, b) => a - b);

  return (
    <div className="flex flex-col rounded-lg border-2 border-primary/50 bg-gradient-to-b from-card to-background shadow-inner p-2 gap-1">
      <div className="flex justify-around w-full">
        {holes.map((holeNumber) => (
          <div key={`hole-num-${holeNumber}`} className="w-full text-center font-bold text-sm text-foreground/80 font-headline">
            {holeNumber}
          </div>
        ))}
      </div>
      <div className="flex justify-between w-full bg-primary/20 rounded-md p-1 gap-1">
        {holes.map((holeNumber) => {
          const isBlowSelected = selectedHoleInfo?.hole === holeNumber && selectedHoleInfo?.action === 'blow';
          const isDrawSelected = selectedHoleInfo?.hole === holeNumber && selectedHoleInfo?.action === 'draw';
          const isClickable = !!onHoleSelect;

          return (
            <div key={`hole-${holeNumber}`} className="flex flex-col items-center w-full gap-px group">
              {/* Blow Hole */}
              <div
                onClick={() => onHoleSelect?.(holeNumber, 'blow')}
                className={cn(
                  "relative flex items-center justify-center w-full h-12 rounded-t-md bg-card border-x border-t border-primary/30 transition-all duration-300",
                  isClickable && "cursor-pointer group-hover:bg-accent/20",
                  isBlowSelected && "bg-accent text-accent-foreground scale-105 shadow-lg z-10"
                )}
                aria-label={`Hole ${holeNumber} blow: ${layout[holeNumber].blow}`}
              >
                <span className="font-bold font-headline">{layout[holeNumber].blow}</span>
                <span className="absolute bottom-1 right-1 text-xs opacity-50">blow</span>
              </div>
              
              {/* Draw Hole */}
              <div
                onClick={() => onHoleSelect?.(holeNumber, 'draw')}
                className={cn(
                  "relative flex items-center justify-center w-full h-12 rounded-b-md bg-card/80 border-x border-b border-primary/30 transition-all duration-300",
                  isClickable && "cursor-pointer group-hover:bg-accent/20",
                  isDrawSelected && "bg-accent text-accent-foreground scale-105 shadow-lg z-10"
                )}
                aria-label={`Hole ${holeNumber} draw: ${layout[holeNumber].draw}`}
              >
                <span className="font-bold font-headline">{layout[holeNumber].draw}</span>
                 <span className="absolute bottom-1 right-1 text-xs opacity-50">draw</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
