import { getPublicSiteUrl } from "@/lib/seo-url-metadata";
import { fetchSitemapPayload } from "@/lib/server-sitemap";
import { renderUrlSet, xmlResponse } from "@/lib/sitemap-xml";

export const revalidate = 3600;

type Payload = { data?: { companies?: Array<{ slug: string; updatedAt: string }> } };

export async function GET() {
  const payload = await fetchSitemapPayload<Payload>("/api/sitemap/companies");
  const siteUrl = getPublicSiteUrl();
  const companies = payload.data?.companies ?? [];
  return xmlResponse(
    renderUrlSet(
      companies
        .filter((company) => company.slug && !company.slug.toLowerCase().startsWith("http"))
        .map((company) => ({
          loc: `${siteUrl}/companies/${encodeURIComponent(company.slug)}`,
          lastmod: company.updatedAt,
        })),
    ),
  );
}
