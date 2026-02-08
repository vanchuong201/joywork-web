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
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import JobSaveButton from "@/components/jobs/JobSaveButton";
import { ChevronDown, List, Grid, ChevronLeft, ChevronRight, SlidersHorizontal, Building2 } from "lucide-react";
import CompanyHoverCard from "@/components/company/CompanyHoverCard";
import CompanyFollowButton from "@/components/company/CompanyFollowButton";
import { useAuthStore } from "@/store/useAuth";
import { cn } from "@/lib/utils";
import useEmblaCarousel from "embla-carousel-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Pagination } from "@/components/ui/pagination";

type Job = {
  id: string;
  title: string;
  location?: string;
  remote: boolean;
  employmentType: string;
  experienceLevel: string;
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

type MockCompany = {
  id: string;
  name: string;
  slug: string;
  bannerUrl: string;
  logoUrl: string;
  tagline: string;
};

const MOCK_COMPANIES: MockCompany[] = [
  {
    id: "momo",
    name: "MoMo",
    slug: "momo",
    bannerUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1600&auto=format&fit=crop",
    logoUrl: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?q=80&w=400&auto=format&fit=crop",
    tagline: "Become the Next Generation of MoMo Leaders",
  },
  {
    id: "vinfast",
    name: "VinFast",
    slug: "vinfast",
    bannerUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop",
    logoUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=400&auto=format&fit=crop",
    tagline: "Empower the next wave of mobility",
  },
  {
    id: "techcombank",
    name: "Techcombank",
    slug: "techcombank",
    bannerUrl: "https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?q=80&w=1600&auto=format&fit=crop",
    logoUrl: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=400&auto=format&fit=crop",
    tagline: "Vì một Việt Nam vượt trội",
  },
  {
    id: "vpbank",
    name: "VPBank",
    slug: "vpbank",
    bannerUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1600&auto=format&fit=crop",
    logoUrl: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=400&auto=format&fit=crop",
    tagline: "Vì một Việt Nam thịnh vượng",
  },
  {
    id: "fpt",
    name: "FPT Software",
    slug: "fpt-software",
    bannerUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1600&auto=format&fit=crop",
    logoUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=400&auto=format&fit=crop",
    tagline: "Build the future with technology",
  },
  {
    id: "vietcombank",
    name: "Vietcombank",
    slug: "vietcombank",
    bannerUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1600&auto=format&fit=crop",
    logoUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=400&auto=format&fit=crop",
    tagline: "Chung niềm tin vững tương lai",
  },
  {
    id: "viettel",
    name: "Viettel",
    slug: "viettel",
    bannerUrl: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=1600&auto=format&fit=crop",
    logoUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=400&auto=format&fit=crop",
    tagline: "Kết nối giá trị mới",
  },
  {
    id: "vinamilk",
    name: "Vinamilk",
    slug: "vinamilk",
    bannerUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1600&auto=format&fit=crop",
    logoUrl: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=400&auto=format&fit=crop",
    tagline: "Vươn cao Việt Nam",
  },
  {
    id: "vnpt",
    name: "VNPT",
    slug: "vnpt",
    bannerUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1600&auto=format&fit=crop",
    logoUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=400&auto=format&fit=crop",
    tagline: "Cuộc sống đích thực",
  },
  {
    id: "microsoft",
    name: "Microsoft",
    slug: "microsoft",
    bannerUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1600&auto=format&fit=crop",
    logoUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=400&auto=format&fit=crop",
    tagline: "Empower every person on the planet",
  },
];

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

function JobsPageContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  const q = sp.get("q") || undefined;
  const location = sp.get("location") || undefined;
  const skills = sp.get("skills") || undefined;
  const companyId = sp.get("companyId") || undefined;
  const remote = sp.get("remote") === "true" ? true : undefined;
  const employmentType = sp.get("employmentType") || undefined;
  const experienceLevel = sp.get("experienceLevel") || undefined;

  const hasActiveFilters = Boolean(q || location || skills || companyId || remote === true || employmentType || experienceLevel);

  const [filtersOpen, setFiltersOpen] = useState(hasActiveFilters);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const page = Number(sp.get("page") || "1");
  const limit = 12;
  const featuredPage = Number(sp.get("featuredPage") || "1");
  const featuredLimit = 12;

  useEffect(() => {
    if (hasActiveFilters) {
      setFiltersOpen(true);
    }
  }, [hasActiveFilters]);

  const { data, isLoading, isFetching } = useQuery<{ jobs: Job[]; pagination: any }>({
    queryKey: ["jobs", { q, location, skills, remote, employmentType, experienceLevel, companyId, page }],
    queryFn: async () => {
      const res = await api.get("/api/jobs", {
        params: {
          limit,
          page,
          q,
          location,
          skills,
          companyId,
          remote,
          employmentType,
          experienceLevel,
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
    ["q", "location", "skills", "companyId", "remote", "employmentType", "experienceLevel", "page"].forEach((key) =>
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

  const activeFilterLabels = useMemo(
    () =>
      [
        q ? `Từ khoá: ${q}` : null,
        location ? `Địa điểm: ${location}` : null,
        skills ? `Kỹ năng: ${skills}` : null,
        companyId ? "Đang lọc theo doanh nghiệp" : null,
        remote === true ? "Làm việc từ xa" : null,
        employmentType ? `Loại: ${translateEmploymentType(employmentType)}` : null,
        experienceLevel ? `Kinh nghiệm: ${translateExperienceLevel(experienceLevel)}` : null,
      ].filter(Boolean) as string[],
    [q, location, skills, companyId, remote, employmentType, experienceLevel],
  );

  const totalPages = data?.pagination?.totalPages ?? 1;
  const featuredTotalPages = featuredData?.pagination?.totalPages ?? 1;

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
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Khám phá công ty nổi bật</h1>
          <Button asChild variant="outline" size="sm">
            <Link href="/companies">Khám phá ngay</Link>
          </Button>
        </div>
        <SimpleCarousel itemClassName="flex-[0_0_100%]">
          {MOCK_COMPANIES.map((company) => (
            <Card key={company.id} className="overflow-hidden border border-[var(--border)]">
              <div className="relative h-56 w-full">
                <img src={company.bannerUrl} alt={company.name} className="h-full w-full object-cover" />
              </div>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-xl bg-[var(--muted)]">
                    <img src={company.logoUrl} alt={`${company.name} logo`} className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{company.name}</p>
                    <p className="text-xs text-[var(--muted-foreground)] line-clamp-1">{company.tagline}</p>
                  </div>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/companies/${company.slug}`}>Xem hồ sơ</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </SimpleCarousel>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Các công ty hàng đầu</h2>
        <SimpleCarousel itemClassName="flex-[0_0_60%] sm:flex-[0_0_40%] lg:flex-[0_0_25%]">
          {MOCK_COMPANIES.map((company) => (
            <Card key={company.id} className="border border-[var(--border)]">
              <CardContent className="flex flex-col items-center gap-3 p-4 text-center">
                <div className="h-20 w-20 overflow-hidden rounded-2xl bg-[var(--muted)]">
                  <img src={company.logoUrl} alt={company.name} className="h-full w-full object-cover" />
                </div>
                <div className="text-sm font-semibold">{company.name}</div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/companies/${company.slug}`}>Việc mới</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </SimpleCarousel>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Việc làm tốt nhất</h2>
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
                            <img 
                              src={j.company.logoUrl} 
                              alt={j.company.name} 
                              className="h-full w-full object-cover"
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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen((open) => !open)}
              className={cn("h-9 w-9", filtersOpen && "border-[var(--brand)] text-[var(--brand)]")}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
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
        {filtersOpen ? (
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
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2 text-sm">
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
                {q ? (
                  <button className="text-xs text-[var(--brand)] hover:underline" onClick={() => toggleParam("q", undefined, { resetPage: true })}>
                    Xoá từ khoá
                  </button>
                ) : null}
              </div>
              <div className="space-y-2 text-sm">
                <div className="font-medium">Địa điểm</div>
                <Input
                  defaultValue={location ?? ""}
                  placeholder="VD: Hà Nội, HCM, Đà Nẵng..."
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    const value = (e.currentTarget.value ?? "").trim();
                    toggleParam("location", value || undefined, { resetPage: true });
                  }}
                  onBlur={(e) => {
                    const value = (e.currentTarget.value ?? "").trim();
                    if ((location ?? "") === value) return;
                    toggleParam("location", value || undefined, { resetPage: true });
                  }}
                />
                {location ? (
                  <button className="text-xs text-[var(--brand)] hover:underline" onClick={() => toggleParam("location", undefined, { resetPage: true })}>
                    Xoá địa điểm
                  </button>
                ) : null}
              </div>
              <div className="space-y-2 text-sm">
                <div className="font-medium">Kỹ năng</div>
                <Input
                  defaultValue={skills ?? ""}
                  placeholder="VD: react, nextjs, nodejs (ngăn cách bằng dấu phẩy)"
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    const value = (e.currentTarget.value ?? "").trim();
                    toggleParam("skills", value || undefined, { resetPage: true });
                  }}
                  onBlur={(e) => {
                    const value = (e.currentTarget.value ?? "").trim();
                    if ((skills ?? "") === value) return;
                    toggleParam("skills", value || undefined, { resetPage: true });
                  }}
                />
                {skills ? (
                  <button className="text-xs text-[var(--brand)] hover:underline" onClick={() => toggleParam("skills", undefined, { resetPage: true })}>
                    Xoá kỹ năng
                  </button>
                ) : null}
              </div>
              <div className="space-y-2 text-sm">
                <div className="font-medium">Doanh nghiệp</div>
                <CompanySearch value={companyId} onSelect={(id) => toggleParam("companyId", id, { resetPage: true })} />
                {companyId ? (
                  <button
                    className="text-xs text-[var(--brand)] hover:underline"
                    onClick={() => toggleParam("companyId", undefined, { resetPage: true })}
                  >
                    Bỏ chọn doanh nghiệp
                  </button>
                ) : null}
              </div>
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
              <div className="space-y-2 text-sm">
                <div className="font-medium">Loại hợp đồng</div>
                <div className="space-y-1">
                  {["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "FREELANCE"].map((t) => (
                    <label key={t} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="employmentType"
                        checked={employmentType === t}
                        onChange={() => toggleParam("employmentType", t, { resetPage: true })}
                      />
                      {translateEmploymentType(t)}
                    </label>
                  ))}
                </div>
                <button
                  className="text-xs text-[var(--brand)] hover:underline"
                  onClick={() => toggleParam("employmentType", undefined, { resetPage: true })}
                >
                  Bỏ chọn
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="font-medium">Kinh nghiệm</div>
                <div className="space-y-1">
                  {["NO_EXPERIENCE", "LT_1_YEAR", "Y1_2", "Y2_3", "Y3_5", "Y5_10", "GT_10"].map((t) => (
                    <label key={t} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="experienceLevel"
                        checked={experienceLevel === t}
                        onChange={() => toggleParam("experienceLevel", t, { resetPage: true })}
                      />
                      {translateExperienceLevel(t)}
                    </label>
                  ))}
                </div>
                <button
                  className="text-xs text-[var(--brand)] hover:underline"
                  onClick={() => toggleParam("experienceLevel", undefined, { resetPage: true })}
                >
                  Bỏ chọn
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {!filtersOpen && activeFilterLabels.length ? (
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted-foreground)]">
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
                            <img 
                              src={j.company.logoUrl} 
                              alt={j.company.name} 
                              className="h-full w-full object-cover"
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
                            <img 
                              src={j.company.logoUrl} 
                              alt={j.company.name} 
                              className="h-full w-full object-cover"
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

