"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuth";
import {
  getCvFlipAccessCompanies,
  getCvFlipUsage,
  listCvFlipCandidates,
} from "@/lib/api/cv-flip";
import CompanySelectorModal from "@/components/candidates/CompanySelectorModal";
import CvFlipUsageBadge from "@/components/candidates/CvFlipUsageBadge";
import TalentPoolExplorer from "@/components/talent-pool/TalentPoolExplorer";
import TalentPoolLocked from "@/components/talent-pool/TalentPoolLocked";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProvinceSelect from "@/components/ui/province-select";
import WardSelect from "@/components/ui/ward-select";
import api from "@/lib/api";

const SELECTED_COMPANY_KEY = "cvFlip.selectedCompanyId";
const TAB_ALL = "all";
const TAB_TALENT_POOL = "talent-pool";

function CandidatesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, initialized, loading } = useAuthStore();

  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [page, setPage] = useState(1);
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [locations, setLocations] = useState<string[]>([]);
  const [wardCodes, setWardCodes] = useState<string[]>([]);
  const [salaryCurrency, setSalaryCurrency] = useState<"VND" | "USD">("VND");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const tab = searchParams.get("tab") === TAB_TALENT_POOL ? TAB_TALENT_POOL : TAB_ALL;

  useEffect(() => {
    if (initialized && !loading && !user) {
      router.replace("/login");
    }
  }, [initialized, loading, user, router]);

  const accessQuery = useQuery({
    queryKey: ["cv-flip-access"],
    queryFn: getCvFlipAccessCompanies,
    enabled: initialized && !loading && !!user,
  });

  const companies = useMemo(() => accessQuery.data ?? [], [accessQuery.data]);
  const selectedCompany = companies.find((company) => company.id === selectedCompanyId) ?? null;

  useEffect(() => {
    if (!companies.length) return;
    const cached = typeof window !== "undefined" ? localStorage.getItem(SELECTED_COMPANY_KEY) : null;
    if (cached && companies.some((company) => company.id === cached)) {
      setSelectedCompanyId(cached);
      return;
    }
    if (companies.length === 1) {
      setSelectedCompanyId(companies[0].id);
    }
  }, [companies]);

  useEffect(() => {
    if (!selectedCompanyId) return;
    if (typeof window !== "undefined") {
      localStorage.setItem(SELECTED_COMPANY_KEY, selectedCompanyId);
    }
  }, [selectedCompanyId]);

  const usageQuery = useQuery({
    queryKey: ["cv-flip-usage", selectedCompanyId],
    queryFn: () => getCvFlipUsage(selectedCompanyId),
    enabled: Boolean(selectedCompanyId),
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setKeyword(keywordInput.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [keywordInput]);

  useEffect(() => {
    const validWards = wardCodes.filter((code) =>
      locations.some((provinceCode) => code.startsWith(`${provinceCode}/`))
    );
    if (validWards.length !== wardCodes.length) {
      setWardCodes(validWards);
    }
  }, [locations, wardCodes]);

  useEffect(() => {
    setPage(1);
  }, [salaryCurrency, salaryMin, salaryMax]);

  const candidatesQuery = useQuery({
    queryKey: [
      "cv-flip-candidates",
      page,
      keyword,
      locations,
      wardCodes[0] ?? "",
      salaryCurrency,
      salaryMin,
      salaryMax,
    ],
    queryFn: () =>
      listCvFlipCandidates({
        page,
        limit: 12,
        keyword: keyword || undefined,
        locations: locations.length > 0 ? locations : undefined,
        ward: wardCodes[0] || undefined,
        salaryCurrency,
        salaryMin: salaryMin ? Number(salaryMin) : undefined,
        salaryMax: salaryMax ? Number(salaryMax) : undefined,
      }),
    enabled: initialized && !loading && !!user && !!selectedCompanyId,
  });

  const talentPoolAccessQuery = useQuery<{ hasAccess: boolean; reason?: string }>({
    queryKey: ["talent-pool-access"],
    queryFn: async () => {
      const res = await api.get("/api/talent-pool/access");
      return res.data.data;
    },
    enabled: initialized && !loading && !!user && tab === TAB_TALENT_POOL,
  });

  if (!initialized || loading || accessQuery.isLoading) {
    return <div className="mx-auto max-w-6xl p-4 text-sm text-slate-500">Đang tải dữ liệu...</div>;
  }

  if (!user) return null;

  const modalOpen = companies.length === 0 || (companies.length > 1 && !selectedCompanyId);
  const switchTab = (nextTab: typeof TAB_ALL | typeof TAB_TALENT_POOL) => {
    const next = new URLSearchParams(searchParams.toString());
    if (nextTab === TAB_ALL) {
      next.delete("tab");
    } else {
      next.set("tab", TAB_TALENT_POOL);
    }
    const qs = next.toString();
    router.replace(qs ? `/candidates?${qs}` : "/candidates");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <CompanySelectorModal
        open={modalOpen}
        companies={companies}
        selectedCompanyId={selectedCompanyId}
        onSelectedCompanyIdChange={setSelectedCompanyId}
        onConfirm={() => {
          if (!selectedCompanyId) return;
        }}
        onCreateCompany={() => router.push("/companies/new")}
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Danh sách ứng viên</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Chỉ tài khoản đăng nhập mới truy cập được trang này.</p>
        </div>
        {companies.length > 1 ? (
          <div className="flex items-center gap-2">
            <select
              className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-sm"
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
            >
              <option value="" disabled>
                Chọn doanh nghiệp
              </option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            <Button variant="outline" onClick={() => setSelectedCompanyId("")}>
              Chọn lại
            </Button>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between border-b border-[var(--border)]">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            className={`rounded-none border-b-2 px-2 ${
              tab === TAB_ALL
                ? "border-[var(--brand)] text-[var(--brand)]"
                : "border-transparent text-[var(--muted-foreground)]"
            }`}
            onClick={() => switchTab(TAB_ALL)}
          >
            Tất cả ứng viên
          </Button>
          <Button
            variant="ghost"
            className={`rounded-none border-b-2 px-2 ${
              tab === TAB_TALENT_POOL
                ? "border-[var(--brand)] text-[var(--brand)]"
                : "border-transparent text-[var(--muted-foreground)]"
            }`}
            onClick={() => switchTab(TAB_TALENT_POOL)}
          >
            Talent Pool
          </Button>
        </div>
        {selectedCompany ? (
          <CvFlipUsageBadge usage={usageQuery.data} />
        ) : null}
      </div>

      {tab === TAB_ALL ? (
        <>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="Từ khóa trong CV (ưu tiên tiêu đề nghề nghiệp)"
            />
            <ProvinceSelect
              multiple
              values={locations}
              onChangeValues={(values) => {
                setLocations(values);
                setPage(1);
              }}
              placeholder="Chọn tỉnh / thành phố"
            />
            <WardSelect
              provinceCodes={locations}
              values={wardCodes}
              onChangeValues={(values) => {
                setWardCodes(values);
                setPage(1);
              }}
              placeholder="Chọn phường / xã"
            />
            <Input
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              placeholder={`Lương tối thiểu (${salaryCurrency})`}
              type="number"
            />
            <Input
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
              placeholder={`Lương tối đa (${salaryCurrency})`}
              type="number"
            />
            <select
              className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-sm"
              value={salaryCurrency}
              onChange={(e) => setSalaryCurrency(e.target.value as "VND" | "USD")}
            >
              <option value="VND">VND</option>
              <option value="USD">USD</option>
            </select>
          </div>

          {candidatesQuery.error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              Không tải được danh sách ứng viên.
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(candidatesQuery.data?.candidates ?? []).map((candidate) => (
              <div key={candidate.userId} className="rounded-xl border border-[var(--border)] bg-white p-4">
                <p className="font-semibold">{candidate.name || "Ứng viên"}</p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">{candidate.headline || "Chưa cập nhật headline"}</p>
                <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                  Kỹ năng: {candidate.skills.slice(0, 5).join(", ") || "Chưa cập nhật"}
                </p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  Địa điểm: {candidate.locations.join(", ") || "Chưa cập nhật"}
                </p>
                <div className="mt-3">
                  <Link
                    href={`/candidates/${encodeURIComponent(candidate.slug || candidate.userId)}`}
                    className="text-sm font-medium text-[var(--brand)] hover:underline"
                  >
                    Xem chi tiết
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {candidatesQuery.data?.pagination ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--muted-foreground)]">
                Trang {candidatesQuery.data.pagination.page}/{candidatesQuery.data.pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                  Trước
                </Button>
                <Button
                  variant="outline"
                  disabled={page >= candidatesQuery.data.pagination.totalPages}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Sau
                </Button>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <>
          {talentPoolAccessQuery.isLoading ? (
            <div className="rounded-lg border border-[var(--border)] bg-white p-4 text-sm text-[var(--muted-foreground)]">
              Đang kiểm tra quyền truy cập Talent Pool...
            </div>
          ) : talentPoolAccessQuery.data?.hasAccess ? (
            <TalentPoolExplorer />
          ) : (
            <TalentPoolLocked reason={talentPoolAccessQuery.data?.reason} />
          )}
        </>
      )}
    </div>
  );
}

export default function CandidatesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl p-4 text-sm text-slate-500">Đang tải trang...</div>
      }
    >
      <CandidatesPageContent />
    </Suspense>
  );
}
