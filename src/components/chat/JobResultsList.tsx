"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Briefcase, DollarSign } from "lucide-react";

export interface JobSearchResult {
  id: string;
  title: string;
  slug: string | null;
  companyName: string;
  companySlug: string;
  logoUrl: string | null;
  locations: string[];
  employmentType: string;
  jobLevel: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  benefitsIncome: string | null;
  similarity: number;
  url: string;
}

const EMPLOYMENT_TYPE_LABEL: Record<string, string> = {
  FULL_TIME: "Toàn thời gian",
  PART_TIME: "Bán thời gian",
  CONTRACT: "Hợp đồng",
  INTERNSHIP: "Thực tập",
  REMOTE: "Remote",
};

function formatSalary(min: number | null, max: number | null, currency: string): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) =>
    currency === "VND"
      ? `${(n / 1_000_000).toFixed(0)}tr`
      : `$${n.toLocaleString()}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `Từ ${fmt(min)}`;
  if (max) return `Đến ${fmt(max)}`;
  return null;
}

export function JobResultsList({ jobs }: { jobs: JobSearchResult[] }) {
  if (!jobs || jobs.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic">Không tìm thấy việc làm phù hợp.</p>
    );
  }

  return (
    <div className="flex flex-col gap-2 mt-1">
      {jobs.map(job => (
        <Link
          key={job.id}
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 hover:bg-[var(--muted)] transition-colors"
        >
          <div className="flex items-start gap-2">
            {job.logoUrl ? (
              <Image
                src={job.logoUrl}
                alt={job.companyName}
                width={32}
                height={32}
                className="rounded object-contain flex-shrink-0 mt-0.5"
              />
            ) : (
              <div className="w-8 h-8 rounded bg-[var(--muted)] flex items-center justify-center flex-shrink-0">
                <Briefcase size={14} className="text-[var(--muted-foreground)]" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-[var(--foreground)] truncate">{job.title}</p>
              <p className="text-xs text-[var(--muted-foreground)] truncate">{job.companyName}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                {job.locations.length > 0 && (
                  <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                    <MapPin size={10} />
                    {job.locations[0]}
                  </span>
                )}
                <span className="text-xs text-[var(--muted-foreground)]">
                  {EMPLOYMENT_TYPE_LABEL[job.employmentType] ?? job.employmentType}
                </span>
                {(job.benefitsIncome || formatSalary(job.salaryMin, job.salaryMax, job.currency)) && (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <DollarSign size={10} />
                    {job.benefitsIncome ?? formatSalary(job.salaryMin, job.salaryMax, job.currency)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
