import type { Metadata } from "next";

export const SITE_NAME = "JOYWORK";

export function getPublicSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_FRONTEND_ORIGIN ??
    "https://joywork.vn"
  ).replace(/\/$/, "");
}

export function jobsListCanonicalUrl(siteUrl = getPublicSiteUrl()): string {
  return `${siteUrl}/jobs`;
}

export type SeoLandingMetaInput = {
  slug: string;
  title: string;
  description: string;
  hasResults: boolean;
  /**
   * Đường dẫn SEO URL chính của nhóm cùng bộ lọc. Nhiều SEO URL được phép trỏ
   * cùng một bộ lọc, nên alias phải canonical về URL chính để Google hợp nhất
   * tín hiệu thay vì coi là trang trùng lặp.
   */
  canonicalPath?: string;
};

/**
 * Metadata cho SEO landing. Landing chưa có việc làm nào vẫn trả 200 nhưng
 * `noindex, follow` để không đưa trang rỗng vào index; tự index lại khi có tin.
 */
export function buildSeoLandingMetadata(
  landing: SeoLandingMetaInput,
  siteUrl = getPublicSiteUrl(),
): Metadata {
  const url = `${siteUrl}/jobs/${landing.slug}`;
  const canonicalUrl = landing.canonicalPath ? `${siteUrl}${landing.canonicalPath}` : url;

  return {
    title: landing.title,
    description: landing.description,
    alternates: { canonical: canonicalUrl },
    robots: landing.hasResults ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: landing.title,
      description: landing.description,
      url: canonicalUrl,
      locale: "vi_VN",
    },
    twitter: {
      card: "summary",
      title: landing.title,
      description: landing.description,
    },
  };
}
