import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildJobUrl, resolveJobIdFromSlugParam } from "@/lib/job-url";
import { htmlToOgDescription } from "@/lib/html-to-og-description";
import { fetchJobForOpenGraph } from "@/lib/server-job-metadata";

const SITE_NAME = "JOYWORK";
/** Ảnh OG tối ưu 1200×630 (~100KB); tránh thumbnail.jpg gốc quá nặng cho crawler Facebook */
const DEFAULT_OG_IMAGE = "/og-share.jpg";

type JobLayoutParams = Promise<{ "slug--id": string }>;

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_FRONTEND_ORIGIN ?? "https://joywork.vn";

export async function generateMetadata({
  params,
}: {
  params: JobLayoutParams;
}): Promise<Metadata> {
  const { "slug--id": slugParam } = await params;
  const jobId = resolveJobIdFromSlugParam(slugParam);

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

  const title = `${job.title} tại ${job.company.name}`;
  const fromMission = htmlToOgDescription(job.mission ?? undefined, 200);
  const fromGeneral = htmlToOgDescription(job.generalInfo ?? undefined, 200);
  const description =
    fromMission ||
    fromGeneral ||
    `Mô tả công việc ${job.title} tại ${job.company.name} — ${SITE_NAME}.`;

  const path = buildJobUrl({
    id: job.id,
    slug: job.slug,
    title: job.title,
  });
  const url = `${siteUrl.replace(/\/$/, "")}${path}`;
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

export default function JobDetailLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
