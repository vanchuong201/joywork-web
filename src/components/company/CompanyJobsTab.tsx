"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Briefcase, Clock, List, Grid, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, cn } from "@/lib/utils";
import { getProvinceNameByCode } from "@/lib/provinces";
import { buildJobUrl } from "@/lib/job-url";

type CompanyJob = {
  id: string;
  slug?: string | null;
  title: string;
  updatedAt?: string;
  createdAt?: string;
  employmentType?: string;
  experienceLevel?: string;
  remote?: boolean;
  location?: string;
  locations?: string[];
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  benefitsIncome?: string;
  tags?: string[];
};

type Props = {
  jobs: CompanyJob[];
  companyName: string;
  companyLogoUrl?: string | null;
  companyIsGood?: boolean;
};

type ViewMode = "list" | "grid";

export default function CompanyJobsTab({ jobs }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  if (jobs.length === 0) {
    return (
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] py-20 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]">
          <Briefcase className="h-8 w-8" />
        </div>
        <h3 className="mb-2 text-xl font-bold text-[var(--foreground)]">Chưa có tin tuyển dụng nào</h3>
        <p className="text-[var(--muted-foreground)]">Công ty chưa đăng tải tin tuyển dụng nào.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h3 className="text-lg font-bold text-[var(--foreground)] sm:text-xl">Tin tuyển dụng</h3>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {jobs.length} vị trí đang mở — nhấn vào tin để xem chi tiết và ứng tuyển
          </p>
        </div>
        <div
          className="flex w-full items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--card)] p-1 sm:w-auto"
          role="group"
          aria-label="Chế độ hiển thị"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("list")}
            aria-pressed={viewMode === "list"}
            aria-label="Danh sách"
            className={cn("h-8 flex-1 px-3 sm:flex-none", viewMode === "list" && "bg-[var(--muted)]")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("grid")}
            aria-pressed={viewMode === "grid"}
            aria-label="Lưới"
            className={cn("h-8 flex-1 px-3 sm:flex-none", viewMode === "grid" && "bg-[var(--muted)]")}
          >
            <Grid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="space-y-3">
          {jobs.map((job) => (
            <CompanyJobCard key={job.id} job={job} variant="list" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => (
            <CompanyJobCard key={job.id} job={job} variant="grid" />
          ))}
        </div>
      )}
    </div>
  );
}

