"use client";

import { useAdmin } from "@/contexts/admin-context";
import ApprovedTabsDisplay from "@/components/approved-tabs-display";
import PendingTabsAdmin from "@/components/pending-tabs-admin";
import AdminLogin from "@/components/admin-login";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus, Mic } from "lucide-react";
import Link from "next/link";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Home() {
  const { isAdmin, apiKey } = useAdmin();
  const isMobile = useIsMobile();

  return (
    <main className="flex min-h-screen w-full flex-col p-4 sm:p-8 md:p-12 bg-background">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold font-headline mb-2">HarpTab Navigator</h1>
              <p className="text-muted-foreground">
                {isAdmin
                  ? "Admin Panel - Review pending harmonica tabs"
                  : "Discover and create harmonica tabs"}
              </p>
            </div>
            <div className="flex flex-row gap-2 w-auto">
              <AdminLogin />
              <Link href="/pitch-detector">
                <Button variant="outline" size={isMobile ? "icon" : "default"} className="sm:w-auto">
                  <Mic className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Pitch Detector</span>
                </Button>
              </Link>
              <Link href="/tabs">
                <Button variant="outline" size={isMobile ? "icon" : "default"} className="sm:w-auto">
                  <BookOpen className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Tab Library</span>
                </Button>
              </Link>
              <Link href="/create">
                <Button size={isMobile ? "icon" : "default"} className="sm:w-auto">
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Create Tab</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Content */}
        {isAdmin && apiKey ? (
          <div className="space-y-10">
            <PendingTabsAdmin apiKey={apiKey} />
            <div>
              <div className="mb-4">
                <h2 className="text-2xl font-bold">Approved Tabs</h2>
                <p className="text-sm text-muted-foreground">
                  Edit public tabs to correct titles or content.
                </p>
              </div>
              <ApprovedTabsDisplay apiKey={apiKey} />
            </div>
          </div>
        ) : (
          <ApprovedTabsDisplay />
        )}
      </div>
    </main>
  );
}
