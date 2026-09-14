import { cache } from "react";
import type { Job, JobsPagination } from "@/components/jobs/JobsListingPageClient";

export type SeoUrlLanding = {
  id: string;
  seoPath: string;
  slug: string;
  title: string;
  description: string;
  heading: string;
  destinationType: "JOB_SEARCH";
  destinationParams: Record<string, string>;
  originalPath: string;
  /** SEO URL chính của nhóm cùng bộ lọc; alias dùng nó làm canonical. */
  canonicalPath: string;
  isCanonical: boolean;
  hasResults: boolean;
  jobs: Job[];
  pagination: JobsPagination;
};

export type SeoUrlSitemapEntry = {
  seoPath: string;
  slug: string;
  updatedAt: string;
  hasResults: boolean;
};

type ResolveApiResponse = { data?: { page?: SeoUrlLanding | null } };
type ListApiResponse = { data?: { pages?: SeoUrlSitemapEntry[] } };

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

const API_BASE_CANDIDATES = Array.from(
  new Set(
    [process.env.INTERNAL_API_BASE_URL, API_BASE_URL, "http://127.0.0.1:4000", "http://localhost:4000"].filter(
      Boolean,
    ),
  ),
) as string[];

/** Revalidate ngắn để thay đổi bên admin sớm xuất hiện trên web. */
export const SEO_URL_REVALIDATE_SECONDS = 60;

/**
 * Resolve SEO URL đã publish. Bọc `cache()` để `generateMetadata` và page dùng
 * chung một lần fetch trong cùng request.
 */
export const getSeoUrlLanding = cache(async (slug: string): Promise<SeoUrlLanding | null> => {
  for (const baseUrl of API_BASE_CANDIDATES) {
    try {
      const res = await fetch(`${baseUrl}/api/seo-urls/jobs/${encodeURIComponent(slug)}`, {
        next: { revalidate: SEO_URL_REVALIDATE_SECONDS, tags: [`seo-url-${slug}`] },
      });

      if (res.status === 404) return null;
      if (!res.ok) continue;

      const payload = (await res.json()) as ResolveApiResponse;
      return payload?.data?.page ?? null;
    } catch {
      // thử base tiếp theo
    }
  }

  return null;
});

/** Danh sách SEO URL publish có kết quả, dùng cho sitemap. */
export async function fetchSeoUrlSitemapEntries(): Promise<SeoUrlSitemapEntry[]> {
  for (const baseUrl of API_BASE_CANDIDATES) {
    try {
      const res = await fetch(`${baseUrl}/api/seo-urls`, {
        next: { revalidate: SEO_URL_REVALIDATE_SECONDS, tags: ["seo-urls-sitemap"] },
      });
      if (!res.ok) continue;

      const payload = (await res.json()) as ListApiResponse;
      return payload?.data?.pages ?? [];
    } catch {
      // thử base tiếp theo
    }
  }

  return [];
}
