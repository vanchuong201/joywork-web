"use client";

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
// import CompanySearch from "@/components/feed/CompanySearch";
import { Input } from "@/components/ui/input";
import ProvinceSelect from "@/components/ui/province-select";
import WardSelect from "@/components/ui/ward-select";
import { getProvinceNameByCode } from "@/lib/provinces";
import { fetchWardsByProvinceCodes } from "@/lib/location-wards";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import JobSaveButton from "@/components/jobs/JobSaveButton";
import { List, Grid, ChevronLeft, ChevronRight, Building2, X } from "lucide-react";
import CompanyHoverCard from "@/components/company/CompanyHoverCard";
import CompanyFollowButton from "@/components/company/CompanyFollowButton";
import { CompanyLogo } from "@/components/company/CompanyLogo";
import { useAuthStore } from "@/store/useAuth";
import { cn } from "@/lib/utils";
import useEmblaCarousel from "embla-carousel-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Pagination } from "@/components/ui/pagination";

type Job = {
  id: string;
  title: string;
  locations?: string[];
  location?: string;
  wardCodes?: string[];
  remote: boolean;
  employmentType: string;
  experienceLevel: string;
  jobLevel?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string;
  company: { 
    id: string; 
    name: string; 
    legalName?: string | null;
    slug: string; 
    logoUrl?: string | null;
  };
  // JD chuẩn fields
  generalInfo?: string;
  mission?: string;
  tasks?: string;
  knowledge?: string;
  skills?: string;
  attitude?: string;
  kpis?: string;
  authority?: string;
  relationships?: string;
  careerPath?: string;
  benefitsIncome?: string;
  benefitsPerks?: string;
  contact?: string;
};

type ViewMode = "list" | "grid";
type SalaryUnit = "THOUSAND" | "MILLION" | "BILLION";

const SALARY_UNIT_OPTIONS: Array<{
  value: SalaryUnit;
  label: string;
  shortLabel: string;
  multiplier: number;
}> = [
  { value: "THOUSAND", label: "Nghìn VND", shortLabel: "nghìn", multiplier: 1_000 },
  { value: "MILLION", label: "Triệu VND", shortLabel: "triệu", multiplier: 1_000_000 },
  { value: "BILLION", label: "Tỷ VND", shortLabel: "tỷ", multiplier: 1_000_000_000 },
];

const DEFAULT_SALARY_UNIT: SalaryUnit = "MILLION";

function parseSalaryUnit(value?: string | null): SalaryUnit {
  if (value === "THOUSAND" || value === "MILLION" || value === "BILLION") return value;
  return DEFAULT_SALARY_UNIT;
}

function parseSalaryValueParam(value?: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return parsed;
}

function formatSalaryInputValue(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return Number(value.toFixed(2)).toString();
}

function formatSalaryFilterValue(value: number): string {
  return value.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
}

type HomepageShowcaseCompany = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  tagline?: string | null;
  coverUrl?: string | null;
  order: number;
};

