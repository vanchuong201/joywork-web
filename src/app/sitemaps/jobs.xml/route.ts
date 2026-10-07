import { getPublicSiteUrl } from "@/lib/seo-url-metadata";
import { fetchSitemapPayload } from "@/lib/server-sitemap";
import { renderUrlSet, xmlResponse } from "@/lib/sitemap-xml";

export const revalidate = 3600;

type Payload = { data?: { jobs?: Array<{ path: string; updatedAt: string }> } };

export async function GET() {
  const payload = await fetchSitemapPayload<Payload>("/api/sitemap/jobs");
  const siteUrl = getPublicSiteUrl();
  const jobs = payload.data?.jobs ?? [];
  return xmlResponse(
    renderUrlSet(
      jobs
        .filter((job) => job.path.startsWith("/jobs/") && !job.path.includes("?"))
        .map((job) => ({ loc: `${siteUrl}${job.path}`, lastmod: job.updatedAt })),
    ),
  );
}
