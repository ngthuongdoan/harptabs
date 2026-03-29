"use client";

import { useEffect } from "react";
import { useTabViewTracking } from "@/hooks/use-tab-view-tracking";

interface TabViewTrackerProps {
  tabId: string;
}

export default function TabViewTracker({ tabId }: TabViewTrackerProps) {
  const { trackView } = useTabViewTracking();

  useEffect(() => {
    if (!tabId) return;
    void trackView(tabId);
  }, [tabId, trackView]);

  return null;
}
