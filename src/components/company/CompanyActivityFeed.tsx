"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import PostCard, { type PostCardData } from "@/components/feed/PostCard";
import api from "@/lib/api";
import useInView from "@/hooks/useInView";
import { useAuthStore } from "@/store/useAuth";
import { useAuthPrompt } from "@/contexts/AuthPromptContext";

type Props = {
  posts: PostCardData[];
  companyId: string;
  totalPages?: number;
};

const PAGE_SIZE = 2;

export default function CompanyActivityFeed({ posts, companyId, totalPages }: Props) {
  const normalizedPosts =
    posts?.map((post) => ({
      ...post,
      content: post.content ?? "",
    })) ?? [];

  const previousState = useRef<PostCardData[] | null>(null);
  const [items, setItems] = useState<PostCardData[]>(normalizedPosts);
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin: "200px" });

  const query = useInfiniteQuery({
    queryKey: ["company-posts", companyId],
    initialPageParam: 2,
    enabled:
      Boolean(companyId) &&
      normalizedPosts.length >= PAGE_SIZE &&
      (totalPages === undefined || totalPages > 1),
    queryFn: async ({ pageParam }) => {
      const res = await api.get("/api/posts", {
        params: { companyId, page: pageParam, limit: PAGE_SIZE },
      });
      return res.data.data as { posts: PostCardData[]; pagination: { page: number; totalPages: number } };
    },
    getNextPageParam: (lastPage) => {
      const current = lastPage.pagination?.page ?? 1;
      const totalPages = lastPage.pagination?.totalPages ?? current;
      return current < totalPages ? current + 1 : undefined;
    },
  });

  const mergedItems = useMemo(() => {
    const extra =
      query.data?.pages.flatMap((page) =>
        page.posts.map((post) => ({
          ...post,
          content: post.content ?? "",
        })),
      ) ?? [];

    const ordered: PostCardData[] = [];
    const seen = new Set<string>();

    for (const item of items) {
      if (item?.id && !seen.has(item.id)) {
        seen.add(item.id);
        ordered.push(item);
      }
    }

    for (const item of extra) {
      if (item?.id && !seen.has(item.id)) {
        seen.add(item.id);
        ordered.push(item);
      }
    }

    return ordered;
  }, [items, query.data]);

  useEffect(() => {
    setItems(normalizedPosts);
  }, [posts]);

  useEffect(() => {
    if (inView && query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  }, [inView, query]);

  const mutation = useMutation({
    mutationFn: async (post: PostCardData) => {
      if (post.isLiked) {
        await api.delete(`/api/posts/${post.id}/like`);
      } else {
        await api.post(`/api/posts/${post.id}/like`);
      }
      return post.id;
    },
    onMutate: async (post) => {
      setItems((prev) => {
        previousState.current = prev;
        return prev.map((item) => {
          if (item.id !== post.id) return item;
          const likeCount = getLikeCount(item);
          return {
            ...item,
            isLiked: !item.isLiked,
            likesCount: likeCount + (item.isLiked ? -1 : 1),
          };
        });
      });
      return { postId: post.id };
    },
    onError: (error: any, _variables, _context) => {
      toast.error(error?.response?.data?.error?.message ?? "Không thể cập nhật lượt thích");
      if (previousState.current) {
        setItems(previousState.current);
      } else {
        setItems(normalizedPosts);
      }
    },
  });

  const user = useAuthStore((state) => state.user);
  const { openPrompt } = useAuthPrompt();

  const handleLike = useCallback(
    (post: PostCardData) => {
      if (!user) {
        openPrompt("like");
        return;
      }
      if (mutation.isPending) return;
      mutation.mutate(post);
    },
    [mutation, user, openPrompt],
  );

  return (
    <div className="space-y-4">
      {mergedItems.map((post) => (
        <PostCard key={post.id} post={post} onLike={() => handleLike(post)} />
      ))}
      {query.hasNextPage ? (
        <div ref={ref} className="flex justify-center py-4 text-xs text-[var(--muted-foreground)]">
          {query.isFetchingNextPage ? "Đang tải thêm..." : "Đang tải nội dung..."}
        </div>
      ) : null}
    </div>
  );
}

function getLikeCount(post: PostCardData) {
  const count = post.likesCount ?? (post as any)?._count?.likes ?? 0;
  return count;
}

