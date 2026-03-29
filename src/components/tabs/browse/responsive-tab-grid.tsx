import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveTabGridProps {
  children: ReactNode;
  className?: string;
}

export function ResponsiveTabGrid({ children, className }: ResponsiveTabGridProps) {
  return (
    <div className={cn(
      "grid gap-4",
      "grid-cols-1",
      "sm:grid-cols-2",
      "lg:grid-cols-3",
      "xl:grid-cols-4",
      className
    )}>
      {children}
    </div>
  );
}
