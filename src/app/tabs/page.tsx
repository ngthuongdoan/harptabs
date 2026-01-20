import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import ApprovedTabsLibrary from "@/components/approved-tabs-library";

export const revalidate = 60;

export default function TabsLibraryPage() {
  return (
    <main className="flex min-h-screen w-full flex-col p-4 sm:p-8 md:p-12 bg-background">
      <div className="w-full max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold font-headline mb-2">Tab Library</h1>
              <p className="text-muted-foreground">
                Browse approved harmonica tabs from the community.
              </p>
            </div>
            <div className="flex flex-row gap-2 w-auto">
              <Link href="/">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <Link href="/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Tab
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <ApprovedTabsLibrary />
      </div>
    </main>
  );
}
