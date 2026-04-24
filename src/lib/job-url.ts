/**
 * Shared utilities for Job URL slug generation, building, and parsing.
 * Uses the slugify package with Vietnamese locale.
 * NOTE: This must stay in sync with the backend's `src/shared/job-slug.ts`.
 */
import slugifyLib from 'slugify';

const CUID_REGEX = /^[a-z][a-z0-9]{24}$/;

/**
 * Normalize a Vietnamese title string to a URL-friendly slug.
 */
export const slugifyVietnamese = (text: string): string =>
  slugifyLib(text, { locale: 'vi', lower: true, trim: true });

/**
 * Build the canonical SEO-friendly URL for a job.
 *
 * Uses stored slug if available, otherwise falls back to generating
 * one from the job title (useful for jobs created before this feature).
 */
export function buildJobUrl(job: {
  id: string;
  slug?: string | null;
  title: string;
}): string {
  const slug = job.slug ?? slugifyVietnamese(job.title);
  return `/jobs/${slug}--${job.id}`;
}

/**
 * Parse a job URL param of the form "slug--cuid".
 *
 * Uses lastIndexOf('--') so that slugs containing '--' are handled
 * correctly — only the final '--' is the separator between slug and ID.
 *
 * Returns null if:
 * - No '--' separator found (pure old-style ID URL)
 * - ID portion doesn't match Prisma cuid pattern
 * - Slug is empty
 */
export function parseJobUrlParam(
  param: string,
): { slug: string; id: string } | null {
  const lastSepIdx = param.lastIndexOf('--');
  if (lastSepIdx === -1) return null;
  const id = param.slice(lastSepIdx + 2);
  const slug = param.slice(0, lastSepIdx);
  if (!CUID_REGEX.test(id) || !slug) return null;
  return { slug, id };
}
