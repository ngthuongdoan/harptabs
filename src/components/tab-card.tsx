import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Eye, Music2 } from "lucide-react";
import type { SavedTab } from '../../lib/db';

interface TabCardProps {
  tab: SavedTab;
  onClick?: (tab: SavedTab) => void;
  children?: React.ReactNode;
  showDate?: boolean;
  dateFormatter?: (timestamp: Date | string | number) => string;
  className?: string;
  additionalBadges?: React.ReactNode;
  previewMode?: boolean;
}

export function TabCard({
  tab,
  onClick,
  children,
  showDate = true,
  dateFormatter,
  className = "",
  additionalBadges,
  previewMode = false
}: TabCardProps) {
  const harmonicaTypeLabel = tab.harmonicaType === 'tremolo'
    ? 'Tremolo'
    : 'Diatonic';

  const headerGradient = tab.harmonicaType === 'tremolo'
    ? 'from-violet-700/80 via-fuchsia-600/70 to-amber-500/70'
    : 'from-sky-700/80 via-emerald-600/70 to-amber-500/70';

  return (
    <Card
      className={`overflow-hidden rounded-2xl border border-slate-200/70 dark:border-white/5 bg-white/90 dark:bg-card ${onClick && !previewMode ? 'cursor-pointer hover:shadow-xl transition-shadow' : ''} ${className}`}
      onClick={onClick && !previewMode ? () => onClick(tab) : undefined}
    >
      <div className="relative h-40 sm:h-48 w-full bg-slate-100 dark:bg-slate-800">
        {tab.thumbnailUrl ? (
          <img
            src={tab.thumbnailUrl}
            alt={`Thumbnail for ${tab.title}`}
            className="absolute inset-0 w-full h-full object-contain"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${headerGradient}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/25 to-transparent" />
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex flex-wrap gap-1.5 sm:gap-2">
          {additionalBadges}
          <Badge className="border-none bg-white/80 text-slate-800 dark:bg-white/10 dark:text-white/90 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider">
            {harmonicaTypeLabel}
          </Badge>
        </div>
        <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 flex items-center gap-1 rounded-full bg-white/80 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-slate-700 dark:bg-white/10 dark:text-white/80">
          <Music2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
          {tab.difficulty}
        </div>
      </div>
      <CardContent className="p-3 sm:p-5">
        <CardTitle className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900 dark:text-white mb-1.5 sm:mb-2 line-clamp-2">
          {tab.title}
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-slate-500 dark:text-slate-300">
          {showDate && dateFormatter && (
            <CardDescription className="flex items-center gap-1.5 sm:gap-2 text-xs">
              <Calendar className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{dateFormatter(tab.createdAt)}</span>
            </CardDescription>
          )}
          {tab.viewCount > 0 && (
            <CardDescription className="flex items-center gap-1.5 text-xs">
              <Eye className="h-3 w-3 flex-shrink-0" />
              <span>{tab.viewCount} {tab.viewCount === 1 ? 'view' : 'views'}</span>
            </CardDescription>
          )}
        </div>
        {children && !previewMode && (
          <div className="mt-3 sm:mt-4">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function TabTypeBadge({ type }: { type: 'tremolo' | 'diatonic' }) {
  const style = type === 'tremolo'
    ? 'bg-purple-100 dark:bg-purple-950'
    : 'bg-blue-100 dark:bg-blue-950';

  const label = type === 'tremolo'
    ? '24-Hole Tremolo'
    : '10-Hole Diatonic';

  return (
    <Badge variant="outline" className={style}>
      {label}
    </Badge>
  );
}
