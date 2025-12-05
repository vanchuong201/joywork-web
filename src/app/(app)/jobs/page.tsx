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
import { ChevronDown } from "lucide-react";
import CompanyHoverCard from "@/components/company/CompanyHoverCard";

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

function JobsPageContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const companyId = sp.get("companyId") || undefined;
  const remote = sp.get("remote") === "true" ? true : undefined;
  const employmentType = sp.get("employmentType") || undefined;
  const experienceLevel = sp.get("experienceLevel") || undefined;

  const hasActiveFilters = Boolean(companyId || remote === true || employmentType || experienceLevel);

  const [filtersOpen, setFiltersOpen] = useState(hasActiveFilters);

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

  const humanize = (value: string) =>
    value
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const activeFilterLabels = useMemo(
    () =>
      [
        companyId ? "Đang lọc theo doanh nghiệp" : null,
        remote === true ? "Remote" : null,
        employmentType ? `Loại: ${humanize(employmentType)}` : null,
        experienceLevel ? `Cấp bậc: ${humanize(experienceLevel)}` : null,
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
                Remote
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
                    {humanize(t)}
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
                    {humanize(t)}
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
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : data?.jobs?.length ? (
          <div className="space-y-3">
            {data?.jobs?.map((j) => (
              <Card key={j.id}>
                <CardHeader className="pb-2">
                  <div className="text-sm text-[var(--muted-foreground)]">
                    <CompanyHoverCard companyId={j.company.id} slug={j.company.slug} companyName={j.company.name}>
                      <Link href={`/companies/${j.company.slug}`} className="font-medium hover:underline">
                        {j.company.name}
                      </Link>
                    </CompanyHoverCard>
                  </div>
                  <div className="text-base font-semibold">{j.title}</div>
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
          <EmptyState title="No jobs found" subtitle="Try adjusting filters or search criteria" />
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

