"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { Calendar, Eye } from 'lucide-react';
import type { SavedTab } from '../../lib/db';

export default function ApprovedTabsDisplay() {
  const [tabs, setTabs] = useState<SavedTab[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<SavedTab | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadApprovedTabs();
  }, []);

  const loadApprovedTabs = async () => {
    try {
      const response = await fetch('/api/tabs');
      if (!response.ok) throw new Error('Failed to fetch tabs');
      const data = await response.json();
      setTabs(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load tabs.",
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
      day: 'numeric'
    });
  };

  const handleViewTab = (tab: SavedTab) => {
    setSelectedTab(tab);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading tabs...</p>
      </div>
    );
  }

  if (tabs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-muted-foreground mb-2">No tabs available yet</p>
        <p className="text-sm text-muted-foreground">Be the first to create a harmonica tab!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tabs.map((tab) => (
          <Card
            key={tab.id}
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleViewTab(tab)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg line-clamp-2">{tab.title}</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="secondary">Approved</Badge>
                  <Badge variant="outline" className={tab.harmonicaType === 'tremolo' ? 'bg-purple-100 dark:bg-purple-950' : 'bg-blue-100 dark:bg-blue-950'}>
                    {tab.harmonicaType === 'tremolo' ? 'Tremolo' : 'Diatonic'}
                  </Badge>
                </div>
              </div>
              <CardDescription className="flex items-center gap-2 text-xs">
                <Calendar className="h-3 w-3" />
                {formatDate(tab.createdAt)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Preview:</p>
                  <ScrollArea className="h-20">
                    <pre className="text-xs font-mono bg-background/50 p-2 rounded">
                      {tab.holeHistory.split('\n')[0] || 'No content'}
                    </pre>
                  </ScrollArea>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  View Full Tab
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedTab && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{selectedTab.title}</CardTitle>
                <CardDescription>
                  Created on {formatDate(selectedTab.createdAt)}
                </CardDescription>
              </div>
              <Badge variant="outline" className={selectedTab.harmonicaType === 'tremolo' ? 'bg-purple-100 dark:bg-purple-950' : 'bg-blue-100 dark:bg-blue-950'}>
                {selectedTab.harmonicaType === 'tremolo' ? '24-Hole Tremolo' : '10-Hole Diatonic'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-sm uppercase text-muted-foreground tracking-wider mb-2">
                  Hole Numbers
                </h3>
                <ScrollArea className="h-64">
                  <pre className="p-4 bg-background/50 rounded-lg text-base font-mono whitespace-pre-wrap">
                    {selectedTab.holeHistory}
                  </pre>
                </ScrollArea>
              </div>
              <div>
                <h3 className="font-semibold text-sm uppercase text-muted-foreground tracking-wider mb-2">
                  Note Letters
                </h3>
                <ScrollArea className="h-64">
                  <pre className="p-4 bg-background/50 rounded-lg text-base font-mono whitespace-pre-wrap">
                    {selectedTab.noteHistory}
                  </pre>
                </ScrollArea>
              </div>
            </div>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setSelectedTab(null)}
            >
              Close
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
