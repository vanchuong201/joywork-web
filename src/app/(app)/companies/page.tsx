"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import Link from "next/link";
import { MapPin, Settings2, Users } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";

import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import CompanyFollowButton from "@/components/company/CompanyFollowButton";
import { useAuthStore } from "@/store/useAuth";

type Membership = {
  membershipId: string;
  role: string;
  company: {
    id: string;
    name: string;
    slug: string;
    tagline?: string | null;
  };
};

type CompanyListItem = {
  id: string;
  name: string;
  slug: string;
  tagline?: string | null;
  logoUrl?: string | null;
  location?: string | null;
  industry?: string | null;
  size?: string | null;
};

type CompaniesResponse = {
  companies: CompanyListItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const PAGE_SIZE = 12;
const SIZE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Tất cả quy mô" },
  { value: "STARTUP", label: "Startup (1-20)" },
  { value: "SMALL", label: "Nhỏ (20-50)" },
  { value: "MEDIUM", label: "Vừa (50-200)" },
  { value: "LARGE", label: "Lớn (200-1000)" },
  { value: "ENTERPRISE", label: "Tập đoàn (>1000)" },
];

export default function CompaniesPage() {
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [size, setSize] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const deferredSearch = useDeferredValue(search.trim());
  const deferredIndustry = useDeferredValue(industry.trim());
  const deferredLocation = useDeferredValue(location.trim());
  const sizeParam = size || undefined;
  const advancedFiltersApplied = Boolean(industry.trim() || location.trim() || size);

  const membershipsQuery = useQuery<{ memberships: Membership[] }>({
    queryKey: ["my-companies"],
    queryFn: async () => {
      const res = await api.get("/api/companies/me/companies");
      return res.data.data;
    },
  });

  const companiesQuery = useInfiniteQuery<CompaniesResponse>({
    queryKey: [
      "companies-discover",
      { search: deferredSearch, industry: deferredIndustry, location: deferredLocation, size: sizeParam },
    ],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.get("/api/companies", {
        params: {
          q: deferredSearch || undefined,
          industry: deferredIndustry || undefined,
          location: deferredLocation || undefined,
          size: sizeParam,
          page: pageParam,
          limit: PAGE_SIZE,
        },
      });
      return res.data.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const current = lastPage?.pagination?.page ?? 1;
      const totalPages = lastPage?.pagination?.totalPages ?? 1;
      return current < totalPages ? current + 1 : undefined;
    },
  });

  const [ref, inView] = useInView({ rootMargin: "240px" });

  useEffect(() => {
    if (inView && companiesQuery.hasNextPage && !companiesQuery.isFetchingNextPage) {
      companiesQuery.fetchNextPage();
    }
  }, [companiesQuery, inView]);

  const companies = useMemo(
    () => companiesQuery.data?.pages.flatMap((page) => page?.companies ?? []) ?? [],
    [companiesQuery.data],
  );

  const memberships = membershipsQuery.data?.memberships ?? [];
  const clearAdvancedFilters = () => {
    setIndustry("");
    setLocation("");
    setSize("");
  };

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Công ty của tôi</h2>
          <Button asChild size="sm" variant="secondary">
            <Link href="/companies/new">+ Tạo công ty</Link>
          </Button>
        </div>

        {membershipsQuery.isLoading ? (
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 2 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full rounded-md md:w-64" />
            ))}
          </div>
        ) : memberships.length ? (
          <div className="flex flex-wrap gap-3">
            {memberships.map((membership) => (
              <Card
                key={membership.membershipId}
                className="flex w-full flex-col justify-between rounded-lg border border-dashed border-[var(--border)] bg-[var(--card)] p-4 text-sm md:w-[240px]"
              >
                <div className="space-y-1">
                  <Link
                    href={`/companies/${membership.company.slug}`}
                    className="line-clamp-2 text-sm font-semibold text-[var(--foreground)] hover:text-[var(--brand)]"
                  >
                    {membership.company.name}
                  </Link>
                  {membership.company.tagline ? (
                    <p className="text-xs text-[var(--muted-foreground)] line-clamp-2">{membership.company.tagline}</p>
                  ) : null}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                  <span className="rounded-full bg-[var(--brand)]/10 px-2 py-0.5 font-medium text-[var(--brand)] uppercase">
                    {membership.role}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/companies/${membership.company.slug}`}>Xem</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/companies/${membership.company.slug}/manage`}>Quản trị</Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--card)] p-4 text-xs text-[var(--muted-foreground)]">
            <p className="font-medium text-[var(--foreground)]">Bạn chưa tham gia công ty nào.</p>
            <p className="mt-1">
              Nếu bạn là chủ doanh nghiệp, hãy tạo hồ sơ công ty để thu hút ứng viên và quản lý hoạt động tuyển dụng.
            </p>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-[var(--foreground)]">Khám phá doanh nghiệp</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Tìm hiểu văn hoá, hoạt động và các cơ hội việc làm từ các công ty trên JoyWork.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center gap-3 md:justify-start">
          <div className="w-full flex-1 min-w-[260px] md:max-w-xl">
            <Input
              placeholder="Tìm theo tên, tagline..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Popover.Root open={filtersOpen} onOpenChange={setFiltersOpen}>
            <Popover.Trigger asChild>
              <Button
                variant={advancedFiltersApplied ? "secondary" : "outline"}
                size="sm"
                className="flex h-10 shrink-0 items-center gap-2 rounded-md border border-[var(--border)] px-4 text-sm font-medium md:w-[150px] md:justify-center"
              >
                <Settings2 className="h-4 w-4" />
                Bộ lọc nâng cao
                {advancedFiltersApplied ? (
                  <span className="ml-1 inline-flex h-2 w-2 rounded-full bg-[var(--brand)]" />
                ) : null}
              </Button>
            </Popover.Trigger>
            <Popover.Content className="z-50 mt-2 w-[320px] rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 shadow-xl">
              <div className="space-y-4 text-sm">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Ngành nghề</label>
                  <Input
                    placeholder="Ví dụ: Fintech"
                    value={industry}
                    onChange={(event) => setIndustry(event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Địa điểm</label>
                  <Input
                    placeholder="Ví dụ: Hà Nội"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Quy mô</label>
                  <select
                    value={size}
                    onChange={(event) => setSize(event.target.value)}
                    className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)] outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
                  >
                    {SIZE_OPTIONS.map((option) => (
                      <option key={option.value || "all"} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-between pt-2">
                  {advancedFiltersApplied ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        clearAdvancedFilters();
                        setFiltersOpen(false);
                      }}
                    >
                      Xoá bộ lọc
                    </Button>
                  ) : (
                    <span />
                  )}
                  <Button size="sm" onClick={() => setFiltersOpen(false)}>
                    Đóng
                  </Button>
                </div>
              </div>
            </Popover.Content>
          </Popover.Root>
        </div>

        {companiesQuery.isLoading ? (
          <CompanySkeletonGrid />
        ) : companies.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {companies.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        ) : companiesQuery.isFetching ? (
          <CompanySkeletonGrid />
        ) : (
          <EmptyState
            title="Không tìm thấy doanh nghiệp phù hợp"
            subtitle="Thử điều chỉnh từ khoá hoặc khám phá các ngành nghề khác."
          />
        )}

        {companiesQuery.hasNextPage ? (
          <div ref={ref} className="flex justify-center py-4 text-xs text-[var(--muted-foreground)]">
            {companiesQuery.isFetchingNextPage ? "Đang tải thêm doanh nghiệp..." : "Cuộn xuống để xem thêm"}
          </div>
        ) : null}
      </section>

    </div>
  );
}

function CompanySkeletonGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="border-dashed">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CompanyCard({ company }: { company: CompanyListItem }) {
  return (
    <Card className="flex h-full flex-col border border-[var(--border)] bg-[var(--card)]">
      <CardHeader className="flex flex-row items-start gap-3 pb-3">
        <CompanyAvatar name={company.name} logoUrl={company.logoUrl} />
        <div className="space-y-1">
          <Link
            href={`/companies/${company.slug}`}
            className="text-base font-semibold text-[var(--foreground)] hover:text-[var(--brand)]"
          >
            {company.name}
          </Link>
          {company.tagline ? (
            <p className="text-xs text-[var(--muted-foreground)] line-clamp-2">{company.tagline}</p>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="mt-auto space-y-4 text-sm text-[var(--muted-foreground)]">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted-foreground)]">
          {company.industry ? (
            <Badge className="bg-[var(--muted)] text-[var(--foreground)]">{company.industry}</Badge>
          ) : null}
          {company.location ? (
            <span className="inline-flex items-center gap-1">
              <MapPin size={14} /> {company.location}
            </span>
          ) : null}
          {company.size ? (
            <span className="inline-flex items-center gap-1">
              <Users size={14} /> {translateCompanySize(company.size)}
            </span>
          ) : null}
        </div>
        <div className="flex items-center justify-between">
          <Link
            href={`/companies/${company.slug}`}
            className="text-xs text-[var(--brand)] underline-offset-4 hover:underline"
          >
            Xem chi tiết
          </Link>
          <CompanyFollowButton companyId={company.id} companySlug={company.slug} className="shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}

function CompanyAvatar({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  if (logoUrl) {
    return (
      <div className="h-12 w-12 overflow-hidden rounded-xl border border-[var(--border)] bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} alt={name} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--muted)] text-base font-semibold text-[var(--muted-foreground)]">
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function translateCompanySize(size?: string | null) {
  switch (size) {
    case "STARTUP":
      return "Startup (1-20)";
    case "SMALL":
      return "Nhỏ (20-50)";
    case "MEDIUM":
      return "Vừa (50-200)";
    case "LARGE":
      return "Lớn (200-1000)";
    case "ENTERPRISE":
      return "Tập đoàn (>1000)";
    default:
      return "Quy mô đang cập nhật";
  }
}


