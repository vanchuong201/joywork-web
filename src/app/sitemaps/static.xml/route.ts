import { getPublicSiteUrl } from "@/lib/seo-url-metadata";
import { renderUrlSet, STATIC_SITEMAP_PATHS, xmlResponse } from "@/lib/sitemap-xml";

export const revalidate = 3600;

export function GET() {
  const siteUrl = getPublicSiteUrl();
  return xmlResponse(renderUrlSet(STATIC_SITEMAP_PATHS.map((path) => ({ loc: path === "/" ? `${siteUrl}/` : `${siteUrl}${path}` }))));
}
