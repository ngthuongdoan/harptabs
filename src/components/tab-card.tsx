import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Eye } from "lucide-react";
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
  const harmonicaTypeStyle = tab.harmonicaType === 'tremolo'
    ? 'bg-purple-100 dark:bg-purple-950'
    : 'bg-blue-100 dark:bg-blue-950';

  const harmonicaTypeLabel = tab.harmonicaType === 'tremolo'
    ? 'Tremolo'
    : 'Diatonic';

  return (
    <Card
      className={`${onClick && !previewMode ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''} ${className}`}
      onClick={onClick && !previewMode ? () => onClick(tab) : undefined}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{tab.title}</CardTitle>
            <div className="flex items-center gap-4">
              {showDate && dateFormatter && (
                <CardDescription className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  {dateFormatter(tab.createdAt)}
                </CardDescription>
              )}
              {tab.viewCount > 0 && (
                <CardDescription className="flex items-center gap-1.5">
                  <Eye className="h-3 w-3" />
                  <span className="text-xs">{tab.viewCount} {tab.viewCount === 1 ? 'view' : 'views'}</span>
                </CardDescription>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {additionalBadges}
            <Badge variant="outline" className={harmonicaTypeStyle}>
              {harmonicaTypeLabel}
            </Badge>
          </div>
        </div>
      </CardHeader>
      {children && !previewMode && <CardContent>{children}</CardContent>}
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
