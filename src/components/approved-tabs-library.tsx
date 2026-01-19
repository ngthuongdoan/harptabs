"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTabViewTracking } from "@/hooks/use-tab-view-tracking";
import { Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { TabCard, TabTypeBadge } from "@/components/tab-card";
import { TabContentView, TabPreview } from "@/components/tab-content-view";
import { formatDateShort } from "@/lib/tab-utils";
import type { SavedTab } from "../../lib/db";
import {
  convertDiatonicToTremolo,
  convertTremoloToDiatonic,
  type HarmonicaType,
} from "@/lib/harmonica";

const PAGE_SIZE = 9;

export default function ApprovedTabsLibrary() {
  const [tabs, setTabs] = useState<SavedTab[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTabs, setTotalTabs] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<"all" | "Beginner" | "Intermediate" | "Advanced">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "diatonic" | "tremolo">("all");
  const [keyFilter, setKeyFilter] = useState("");
  const [sortOption, setSortOption] = useState<"newest" | "views">("newest");
  const [selectedTab, setSelectedTab] = useState<SavedTab | null>(null);
  const [viewHarmonicaType, setViewHarmonicaType] = useState<HarmonicaType | null>(null);
  const { toast } = useToast();
  const { trackView } = useTabViewTracking();

  useEffect(() => {
    loadTabs(page);
  }, [page, searchQuery, difficultyFilter, typeFilter, keyFilter, sortOption]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(debounce);
  }, [searchInput]);

  const loadTabs = async (targetPage: number) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: targetPage.toString(),
        limit: PAGE_SIZE.toString(),
        sort: sortOption
      });

      if (searchQuery) {
        params.set("q", searchQuery);
      }

      if (difficultyFilter !== "all") {
        params.set("difficulty", difficultyFilter);
      }

      if (typeFilter !== "all") {
        params.set("type", typeFilter);
      }

      if (keyFilter.trim()) {
        params.set("key", keyFilter.trim());
      }

      const response = await fetch(`/api/tabs/paginated?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch tabs");
      const data = await response.json();
      const normalizedTotalPages = Math.max(1, data.totalPages ?? 1);
      setTabs(data.tabs ?? []);
      setTotalTabs(data.total ?? 0);
      setTotalPages(normalizedTotalPages);
      if (targetPage > normalizedTotalPages) {
        setPage(normalizedTotalPages);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load tab library.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewTab = async (tab: SavedTab) => {
    setSelectedTab(tab);
    setViewHarmonicaType(tab.harmonicaType);

    // Track view - updates database and session storage
    const tracked = await trackView(tab.id);

    // Update local state to reflect new view count
    if (tracked) {
      setTabs(prevTabs =>
        prevTabs.map(t =>
          t.id === tab.id
            ? { ...t, viewCount: t.viewCount + 1 }
            : t
        )
      );
    }
  };

  const getTabDisplayData = (tab: SavedTab, targetType: HarmonicaType) => {
    if (targetType === tab.harmonicaType) {
      return {
        holeHistory: tab.holeHistory,
        errors: [] as string[],
        warnings: [] as string[],
        isConverted: false,
        usedFallback: false,
      };
    }

    const result =
      tab.harmonicaType === "diatonic"
        ? convertDiatonicToTremolo(tab.holeHistory)
        : convertTremoloToDiatonic(tab.holeHistory);

    const hasConvertedTab = Boolean(result.convertedTab);
    return {
      holeHistory: hasConvertedTab ? result.convertedTab : tab.holeHistory,
      errors: result.errors,
      warnings: result.warnings,
      isConverted: true,
      usedFallback: !hasConvertedTab,
    };
  };

  const activeViewType = selectedTab
    ? viewHarmonicaType ?? selectedTab.harmonicaType
    : null;
  const displayData =
    selectedTab && activeViewType
      ? getTabDisplayData(selectedTab, activeViewType)
      : null;

  const canGoBack = page > 1;
  const canGoForward = page < totalPages;
  const startIndex = totalTabs === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(page * PAGE_SIZE, totalTabs);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
        <div className="space-y-1">
          <label className="text-sm text-muted-foreground" htmlFor="tab-search">
            Search by title
          </label>
          <Input
            id="tab-search"
            placeholder="Search tabs..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <span className="text-sm text-muted-foreground">Difficulty</span>
          <Select
            value={difficultyFilter}
            onValueChange={(value: "all" | "Beginner" | "Intermediate" | "Advanced") => {
              setDifficultyFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              <SelectItem value="Beginner">Beginner</SelectItem>
              <SelectItem value="Intermediate">Intermediate</SelectItem>
              <SelectItem value="Advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <span className="text-sm text-muted-foreground">Harmonica type</span>
          <Select
            value={typeFilter}
            onValueChange={(value: "all" | "diatonic" | "tremolo") => {
              setTypeFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="diatonic">Diatonic</SelectItem>
              <SelectItem value="tremolo">Tremolo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-sm text-muted-foreground" htmlFor="tab-key">
            Key
          </label>
          <Input
            id="tab-key"
            placeholder="C"
            value={keyFilter}
            onChange={(event) => {
              setKeyFilter(event.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {startIndex}-{endIndex} of {totalTabs} tabs
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={sortOption}
            onValueChange={(value: "newest" | "views") => {
              setSortOption(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="views">Most viewed</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            disabled={!canGoBack}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!canGoForward}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading tab library...</p>
        </div>
      ) : tabs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground mb-2">No tabs match these filters</p>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tabs.map((tab) => (
            <div key={tab.id} className="space-y-2">
              <TabCard
                tab={tab}
                dateFormatter={formatDateShort}
                additionalBadges={<Badge variant="secondary">Approved</Badge>}
              >
                <TabPreview holeHistory={tab.holeHistory} />
              </TabCard>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleViewTab(tab)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Full Tab
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!selectedTab} onOpenChange={(open) => !open && setSelectedTab(null)}>
        <DialogContent className="max-w-full h-full md:max-w-4xl md:h-[90vh] flex flex-col">
          {selectedTab && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-2xl">{selectedTab.title}</DialogTitle>
                    <DialogDescription>
                      Created on {formatDateShort(selectedTab.createdAt)}
                    </DialogDescription>
                  </div>
                  <TabTypeBadge type={selectedTab.harmonicaType} />
                </div>
              </DialogHeader>
              <div className="flex-1 overflow-auto">
                {selectedTab && displayData && (
                  <>
                    <div className="flex flex-col gap-2 mb-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-muted-foreground">View as:</span>
                        <Button
                          variant={activeViewType === "diatonic" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setViewHarmonicaType("diatonic")}
                        >
                          Diatonic
                        </Button>
                        <Button
                          variant={activeViewType === "tremolo" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setViewHarmonicaType("tremolo")}
                        >
                          Tremolo
                        </Button>
                        {activeViewType !== selectedTab.harmonicaType && (
                          <Badge variant="secondary">Converted</Badge>
                        )}
                      </div>
                      {displayData.isConverted &&
                        (displayData.errors.length > 0 || displayData.warnings.length > 0) && (
                          <p className="text-xs text-muted-foreground">
                            {displayData.usedFallback &&
                              "Conversion failed; showing original tab. "}
                            {displayData.errors.length > 0 &&
                              `Errors: ${displayData.errors.join("; ")}. `}
                            {displayData.warnings.length > 0 &&
                              `Warnings: ${displayData.warnings.join("; ")}.`}
                          </p>
                        )}
                    </div>

                    <TabContentView
                      holeHistory={displayData.holeHistory}
                      noteHistory={selectedTab.noteHistory}
                      height="h-96"
                    />
                  </>
                )}
              </div>
              <DialogFooter className="flex-shrink-0 gap-2">
                <Button variant="outline" onClick={() => setSelectedTab(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
