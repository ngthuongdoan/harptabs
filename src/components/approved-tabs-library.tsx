"use client";

import { TabCard } from "@/components/tab-card";
import { TabViewDialog } from "@/components/tab-view-dialog";
import { ResponsiveTabGrid } from "@/components/responsive-tab-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTabViewTracking } from "@/hooks/use-tab-view-tracking";
import { useToast } from "@/hooks/use-toast";
import { formatDateShort } from "@/lib/tab-utils";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import type { SavedTab } from "../../lib/db";

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
  const [alertDialog, setAlertDialog] = useState<{
    title: string;
    description: string;
  } | null>(null);
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

  const canGoBack = page > 1;
  const canGoForward = page < totalPages;
  const startIndex = totalTabs === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(page * PAGE_SIZE, totalTabs);
  const isAlertDialogOpen = Boolean(alertDialog);

  const openAlertDialog = (title: string, description: string) => {
    setAlertDialog({ title, description });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
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
            <SelectTrigger className="w-full sm:w-[180px]">
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
            <span className="hidden sm:inline">Previous</span>
            <span className="sm:hidden">Prev</span>
          </Button>
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!canGoForward}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          >
            <span className="hidden sm:inline">Next</span>
            <span className="sm:hidden">Next</span>
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
                onClick={() => handleViewTab(tab)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Full Tab
              </Button>
            </TabCard>
          ))}
            </ResponsiveTabGrid>
      )}

      <TabViewDialog
        tab={selectedTab}
        open={!!selectedTab}
        onOpenChange={(open) => !open && setSelectedTab(null)}
        dateFormatter={formatDateShort}
        additionalBadges={<Badge variant="secondary">Approved</Badge>}
        showDetailedErrors={true}
      >
        <Button variant="outline" onClick={() => setSelectedTab(null)}>
          Close
        </Button>
      </TabViewDialog>

      <Dialog open={isAlertDialogOpen} onOpenChange={(open) => !open && setAlertDialog(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{alertDialog?.title}</DialogTitle>
            <DialogDescription>{alertDialog?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAlertDialog(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
