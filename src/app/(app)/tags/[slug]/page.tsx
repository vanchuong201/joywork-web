"use client";

import { useInfiniteQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
import PostCard, { type PostCardData } from "@/components/feed/PostCard";
import { useEffect, useMemo } from "react";
import useInView from "@/hooks/useInView";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuth";
import { useAuthPrompt } from "@/contexts/AuthPromptContext";
import { toast } from "sonner";

export default function TagPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin: "300px" });
  const pageSize = 10;
  const user = useAuthStore((state) => state.user);
  const { openPrompt } = useAuthPrompt();
  const qc = useQueryClient();

  const query = useInfiniteQuery<{ posts: PostCardData[]; pagination: { page: number; totalPages: number } }>({
    queryKey: ["tag-feed", slug],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const res = await api.get("/api/posts", { params: { limit: pageSize, page: pageParam, hashtag: slug } });
      return res.data.data;
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination || { page: 1, totalPages: 1 };
      return page < totalPages ? page + 1 : undefined;
    },
    enabled: Boolean(slug),
  });

  const like = useMutation({
    mutationFn: async (p: PostCardData) => {
      if (p.isLiked) await api.delete(`/api/posts/${p.id}/like`);
      else await api.post(`/api/posts/${p.id}/like`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tag-feed", slug] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? "Action failed"),
  });

  const handleLike = (p: PostCardData) => {
    if (!user) {
      openPrompt("like");
      return;
    }
    like.mutate(p);
  };

  useEffect(() => {
    if (inView && query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  }, [inView, query]);

  const allPosts = useMemo(() => (query.data?.pages ?? []).flatMap((p) => p.posts ?? []), [query.data]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">#{slug}</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Các bài viết thuộc chủ đề này</p>
      </div>

      {query.isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      ) : allPosts.length ? (
        <div className="space-y-6">
          {allPosts.map((p) => (
            <PostCard key={p.id} post={p} onLike={() => handleLike(p)} />
          ))}
          {query.hasNextPage ? (
            <div ref={ref} className="h-4 flex justify-center py-4">
                {query.isFetchingNextPage ? <Skeleton className="h-8 w-32" /> : null}
            </div>
          ) : null}
        </div>
      ) : (
        <EmptyState
          title="Chưa có bài viết nào"
          subtitle={`Chưa có bài viết nào gắn hashtag #${slug}.`}
        />
      )}
    </div>
  );
}


