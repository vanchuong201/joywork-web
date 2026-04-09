"use client";

import Link from "next/link";
import { Briefcase, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CompanyLogo } from "@/components/company/CompanyLogo";

export type RelatedJobItem = {
  id: string;
  title: string;
  location?: string;
  locations?: string[];
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  benefitsIncome?: string;
  employmentType?: string;
  company: {
    name: string;
    slug: string;
    logoUrl?: string | null;
  };
};

type RelatedJobCardProps = {
  job: RelatedJobItem;
  size?: "featured" | "compact";
  className?: string;
};

function formatSalary(job: RelatedJobItem) {
  if (job.salaryMin || job.salaryMax) {
    if (job.salaryMin && job.salaryMax) {
      return `${job.salaryMin.toLocaleString("vi-VN")} - ${job.salaryMax.toLocaleString("vi-VN")} ${job.currency ?? "VND"}`;
    }
    if (job.salaryMin) {
      return `${job.salaryMin.toLocaleString("vi-VN")} ${job.currency ?? "VND"}`;
    }
    return `${job.salaryMax?.toLocaleString("vi-VN")} ${job.currency ?? "VND"}`;
  }
  return job.benefitsIncome || "Thoả thuận";
}

function formatLocation(job: RelatedJobItem) {
  if (job.location) return job.location;
  if (job.locations?.[0]) return job.locations[0];
  return "Địa điểm linh hoạt";
}

function translateEmploymentType(type?: string) {
  switch (type) {
    case "FULL_TIME":
      return "Toàn thời gian";
    case "PART_TIME":
      return "Bán thời gian";
    case "CONTRACT":
      return "Hợp đồng";
    case "INTERNSHIP":
      return "Thực tập";
    case "FREELANCE":
      return "Tự do";
    default:
      return "Hình thức linh hoạt";
  }
}

export default function RelatedJobCard({ job, size = "featured", className }: RelatedJobCardProps) {
  const compact = size === "compact";
  const salary = formatSalary(job);

  return (
    <Link href={`/jobs/${job.id}`} className={cn("group block", className)}>
      <Card
        className={cn(
          "h-full border-[var(--border)] bg-[var(--card)]/90 shadow-none transition-all hover:-translate-y-0.5 hover:border-[var(--brand)]/50 hover:shadow-sm",
          compact ? "rounded-xl p-2.5 sm:p-3" : "rounded-xl p-3 sm:p-3.5"
        )}
      >
        <div className={cn("flex items-start gap-2.5", compact ? "mb-2.5" : "mb-3")}>
          <div
            className={cn(
              "flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-[var(--border)] bg-[var(--muted)]/40",
              compact ? "h-8 w-8" : "h-9 w-9"
            )}
          >
            {job.company.logoUrl ? (
              <CompanyLogo
                src={job.company.logoUrl}
                alt={job.company.name}
                className="h-full w-full object-cover"
                width={48}
                height={48}
              />
            ) : (
              <Briefcase className={cn("text-[var(--muted-foreground)]", compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className={cn("truncate font-medium text-[var(--muted-foreground)]", compact ? "text-[11px]" : "text-xs")}>{job.company.name}</p>
            <h4
              className={cn(
                "line-clamp-2 font-semibold text-[var(--foreground)] transition-colors group-hover:text-[var(--brand)]",
                compact ? "mt-0.5 text-xs leading-4" : "mt-0.5 text-sm leading-5"
              )}
            >
              {job.title}
            </h4>
          </div>
        </div>

        <div className={cn("space-y-1 text-[var(--muted-foreground)]", compact ? "text-[11px]" : "text-xs")}>
          <div className="flex items-center gap-1">
            <MapPin className={cn("shrink-0", compact ? "h-3 w-3" : "h-3.5 w-3.5")} />
            <span className="truncate">{formatLocation(job)}</span>
          </div>
          <p className="font-semibold text-[var(--brand)]/95">{salary}</p>
          <p className="truncate">{translateEmploymentType(job.employmentType)}</p>
        </div>
      </Card>
    </Link>
  );
}
