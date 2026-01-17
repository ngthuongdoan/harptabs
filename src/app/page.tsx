"use client";

import { useAdmin } from "@/contexts/admin-context";
import ApprovedTabsDisplay from "@/components/approved-tabs-display";
import PendingTabsAdmin from "@/components/pending-tabs-admin";
import AdminLogin from "@/components/admin-login";
import { Button } from "@/components/ui/button";
import { Plus, Mic } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { isAdmin, apiKey } = useAdmin();

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
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <AdminLogin />
              <Link href="/pitch-detector" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto">
                  <Mic className="h-4 w-4 mr-2" />
                  Pitch Detector
                </Button>
              </Link>
              <Link href="/create" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Tab
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Content */}
        {isAdmin && apiKey ? (
          <PendingTabsAdmin apiKey={apiKey} />
        ) : (
          <ApprovedTabsDisplay />
        )}
      </div>
    </main>
  );
}