function CompanyJobCard({ job, variant }: { job: CompanyJob; variant: "list" | "grid" }) {
  const salary = formatSalary(job);
  const location = formatLocation(job);
  const employmentType = translateEmploymentType(job.employmentType);
  const experience = translateExperienceLevel(job.experienceLevel);
  const updatedLabel = formatDate(job.updatedAt || job.createdAt);
  const tags = job.tags ?? [];
  const isGrid = variant === "grid";
  const maxTags = isGrid ? 3 : 5;

  return (
    <Link
      href={buildJobUrl(job)}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
      aria-label={`Xem tin tuyển dụng: ${job.title}`}
    >
      <Card
        className={cn(
          "border-[var(--border)] bg-[var(--card)] transition-all hover:border-[var(--brand)]/45 hover:shadow-sm",
          isGrid && "h-full"
        )}
      >
        <div className={cn("p-4 sm:p-5", isGrid ? "flex h-full flex-col gap-3" : "flex items-start gap-4")}>
          <div className={cn("min-w-0 flex-1", isGrid ? "space-y-3" : "space-y-2.5")}>
            <div className={cn("flex items-start gap-3", !isGrid && "justify-between")}>
              <h4
                className={cn(
                  "font-semibold text-[var(--foreground)] transition-colors group-hover:text-[var(--brand)]",
                  isGrid ? "line-clamp-2 text-base leading-snug sm:text-lg" : "text-base sm:text-lg"
                )}
              >
                {job.title}
              </h4>
              {!isGrid ? (
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--muted)]/40 text-[var(--muted-foreground)] transition-colors group-hover:border-[var(--brand)]/30 group-hover:bg-[var(--brand)]/10 group-hover:text-[var(--brand)]">
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </span>
              ) : null}
            </div>

            <p className="text-sm font-semibold text-[var(--brand)] sm:text-base">{salary}</p>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--muted-foreground)]">
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="truncate">{location}</span>
              </span>
              {(employmentType || experience) ? (
                <>
                  <span className="text-[var(--border)]" aria-hidden>
                    ·
                  </span>
                  <span className="truncate">
                    {[employmentType, experience].filter(Boolean).join(" · ")}
                  </span>
                </>
              ) : null}
            </div>

            <p className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
              <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>Cập nhật ngày: {updatedLabel}</span>
            </p>

            {tags.length > 0 ? (
              <div className={cn("flex flex-wrap gap-1.5", isGrid && "mt-auto border-t border-[var(--border)] pt-3")}>
                {tags.slice(0, maxTags).map((tag) => (
                  <Badge
                    key={tag}
                    className="border-0 bg-[var(--muted)] font-normal text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80 text-xs"
                  >
                    {tag}
                  </Badge>
                ))}
                {tags.length > maxTags ? (
                  <Badge className="border-0 bg-[var(--muted)]/60 font-normal text-[var(--muted-foreground)] text-xs">
                    +{tags.length - maxTags}
                  </Badge>
                ) : null}
              </div>
            ) : null}
          </div>

          {isGrid ? (
            <div className="flex items-center justify-between border-t border-[var(--border)] pt-3 text-xs font-medium text-[var(--brand)]">
              <span>Xem chi tiết</span>
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
            </div>
          ) : null}
        </div>
      </Card>
    </Link>
  );
}

function formatSalary(job: CompanyJob) {
  if (job.salaryMin || job.salaryMax) {
    const currency = job.currency || "VND";
    if (job.salaryMin && job.salaryMax) {
      return `${job.salaryMin.toLocaleString("vi-VN")} - ${job.salaryMax.toLocaleString("vi-VN")} ${currency}`;
    }
    if (job.salaryMin) {
      return `Từ ${job.salaryMin.toLocaleString("vi-VN")} ${currency}`;
    }
    return `Đến ${job.salaryMax!.toLocaleString("vi-VN")} ${currency}`;
  }
  return job.benefitsIncome || "Thương lượng";
}

function formatLocation(job: CompanyJob) {
  if (job.remote) {
    return "Làm việc từ xa";
  }

  if (job.locations && job.locations.length > 0) {
    const first = job.locations[0];
    const provinceName = getProvinceNameByCode(first) || first;
    if (job.locations.length === 1) {
      return provinceName;
    }
    return `${provinceName} +${job.locations.length - 1} địa điểm`;
  }

  if (job.location) {
    return job.location;
  }

  return "Địa điểm linh hoạt";
}

function translateEmploymentType(type?: string) {
  switch (type) {
    case "FULL_TIME":
      return "Toàn thời gian";
    case "PART_TIME":
      return "Bán thời gian";
    case "CONTRACT":
      return "Hợp đồng thời vụ";
    case "INTERNSHIP":
      return "Thực tập";
    case "REMOTE":
      return "Làm việc từ xa";
    default:
      return type ?? "";
  }
}

function translateExperienceLevel(level?: string) {
  switch (level) {
    case "NO_EXPERIENCE":
      return "Không yêu cầu kinh nghiệm";
    case "LT_1_YEAR":
      return "Dưới 1 năm";
    case "Y1_2":
      return "1 - 2 năm";
    case "Y2_3":
      return "2 - 3 năm";
    case "Y3_5":
      return "3 - 5 năm";
    case "Y5_10":
      return "5 - 10 năm";
    case "GT_10":
      return "Trên 10 năm";
    default:
      return "";
  }
}