function SimpleCarousel({
  children,
  itemClassName = "flex-[0_0_85%] sm:flex-[0_0_70%] lg:flex-[0_0_50%]",
}: {
  children: React.ReactNode;
  itemClassName?: string;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", loop: false, dragFree: true });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi]);

  return (
    <div className="relative">
      {canScrollPrev && (
        <button
          type="button"
          onClick={() => emblaApi?.scrollPrev()}
          className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-[var(--border)] bg-[var(--card)]/90 p-2 text-[var(--muted-foreground)] shadow hover:text-[var(--brand)]"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
      {canScrollNext && (
        <button
          type="button"
          onClick={() => emblaApi?.scrollNext()}
          className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-[var(--border)] bg-[var(--card)]/90 p-2 text-[var(--muted-foreground)] shadow hover:text-[var(--brand)]"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex gap-4 py-2">
          {Array.isArray(children)
            ? children.map((child, idx) => (
                <div key={idx} className={itemClassName}>
                  {child}
                </div>
              ))
            : (
              <div className={itemClassName}>{children}</div>
            )}
        </div>
      </div>
    </div>
  );
}

function JobsFilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="group relative inline-flex max-w-full items-center rounded-full border border-[var(--border)] bg-[var(--muted)] pl-3 pr-7 py-1 text-xs text-[var(--muted-foreground)]">
      <span className="truncate">{label}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute right-1 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[var(--muted-foreground)] opacity-100 transition-opacity hover:bg-[var(--background)] hover:text-[var(--foreground)] focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100"
        aria-label="Bỏ lọc này"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function JobsPageContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  const q = sp.get("q") || undefined;
  const location = sp.get("location") || undefined;
  const ward = sp.get("ward") || undefined;
  const companyId = sp.get("companyId") || undefined;
  const remote = sp.get("remote") === "true" ? true : undefined;
  const employmentType = sp.get("employmentType") || undefined;
  const experienceLevel = sp.get("experienceLevel") || undefined;
  const jobLevel = sp.get("jobLevel") || undefined;
  const salaryMin = parseSalaryValueParam(sp.get("salaryMin"));
  const salaryMax = parseSalaryValueParam(sp.get("salaryMax"));
  const salaryUnit = parseSalaryUnit(sp.get("salaryUnit"));
  const salaryUnitMeta = SALARY_UNIT_OPTIONS.find((option) => option.value === salaryUnit) || SALARY_UNIT_OPTIONS[1];

  const hasActiveFilters = Boolean(
    q ||
      location ||
      ward ||
      companyId ||
      remote === true ||
      employmentType ||
      experienceLevel ||
      jobLevel ||
      salaryMin !== undefined ||
      salaryMax !== undefined,
  );
  const hasAdvancedFilters = Boolean(
    employmentType || experienceLevel || jobLevel || salaryMin !== undefined || salaryMax !== undefined,
  );
  const advancedFilterCount =
    [employmentType, experienceLevel, jobLevel].filter(Boolean).length +
    (salaryMin !== undefined || salaryMax !== undefined ? 1 : 0);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(hasAdvancedFilters);
  const page = Number(sp.get("page") || "1");
  const limit = 12;
  const featuredPage = Number(sp.get("featuredPage") || "1");
  const featuredLimit = 12;

  const { data, isLoading, isFetching } = useQuery<{ jobs: Job[]; pagination: any }>({
    queryKey: ["jobs", { q, location, ward, remote, employmentType, experienceLevel, jobLevel, salaryMin, salaryMax, companyId, page }],
    queryFn: async () => {
      const res = await api.get("/api/jobs", {
        params: {
          limit,
          page,
          q,
          location,
          ward,
          companyId,
          remote,
          employmentType,
          experienceLevel,
          jobLevel,
          salaryMin,
          salaryMax,
        },
      });
      return res.data.data;
    },
    // Keep previous list while fetching new params (avoid full re-render + scroll jump)
    placeholderData: (prev) => prev,
  });

  const { data: featuredData, isLoading: featuredLoading, isFetching: featuredFetching } = useQuery<{ jobs: Job[]; pagination: any }>({
    queryKey: ["jobs-featured", featuredPage],
    queryFn: async () => {
      const res = await api.get("/api/jobs", {
        params: { limit: featuredLimit, page: featuredPage },
      });
      return res.data.data;
    },
    placeholderData: (prev) => prev,
  });

  const { data: featuredCompaniesData } = useQuery<{ companies: HomepageShowcaseCompany[] }>({
    queryKey: ["homepage-showcase-companies", "FEATURED"],
    queryFn: async () => {
      const res = await api.get("/api/companies/showcase/homepage", {
        params: { type: "FEATURED", limit: 12 },
      });
      return res.data.data;
    },
  });

  const { data: topCompaniesData } = useQuery<{ companies: HomepageShowcaseCompany[] }>({
    queryKey: ["homepage-showcase-companies", "TOP"],
    queryFn: async () => {
      const res = await api.get("/api/companies/showcase/homepage", {
        params: { type: "TOP", limit: 16 },
      });
      return res.data.data;
    },
  });

  useEffect(() => {
    if (hasAdvancedFilters) {
      setShowAdvancedFilters(true);
    }
  }, [hasAdvancedFilters]);

  const { data: wardsForFilterChip = [] } = useQuery({
    queryKey: ["job-search-ward-labels", location],
    queryFn: () => fetchWardsByProvinceCodes(location ? [location] : []),
    enabled: Boolean(location && ward),
  });

  const wardDisplayName = useMemo(() => {
    if (!ward) return "";
    const row = wardsForFilterChip.find((w) => w.code === ward);
    return row ? (row.fullName ?? row.name) : ward;
  }, [ward, wardsForFilterChip]);

  const applyParams = (params: URLSearchParams) => {
    const query = params.toString();
    // Don't scroll to top when changing query params
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const toggleParam = (key: string, value?: string, opts?: { resetPage?: boolean }) => {
    const next = new URLSearchParams(sp.toString());
    if (!value) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    if (opts?.resetPage) {
      next.delete("page");
    }
    applyParams(next);
  };

  const handleFeaturedPageChange = (newPage: number) => {
    toggleParam("featuredPage", String(newPage));
  };

  const handlePageChange = (newPage: number) => {
    toggleParam("page", String(newPage));
  };

  const clearAllFilters = () => {
    const next = new URLSearchParams(sp.toString());
    ["q", "location", "ward", "companyId", "remote", "employmentType", "experienceLevel", "jobLevel", "salaryMin", "salaryMax", "salaryUnit", "page"].forEach((key) =>
      next.delete(key),
    );
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
        return level;
    }
  };

  const translateJobLevel = (level: string) => {
    switch (level) {
      case "INTERN_STUDENT":
        return "Thực tập sinh / Sinh viên";
      case "FRESH_GRAD":
        return "Mới tốt nghiệp";
      case "EMPLOYEE":
        return "Nhân viên";
      case "SPECIALIST_TEAM_LEAD":
        return "Chuyên viên / Trưởng nhóm";
      case "MANAGER_HEAD":
        return "Quản lý / Trưởng phòng";
      case "DIRECTOR":
        return "Giám đốc";
      case "EXECUTIVE":
        return "Điều hành";
      default:
        return level;
    }
  };

  const convertFromBaseSalary = (value: number) => value / salaryUnitMeta.multiplier;
  const convertToBaseSalary = (value: number) => Math.round(value * salaryUnitMeta.multiplier);
  const salaryMinDisplay = salaryMin !== undefined ? formatSalaryInputValue(convertFromBaseSalary(salaryMin)) : "";
  const salaryMaxDisplay = salaryMax !== undefined ? formatSalaryInputValue(convertFromBaseSalary(salaryMax)) : "";

  const updateSalaryParam = (key: "salaryMin" | "salaryMax", rawValue: string) => {
    const next = new URLSearchParams(sp.toString());
    const trimmed = rawValue.trim();
    if (!trimmed) {
      next.delete(key);
    } else {
      const parsed = Number(trimmed);
      if (!Number.isFinite(parsed) || parsed < 0) return;
      next.set(key, String(convertToBaseSalary(parsed)));
    }
    next.delete("page");
    applyParams(next);
  };

  const salaryFilterLabel = useMemo(() => {
    if (salaryMin === undefined && salaryMax === undefined) return "";
    const fromLabel = salaryMin !== undefined ? formatSalaryFilterValue(salaryMin / salaryUnitMeta.multiplier) : undefined;
    const toLabel = salaryMax !== undefined ? formatSalaryFilterValue(salaryMax / salaryUnitMeta.multiplier) : undefined;
    if (fromLabel && toLabel) return `Mức lương: ${fromLabel} - ${toLabel} ${salaryUnitMeta.shortLabel}`;
    if (fromLabel) return `Mức lương: từ ${fromLabel} ${salaryUnitMeta.shortLabel}`;
    if (toLabel) return `Mức lương: đến ${toLabel} ${salaryUnitMeta.shortLabel}`;
    return "";
  }, [salaryMin, salaryMax, salaryUnitMeta]);

  const clearLocationAndWard = () => {
    const next = new URLSearchParams(sp.toString());
    next.delete("location");
    next.delete("ward");
    next.delete("page");
    applyParams(next);
  };

  const totalPages = data?.pagination?.totalPages ?? 1;
  const featuredTotalPages = featuredData?.pagination?.totalPages ?? 1;
  const featuredCompanies = featuredCompaniesData?.companies ?? [];
  const topCompanies = topCompaniesData?.companies ?? [];

  // Helper function to format salary
  const formatSalary = (job: Job) => {
    if (job.salaryMin || job.salaryMax) {
      if (job.salaryMin && job.salaryMax) {
        return `${job.salaryMin.toLocaleString("vi-VN")} - ${job.salaryMax.toLocaleString("vi-VN")} ${job.currency || "VND"}`;
      } else if (job.salaryMin) {
        return `${job.salaryMin.toLocaleString("vi-VN")} ${job.currency || "VND"}`;
      } else if (job.salaryMax) {
        return `${job.salaryMax.toLocaleString("vi-VN")} ${job.currency || "VND"}`;
      }
    }
    return job.benefitsIncome || "Thương lượng";
  };

  // Helper function to format location
  const formatLocation = (job: Job) => {
    if (job.remote) return "Làm việc từ xa";
    return job.location || "Không ghi rõ";
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Tìm kiếm việc làm</h1>
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
          <div className="flex items-center gap-2">
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
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Bộ lọc</h3>
              {hasActiveFilters ? (
                <span className="rounded-full border border-[var(--border)] bg-[var(--muted)] px-2 py-0.5 text-xs font-medium text-[var(--muted-foreground)]">
                  Đang áp dụng
                </span>
              ) : null}
            </div>
            {hasActiveFilters ? (
              <button
                className="text-xs font-medium text-[var(--brand)] hover:underline"
                onClick={clearAllFilters}
              >
                Xoá tất cả
              </button>
            ) : null}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-1.5 text-sm">
              <div className="font-medium">Từ khoá</div>
              <Input
                defaultValue={q ?? ""}
                placeholder="Tìm theo tiêu đề và nội dung JD (sứ mệnh, nhiệm vụ, kỹ năng...)"
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  const value = (e.currentTarget.value ?? "").trim();
                  toggleParam("q", value || undefined, { resetPage: true });
                }}
                onBlur={(e) => {
                  const value = (e.currentTarget.value ?? "").trim();
                  // tránh replace liên tục nếu không thay đổi
                  if ((q ?? "") === value) return;
                  toggleParam("q", value || undefined, { resetPage: true });
                }}
              />
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="font-medium">Tỉnh/thành</div>
              <ProvinceSelect
                value={location ?? null}
                onChange={(value) => {
                  const next = new URLSearchParams(sp.toString());
                  if (value) {
                    next.set("location", value);
                    const w = next.get("ward");
                    if (w && w.split("/")[0] !== value) next.delete("ward");
                  } else {
                    next.delete("location");
                    next.delete("ward");
                  }
                  next.delete("page");
                  applyParams(next);
                }}
              />
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="font-medium">Phường / xã</div>
              <WardSelect
                provinceCodes={location ? [location] : []}
                disabled={!location}
                values={ward ? [ward] : []}
                onChangeValues={(vals) => {
                  const v = vals.length ? vals[vals.length - 1] : undefined;
                  toggleParam("ward", v, { resetPage: true });
                }}
                placeholder={location ? "Lọc theo phường/xã (tuỳ chọn)" : "Chọn tỉnh/thành trước"}
              />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => setShowAdvancedFilters((prev) => !prev)}
            >
              {showAdvancedFilters ? "Ẩn lọc nâng cao" : "Lọc nâng cao"}
              {hasAdvancedFilters ? ` (${advancedFilterCount})` : ""}
            </Button>
          </div>
          {showAdvancedFilters ? (
            <div className="mt-4 grid gap-3 border-t border-[var(--border)] pt-4 md:grid-cols-2 xl:grid-cols-4">
            {/*
            <div className="space-y-1.5 text-sm">
              <div className="font-medium">Doanh nghiệp</div>
              <CompanySearch value={companyId} onSelect={(id) => toggleParam("companyId", id, { resetPage: true })} />
            </div>
            */}
            {/* <div className="space-y-2 text-sm">
              <div className="font-medium">Hình thức làm việc</div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={remote === true}
                  onChange={(e) => toggleParam("remote", e.target.checked ? "true" : undefined, { resetPage: true })}
                />
                Làm việc từ xa
              </label>
            </div> */}
            <div className="space-y-1.5 text-sm">
              <div className="font-medium">Loại hợp đồng</div>
              <select
                value={employmentType ?? ""}
                onChange={(e) => toggleParam("employmentType", e.target.value || undefined, { resetPage: true })}
                className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-sm"
              >
                <option value="">Tất cả loại hợp đồng</option>
                {["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "FREELANCE"].map((t) => (
                  <option key={t} value={t}>
                    {translateEmploymentType(t)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="font-medium">Kinh nghiệm</div>
              <select
                value={experienceLevel ?? ""}
                onChange={(e) => toggleParam("experienceLevel", e.target.value || undefined, { resetPage: true })}
                className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-sm"
              >
                <option value="">Tất cả mức kinh nghiệm</option>
                {["NO_EXPERIENCE", "LT_1_YEAR", "Y1_2", "Y2_3", "Y3_5", "Y5_10", "GT_10"].map((t) => (
                  <option key={t} value={t}>
                    {translateExperienceLevel(t)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="font-medium">Cấp bậc</div>
              <select
                value={jobLevel ?? ""}
                onChange={(e) => toggleParam("jobLevel", e.target.value || undefined, { resetPage: true })}
                className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-sm"
              >
                <option value="">Tất cả cấp bậc</option>
                {["INTERN_STUDENT", "FRESH_GRAD", "EMPLOYEE", "SPECIALIST_TEAM_LEAD", "MANAGER_HEAD", "DIRECTOR", "EXECUTIVE"].map((t) => (
                  <option key={t} value={t}>
                    {translateJobLevel(t)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5 text-sm md:col-span-2 xl:col-span-2">
              <div className="font-medium">Mức lương</div>
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <Input
                  key={`salary-min-${salaryUnit}-${salaryMin ?? "empty"}`}
                  type="number"
                  min={0}
                  step="0.1"
                  defaultValue={salaryMinDisplay}
                  placeholder="Từ"
                  className="w-full md:min-w-[180px] md:flex-1"
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    updateSalaryParam("salaryMin", e.currentTarget.value || "");
                  }}
                  onBlur={(e) => {
                    if ((e.currentTarget.value || "").trim() === salaryMinDisplay) return;
                    updateSalaryParam("salaryMin", e.currentTarget.value || "");
                  }}
                />
                <Input
                  key={`salary-max-${salaryUnit}-${salaryMax ?? "empty"}`}
                  type="number"
                  min={0}
                  step="0.1"
                  defaultValue={salaryMaxDisplay}
                  placeholder="Đến"
                  className="w-full md:min-w-[180px] md:flex-1"
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    updateSalaryParam("salaryMax", e.currentTarget.value || "");
                  }}
                  onBlur={(e) => {
                    if ((e.currentTarget.value || "").trim() === salaryMaxDisplay) return;
                    updateSalaryParam("salaryMax", e.currentTarget.value || "");
                  }}
                />
                <select
                  value={salaryUnit}
                  onChange={(e) => toggleParam("salaryUnit", e.target.value, { resetPage: true })}
                  className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2 text-sm md:w-[170px] md:flex-none"
                  aria-label="Đơn vị lương"
                >
                  {SALARY_UNIT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            </div>
          ) : null}
          {hasActiveFilters ? (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-4">
              {q ? (
                <JobsFilterChip label={`Từ khoá: ${q}`} onRemove={() => toggleParam("q", undefined, { resetPage: true })} />
              ) : null}
              {location ? (
                <JobsFilterChip
                  label={`Tỉnh/thành: ${getProvinceNameByCode(location) || location}`}
                  onRemove={clearLocationAndWard}
                />
              ) : null}
              {ward ? (
                <JobsFilterChip label={`Phường/xã: ${wardDisplayName || ward}`} onRemove={() => toggleParam("ward", undefined, { resetPage: true })} />
              ) : null}
              {companyId ? (
                <JobsFilterChip label="Doanh nghiệp đã chọn" onRemove={() => toggleParam("companyId", undefined, { resetPage: true })} />
              ) : null}
              {remote === true ? (
                <JobsFilterChip label="Làm việc từ xa" onRemove={() => toggleParam("remote", undefined, { resetPage: true })} />
              ) : null}
              {employmentType ? (
                <JobsFilterChip
                  label={`Loại hợp đồng: ${translateEmploymentType(employmentType)}`}
                  onRemove={() => toggleParam("employmentType", undefined, { resetPage: true })}
                />
              ) : null}
              {experienceLevel ? (
                <JobsFilterChip
                  label={`Kinh nghiệm: ${translateExperienceLevel(experienceLevel)}`}
                  onRemove={() => toggleParam("experienceLevel", undefined, { resetPage: true })}
                />
              ) : null}
              {jobLevel ? (
                <JobsFilterChip
                  label={`Cấp bậc: ${translateJobLevel(jobLevel)}`}
                  onRemove={() => toggleParam("jobLevel", undefined, { resetPage: true })}
                />
              ) : null}
              {salaryFilterLabel ? (
                <JobsFilterChip
                  label={salaryFilterLabel}
                  onRemove={() => {
                    const next = new URLSearchParams(sp.toString());
                    next.delete("salaryMin");
                    next.delete("salaryMax");
                    next.delete("page");
                    applyParams(next);
                  }}
                />
              ) : null}
            </div>
          ) : null}
        </div>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : data?.jobs?.length ? (
          viewMode === "list" ? (
            <TooltipProvider>
              <div className="space-y-3">
                {data?.jobs?.map((j) => (
                  <Card 
                    key={j.id}
                    className="bg-white/70 border border-[var(--border)] hover:border-[var(--brand)]/40 transition-colors"
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        {/* Company Avatar */}
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[var(--muted)] border border-[var(--border)]">
                          {j.company.logoUrl ? (
                            <CompanyLogo
                              src={j.company.logoUrl}
                              alt={j.company.name}
                              className="h-full w-full object-cover"
                              width={64}
                              height={64}
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-[var(--muted-foreground)]">
                              <Building2 className="h-8 w-8" />
                            </div>
                          )}
                        </div>
                        {/* Job Info */}
                        <div className="flex-1 min-w-0 space-y-1">
                          {/* Job Title with Tooltip */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <h3 
                                className="text-base font-semibold text-[var(--foreground)] line-clamp-1 cursor-pointer hover:text-[var(--brand)] transition-colors"
                                onClick={() => window.open(`/jobs/${j.id}`, "_blank", "noopener,noreferrer")}
                              >
                                {j.title}
                              </h3>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{j.title}</p>
                            </TooltipContent>
                          </Tooltip>
                          {/* Company Legal Name with HoverCard and Link */}
                          <CompanyHoverCard companyId={j.company.id} slug={j.company.slug} companyName={j.company.name}>
                            <Link 
                              href={`/companies/${j.company.slug}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-[var(--muted-foreground)] line-clamp-1 hover:text-[var(--brand)] hover:underline"
                            >
                              {j.company.legalName || j.company.name}
                            </Link>
                          </CompanyHoverCard>
                          <p className="text-xs font-medium text-red-600 line-clamp-1">
                            {formatSalary(j)}
                          </p>
                          <p className="text-xs text-[var(--muted-foreground)] line-clamp-1">
                            {formatLocation(j)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TooltipProvider>
          ) : (
            <TooltipProvider>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data?.jobs?.map((j) => (
                  <Card 
                    key={j.id}
                    className="bg-white/70 border border-[var(--border)] hover:border-[var(--brand)]/40 transition-colors"
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        {/* Company Avatar */}
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[var(--muted)] border border-[var(--border)]">
                          {j.company.logoUrl ? (
                            <CompanyLogo
                              src={j.company.logoUrl}
                              alt={j.company.name}
                              className="h-full w-full object-cover"
                              width={64}
                              height={64}
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-[var(--muted-foreground)]">
                              <Building2 className="h-8 w-8" />
                            </div>
                          )}
                        </div>
                        {/* Job Info */}
                        <div className="flex-1 min-w-0 space-y-1">
                          {/* Job Title with Tooltip */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <h3 
                                className="text-sm font-semibold text-[var(--foreground)] line-clamp-1 cursor-pointer hover:text-[var(--brand)] transition-colors"
                                onClick={() => window.open(`/jobs/${j.id}`, "_blank", "noopener,noreferrer")}
                              >
                                {j.title}
                              </h3>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{j.title}</p>
                            </TooltipContent>
                          </Tooltip>
                          {/* Company Legal Name with HoverCard and Link */}
                          <CompanyHoverCard companyId={j.company.id} slug={j.company.slug} companyName={j.company.name}>
                            <Link 
                              href={`/companies/${j.company.slug}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-[var(--muted-foreground)] line-clamp-1 hover:text-[var(--brand)] hover:underline"
                            >
                              {j.company.legalName || j.company.name}
                            </Link>
                          </CompanyHoverCard>
                          <p className="text-xs font-medium text-red-600 line-clamp-1">
                            {formatSalary(j)}
                          </p>
                          <p className="text-xs text-[var(--muted-foreground)] line-clamp-1">
                            {formatLocation(j)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TooltipProvider>
          )
        ) : (
          <EmptyState title="Không tìm thấy việc làm" subtitle="Thử điều chỉnh bộ lọc hoặc tiêu chí tìm kiếm" />
        )}
        {totalPages > 1 ? (
          <div className="pt-4">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Khám phá công ty nổi bật</h1>
          <Button asChild variant="outline" size="sm">
            <Link href="/companies">Khám phá ngay</Link>
          </Button>
        </div>
        {featuredCompanies.length ? (
          <SimpleCarousel itemClassName="flex-[0_0_100%]">
            {featuredCompanies.map((company) => (
              <Card key={company.id} className="overflow-hidden border border-[var(--border)]">
                <div className="relative h-56 w-full">
                  {company.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- ảnh cover từ backend
                    <img
                      src={company.coverUrl}
                      alt={company.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[var(--muted)] text-xs text-[var(--muted-foreground)]">
                      Chưa có ảnh cover nổi bật
                    </div>
                  )}
                </div>
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 overflow-hidden rounded-xl bg-[var(--muted)]">
                      {company.logoUrl ? (
                        <CompanyLogo
                          src={company.logoUrl}
                          alt={`${company.name} logo`}
                          className="h-full w-full object-contain"
                          width={48}
                          height={48}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg font-bold text-[var(--foreground)]">
                          {(company.name || "?").charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{company.name}</p>
                      <p className="text-xs text-[var(--muted-foreground)] line-clamp-1">
                        {company.tagline || "Khám phá cơ hội nghề nghiệp mới cùng doanh nghiệp hàng đầu."}
                      </p>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/companies/${company.slug}`}>Xem hồ sơ</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </SimpleCarousel>
        ) : (
          <EmptyState title="Chưa có công ty nổi bật" subtitle="Danh sách sẽ được cập nhật sớm." />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Các công ty hàng đầu</h2>
        {topCompanies.length ? (
          <SimpleCarousel itemClassName="flex-[0_0_60%] sm:flex-[0_0_40%] lg:flex-[0_0_25%]">
            {topCompanies.map((company) => (
              <Card key={company.id} className="border border-[var(--border)]">
                <CardContent className="flex flex-col items-center gap-3 p-4 text-center">
                  <div className="h-20 w-20 overflow-hidden rounded-2xl bg-[var(--muted)]">
                    {company.logoUrl ? (
                      <CompanyLogo
                        src={company.logoUrl}
                        alt={company.name}
                        className="h-full w-full object-contain"
                        width={80}
                        height={80}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-[var(--foreground)]">
                        {(company.name || "?").charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="text-sm font-semibold">{company.name}</div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/companies/${company.slug}`}>Việc mới</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </SimpleCarousel>
        ) : (
          <EmptyState title="Chưa có công ty hàng đầu" subtitle="Danh sách sẽ được cập nhật sớm." />
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Việc làm mới nhất</h2>
          {/* <Button asChild variant="ghost" size="sm">
            <Link href="/jobs">Xem tất cả</Link>
          </Button> */}
        </div>
        {featuredLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <Skeleton key={idx} className="h-32 rounded-lg" />
            ))}
          </div>
        ) : featuredData?.jobs?.length ? (
          <>
            <TooltipProvider>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {featuredData.jobs.map((j) => (
                  <Card 
                    key={j.id}
                    className="border border-[var(--border)] bg-white/70 shadow-sm transition hover:shadow-md hover:border-[var(--brand)]/40"
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        {/* Company Avatar */}
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[var(--muted)] border border-[var(--border)]">
                          {j.company.logoUrl ? (
                            <CompanyLogo
                              src={j.company.logoUrl}
                              alt={j.company.name}
                              className="h-full w-full object-cover"
                              width={64}
                              height={64}
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-[var(--muted-foreground)]">
                              <Building2 className="h-8 w-8" />
                            </div>
                          )}
                        </div>
                        {/* Job Info */}
                        <div className="flex-1 min-w-0 space-y-1">
                          {/* Job Title with Tooltip */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <h3 
                                className="text-sm font-semibold text-[var(--foreground)] line-clamp-1 cursor-pointer hover:text-[var(--brand)] transition-colors"
                                onClick={() => window.open(`/jobs/${j.id}`, "_blank", "noopener,noreferrer")}
                              >
                                {j.title}
                              </h3>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{j.title}</p>
                            </TooltipContent>
                          </Tooltip>
                          {/* Company Legal Name with HoverCard and Link */}
                          <CompanyHoverCard companyId={j.company.id} slug={j.company.slug} companyName={j.company.name}>
                            <Link 
                              href={`/companies/${j.company.slug}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-[var(--muted-foreground)] line-clamp-1 hover:text-[var(--brand)] hover:underline"
                            >
                              {j.company.legalName || j.company.name}
                            </Link>
                          </CompanyHoverCard>
                          <p className="text-xs font-medium text-red-600 line-clamp-1">
                            {formatSalary(j)}
                          </p>
                          <p className="text-xs text-[var(--muted-foreground)] line-clamp-1">
                            {formatLocation(j)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TooltipProvider>
            {featuredTotalPages > 1 ? (
              <div className="pt-4">
                <Pagination
                  currentPage={featuredPage}
                  totalPages={featuredTotalPages}
                  onPageChange={handleFeaturedPageChange}
                />
              </div>
            ) : null}
          </>
        ) : (
          <EmptyState title="Chưa có việc làm nổi bật" subtitle="Vui lòng quay lại sau." />
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

