"use client";

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
import CompanySearch from "@/components/feed/CompanySearch";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import JobSaveButton from "@/components/jobs/JobSaveButton";
import { ChevronDown, List, Grid } from "lucide-react";
import CompanyHoverCard from "@/components/company/CompanyHoverCard";
import CompanyFollowButton from "@/components/company/CompanyFollowButton";
import { useAuthStore } from "@/store/useAuth";
import { cn } from "@/lib/utils";

type Job = {
  id: string;
  title: string;
  description: string;
  location?: string;
  remote: boolean;
  employmentType: string;
  experienceLevel: string;
  company: { id: string; name: string; slug: string };
};

type ViewMode = "list" | "grid";

function JobsPageContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  const companyId = sp.get("companyId") || undefined;
  const remote = sp.get("remote") === "true" ? true : undefined;
  const employmentType = sp.get("employmentType") || undefined;
  const experienceLevel = sp.get("experienceLevel") || undefined;

  const hasActiveFilters = Boolean(companyId || remote === true || employmentType || experienceLevel);

  const [filtersOpen, setFiltersOpen] = useState(hasActiveFilters);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  useEffect(() => {
    if (hasActiveFilters) {
      setFiltersOpen(true);
    }
  }, [hasActiveFilters]);

  const { data, isLoading } = useQuery<{ jobs: Job[]; pagination: any }>({
    queryKey: ["jobs", { remote, employmentType, experienceLevel, companyId }],
    queryFn: async () => {
      const res = await api.get("/api/jobs", {
        params: {
          limit: 10,
          companyId,
          remote,
          employmentType,
          experienceLevel,
        },
      });
      return res.data.data;
    },
  });

  const applyParams = (params: URLSearchParams) => {
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const toggleParam = (key: string, value?: string) => {
    const next = new URLSearchParams(sp.toString());
    if (!value) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    applyParams(next);
  };

  const clearAllFilters = () => {
    const next = new URLSearchParams(sp.toString());
    ["companyId", "remote", "employmentType", "experienceLevel"].forEach((key) => next.delete(key));
    applyParams(next);
  };

  const translateEmploymentType = (type: string) => {
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
        return type;
    }
  };

  const translateExperienceLevel = (level: string) => {
    switch (level) {
      case "ENTRY":
        return "Mới tốt nghiệp";
      case "JUNIOR":
        return "Nhân viên";
      case "MID":
        return "Chuyên viên";
      case "SENIOR":
        return "Chuyên viên cao cấp";
      case "LEAD":
        return "Trưởng nhóm";
      case "EXECUTIVE":
        return "Điều hành";
      default:
        return level;
    }
  };

  const activeFilterLabels = useMemo(
    () =>
      [
        companyId ? "Đang lọc theo doanh nghiệp" : null,
        remote === true ? "Làm việc từ xa" : null,
        employmentType ? `Loại: ${translateEmploymentType(employmentType)}` : null,
        experienceLevel ? `Cấp bậc: ${translateExperienceLevel(experienceLevel)}` : null,
      ].filter(Boolean) as string[],
    [companyId, remote, employmentType, experienceLevel],
  );

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((open) => !open)}
            className="flex flex-1 items-center justify-between gap-2 text-left"
          >
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Bộ lọc</h3>
              {hasActiveFilters ? (
                <span className="rounded-full border border-[var(--border)] bg-[var(--muted)] px-2 py-0.5 text-xs font-medium text-[var(--muted-foreground)]">
                  Đang áp dụng
                </span>
              ) : null}
            </div>
            <ChevronDown
              size={18}
              className={`text-[var(--muted-foreground)] transition-transform duration-200 ${filtersOpen ? "rotate-180" : ""}`}
            />
          </button>
          {hasActiveFilters ? (
            <button
              className="text-xs font-medium text-[var(--brand)] hover:underline"
              onClick={clearAllFilters}
            >
              Xoá tất cả
            </button>
          ) : null}
        </div>
        {filtersOpen ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2 text-sm">
              <div className="font-medium">Doanh nghiệp</div>
              <CompanySearch value={companyId} onSelect={(id) => toggleParam("companyId", id)} />
              {companyId ? (
                <button
                  className="text-xs text-[var(--brand)] hover:underline"
                  onClick={() => toggleParam("companyId", undefined)}
                >
                  Bỏ chọn doanh nghiệp
                </button>
              ) : null}
            </div>
            <div className="space-y-2 text-sm">
              <div className="font-medium">Hình thức làm việc</div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={remote === true}
                  onChange={(e) => toggleParam("remote", e.target.checked ? "true" : undefined)}
                />
                Làm việc từ xa
              </label>
            </div>
            <div className="space-y-2 text-sm">
              <div className="font-medium">Loại hợp đồng</div>
              <div className="space-y-1">
                {["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "FREELANCE"].map((t) => (
                  <label key={t} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="employmentType"
                      checked={employmentType === t}
                      onChange={() => toggleParam("employmentType", t)}
                    />
                    {translateEmploymentType(t)}
                  </label>
                ))}
              </div>
              <button
                className="text-xs text-[var(--brand)] hover:underline"
                onClick={() => toggleParam("employmentType", undefined)}
              >
                Bỏ chọn
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="font-medium">Cấp bậc</div>
              <div className="space-y-1">
                {["ENTRY", "JUNIOR", "MID", "SENIOR", "LEAD", "EXECUTIVE"].map((t) => (
                  <label key={t} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="experienceLevel"
                      checked={experienceLevel === t}
                      onChange={() => toggleParam("experienceLevel", t)}
                    />
                    {translateEmploymentType(t)}
                  </label>
                ))}
              </div>
              <button
                className="text-xs text-[var(--brand)] hover:underline"
                onClick={() => toggleParam("experienceLevel", undefined)}
              >
                Bỏ chọn
              </button>
            </div>
          </div>
        ) : null}
        {!filtersOpen && activeFilterLabels.length ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--muted-foreground)]">
            {activeFilterLabels.map((label) => (
              <span
                key={label}
                className="rounded-full border border-[var(--border)] bg-[var(--muted)] px-3 py-1 text-[var(--muted-foreground)]"
              >
                {label}
              </span>
            ))}
          </div>
        ) : null}
      </section>
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Việc làm</h1>
            {companyId ? (
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                Đang lọc theo doanh nghiệp:
                {" "}
                <span className="font-medium text-[var(--foreground)]">
                  {data?.jobs?.[0]?.company?.name ?? (isLoading ? "đang tải..." : "không có job phù hợp")}
                </span>
              </p>
            ) : null}
          </div>
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 border border-[var(--border)] rounded-lg p-1 bg-[var(--card)]">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("list")}
              className={cn("h-8 px-3", viewMode === "list" && "bg-[var(--muted)]")}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid")}
              className={cn("h-8 px-3", viewMode === "grid" && "bg-[var(--muted)]")}
            >
              <Grid className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : data?.jobs?.length ? (
          viewMode === "list" ? (
            <div className="space-y-3">
              {data?.jobs?.map((j) => (
                <Card key={j.id} className="hover:border-[var(--brand)]/50 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CompanyHoverCard companyId={j.company.id} slug={j.company.slug} companyName={j.company.name}>
                        <Link href={`/companies/${j.company.slug}`} className="text-base font-semibold text-[var(--foreground)] hover:text-[var(--brand)] hover:underline">
                          {j.company.name}
                        </Link>
                      </CompanyHoverCard>
                      {user && (
                        <CompanyFollowButton
                          companyId={j.company.id}
                          companySlug={j.company.slug}
                          variant="link"
                          size="sm"
                          className="text-[#2563eb] hover:text-[#1d4ed8] hover:underline p-0 h-auto font-normal text-sm"
                        />
                      )}
                    </div>
                    <div className="text-lg font-semibold mt-1">{j.title}</div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div
                      className="prose prose-sm max-w-none text-[var(--muted-foreground)] leading-6 max-h-[4.5rem] overflow-hidden"
                      dangerouslySetInnerHTML={{ __html: j.description ?? "" }}
                    />
                    <div className="flex items-center gap-2">
                      <Button asChild size="sm">
                        <Link href={`/jobs/${j.id}`}>Xem chi tiết</Link>
                      </Button>
                      <JobSaveButton jobId={j.id} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data?.jobs?.map((j) => (
                <Card key={j.id} className="hover:border-[var(--brand)]/50 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CompanyHoverCard companyId={j.company.id} slug={j.company.slug} companyName={j.company.name}>
                        <Link href={`/companies/${j.company.slug}`} className="text-sm font-semibold text-[var(--foreground)] hover:text-[var(--brand)] hover:underline">
                          {j.company.name}
                        </Link>
                      </CompanyHoverCard>
                      {user && (
                        <CompanyFollowButton
                          companyId={j.company.id}
                          companySlug={j.company.slug}
                          variant="link"
                          size="sm"
                          className="text-[#2563eb] hover:text-[#1d4ed8] hover:underline p-0 h-auto font-normal text-xs"
                        />
                      )}
                    </div>
                    <div className="text-base font-semibold mt-1 line-clamp-2">{j.title}</div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div
                      className="prose prose-sm max-w-none text-[var(--muted-foreground)] leading-6 max-h-[4.5rem] overflow-hidden"
                      dangerouslySetInnerHTML={{ __html: j.description ?? "" }}
                    />
                    <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border)]">
                      <Button asChild size="sm" className="w-full">
                        <Link href={`/jobs/${j.id}`}>Xem chi tiết</Link>
                      </Button>
                      <JobSaveButton jobId={j.id} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : (
          <EmptyState title="Không tìm thấy việc làm" subtitle="Thử điều chỉnh bộ lọc hoặc tiêu chí tìm kiếm" />
        )}
      </section>
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <Skeleton className="h-32 rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-32" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    }>
      <JobsPageContent />
    </Suspense>
  );
}

