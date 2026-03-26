"use client";

export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { SlidersHorizontal } from "lucide-react";
import EmptyState from "@/components/ui/empty-state";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import CompanySearch from "@/components/feed/CompanySearch";
import PostCard, { type PostCardData } from "@/components/feed/PostCard";
import FeedPostComposer from "@/components/feed/FeedPostComposer";
import { useCallback, useEffect, useMemo, useState } from "react";
import useInView from "@/hooks/useInView";
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
  const inViewOptions = useMemo<IntersectionObserverInit>(
    () => ({ root: null, rootMargin: "800px 0px 800px 0px", threshold: 0 }),
    []
  );
  const { ref, inView } = useInView<HTMLDivElement>(inViewOptions);
  const pageSize = 6;
  const user = useAuthStore((state) => state.user);
  const following = tab === "following" ? true : undefined;
  const {
    data: feedData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    isSuccess: feedQuerySuccess,
    isLoading: feedQueryLoading,
  } = useInfiniteQuery<{ posts: Post[]; pagination: { page: number; totalPages: number } }>({
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

  const loadMore = useCallback(() => {
    if (!feedQuerySuccess || !hasNextPage || isFetchingNextPage || isFetchNextPageError) return;
    fetchNextPage();
  }, [feedQuerySuccess, hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage]);

  useEffect(() => {
    if (inView) loadMore();
  }, [inView, loadMore]);

  const scrollRootMarginPx = 480;
  useEffect(() => {
    if (!feedQuerySuccess || !hasNextPage || isFetchingNextPage) return;

    const onScrollOrResize = () => {
      const doc = document.documentElement;
      const scrollBottom = window.scrollY + window.innerHeight;
      const threshold = doc.scrollHeight - scrollRootMarginPx;
      if (scrollBottom >= threshold) loadMore();
    };

    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });
    onScrollOrResize();
    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [feedQuerySuccess, hasNextPage, isFetchingNextPage, isFetchNextPageError, loadMore]);
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
  const { openPrompt } = useAuthPrompt();
  const allPosts = useMemo(() => (feedData?.pages ?? []).flatMap((p) => p.posts ?? []), [feedData]);
  const posts = useMemo(
    () =>
      tab === "trending"
        ? [...allPosts].sort(
            (a: any, b: any) =>
              ((b as any)?._count?.likes ?? (b as any)?.likesCount ?? 0) -
              ((a as any)?._count?.likes ?? (a as any)?.likesCount ?? 0)
          )
        : allPosts,
    [allPosts, tab]
  );

  return (
    <div className="space-y-4">
      {/* Post Composer */}
      <FeedPostComposer />

      <div className="sticky top-[64px] z-40 -mx-2 bg-[var(--background)]/80 px-2 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/60">
        <div className="flex items-center gap-2 py-2">
          <Tabs
            className="min-w-0 flex-1"
            value={tab}
            onValueChange={(v) => {
              if (v === "following" && !user) {
                openPrompt("login");
                return;
              }
              setTab(v as any);
            }}
          >
            <TabsList className="w-full justify-start gap-1 overflow-x-auto p-1 sm:w-auto sm:overflow-visible">
              <TabsTrigger className="whitespace-nowrap" value="all">Tất cả</TabsTrigger>
              <TabsTrigger className="whitespace-nowrap" value="trending">Nổi bật</TabsTrigger>
              <TabsTrigger className="whitespace-nowrap" value="following">Theo dõi</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            className="h-9 w-9 shrink-0 sm:w-auto"
            variant="outline"
            size="sm"
            onClick={() => setShowFilters((s) => !s)}
            aria-label="Bộ lọc nâng cao"
          >
            <SlidersHorizontal className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Bộ lọc nâng cao</span>
          </Button>
        </div>
        {showFilters ? (
          <div className="relative z-50 mb-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 sm:p-4 shadow-lg">
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-semibold">Doanh nghiệp</h3>
              <CompanySearch value={companyId} onSelect={setCompany} />
            </div>
          </div>
        ) : null}
      </div>

      {feedQueryLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      ) : posts.length ? (
        <div className="space-y-6">
          {posts.map((p, idx) => (
            <div key={p.id} className={idx === 0 ? "md:scale-[1.02]" : undefined}>
              <PostCard post={p} />
            </div>
          ))}
          {/* Load more sentinel */}
          {hasNextPage ? (
            <div className="space-y-3">
              <div ref={ref} className="h-6" aria-hidden />
              {isFetchingNextPage ? (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3">
                  <div className="mb-3 flex items-center justify-center gap-2 text-xs text-[var(--muted-foreground)]">
                    <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-[var(--brand)] [animation-delay:-0.2s]" />
                    <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-[var(--brand)] [animation-delay:-0.1s]" />
                    <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-[var(--brand)]" />
                    <span className="ml-1">Đang tải thêm bài viết...</span>
                  </div>
                  <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <Skeleton key={i} className="h-40 rounded-lg" />
                    ))}
                  </div>
                </div>
              ) : isFetchNextPageError ? (
                <div className="flex justify-center">
                  <Button variant="outline" onClick={() => fetchNextPage()}>
                    Tải lại bài viết
                  </Button>
                </div>
              ) : null}
            </div>
          ) : posts.length ? (
            <div className="flex justify-center py-3 text-xs text-[var(--muted-foreground)]">
              Bạn đã xem hết bài viết mới.
            </div>
          ) : null}
        </div>
      ) : (
        <EmptyState
          title={tab === "following" ? "Chưa có bài viết từ doanh nghiệp bạn theo dõi" : "Chưa có bài viết"}
          subtitle={
            tab === "following"
              ? user
                ? "Hãy theo dõi thêm doanh nghiệp để cập nhật hoạt động mới."
                : "Đăng nhập và theo dõi doanh nghiệp để xem bài viết."
              : "Thử chuyển loại bài viết hoặc theo dõi thêm doanh nghiệp"
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

