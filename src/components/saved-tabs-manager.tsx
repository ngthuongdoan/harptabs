"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SavedTabsManager, type SavedTab } from '@/lib/saved-tabs';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Edit, Download, Calendar } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import SaveTabDialog from './save-tab-dialog';

interface SavedTabsManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadTab: (holeHistory: string, noteHistory: string) => void;
}

export default function SavedTabsManagerDialog({
  open,
  onOpenChange,
  onLoadTab
}: SavedTabsManagerProps) {
  const [savedTabs, setSavedTabs] = useState<SavedTab[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<SavedTab | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadTabs();
    }
  }, [open]);

  const loadTabs = async () => {
    const tabs = await SavedTabsManager.getAllTabs();
    setSavedTabs(tabs);
  };

  const handleDelete = (tab: SavedTab) => {
    setSelectedTab(tab);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedTab) {
      const success = await SavedTabsManager.deleteTab(selectedTab.id);
      if (success) {
        toast({
          title: "Success",
          description: "Tab deleted successfully!"
        });
        loadTabs();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete tab.",
          variant: "destructive"
        });
      }
    }
    setDeleteDialogOpen(false);
    setSelectedTab(null);
  };

  const handleEdit = (tab: SavedTab) => {
    setSelectedTab(tab);
    setEditDialogOpen(true);
  };

  const handleLoad = (tab: SavedTab) => {
    onLoadTab(tab.holeHistory, tab.noteHistory);
    onOpenChange(false);
    toast({
      title: "Success",
      description: `Loaded "${tab.title}" into the navigator!`
    });
  };

  const formatDate = (timestamp: Date | string | number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleEditComplete = () => {
    setEditDialogOpen(false);
    setSelectedTab(null);
    loadTabs();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Saved Tabs</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {savedTabs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No saved tabs yet.</p>
                <p className="text-sm">Create some notes and save them to see them here!</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {savedTabs.map((tab) => (
                    <Card key={tab.id} className="relative">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{tab.title}</CardTitle>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleLoad(tab)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Load
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(tab)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(tab)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Updated: {formatDate(tab.updatedAt)}</span>
                          {new Date(tab.createdAt).getTime() !== new Date(tab.updatedAt).getTime() && (
                            <Badge variant="secondary" className="ml-2">Edited</Badge>
                          )}
                          <Badge variant="outline" className={tab.harmonicaType === 'tremolo' ? 'bg-purple-100 dark:bg-purple-950 ml-2' : 'bg-blue-100 dark:bg-blue-950 ml-2'}>
                            {tab.harmonicaType === 'tremolo' ? 'Tremolo' : 'Diatonic'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Holes:</p>
                            <div className="p-2 bg-muted rounded text-sm font-mono max-h-16 overflow-y-auto">
                              {tab.holeHistory || '(empty)'}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Notes:</p>
                            <div className="p-2 bg-muted rounded text-sm font-mono max-h-16 overflow-y-auto">
                              {tab.noteHistory || '(empty)'}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tab</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedTab?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedTab && (
        <SaveTabDialog
          open={editDialogOpen}
          onOpenChange={(open) => {
            if (!open) handleEditComplete();
          }}
          holeHistory={selectedTab.holeHistory}
          noteHistory={selectedTab.noteHistory}
          editingTab={{ id: selectedTab.id, title: selectedTab.title }}
        />
      )}
    </>
  );
}