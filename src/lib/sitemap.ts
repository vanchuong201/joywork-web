import type { MetadataRoute } from "next";
import { buildJobUrl } from "@/lib/job-url";

const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.NEXT_PUBLIC_FRONTEND_ORIGIN ??
  "https://joywork.vn"
).replace(/\/$/, "");

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

const API_BASE_CANDIDATES = Array.from(
  new Set(
    [process.env.INTERNAL_API_BASE_URL, API_BASE_URL, "http://127.0.0.1:4000", "http://localhost:4000"].filter(Boolean),
  ),
) as string[];

const PAGE_SIZE = 50;
const MAX_PAGES = 40;
const FETCH_REVALIDATE_SECONDS = 3600;

type Pagination = {
  page?: number;
  totalPages?: number;
};

type JobListItem = {
  id: string;
  title: string;
  slug?: string | null;
  updatedAt?: string;
};

type CompanyListItem = {
  slug: string;
  updatedAt?: string;
};

type PostListItem = {
  id: string;
  updatedAt?: string;
  publishedAt?: string | null;
};

type CourseListItem = {
  slug: string;
  updatedAt?: string;
};

type HashtagListItem = {
  slug: string;
};

function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function toDate(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

async function fetchApiJson(pathnameWithQuery: string): Promise<unknown | null> {
  for (const baseUrl of API_BASE_CANDIDATES) {
    try {
      const res = await fetch(`${baseUrl}${pathnameWithQuery}`, {
        next: { revalidate: FETCH_REVALIDATE_SECONDS },
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // thử base tiếp theo
    }
  }
  return null;
}

async function fetchAllPages<T>(
  pathname: string,
  extract: (payload: unknown) => { items: T[]; totalPages: number },
  limit = PAGE_SIZE,
): Promise<T[]> {
  const items: T[] = [];
  let page = 1;
  let totalPages = 1;
  const separator = pathname.includes("?") ? "&" : "?";

  while (page <= totalPages && page <= MAX_PAGES) {
    const payload = await fetchApiJson(`${pathname}${separator}page=${page}&limit=${limit}`);
    if (!payload) break;
    const extracted = extract(payload);
    items.push(...extracted.items);
    totalPages = Math.max(1, extracted.totalPages || 1);
    page += 1;
  }

  return items;
}

function paginationFrom(payload: unknown): Pagination {
  const data = (payload as { data?: { pagination?: Pagination } } | undefined)?.data;
  return data?.pagination ?? {};
}

function staticEntries(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/jobs"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/companies"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/courses"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/gioi-thieu"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/dieu-khoan-hoat-dong"), lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: absoluteUrl("/login"), changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/register"), changeFrequency: "yearly", priority: 0.3 },
  ];
}

async function jobEntries(): Promise<MetadataRoute.Sitemap> {
  const jobs = await fetchAllPages<JobListItem>("/api/jobs?isActive=true", (payload) => {
    const data = (payload as { data?: { jobs?: JobListItem[] } })?.data;
    return {
      items: data?.jobs ?? [],
      totalPages: paginationFrom(payload).totalPages ?? 1,
    };
  });

  return jobs
    .filter((job) => job.id && job.title)
    .map((job) => ({
      url: absoluteUrl(buildJobUrl(job)),
      lastModified: toDate(job.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
}

async function companyEntries(): Promise<MetadataRoute.Sitemap> {
  const companies = await fetchAllPages<CompanyListItem>("/api/companies", (payload) => {
    const data = (payload as { data?: { companies?: CompanyListItem[] } })?.data;
    return {
      items: data?.companies ?? [],
      totalPages: paginationFrom(payload).totalPages ?? 1,
    };
  });

  return companies
    .filter((company) => company.slug)
    .map((company) => ({
      url: absoluteUrl(`/companies/${encodeURIComponent(company.slug)}`),
      lastModified: toDate(company.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
}

async function postEntries(): Promise<MetadataRoute.Sitemap> {
  const posts = await fetchAllPages<PostListItem>("/api/posts", (payload) => {
    const data = (payload as { data?: { posts?: PostListItem[] } })?.data;
    return {
      items: data?.posts ?? [],
      totalPages: paginationFrom(payload).totalPages ?? 1,
    };
  });

  return posts
    .filter((post) => post.id)
    .map((post) => ({
      url: absoluteUrl(`/posts/${encodeURIComponent(post.id)}`),
      lastModified: toDate(post.updatedAt ?? post.publishedAt),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
}

async function courseEntries(): Promise<MetadataRoute.Sitemap> {
  const courses = await fetchAllPages<CourseListItem>(
    "/api/courses",
    (payload) => {
      const data = (payload as { data?: { courses?: CourseListItem[] } })?.data;
      return {
        items: data?.courses ?? [],
        totalPages: paginationFrom(payload).totalPages ?? 1,
      };
    },
    48,
  );

  return courses
    .filter((course) => course.slug)
    .map((course) => ({
      url: absoluteUrl(`/courses/${encodeURIComponent(course.slug)}`),
      lastModified: toDate(course.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
}

async function tagEntries(): Promise<MetadataRoute.Sitemap> {
  const payload = await fetchApiJson("/api/hashtags/trending?window=all&limit=50");
  const items =
    (payload as { data?: { items?: HashtagListItem[] } } | null)?.data?.items ?? [];

  return items
    .filter((tag) => tag.slug)
    .map((tag) => ({
      url: absoluteUrl(`/tags/${encodeURIComponent(tag.slug)}`),
      changeFrequency: "weekly" as const,
      priority: 0.4,
    }));
}

export function getSitemapIndexUrl(): string {
  return absoluteUrl("/sitemap.xml");
}

export async function buildSitemap(): Promise<MetadataRoute.Sitemap> {
  const [jobs, companies, posts, courses, tags] = await Promise.all([
    jobEntries(),
    companyEntries(),
    postEntries(),
    courseEntries(),
    tagEntries(),
  ]);

  return [...staticEntries(), ...jobs, ...companies, ...posts, ...courses, ...tags];
}
