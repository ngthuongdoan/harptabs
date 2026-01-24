"use client";

import { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TabTypeBadge } from '@/components/tab-card';
import { TabContentView } from '@/components/tab-content-view';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Info, XCircle } from 'lucide-react';
import type { SavedTab } from '../../lib/db';
import { convertDiatonicToTremolo, convertTremoloToDiatonic, type HarmonicaType } from '@/lib/harmonica';

interface TabViewDialogProps {
  tab: SavedTab | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dateFormatter: (timestamp: Date | string | number) => string;
  children?: React.ReactNode;
  additionalBadges?: React.ReactNode;
  showDetailedErrors?: boolean;
}

function getTabDisplayData(tab: SavedTab, targetType: HarmonicaType) {
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
}

export function TabViewDialog({
  tab,
  open,
  onOpenChange,
  dateFormatter,
  children,
  additionalBadges,
  showDetailedErrors = false
}: TabViewDialogProps) {
  const [viewHarmonicaType, setViewHarmonicaType] = useState<HarmonicaType | null>(null);
  const [alertDialog, setAlertDialog] = useState<{
    title: string;
    description: string;
  } | null>(null);

  const activeViewType = tab ? (viewHarmonicaType ?? tab.harmonicaType) : null;
  const displayData = tab && activeViewType ? getTabDisplayData(tab, activeViewType) : null;

  const openAlertDialog = (title: string, description: string) => {
    setAlertDialog({ title, description });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setViewHarmonicaType(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="w-full h-full max-w-full md:max-w-4xl md:h-[90vh] flex flex-col p-4 md:p-6">
          {tab && (
            <>
              <DialogHeader>
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-xl md:text-2xl break-words">{tab.title}</DialogTitle>
                    <DialogDescription className="text-xs md:text-sm">
                      {dateFormatter(tab.createdAt)}
                    </DialogDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <TabTypeBadge type={tab.harmonicaType} />
                    {additionalBadges}
                  </div>
                </div>
              </DialogHeader>
              <div className="flex-1 overflow-auto">
                {tab && displayData && (
                  <>
                    <div className="flex flex-col gap-2 mb-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs md:text-sm text-muted-foreground">View as:</span>
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
                        {activeViewType !== tab.harmonicaType && (
                          <Badge variant="secondary">Converted</Badge>
                        )}
                      </div>

                      {/* Simple error display for mobile-friendly layouts */}
                      {!showDetailedErrors && displayData.isConverted && (displayData.errors.length > 0 || displayData.warnings.length > 0) && (
                        <p className="text-xs text-muted-foreground">
                          {displayData.usedFallback && 'Conversion failed; showing original tab. '}
                          {displayData.errors.length > 0 && `Errors: ${displayData.errors.join('; ')}. `}
                          {displayData.warnings.length > 0 && `Warnings: ${displayData.warnings.join('; ')}.`}
                        </p>
                      )}

                      {/* Detailed error display for desktop layouts */}
                      {showDetailedErrors && displayData.isConverted &&
                        (displayData.usedFallback ||
                          displayData.errors.length > 0 ||
                          displayData.warnings.length > 0) && (
                          <div className="space-y-2">
                            {displayData.usedFallback && (
                              <Alert variant="destructive">
                                <XCircle className="h-4 w-4" />
                                <AlertTitle>Conversion failed</AlertTitle>
                                <AlertDescription>
                                  <div className="flex items-start gap-2">
                                    <div className="flex-1 line-clamp-3">
                                      Showing the original tab because a compatible conversion
                                      could not be produced.
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 flex-shrink-0"
                                      aria-label="Read full conversion failure message"
                                      onClick={() =>
                                        openAlertDialog(
                                          "Conversion failed",
                                          "Showing the original tab because a compatible conversion could not be produced."
                                        )
                                      }
                                    >
                                      <Info className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </AlertDescription>
                              </Alert>
                            )}
                            {displayData.errors.length > 0 && (
                              <Alert variant="destructive">
                                <XCircle className="h-4 w-4" />
                                <AlertTitle>Conversion errors</AlertTitle>
                                <AlertDescription>
                                  <div className="flex items-start gap-2">
                                    <div className="flex-1 line-clamp-3">
                                      Errors: {displayData.errors.join("; ")}.
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 flex-shrink-0"
                                      aria-label="Read full conversion error details"
                                      onClick={() =>
                                        openAlertDialog(
                                          "Conversion errors",
                                          `Errors: ${displayData.errors.join("; ")}.`
                                        )
                                      }
                                    >
                                      <Info className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </AlertDescription>
                              </Alert>
                            )}
                            {displayData.warnings.length > 0 && (
                              <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Conversion warnings</AlertTitle>
                                <AlertDescription>
                                  <div className="flex items-start gap-2">
                                    <div className="flex-1 line-clamp-3">
                                      Warnings: {displayData.warnings.join("; ")}.
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 flex-shrink-0"
                                      aria-label="Read full conversion warning details"
                                      onClick={() =>
                                        openAlertDialog(
                                          "Conversion warnings",
                                          `Warnings: ${displayData.warnings.join("; ")}.`
                                        )
                                      }
                                    >
                                      <Info className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                        )}
                    </div>

                    <TabContentView
                      holeHistory={displayData.holeHistory}
                      noteHistory={tab.noteHistory}
                      height="h-96"
                    />
                  </>
                )}
              </div>
              <DialogFooter className="flex-shrink-0 gap-2 flex-col-reverse sm:flex-row sm:justify-end">
                {children}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Alert dialog for detailed error messages */}
      <Dialog open={Boolean(alertDialog)} onOpenChange={(open) => !open && setAlertDialog(null)}>
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
    </>
  );
}
