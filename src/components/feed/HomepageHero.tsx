"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ChevronDown, MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import HeroBannerCarousel from "@/components/feed/HeroBannerCarousel";
import { PROVINCES } from "@/lib/provinces";
import { useAuthStore } from "@/store/useAuth";
import { cn } from "@/lib/utils";

const MIN_KEYWORD_LENGTH = 3;
const GOOD_COMPANIES_URL = "/jobs?companyBadges=GOOD_COMPANY%2CBASIC_COMMITMENT";

export default function HomepageHero() {
  const router = useRouter();
  const memberships = useAuthStore((state) => state.memberships);
  const [keyword, setKeyword] = useState("");
  const [province, setProvince] = useState("");

  const trimmedKeyword = keyword.trim();
  const canSearch = trimmedKeyword.length > MIN_KEYWORD_LENGTH;

  const managedCompanies = memberships.filter(
    (membership) =>
      (membership.role === "OWNER" || membership.role === "ADMIN") &&
      Boolean(membership.company?.slug)
  );

  const postJobHref =
    managedCompanies.length === 0
      ? "/companies/new"
      : managedCompanies.length === 1
        ? `/companies/${managedCompanies[0].company.slug}/manage?tab=jobs`
        : "/companies";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const q = String(formData.get("q") ?? "").trim();
    const location = String(formData.get("location") ?? "").trim();

    if (q.length <= MIN_KEYWORD_LENGTH) return;

    const params = new URLSearchParams();
    params.set("q", q);
    if (location) {
      params.set("location", location);
    }

    router.push(`/jobs?${params.toString()}`);
  };

  return (
    <section className="mb-6 space-y-4">
      <div
        className="relative overflow-hidden rounded-3xl px-4 py-6 shadow-[0_18px_40px_-18px_rgba(14,26,90,0.6)] sm:px-6 sm:py-8 lg:rounded-2xl lg:px-8 lg:py-9"
        style={{
          background:
            "radial-gradient(120% 90% at 15% 0%, #2A47C9 0%, #122287 45%, #0A1450 100%)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[var(--brand-secondary)]/35 blur-[50px] lg:hidden"
        />

        <div className="relative space-y-5">
          <header className="text-left lg:text-center">
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[2px] text-white/50 sm:text-xs">
              <span className="font-extrabold text-[#FF6FA5]">JOYWORK</span>
              <span className="mx-1.5">·</span>
              Nền tảng tuyển dụng
            </p>
            <h1 className="text-[22px] font-extrabold leading-[1.28] tracking-tight text-white sm:text-2xl lg:text-[26px] lg:leading-relaxed">
              Của những doanh nghiệp có{" "}
              <span className="">môi trường làm việc tốt</span>
            </h1>
          </header>

          <form
            onSubmit={handleSubmit}
            className="relative z-20 rounded-[18px] bg-white p-1.5 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.45)] lg:rounded-[10px] lg:p-0 lg:shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
          >
            <div className="flex flex-col lg:flex-row lg:items-stretch">
              <div className="relative flex min-w-0 flex-1 items-center gap-2.5 px-3 pb-2 pt-2.5 lg:gap-0 lg:p-0">
                <Search className="h-4 w-4 shrink-0 text-[var(--muted-foreground)] lg:hidden" />
                <Input
                  name="q"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Bạn muốn tìm vị trí tuyển dụng nào ?"
                  className={cn(
                    "h-10 flex-1 rounded-none border-0 bg-transparent px-0 text-[14.5px] text-[var(--foreground)] shadow-none",
                    "placeholder:text-[var(--muted-foreground)]",
                    "focus-visible:ring-0 focus-visible:ring-offset-0",
                    "lg:h-12 lg:rounded-[10px] lg:rounded-r-none lg:px-5 lg:text-sm"
                  )}
                />
              </div>

              <div className="mx-3 h-px bg-[var(--border)] lg:mx-0 lg:hidden" />
              <div className="hidden h-7 w-px shrink-0 self-center bg-[var(--border)] lg:block" />

              <div className="flex items-center gap-2 px-2 py-2 lg:w-[220px] lg:gap-0 lg:p-0">
                <div className="relative min-w-0 flex-1 lg:w-full">
                  <MapPin className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--brand-secondary)] lg:left-4 lg:h-4 lg:w-4" />
                  <select
                    name="location"
                    value={province}
                    onChange={(event) => setProvince(event.target.value)}
                    aria-label="Chọn tỉnh / thành phố"
                    className={cn(
                      "h-11 w-full cursor-pointer appearance-none bg-transparent py-2 pl-8 pr-8 text-[14.5px] font-medium text-[var(--foreground)] outline-none",
                      "lg:h-12 lg:pl-10 lg:pr-9 lg:text-sm lg:font-normal"
                    )}
                  >
                    <option value="">Toàn quốc</option>
                    {PROVINCES.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-foreground)] lg:right-3 lg:h-4 lg:w-4" />
                </div>

                <Button
                  type="submit"
                  disabled={!canSearch}
                  className={cn(
                    "h-11 shrink-0 gap-1.5 rounded-xl px-4 text-sm font-bold lg:hidden",
                    "bg-[linear-gradient(100deg,var(--brand-secondary),#F0498F)] text-[var(--brand-secondary-foreground)]",
                    "shadow-[0_8px_18px_-8px_rgba(208,16,106,0.9)]",
                    "hover:bg-[var(--brand-secondary-hover)] hover:opacity-95 disabled:opacity-50"
                  )}
                >
                  Tìm kiếm
                </Button>
              </div>

              <Button
                type="submit"
                disabled={!canSearch}
                className={cn(
                  "hidden h-12 w-full shrink-0 gap-2 rounded-b-[10px] px-8 text-sm font-semibold lg:flex lg:w-auto lg:min-w-[148px] lg:rounded-none lg:rounded-r-[10px]",
                  "bg-[var(--brand-secondary)] text-[var(--brand-secondary-foreground)]",
                  "hover:bg-[var(--brand-secondary-hover)] disabled:opacity-50"
                )}
              >
                <Search className="h-4 w-4" />
                Tìm kiếm
              </Button>
            </div>
          </form>

          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-stretch lg:gap-4">
            <div className="contents lg:flex lg:flex-col lg:justify-center lg:gap-3.5">
              <Link
                href={postJobHref}
                className={cn(
                  "rounded-2xl border border-white/[0.16] bg-white/[0.08] px-3.5 py-3.5",
                  "transition-colors hover:bg-white/[0.12]",
                  "lg:rounded-lg lg:border-white/30 lg:bg-[linear-gradient(135deg,rgba(255,255,255,0.18)_0%,rgba(100,130,255,0.12)_100%)] lg:px-4 lg:hover:border-white/45 lg:hover:bg-white/20"
                )}
              >
                <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.6px] text-white/55 lg:mb-1.5 lg:text-[11px] lg:normal-case lg:tracking-wide">
                  <span className="lg:hidden">Doanh nghiệp</span>
                  <span className="hidden lg:inline">Bạn là doanh nghiệp?</span>
                </p>
                <p className="text-[13px] font-bold leading-snug text-white sm:text-sm">
                  <span className="lg:hidden">
                    Đăng tin
                    <br />
                    miễn phí
                  </span>
                  <span className="hidden lg:inline">
                    Đăng tin tuyển dụng
                    <br />
                    miễn phí
                  </span>
                </p>
                <p className="mt-3 text-xs font-semibold text-[#9FB4FF] lg:hidden">Bắt đầu →</p>
              </Link>

              <a
                href={GOOD_COMPANIES_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "rounded-2xl border border-white/[0.18] px-3.5 py-3.5",
                  "bg-[linear-gradient(150deg,rgba(208,16,106,0.9),rgba(208,16,106,0.35))]",
                  "transition-opacity hover:opacity-95",
                  "lg:rounded-lg lg:border-transparent lg:bg-[var(--brand-secondary)] lg:px-4 lg:hover:bg-[var(--brand-secondary-hover)] lg:hover:opacity-100"
                )}
              >
                <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.6px] text-white/70 lg:mb-1.5 lg:text-[11px] lg:normal-case lg:tracking-wide lg:text-white/55">
                  <span className="lg:hidden">Ứng viên</span>
                  <span className="hidden lg:inline">Bạn là ứng viên?</span>
                </p>
                <p className="text-[13px] font-bold leading-snug text-white sm:text-sm lg:text-[var(--brand-secondary-foreground)]">
                  <span className="lg:hidden">
                    Tìm việc tại
                    <br />
                    công ty tốt
                  </span>
                  <span className="hidden lg:inline">
                    Tìm việc làm
                    <br />
                    tại các công ty tốt
                  </span>
                </p>
                <p className="mt-3 text-xs font-semibold text-[#FFD3E5] lg:hidden">Khám phá →</p>
              </a>
            </div>

            <div className="col-span-2 hidden lg:col-span-1 lg:block">
              <HeroBannerCarousel />
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden">
        <HeroBannerCarousel variant="mobile" />
      </div>
    </section>
  );
}
