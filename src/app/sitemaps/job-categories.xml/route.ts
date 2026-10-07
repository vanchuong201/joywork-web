import { getPublicSiteUrl } from "@/lib/seo-url-metadata";
import { fetchSitemapPayload } from "@/lib/server-sitemap";
import { renderUrlSet, xmlResponse } from "@/lib/sitemap-xml";

export const revalidate = 3600;

type Payload = { data?: { pages?: Array<{ seoPath: string; updatedAt: string }> } };

export async function GET() {
  const payload = await fetchSitemapPayload<Payload>("/api/sitemap/job-categories");
  const siteUrl = getPublicSiteUrl();
  const pages = payload.data?.pages ?? [];
  return xmlResponse(
    renderUrlSet(
      pages
        .filter((page) => page.seoPath.startsWith("/jobs/") && !page.seoPath.includes("?"))
        .map((page) => ({ loc: `${siteUrl}${page.seoPath}`, lastmod: page.updatedAt })),
    ),
  );
}
