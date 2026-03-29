import HarpNavigator from "@/components/harp-workbench/harp-navigator";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TabsDB, initializeDatabase } from "../../../../lib/db";

export const revalidate = 60;

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPage({ params }: EditPageProps) {
  const { id } = await params;
  await initializeDatabase();
  const tab = await TabsDB.getTab(id, true);

  if (!tab) {
    notFound();
  }

  return (
    <main className="flex min-h-screen w-full flex-col p-4 sm:p-8 md:p-12 bg-background">
      <div className="w-full max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
        <HarpNavigator tab={tab} mode="edit" />
      </div>
    </main>
  );
}
