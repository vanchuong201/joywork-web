"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Settings2, Users, Settings, Crown, ShieldCheck, User } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";

import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import CompanyFollowButton from "@/components/company/CompanyFollowButton";
import { CompanyLogo } from "@/components/company/CompanyLogo";
import { useAuthStore } from "@/store/useAuth";
import { COMPANY_SIZE_OPTIONS, getCompanySizeLabel } from "@/lib/company-size";
import ProvinceSelect from "@/components/ui/province-select";
import IndustrySelect from "@/components/ui/industry-select";
import { getProvinceDisplayLabel } from "@/lib/provinces";

type Membership = {
  membershipId: string;
  role: string;
  company: {
    id: string;
    name: string;
    slug: string;
    tagline?: string | null;
    logoUrl?: string | null;
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
const SIZE_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Tất cả quy mô" },
  ...COMPANY_SIZE_OPTIONS.map((band) => ({ value: band, label: `${band} nhân viên` })),
];

export default function CompaniesPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("");
  /** Mã tỉnh/thành (theo registry), khớp query `location` của API */
  const [locationCode, setLocationCode] = useState<string | null>(null);
  const [size, setSize] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const deferredSearch = useDeferredValue(search.trim());
  const deferredIndustry = useDeferredValue(industry.trim());
  const deferredLocationCode = useDeferredValue(locationCode);
  const sizeParam = size || undefined;
  const advancedFiltersApplied = Boolean(industry.trim() || locationCode || size);

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
      { search: deferredSearch, industry: deferredIndustry, location: deferredLocationCode ?? undefined, size: sizeParam },
    ],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.get("/api/companies", {
        params: {
          q: deferredSearch || undefined,
          industry: deferredIndustry || undefined,
          location: deferredLocationCode || undefined,
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
  const createCompanyHref = user ? "/companies/new" : `/login?redirect=${encodeURIComponent("/companies/new")}`;
  const clearAdvancedFilters = () => {
    setIndustry("");
    setLocationCode(null);
    setSize("");
  };

  const activeFilterLabels = useMemo(() => {
    const items: string[] = [];
    if (industry.trim()) items.push(industry.trim());
    if (locationCode) items.push(getProvinceDisplayLabel(locationCode));
    if (size) items.push(getCompanySizeLabel(size) ?? size);
    return items;
  }, [industry, locationCode, size]);

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Công ty của tôi</h2>
          <Button asChild size="sm" variant="secondary">
            <Link href={createCompanyHref}>+ Tạo công ty</Link>
          </Button>
        </div>

        {membershipsQuery.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 2 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : memberships.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {memberships.map((membership) => {
              const RoleIcon = membership.role === 'OWNER' ? Crown : membership.role === 'ADMIN' ? ShieldCheck : User;
              const roleLabel = membership.role === 'OWNER' ? 'Chủ sở hữu' : membership.role === 'ADMIN' ? 'Quản trị viên' : 'Thành viên';
              return (
                <div
                  key={membership.membershipId}
                  role="link"
                  tabIndex={0}
                  onClick={() => router.push(`/companies/${membership.company.slug}/manage`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/companies/${membership.company.slug}/manage`);
                    }
                  }}
                  className="group flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3.5 transition-all hover:border-[var(--brand)]/30 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                >
                  <CompanyAvatar name={membership.company.name} logoUrl={membership.company.logoUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--foreground)] group-hover:text-[var(--brand)] transition-colors">
                      {membership.company.name}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                      <RoleIcon className="h-3 w-3 shrink-0" />
                      <span>{roleLabel}</span>
                    </div>
                  </div>
                  <Button
                    asChild
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link href={`/companies/${membership.company.slug}/manage`} title="Quản trị">
                      <Settings className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-5 text-sm text-[var(--muted-foreground)]">
            <p className="font-medium text-[var(--foreground)]">Bạn chưa tham gia công ty nào.</p>
            <p className="mt-1 text-xs">
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
              Tìm hiểu văn hoá, hoạt động và các cơ hội việc làm từ các công ty trên JOYWORK.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center md:justify-start">
          <div className="w-full flex-1 min-w-[260px] md:max-w-xl">
            <Input
              placeholder="Tìm theo tên doanh nghiệp..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Popover.Root open={filtersOpen} onOpenChange={setFiltersOpen}>
            <Popover.Trigger asChild>
              <Button
                variant={advancedFiltersApplied ? "secondary" : "outline"}
                size="sm"
                className="flex h-10 shrink-0 items-center gap-2 rounded-md border border-[var(--border)] px-4 text-sm font-medium sm:w-auto md:min-w-[160px] md:justify-center"
              >
                <Settings2 className="h-4 w-4 shrink-0" />
                <span className="truncate">Bộ lọc nâng cao</span>
                {advancedFiltersApplied ? (
                  <span className="ml-0.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--brand)] px-1 text-[10px] font-bold text-white">
                    {activeFilterLabels.length}
                  </span>
                ) : null}
              </Button>
            </Popover.Trigger>
            <Popover.Content
              align="end"
              sideOffset={8}
              className="z-50 flex w-[min(100vw-1.5rem,22rem)] max-h-[min(75vh,28rem)] flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] p-0 shadow-xl"
            >
              <div className="border-b border-[var(--border)] px-4 py-3">
                <p className="text-sm font-semibold text-[var(--foreground)]">Lọc doanh nghiệp</p>
                <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                  Chọn ngành và tỉnh/thành từ danh sách để kết quả khớp dữ liệu hồ sơ.
                </p>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 text-sm">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                    Ngành nghề
                  </label>
                  <IndustrySelect
                    id="companies-discover-industry"
                    value={industry.trim() ? industry : null}
                    onChange={(v) => setIndustry(v ?? "")}
                    placeholder="Chọn ngành nghề"
                    className="w-full [&_button]:min-h-10 [&_button]:w-full [&_button]:rounded-md [&_button]:border [&_button]:border-[var(--border)] [&_button]:bg-[var(--input)] [&_button]:text-[var(--foreground)]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                    Địa điểm
                  </label>
                  <p className="text-xs text-[var(--muted-foreground)]">Chỉ lọc theo tỉnh / thành phố trụ sở.</p>
                  <ProvinceSelect
                    value={locationCode}
                    onChange={(code) => setLocationCode(code)}
                    placeholder="Tất cả tỉnh / thành phố"
                    className="w-full [&_button]:min-h-10 [&_button]:w-full [&_button]:rounded-md [&_button]:border [&_button]:border-[var(--border)] [&_button]:bg-[var(--input)] [&_button]:text-[var(--foreground)]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                    Quy mô nhân sự
                  </label>
                  <select
                    value={size}
                    onChange={(event) => setSize(event.target.value)}
                    className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)] outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
                  >
                    {SIZE_FILTER_OPTIONS.map((option) => (
                      <option key={option.value || "all"} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] bg-[var(--muted)]/25 px-4 py-3">
                {advancedFiltersApplied ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    onClick={() => {
                      clearAdvancedFilters();
                    }}
                  >
                    Xoá bộ lọc
                  </Button>
                ) : (
                  <span className="text-xs text-[var(--muted-foreground)]">Chưa áp dụng lọc</span>
                )}
                <Button size="sm" onClick={() => setFiltersOpen(false)}>
                  Xong
                </Button>
              </div>
            </Popover.Content>
          </Popover.Root>
        </div>

        {advancedFiltersApplied ? (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-medium text-[var(--muted-foreground)]">Đang lọc:</span>
            {activeFilterLabels.map((label) => (
              <Badge
                key={label}
                variant="secondary"
                className="max-w-[220px] truncate border border-[var(--border)] bg-[var(--muted)] font-normal text-[var(--foreground)]"
                title={label}
              >
                {label}
              </Badge>
            ))}
          </div>
        ) : null}

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
              <Users size={14} /> {getCompanySizeLabel(company.size) ?? "Quy mô đang cập nhật"}
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
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[var(--border)] bg-white">
        <CompanyLogo src={logoUrl} alt={name} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--muted)] text-base font-semibold text-[var(--muted-foreground)]">
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}


