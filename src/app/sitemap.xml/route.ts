import { getPublicSiteUrl } from "@/lib/seo-url-metadata";
import { renderSitemapIndex, xmlResponse } from "@/lib/sitemap-xml";

export const revalidate = 3600;

export function GET() {
  const siteUrl = getPublicSiteUrl();
  const body = renderSitemapIndex([
    `${siteUrl}/sitemaps/static.xml`,
    `${siteUrl}/sitemaps/companies.xml`,
    `${siteUrl}/sitemaps/jobs.xml`,
    `${siteUrl}/sitemaps/job-categories.xml`,
  ]);
  return xmlResponse(body);
}
