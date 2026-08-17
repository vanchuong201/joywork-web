import type { MetadataRoute } from "next";
import { buildSitemap } from "@/lib/sitemap";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemap();
}
