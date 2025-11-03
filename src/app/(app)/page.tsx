"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import CompanySearch from "@/components/feed/CompanySearch";
import PostCard, { type PostCardData } from "@/components/feed/PostCard";
import { useState } from "react";
import { toast } from "sonner";

type Post = PostCardData;

export default function FeedPage() {
  const [tab, setTab] = useState<"all" | "trending" | "following">("all");
  const [showFilters, setShowFilters] = useState(false);
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const type = sp.get("type") || undefined; // STORY | ANNOUNCEMENT | EVENT
  const companyId = sp.get("companyId") || undefined;
  const { data, isLoading } = useQuery<{ posts: Post[]; pagination: any }>({
    queryKey: ["feed", { type, companyId }],
    queryFn: async () => {
      const res = await api.get("/api/posts", { params: { limit: 5, type, companyId } });
      return res.data.data;
    },
  });
  const setType = (val?: string) => {
    const next = new URLSearchParams(sp.toString());
    if (!val) next.delete("type");
    else next.set("type", val);
    router.replace(`${pathname}?${next.toString()}`);
  };
  const setCompany = (id?: string) => {
    const next = new URLSearchParams(sp.toString());
    if (!id) next.delete("companyId");
    else next.set("companyId", id);
    router.replace(`${pathname}?${next.toString()}`);
  };
  const qc = useQueryClient();
  const like = useMutation({
    mutationFn: async (p: Post) => {
      if (p.isLiked) await api.delete(`/api/posts/${p.id}/like`);
      else await api.post(`/api/posts/${p.id}/like`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? "Action failed"),
  });

  const raw = data?.posts ?? [];
  const posts = tab === "trending"
    ? [...raw].sort((a: any, b: any) => ((b as any)?._count?.likes ?? (b as any)?.likesCount ?? 0) - ((a as any)?._count?.likes ?? (a as any)?.likesCount ?? 0))
    : raw;

  return (
    <div className="space-y-4">
      <div className="sticky top-[64px] z-10 -mx-2 bg-[var(--background)]/80 px-2 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/60">
        <div className="flex items-center justify-between py-2">
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList>
              <TabsTrigger value="all">Tất cả</TabsTrigger>
              <TabsTrigger value="trending">Nổi bật</TabsTrigger>
              <TabsTrigger value="following" disabled title="Sắp ra mắt">Theo dõi</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" onClick={() => setShowFilters((s) => !s)}>
            Bộ lọc nâng cao
          </Button>
        </div>
        {showFilters ? (
          <div className="mb-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            <h3 className="mb-2 text-sm font-semibold">Post Type</h3>
            <div className="flex flex-wrap gap-3 text-sm">
              {["STORY", "ANNOUNCEMENT", "EVENT"].map((t) => (
                <label key={t} className="flex items-center gap-2">
                  <input type="radio" name="postType" checked={type === t} onChange={() => setType(t)} />
                  {t}
                </label>
              ))}
              <button className="ml-2 text-xs text-[var(--brand)]" onClick={() => setType(undefined)}>
                Clear
              </button>
            </div>
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-semibold">Company</h3>
              <CompanySearch value={companyId} onSelect={setCompany} />
            </div>
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      ) : posts.length ? (
        <div className="space-y-6">
          {posts.map((p, idx) => (
            <div key={p.id} className={idx === 0 ? "md:scale-[1.02]" : undefined}>
              <PostCard post={p} onLike={() => like.mutate(p)} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No posts" subtitle="Try switching type or follow companies" />
      )}
    </div>
  );
}


