import { resolveJobIdFromSlugParam } from "@/lib/job-url";

export type JobRouteKind = "job-detail" | "seo-landing";

/**
 * Phân loại segment của `/jobs/{segment}`: dạng `{slug}--{cuid}` (hoặc cuid
 * thuần từ URL cũ) là trang chi tiết việc làm; slug thuần là SEO landing.
 */
export function classifyJobRouteSegment(segment: string): JobRouteKind {
  return resolveJobIdFromSlugParam(segment) ? "job-detail" : "seo-landing";
}
