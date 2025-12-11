"use client";

import { useMemo, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import PostCard, { type PostCardData } from "@/components/feed/PostCard";
import api from "@/lib/api";
import useInView from "@/hooks/useInView";
import { useAuthStore } from "@/store/useAuth";

type Props = {
  posts: PostCardData[];
  companyId: string;
  totalPages?: number;
};

const PAGE_SIZE = 10;

export default function CompanyActivityFeed({ posts, companyId, totalPages }: Props) {
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin: "200px" });
  const user = useAuthStore((state) => state.user);

  const initialData = useMemo(() => ({
    pages: [
      {
        posts: posts.map((post) => ({
          ...post,
          content: post.content ?? "",
        })),
        pagination: {
          page: 1,
          limit: PAGE_SIZE,
          total: 0,
          totalPages: totalPages ?? 1,
        },
      },
    ],
    pageParams: [1],
  }), [posts, totalPages]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["company-posts-feed", companyId, user?.id],
    initialPageParam: 1,
    initialData: initialData as any,
    queryFn: async ({ pageParam }) => {
      const res = await api.get("/api/posts", {
        params: { companyId, page: pageParam, limit: PAGE_SIZE },
      });
      return res.data.data;
    },
    getNextPageParam: (lastPage: any) => {
      if (!lastPage || !lastPage.pagination) return undefined;
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    // Refetch immediately if user is logged in (to get like/save status), otherwise trust SSR data for a bit
    staleTime: user ? 0 : 1000 * 60 * 5,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const items = useMemo(() => data?.pages.flatMap((p: any) => p.posts) ?? [], [data]);

  return (
    <div className="space-y-4">
      {items.map((post: PostCardData) => (
        <PostCard key={post.id} post={post} />
      ))}
      
      {(isFetchingNextPage) && (
        <div className="py-4 text-center text-sm text-[var(--muted-foreground)]">
          Đang tải thêm...
        </div>
      )}
      
      <div ref={ref} className="h-px" />
    </div>
  );
}
