"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Sparkles, ChevronLeft, ChevronRight, User } from "lucide-react";
import Link from "next/link";

type CandidateProfile = {
  avatar: string | null;
  headline: string | null;
  bio: string | null;
  skills: string[];
  location: string | null;
  knowledge: string[];
  attitude: string[];
  expectedSalary: string | null;
  workMode: string | null;
  expectedCulture: string | null;
};

type Candidate = {
  memberId: string;
  joinedAt: string;
  userId: string;
  name: string | null;
  slug: string | null;
  isPublic: boolean;
  profile: CandidateProfile | null;
};

type CandidatesResponse = {
  candidates: Candidate[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export default function TalentPoolExplorer() {
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [page, setPage] = useState(1);
  const [searchQ, setSearchQ] = useState("");
  const [searchLoc, setSearchLoc] = useState("");

  const { data, isLoading } = useQuery<CandidatesResponse>({
    queryKey: ["talent-pool-candidates", searchQ, searchLoc, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "12");
      if (searchQ) params.set("q", searchQ);
      if (searchLoc) params.set("location", searchLoc);
      const res = await api.get(`/api/talent-pool/candidates?${params}`);
      return res.data.data;
    },
  });

  function handleSearch() {
    setSearchQ(q);
    setSearchLoc(location);
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

      {/* Search bar */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Tìm theo tên, kỹ năng, headline..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9"
          />
        </div>
        <div className="relative min-w-[180px]">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Địa điểm..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch}>
          <Search className="mr-2 h-4 w-4" />Tìm kiếm
        </Button>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <div className="py-16 text-center">
          <User className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <p className="text-slate-500">Không tìm thấy ứng viên phù hợp.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {candidates.map((c) => (
            <CandidateCard key={c.memberId} candidate={c} />
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

function CandidateCard({ candidate }: { candidate: Candidate }) {
  const { name, slug, isPublic, profile } = candidate;

  if (!isPublic || !profile) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-800 dark:bg-slate-900/50">
        <User className="mb-2 h-10 w-10 text-slate-300" />
        <p className="text-sm font-medium text-slate-500">{name ?? "Ứng viên"}</p>
        <p className="mt-1 text-xs text-slate-400">Hồ sơ riêng tư</p>
      </div>
    );
  }

  return (
    <Link
      href={slug ? `/profile/${slug}` : "#"}
      className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="mb-3 flex items-center gap-3">
        {profile.avatar ? (
          <img src={profile.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-950/30">
            <User className="h-6 w-6 text-blue-500" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-blue-600 dark:text-white">
            {name ?? "Ứng viên"}
          </p>
          {profile.headline && (
            <p className="truncate text-xs text-slate-500">{profile.headline}</p>
          )}
        </div>
      </div>

      {profile.location && (
        <div className="mb-2 flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="h-3 w-3" />
          {profile.location}
        </div>
      )}

      {profile.bio && (
        <p className="mb-3 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">{profile.bio}</p>
      )}

      {profile.skills.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {profile.skills.slice(0, 5).map((s) => (
            <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
          ))}
          {profile.skills.length > 5 && (
            <Badge variant="outline" className="text-[10px]">+{profile.skills.length - 5}</Badge>
          )}
        </div>
      )}

      <div className="mt-auto flex flex-wrap gap-2 text-[10px] text-slate-400">
        {profile.expectedSalary && <span>💰 {profile.expectedSalary}</span>}
        {profile.workMode && <span>🏢 {profile.workMode}</span>}
      </div>
    </Link>
  );
}
