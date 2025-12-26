"use client";

export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import { useMutation, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import CompanySearch from "@/components/feed/CompanySearch";
import PostCard, { type PostCardData } from "@/components/feed/PostCard";
import { useEffect, useMemo, useState } from "react";
import useInView from "@/hooks/useInView";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuth";
import { useAuthPrompt } from "@/contexts/AuthPromptContext";
import FeedLayout from "./feed-layout";

type Post = PostCardData;

function FeedPageContent() {
  const [tab, setTab] = useState<"all" | "trending" | "following">("all");
  const [showFilters, setShowFilters] = useState(false);
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const type = sp.get("type") || undefined; // STORY | ANNOUNCEMENT | EVENT
  const companyId = sp.get("companyId") || undefined;
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin: "300px" });
  const pageSize = 6;
  const user = useAuthStore((state) => state.user);
  const following = tab === "following" ? true : undefined;
  const query = useInfiniteQuery<{ posts: Post[]; pagination: { page: number; totalPages: number } }>({
    queryKey: ["feed", { type, companyId, following }],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const res = await api.get("/api/posts", { params: { limit: pageSize, page: pageParam, type, companyId, following } });
      return res.data.data;
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination || { page: 1, totalPages: 1 };
      return page < totalPages ? page + 1 : undefined;
    },
  });

  // Auto-fetch next page when sentinel is visible
  useEffect(() => {
    if (inView && query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  }, [inView, query]);
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
  const { openPrompt } = useAuthPrompt();
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

  const handleLike = (p: Post) => {
    if (!user) {
      openPrompt("like");
      return;
    }
    like.mutate(p);
  };

  const allPosts = useMemo(() => (query.data?.pages ?? []).flatMap((p) => p.posts ?? []), [query.data]);
  const posts = tab === "trending"
    ? [...allPosts].sort((a: any, b: any) => ((b as any)?._count?.likes ?? (b as any)?.likesCount ?? 0) - ((a as any)?._count?.likes ?? (a as any)?.likesCount ?? 0))
    : allPosts;

  return (
    <div className="space-y-4">
      <div className="sticky top-[64px] z-10 -mx-2 bg-[var(--background)]/80 px-2 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/60">
        <div className="flex items-center justify-between py-2">
          <Tabs
            value={tab}
            onValueChange={(v) => {
              if (v === "following" && !user) {
                openPrompt("login");
                return;
              }
              setTab(v as any);
            }}
          >
            <TabsList>
              <TabsTrigger value="all">Tất cả</TabsTrigger>
              <TabsTrigger value="trending">Nổi bật</TabsTrigger>
              <TabsTrigger value="following">Theo dõi</TabsTrigger>
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

      {query.isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      ) : posts.length ? (
        <div className="space-y-6">
          {posts.map((p, idx) => (
            <div key={p.id} className={idx === 0 ? "md:scale-[1.02]" : undefined}>
              <PostCard post={p} onLike={() => handleLike(p)} />
            </div>
          ))}
          {/* Load more sentinel */}
          {query.hasNextPage ? (
            <div className="space-y-3">
              <div ref={ref} className="h-4" />
              {query.isFetchingNextPage ? (
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-40 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="flex justify-center">
                  <Button variant="outline" onClick={() => query.fetchNextPage()}>Tải thêm</Button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      ) : (
        <EmptyState
          title={tab === "following" ? "Chưa có bài viết từ doanh nghiệp bạn theo dõi" : "No posts"}
          subtitle={
            tab === "following"
              ? user
                ? "Hãy theo dõi thêm doanh nghiệp để cập nhật hoạt động mới."
                : "Đăng nhập và theo dõi doanh nghiệp để xem bài viết."
              : "Try switching type or follow companies"
          }
        />
      )}
    </div>
  );
}

export default function FeedPage() {
  return (
    <FeedLayout>
      <Suspense fallback={
        <div className="space-y-4">
          <Skeleton className="h-16 rounded-lg" />
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-lg" />
            ))}
          </div>
        </div>
      }>
        <FeedPageContent />
      </Suspense>
    </FeedLayout>
  );
}

