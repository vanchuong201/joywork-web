"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, ChevronLeft, ChevronRight, User } from "lucide-react";
import ProvinceSelect from "@/components/ui/province-select";
import WardSelect from "@/components/ui/ward-select";
import CandidateRow, { type CandidateRowData } from "@/components/candidates/CandidateRow";

// Local types matching API response
type CandidateExpApi = {
  id: string;
  role: string;
  company: string;
  period: string | null;
};

type CandidateEduApi = {
  id: string;
  school: string;
  degree: string;
  period: string | null;
};

type CandidateProfile = {
  avatar: string | null;
  headline: string | null;
  bio: string | null;
  skills: string[];
  location: string | null;
  locations: string[];
  wardCodes?: string[];
  knowledge: string[];
  attitude: string[];
  expectedSalaryMin: number | null;
  expectedSalaryMax: number | null;
  salaryCurrency: string | null;
  workMode: string | null;
  expectedCulture: string | null;
  title: string | null;
  fullName: string | null;
};

type Candidate = {
  memberId: string;
  joinedAt: string;
  userId: string;
  name: string | null;
  slug: string | null;
  isPublic: boolean;
  profile: CandidateProfile | null;
  experiences: CandidateExpApi[];
  educations: CandidateEduApi[];
};

type CandidatesResponse = {
  candidates: Candidate[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export default function TalentPoolExplorer() {
  const [q, setQ] = useState("");
  const [provinceCode, setProvinceCode] = useState<string | null>(null);
  const [wardCode, setWardCode] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchQ, setSearchQ] = useState("");
  const [searchLoc, setSearchLoc] = useState<string | null>(null);
  const [searchWard, setSearchWard] = useState<string | null>(null);

  const { data, isLoading } = useQuery<CandidatesResponse>({
    queryKey: ["talent-pool-candidates", searchQ, searchLoc, searchWard, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "12");
      if (searchQ) params.set("q", searchQ);
      if (searchLoc) params.set("location", searchLoc);
      if (searchWard) params.set("ward", searchWard);
      const res = await api.get(`/api/talent-pool/candidates?${params}`);
      return res.data.data;
    },
  });

  function handleSearch() {
    setSearchQ(q.trim());
    setSearchLoc(provinceCode);
    setSearchWard(wardCode);
    setPage(1);
  }

  const totalPages = data?.pagination?.totalPages ?? 1;
  const total = data?.pagination?.total ?? 0;
  const candidates = data?.candidates ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-amber-500" />
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Talent Pool</h1>
        <Badge variant="outline" className="ml-2">{total} ứng viên</Badge>
      </div>

      {/* Search + location filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Tìm theo tiêu đề nghề nghiệp, từ khóa trong phần giới thiệu..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9"
          />
        </div>
        <div className="min-w-[220px]">
          <ProvinceSelect
            value={provinceCode}
            onChange={(value) => {
              setProvinceCode(value);
              if (!value) {
                setWardCode(null);
              } else if (wardCode && !wardCode.startsWith(`${value}/`)) {
                setWardCode(null);
              }
            }}
            placeholder="Chọn tỉnh / thành"
          />
        </div>
        <div className="min-w-[260px]">
          <WardSelect
            provinceCodes={provinceCode ? [provinceCode] : []}
            disabled={!provinceCode}
            values={wardCode ? [wardCode] : []}
            onChangeValues={(vals) => {
              const value = vals.length ? vals[vals.length - 1] : null;
              setWardCode(value);
            }}
            placeholder={provinceCode ? "Chọn phường / xã" : "Chọn tỉnh / thành trước"}
          />
        </div>
        <Button onClick={handleSearch}>
          <Search className="mr-2 h-4 w-4" />Tìm kiếm
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setQ("");
            setProvinceCode(null);
            setWardCode(null);
            setSearchQ("");
            setSearchLoc(null);
            setSearchWard(null);
            setPage(1);
          }}
        >
          Xóa lọc
        </Button>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <div className="py-16 text-center">
          <User className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <p className="text-slate-500">Không tìm thấy ứng viên phù hợp.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {candidates.map((c) => (
            <CandidateRow
              key={c.memberId}
              candidate={{
                userId: c.userId,
                slug: c.slug,
                name: c.profile?.fullName || c.name,
                avatar: c.profile?.avatar ?? null,
                headline: c.profile?.headline ?? null,
                title: c.profile?.title ?? null,
                skills: c.profile?.skills ?? [],
                locations: c.profile?.locations ?? [],
                expectedSalaryMin: c.profile?.expectedSalaryMin ?? null,
                expectedSalaryMax: c.profile?.expectedSalaryMax ?? null,
                salaryCurrency: c.profile?.salaryCurrency ?? null,
                workMode: c.profile?.workMode ?? null,
                experiences: c.experiences,
                educations: c.educations,
              }}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-slate-500">{page} / {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
