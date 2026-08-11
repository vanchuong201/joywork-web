"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ChevronDown, MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PROVINCES } from "@/lib/provinces";
import { useAuthStore } from "@/store/useAuth";
import { cn } from "@/lib/utils";

const MIN_KEYWORD_LENGTH = 3;
const GOOD_COMPANIES_URL = "https://doanhnghieptot.joywork.vn/?tab=vinh-danh";

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
    <section className="mb-6 overflow-visible rounded-2xl">
      <div
        className="overflow-visible rounded-2xl px-4 py-7 sm:px-6 sm:py-8 lg:px-8 lg:py-9"
        style={{
          background:
            "linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 35%, #080f2e 70%, #04060f 100%)",
        }}
      >
        <div className="space-y-5">
          <header className="text-center">
            <h1 className="text-lg font-bold leading-snug text-white sm:text-2xl lg:text-[26px] lg:leading-relaxed">
              Nền tảng tuyển dụng của
              <span className="mt-1 block">
                những doanh nghiệp có{" "}
                <span className="text-[var(--brand-secondary)]">môi trường làm việc tốt</span>
              </span>
            </h1>
          </header>

          <form
            onSubmit={handleSubmit}
            className="relative z-20 rounded-[10px] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
          >
            <div className="flex flex-col lg:flex-row lg:items-stretch">
              <div className="relative min-w-0 flex-1">
                <Input
                  name="q"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Tên doanh nghiệp, vị trí tuyển dụng, kỹ năng..."
                  className={cn(
                    "h-12 rounded-[10px] border-0 bg-transparent px-5 text-[var(--foreground)] shadow-none lg:rounded-none lg:rounded-l-[10px]",
                    "placeholder:text-[var(--muted-foreground)]",
                    "focus-visible:ring-0 focus-visible:ring-offset-0"
                  )}
                />
              </div>

              <div className="hidden h-7 w-px shrink-0 self-center bg-[var(--border)] lg:block" />

              <div className="relative w-full border-t border-[var(--border)] lg:w-[220px] lg:border-t-0">
                <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--brand-secondary)]" />
                <select
                  name="location"
                  value={province}
                  onChange={(event) => setProvince(event.target.value)}
                  aria-label="Chọn tỉnh / thành phố"
                  className={cn(
                    "h-12 w-full appearance-none bg-transparent py-2 pl-10 pr-9 text-sm text-[var(--foreground)] outline-none",
                    "cursor-pointer"
                  )}
                >
                  <option value="">Toàn quốc</option>
                  {PROVINCES.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
              </div>

              <Button
                type="submit"
                disabled={!canSearch}
                className={cn(
                  "h-12 w-full shrink-0 gap-2 rounded-b-[10px] px-8 text-sm font-semibold lg:rounded-none lg:rounded-r-[10px]",
                  "bg-[var(--brand-secondary)] text-[var(--brand-secondary-foreground)]",
                  "hover:bg-[var(--brand-secondary-hover)] disabled:opacity-50",
                  "lg:w-auto lg:min-w-[148px]"
                )}
              >
                <Search className="h-4 w-4" />
                Tìm kiếm
              </Button>
            </div>
          </form>

          <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-stretch">
            <div className="flex flex-col justify-center gap-3.5">
              <div className="flex flex-col gap-1.5">
                <p className="text-[11px] tracking-wide text-white/55">Bạn là doanh nghiệp?</p>
                <Link
                  href={postJobHref}
                  className={cn(
                    "rounded-lg border border-white/30 px-4 py-3.5 text-left text-[13px] font-semibold leading-snug text-white",
                    "bg-[linear-gradient(135deg,rgba(255,255,255,0.18)_0%,rgba(100,130,255,0.12)_100%)]",
                    "transition-colors hover:border-white/45 hover:bg-white/20"
                  )}
                >
                  Đăng tin tuyển dụng
                  <br />
                  miễn phí
                </Link>
              </div>

              <div className="flex flex-col gap-1.5">
                <p className="text-[11px] tracking-wide text-white/55">Bạn là ứng viên?</p>
                <a
                  href={GOOD_COMPANIES_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "rounded-lg border border-transparent px-4 py-3.5 text-left text-[13px] font-semibold leading-snug",
                    "bg-[var(--brand-secondary)] text-[var(--brand-secondary-foreground)]",
                    "transition-colors hover:bg-[var(--brand-secondary-hover)]"
                  )}
                >
                  Xem hồ sơ các
                  <br />
                  doanh nghiệp tốt
                </a>
              </div>
            </div>

            <a
              href="https://doanhnghieptot.joywork.vn/"
              target="_blank"
              rel="noopener noreferrer"
              className="block min-h-[180px] overflow-hidden rounded-[10px] border border-white/10 lg:min-h-[230px]"
            >
              <Image
                src="/banner/banner_100dn.png"
                alt="100 doanh nghiệp có môi trường làm việc tốt"
                width={1942}
                height={809}
                priority
                sizes="(max-width: 1024px) 100vw, 860px"
                className="h-full w-full object-cover"
              />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
