"use client";

import { useAdmin } from "@/contexts/admin-context";
import ApprovedTabsDisplay from "@/components/tabs/browse/approved-tabs-display";
import PendingTabsAdmin from "@/components/tabs/browse/pending-tabs-admin";
import AdminLogin from "@/components/admin-login";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BookOpen, Plus, Mic, ArrowLeftRight, Heart, Music, MoreHorizontal, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useCallback } from "react";

export default function Home() {
  const { isAdmin, apiKey, setApiKey } = useAdmin();
  const router = useRouter();
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const titleClickCount = useRef(0);
  const titleClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTitleClick = useCallback(() => {
    titleClickCount.current += 1;
    if (titleClickTimer.current) clearTimeout(titleClickTimer.current);
    if (titleClickCount.current >= 5) {
      titleClickCount.current = 0;
      setAdminDialogOpen(true);
    } else {
      titleClickTimer.current = setTimeout(() => {
        titleClickCount.current = 0;
      }, 2000);
    }
  }, []);

  return (
    <main className="flex min-h-screen w-full flex-col p-4 sm:p-8 md:p-12 bg-background">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1
                className="text-4xl font-bold font-headline mb-2 cursor-default select-none"
                onClick={handleTitleClick}
              >
                HarpTab Navigator
              </h1>
              <p className="text-muted-foreground">
                {isAdmin
                  ? "Admin Panel - Review pending harmonica tabs"
                  : "Discover and create harmonica tabs"}
              </p>
            </div>
            <div className="flex flex-row gap-2 w-auto items-center">
              {isAdmin && (
                <>
                  <AdminLogin showChangePassword />
                  <Button variant="outline" size="sm" onClick={() => setApiKey(null)}>
                    <LogOut className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Logout</span>
                  </Button>
                </>
              )}

              {/* Navigation dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/tabs')}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Tab Library
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/pitch-detector')}>
                    <Mic className="h-4 w-4 mr-2" />
                    Pitch Detector
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/converter')}>
                    <ArrowLeftRight className="h-4 w-4 mr-2" />
                    Tab Converter
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-not-allowed opacity-50" disabled>
                    <Heart className="h-4 w-4 mr-2" />
                    My Favorites
                    <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
                      Soon
                    </Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-not-allowed opacity-50" disabled>
                    <Music className="h-4 w-4 mr-2" />
                    Song Requests
                    <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
                      Soon
                    </Badge>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Link href="/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Tab
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

      {/* Hidden admin login dialog — triggered by clicking the title 5 times */}
      <AdminLogin open={adminDialogOpen} onOpenChange={setAdminDialogOpen} />
    </main>
  );
}
