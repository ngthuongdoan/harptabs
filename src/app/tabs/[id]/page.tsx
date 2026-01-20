import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TabContentView } from "@/components/tab-content-view";
import { TabTypeBadge } from "@/components/tab-card";
import TabViewTracker from "@/components/tab-view-tracker";
import { formatDateShort } from "@/lib/tab-utils";
import { getSiteUrl } from "@/lib/site-url";
import { TabsDB, initializeDatabase, type SavedTab } from "../../../../lib/db";

export const revalidate = 60;

const SITE_NAME = "HarpTab Navigator";

const buildTabDescription = (tab: SavedTab) => {
  const typeLabel = tab.harmonicaType === "tremolo" ? "24-hole tremolo" : "10-hole diatonic";
  const details = [
    typeLabel,
    tab.difficulty ? `${tab.difficulty} level` : null,
    tab.key ? `Key of ${tab.key}` : null,
    tab.genre ? tab.genre : null,
  ].filter(Boolean);

  const suffix = details.length ? ` ${details.join(" • ")}.` : "";
  return `Harmonica tab for ${tab.title}.${suffix}`;
};

interface TabPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: TabPageProps): Promise<Metadata> {
  const { id } = params;
  await initializeDatabase();
  const tab = await TabsDB.getTab(id);

  if (!tab) {
    return {
      title: `Tab not found | ${SITE_NAME}`,
      robots: { index: false, follow: false },
    };
  }

  const baseUrl = getSiteUrl();
  const title = `${tab.title} | ${SITE_NAME}`;
  const description = buildTabDescription(tab);
  const url = new URL(`/tabs/${tab.id}`, baseUrl).toString();

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "article",
    },
  };
}

export default async function TabDetailPage({ params }: TabPageProps) {
  const { id } = params;
  await initializeDatabase();
  const tab = await TabsDB.getTab(id);

  if (!tab) {
    notFound();
  }

  return (
    <main className="flex min-h-screen w-full flex-col p-4 sm:p-8 md:p-12 bg-background">
      <TabViewTracker tabId={tab.id} />
      <div className="w-full max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold font-headline">{tab.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>Created {formatDateShort(tab.createdAt)}</span>
              {tab.viewCount > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {tab.viewCount} {tab.viewCount === 1 ? "view" : "views"}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <TabTypeBadge type={tab.harmonicaType} />
            {tab.difficulty && <Badge variant="secondary">{tab.difficulty}</Badge>}
            {tab.key && <Badge variant="outline">Key {tab.key}</Badge>}
            {tab.genre && <Badge variant="outline">{tab.genre}</Badge>}
          </div>
        </div>

        <TabContentView
          holeHistory={tab.holeHistory}
          noteHistory={tab.noteHistory}
          height="h-72"
        />

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/tabs">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Library
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
