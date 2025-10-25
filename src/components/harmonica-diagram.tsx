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
    <div className="flex flex-col rounded-lg border-2 border-primary/50 bg-gradient-to-b from-card to-background shadow-inner p-2 gap-1 overflow-x-auto">
      <div className="flex justify-around w-full min-w-max">
        {holes.map((holeNumber) => (
          <div key={`hole-num-${holeNumber}`} className="w-12 text-center font-bold text-sm text-foreground/80 font-headline">
            {holeNumber}
          </div>
        ))}
      </div>
      <div className="flex justify-between w-full min-w-max bg-primary/20 rounded-md p-1 gap-1">
        {holes.map((holeNumber) => {
          const holeInfo = layout[holeNumber];
          const isSelected = selectedHoleInfo?.hole === holeNumber;
          const isClickable = !!onHoleSelect;
          const bgColor = holeInfo.action === 'blow' ? 'bg-card' : 'bg-card/80';
          const hoverColor = 'group-hover:bg-accent/20';
          const selectedColor = 'bg-accent text-accent-foreground scale-105 shadow-lg z-10';

          return (
            <div key={`hole-${holeNumber}`} className="flex flex-col items-center w-12 group">
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
                <span className="font-bold font-headline">{holeInfo.note}</span>
                <span className="absolute bottom-1 right-1 text-xs opacity-50">{holeInfo.action}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
