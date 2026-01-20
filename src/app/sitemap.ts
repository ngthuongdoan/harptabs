import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { TabsDB, initializeDatabase } from "../../lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  await initializeDatabase();

  const staticRoutes = [
    "/",
    "/tabs",
    "/create",
    "/converter",
    "/pitch-detector",
  ].map((route) => ({
    url: new URL(route, baseUrl).toString(),
    lastModified: new Date(),
  }));

  const tabs = await TabsDB.getApprovedTabsForSitemap();
  const tabRoutes = tabs.map((tab) => ({
    url: new URL(`/tabs/${tab.id}`, baseUrl).toString(),
    lastModified: tab.updatedAt ?? new Date(),
  }));

  return [...staticRoutes, ...tabRoutes];
}
