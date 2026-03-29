"use client";

import type { ReactNode } from "react";
import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TabCard } from "@/components/tabs/display/tab-card";
import { TabViewDialog } from "@/components/tabs/display/tab-view-dialog";
import { ResponsiveTabGrid } from "@/components/tabs/browse/responsive-tab-grid";
import { formatDateShort } from "@/lib/tab-utils";
import type { SavedTab } from "../../../../lib/db";

interface ApprovedTabsGridProps {
  tabs: SavedTab[];
  selectedTab: SavedTab | null;
  onViewTab: (tab: SavedTab) => void;
  onCloseView: () => void;
  dialogActions?: (tab: SavedTab) => ReactNode;
  showDetailedErrors?: boolean;
}

export function ApprovedTabsGrid({
  tabs,
  selectedTab,
  onViewTab,
  onCloseView,
  dialogActions,
  showDetailedErrors = false,
}: ApprovedTabsGridProps) {
  return (
    <>
      <ResponsiveTabGrid>
        {tabs.map((tab) => (
          <TabCard
            key={tab.id}
            tab={tab}
            dateFormatter={formatDateShort}
            additionalBadges={<Badge variant="secondary">Approved</Badge>}
          >
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => onViewTab(tab)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Full Tab
            </Button>
          </TabCard>
        ))}
      </ResponsiveTabGrid>

      <TabViewDialog
        tab={selectedTab}
        open={!!selectedTab}
        onOpenChange={(open) => !open && onCloseView()}
        dateFormatter={formatDateShort}
        additionalBadges={<Badge variant="secondary">Approved</Badge>}
        showDetailedErrors={showDetailedErrors}
      >
        <Button variant="outline" onClick={onCloseView}>
          Close
        </Button>
        {selectedTab ? dialogActions?.(selectedTab) : null}
      </TabViewDialog>
    </>
  );
}
