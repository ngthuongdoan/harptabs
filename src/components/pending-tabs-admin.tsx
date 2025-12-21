"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { Calendar, Check, X, Eye } from 'lucide-react';
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
import type { SavedTab } from '../../lib/db';

interface PendingTabsAdminProps {
  apiKey: string;
}

export default function PendingTabsAdmin({ apiKey }: PendingTabsAdminProps) {
  const [tabs, setTabs] = useState<SavedTab[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<SavedTab | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadPendingTabs();
  }, []);

  const loadPendingTabs = async () => {
    try {
      const response = await fetch('/api/tabs/pending', {
        headers: {
          'x-api-key': apiKey
        }
      });
      if (!response.ok) throw new Error('Failed to fetch pending tabs');
      const data = await response.json();
      setTabs(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load pending tabs.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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

  const handleApprove = (tab: SavedTab) => {
    setSelectedTab(tab);
    setActionType('approve');
    setActionDialogOpen(true);
  };

  const handleReject = (tab: SavedTab) => {
    setSelectedTab(tab);
    setActionType('reject');
    setActionDialogOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedTab || !actionType) return;

    try {
      if (actionType === 'approve') {
        const response = await fetch(`/api/tabs/${selectedTab.id}/approve`, {
          method: 'POST',
          headers: {
            'x-api-key': apiKey
          }
        });
        if (!response.ok) throw new Error('Failed to approve tab');
        toast({
          title: "Success",
          description: `Tab "${selectedTab.title}" has been approved!`
        });
      } else {
        const response = await fetch(`/api/tabs/${selectedTab.id}`, {
          method: 'DELETE',
          headers: {
            'x-api-key': apiKey
          }
        });
        if (!response.ok) throw new Error('Failed to reject tab');
        toast({
          title: "Success",
          description: `Tab "${selectedTab.title}" has been rejected and deleted.`
        });
      }
      loadPendingTabs();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${actionType} tab.`,
        variant: "destructive"
      });
    } finally {
      setActionDialogOpen(false);
      setSelectedTab(null);
      setActionType(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading pending tabs...</p>
      </div>
    );
  }

  if (tabs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-muted-foreground mb-2">No pending tabs</p>
        <p className="text-sm text-muted-foreground">All tabs have been reviewed!</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Pending Tabs Review</h2>
            <p className="text-sm text-muted-foreground">
              {tabs.length} tab{tabs.length !== 1 ? 's' : ''} awaiting approval
            </p>
          </div>
          <Button variant="outline" onClick={loadPendingTabs}>
            Refresh
          </Button>
        </div>

        {tabs.map((tab) => (
          <Card key={tab.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">{tab.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Submitted on {formatDate(tab.createdAt)}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                  Pending
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h3 className="font-semibold text-sm uppercase text-muted-foreground tracking-wider mb-2">
                    Hole Numbers
                  </h3>
                  <ScrollArea className="h-32">
                    <pre className="p-3 bg-background/50 rounded-lg text-sm font-mono whitespace-pre-wrap">
                      {tab.holeHistory || 'No content'}
                    </pre>
                  </ScrollArea>
                </div>
                <div>
                  <h3 className="font-semibold text-sm uppercase text-muted-foreground tracking-wider mb-2">
                    Note Letters
                  </h3>
                  <ScrollArea className="h-32">
                    <pre className="p-3 bg-background/50 rounded-lg text-sm font-mono whitespace-pre-wrap">
                      {tab.noteHistory || 'No content'}
                    </pre>
                  </ScrollArea>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleReject(tab)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleApprove(tab)}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'approve' ? 'Approve Tab' : 'Reject Tab'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'approve'
                ? `Are you sure you want to approve "${selectedTab?.title}"? This will make it visible to all users.`
                : `Are you sure you want to reject "${selectedTab?.title}"? This will permanently delete it.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAction}>
              {actionType === 'approve' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
