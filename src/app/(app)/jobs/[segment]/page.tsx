import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JobDetailPageClient from "@/components/jobs/JobDetailPageClient";
import JobsListingPageClient from "@/components/jobs/JobsListingPageClient";
import { classifyJobRouteSegment } from "@/lib/job-route";
import { buildJobUrl, resolveJobIdFromSlugParam } from "@/lib/job-url";
import { formatSalaryRange } from "@/lib/provinces";
import { fetchJobForOpenGraph } from "@/lib/server-job-metadata";
import { getSeoUrlLanding } from "@/lib/server-seo-url";
import { buildSeoLandingMetadata, getPublicSiteUrl, SITE_NAME } from "@/lib/seo-url-metadata";

/** Ảnh OG tối ưu 1200×630 (~100KB); tránh thumbnail.jpg gốc quá nặng cho crawler Facebook */
const DEFAULT_OG_IMAGE = "/og-share.jpg";

type JobSegmentParams = Promise<{ segment: string }>;

async function jobDetailMetadata(segment: string): Promise<Metadata> {
  const jobId = resolveJobIdFromSlugParam(segment);
  if (!jobId) {
    return {
      title: `Việc làm | ${SITE_NAME}`,
      robots: { index: false, follow: false },
    };
  }

  let fetchResult: Awaited<ReturnType<typeof fetchJobForOpenGraph>>;
  try {
    fetchResult = await fetchJobForOpenGraph(jobId);
  } catch {
    return { title: `Việc làm | ${SITE_NAME}` };
  }

  const { job, definitiveNotFound } = fetchResult;

  if (!job) {
    if (definitiveNotFound) {
      return {
        title: `Không tìm thấy việc làm | ${SITE_NAME}`,
        robots: { index: false, follow: true },
      };
    }
    return { title: `Việc làm | ${SITE_NAME}` };
  }

  const companyName = job.company.name;
  const title = `${job.title} tại ${companyName} | ${SITE_NAME}`;
  const salaryCurrency = job.currency === "USD" ? "USD" : "VND";
  const salaryRange = formatSalaryRange(job.salaryMin, job.salaryMax, salaryCurrency);
  const description = `${companyName} tuyển ${job.title}, lương ${salaryRange || "Thỏa thuận"}. Xem mô tả công việc, yêu cầu và ứng tuyển ngay tại ${SITE_NAME}.`;

  const url = `${getPublicSiteUrl()}${buildJobUrl({ id: job.id, slug: job.slug, title: job.title })}`;
  const publisher = process.env.NEXT_PUBLIC_FB_PUBLISHER;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url,
      locale: "vi_VN",
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} — ${job.title}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
    other: publisher ? { "article:publisher": publisher } : undefined,
  };
}

export async function generateMetadata({ params }: { params: JobSegmentParams }): Promise<Metadata> {
  const { segment } = await params;

  if (classifyJobRouteSegment(segment) === "job-detail") {
    return jobDetailMetadata(segment);
  }

  const landing = await getSeoUrlLanding(segment);
  if (!landing) {
    return {
      title: `Không tìm thấy trang | ${SITE_NAME}`,
      robots: { index: false, follow: true },
    };
  }

  return buildSeoLandingMetadata({
    slug: landing.slug,
    title: landing.title,
    description: landing.description,
    hasResults: landing.hasResults,
    canonicalPath: landing.canonicalPath,
  });
}

/**
 * `/jobs/{segment}` phục vụ hai loại trang: URL chi tiết việc làm
 * `{slug}--{cuid}` và SEO landing render nội bộ danh sách việc làm.
 */
export default async function JobSegmentPage({ params }: { params: JobSegmentParams }) {
  const { segment } = await params;

  if (classifyJobRouteSegment(segment) === "job-detail") {
    return <JobDetailPageClient segment={segment} />;
  }

  const landing = await getSeoUrlLanding(segment);
  if (!landing) {
    notFound();
  }

  const search = new URLSearchParams(landing.destinationParams).toString();

  return (
    <JobsListingPageClient
      seoMode={{
        search,
        heading: landing.heading,
        initialJobs: landing.jobs,
        initialPagination: landing.pagination,
      }}
    />
  );
}
