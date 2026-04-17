"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { buildJobUrl } from "@/lib/job-url";

type JobDetail = any;

/**
 * Backward compatibility route: `/jobs/:id`
 *
 * Catches any legacy job URLs (e.g. shared links, bookmarks, search results)
 * that still use the old `/jobs/cmo0bjkc000q0lm0ungrjs2a0` format.
 * Redirects to the canonical SEO-friendly URL with a 301-style redirect.
 */
export default function LegacyJobDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const jobId = params?.id as string;
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    api.get(`/api/jobs/${jobId}`)
      .then((res) => {
        const job: JobDetail = res.data?.data?.job;
        if (!job) {
          setError(true);
          return;
        }
        const canonical = buildJobUrl(job);
        router.replace(canonical);
      })
      .catch(() => {
        setError(true);
      });
  }, [jobId]);

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 pb-28 sm:px-6">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-center text-sm text-[var(--muted-foreground)]">
          Không tìm thấy việc làm này.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-28 sm:px-6">
      <div className="h-48 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--card)]" />
    </div>
  );
}
