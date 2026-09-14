import type { MetadataRoute } from "next";
import { fetchSeoUrlSitemapEntries, SEO_URL_REVALIDATE_SECONDS } from "@/lib/server-seo-url";
import { getPublicSiteUrl } from "@/lib/seo-url-metadata";

export const revalidate = SEO_URL_REVALIDATE_SECONDS;

const STATIC_ROUTES: Array<{ path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }> = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/jobs", changeFrequency: "daily", priority: 0.9 },
  { path: "/companies", changeFrequency: "weekly", priority: 0.8 },
  { path: "/gioi-thieu", changeFrequency: "yearly", priority: 0.3 },
  { path: "/dieu-khoan-hoat-dong", changeFrequency: "yearly", priority: 0.2 },
];

/**
 * Sitemap gồm trang tĩnh chính và các SEO landing đã publish. API chỉ trả
 * landing đang có kết quả, nên trang rỗng (noindex) không bị đưa vào sitemap.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getPublicSiteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const landings = await fetchSeoUrlSitemapEntries();
  const landingEntries: MetadataRoute.Sitemap = landings
    .filter((landing) => landing.hasResults)
    .map((landing) => ({
      url: `${siteUrl}${landing.seoPath}`,
      lastModified: new Date(landing.updatedAt),
      changeFrequency: "daily",
      priority: 0.7,
    }));

  return [...staticEntries, ...landingEntries];
}
