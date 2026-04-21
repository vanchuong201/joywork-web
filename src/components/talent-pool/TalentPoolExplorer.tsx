"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ChevronLeft, ChevronRight, User } from "lucide-react";
import CandidateRow from "@/components/candidates/CandidateRow";
import {
  CandidateFilterControls,
  type CandidateFilterValues,
} from "@/components/candidates/CandidateFilters";

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
  gender: string | null;
  yearOfBirth: number | null;
  educationLevel: string | null;
};

type Candidate = {
  memberId: string;
  joinedAt: string;
  userId: string;
  name: string | null;
  slug: string | null;
  isPublic: boolean;
  profile: CandidateProfile | null;
  gender: string | null;
  yearOfBirth: number | null;
  educationLevel: string | null;
  experiences: CandidateExpApi[];
  educations: CandidateEduApi[];
};

type CandidatesResponse = {
  candidates: Candidate[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

type Props = {
  filters: CandidateFilterValues;
  setFilters: (next: CandidateFilterValues | ((prev: CandidateFilterValues) => CandidateFilterValues)) => void;
  onClearFilters: () => void;
};

export default function TalentPoolExplorer({ filters, setFilters, onClearFilters }: Props) {
  const { data, isLoading } = useQuery<CandidatesResponse>({
    queryKey: [
      "talent-pool-candidates",
      filters.keyword,
      filters.locations[0] ?? "",
      filters.wardCodes[0] ?? "",
      filters.gender,
      filters.yearOfBirthMin,
      filters.yearOfBirthMax,
      filters.educationLevels,
      filters.page,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(filters.page));
      params.set("limit", "12");
      if (filters.keyword) params.set("q", filters.keyword);
      if (filters.locations[0]) params.set("location", filters.locations[0]);
      if (filters.wardCodes[0]) params.set("ward", filters.wardCodes[0]);
      if (filters.gender) params.set("gender", filters.gender);
      if (filters.yearOfBirthMin) params.set("yearOfBirthMin", filters.yearOfBirthMin);
      if (filters.yearOfBirthMax) params.set("yearOfBirthMax", filters.yearOfBirthMax);
      if (filters.educationLevels.length > 0) {
        params.set("educationLevels", filters.educationLevels.join(","));
      }
      const res = await api.get(`/api/talent-pool/candidates?${params}`);
      return res.data.data;
    },
  });

  function handleSearch() {
    setFilters((v) => ({ ...v, page: 1 }));
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

      <CandidateFilterControls
        values={filters}
        onValuesChange={setFilters}
        showSalaryFilters={false}
        compact={true}
        onSearch={handleSearch}
        onClear={onClearFilters}
      />

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
                wardCodes: c.profile?.wardCodes,
                expectedSalaryMin: c.profile?.expectedSalaryMin ?? null,
                expectedSalaryMax: c.profile?.expectedSalaryMax ?? null,
                salaryCurrency: c.profile?.salaryCurrency ?? null,
                workMode: c.profile?.workMode ?? null,
                gender: c.gender,
                yearOfBirth: c.yearOfBirth,
                educationLevel: c.educationLevel,
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
          <Button
            size="sm"
            variant="outline"
            disabled={filters.page <= 1}
            onClick={() => setFilters((v) => ({ ...v, page: v.page - 1 }))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-slate-500">{filters.page} / {totalPages}</span>
          <Button
            size="sm"
            variant="outline"
            disabled={filters.page >= totalPages}
            onClick={() => setFilters((v) => ({ ...v, page: v.page + 1 }))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
