"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import PostCard, { type PostCardData } from "@/components/feed/PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type SavedPostsResponse = {
  data: {
    favorites: Array<{ id: string; createdAt: string; post: PostCardData }>;
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };
};

type SavedJobsResponse = {
  data: {
    favorites: Array<{
      id: string;
      jobId: string;
      createdAt: string;
      job: {
        id: string;
        title: string;
        company: { id: string; name: string; slug: string; logoUrl?: string | null };
        location?: string | null;
        remote: boolean;
        employmentType: string;
        experienceLevel: string;
        salaryMin?: number | null;
        salaryMax?: number | null;
        currency: string;
      };
    }>;
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };
};

function SavedPageContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [tab, setTab] = useState<"posts" | "jobs">((sp.get("tab") as any) || "posts");
  const qc = useQueryClient();
  const [removingJobId, setRemovingJobId] = useState<string | null>(null);
  const removeJob = useMutation({
    mutationFn: async (jobId: string) => {
      await api.delete(`/api/jobs/${jobId}/favorite`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saved-jobs"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? "Không thể hủy lưu việc làm"),
    onSettled: () => setRemovingJobId(null),
  });

  useEffect(() => {
    const next = new URLSearchParams(sp.toString());
    next.set("tab", tab);
    router.replace(`${pathname}?${next.toString()}`);
  }, [tab, router, pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const postsQuery = useInfiniteQuery<SavedPostsResponse>({
    queryKey: ["saved-posts"],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const res = await api.get("/api/posts/me/favorites", { params: { page: pageParam, limit: 10 } });
      return res.data as SavedPostsResponse;
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.data.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
  });

  const jobsQuery = useInfiniteQuery<SavedJobsResponse>({
    queryKey: ["saved-jobs"],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const res = await api.get("/api/jobs/me/favorites", { params: { page: pageParam, limit: 10 } });
      return res.data as SavedJobsResponse;
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.data.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
  });

  const savedPosts = useMemo(
    () => (postsQuery.data?.pages ?? []).flatMap((p) => p.data.favorites.map((f) => f.post)),
    [postsQuery.data],
  );
  const savedJobs = useMemo(() => (jobsQuery.data?.pages ?? []).flatMap((p) => p.data.favorites), [jobsQuery.data]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-[var(--foreground)]">Đã lưu</h1>
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="posts">Bài viết</TabsTrigger>
          <TabsTrigger value="jobs">Việc làm</TabsTrigger>
        </TabsList>
        <TabsContent value="posts">
          {postsQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-lg" />
              ))}
            </div>
          ) : savedPosts.length ? (
            <div className="space-y-6">
              {savedPosts.map((p) => (
                <div key={p.id}>
                  <PostCard
                    post={p}
                    onLike={() => {
                      if (p.isLiked) api.delete(`/api/posts/${p.id}/like`);
                      else api.post(`/api/posts/${p.id}/like`);
                      // React Query sẽ tự động update UI nhờ invalidateQueries trong PostCard (handleSave cũng làm vậy)
                      // Tuy nhiên PostCard onLike chỉ là callback để trigger animation + update local like count
                      // Nên ta chỉ cần gọi API là đủ.
                    }}
                  />
                </div>
              ))}
              {postsQuery.hasNextPage ? (
                <div className="flex justify-center">
                  <Button variant="outline" size="sm" onClick={() => postsQuery.fetchNextPage()}>
                    Tải thêm
                  </Button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-lg border border-[var(--border)] p-6 text-center text-sm text-[var(--muted-foreground)]">
              Chưa có bài viết nào được lưu.
            </div>
          )}
        </TabsContent>
        <TabsContent value="jobs">
          {jobsQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          ) : savedJobs.length ? (
            <ul className="space-y-3">
              {savedJobs.map((fav) => {
                const j = fav.job;
                const salary =
                  j.salaryMin || j.salaryMax
                    ? j.salaryMin && j.salaryMax
                      ? `${j.salaryMin.toLocaleString("vi-VN")} - ${j.salaryMax.toLocaleString("vi-VN")} ${j.currency}`
                      : j.salaryMin
                      ? `${j.salaryMin.toLocaleString("vi-VN")} ${j.currency}`
                      : `${j.salaryMax?.toLocaleString("vi-VN")} ${j.currency}`
                    : "Thoả thuận";
                return (
                  <li key={fav.id} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                    <Link href={`/jobs/${j.id}`} className="font-medium hover:underline text-[var(--foreground)]">
                      {j.title}
                    </Link>
                    <div className="mt-1 text-sm text-[var(--muted-foreground)]">{j.company.name}</div>
                    <div className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {j.remote ? "Remote" : j.location ?? "Không rõ"} · {j.employmentType} · {j.experienceLevel} · {salary}
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                      <Button asChild size="sm">
                        <Link href={`/jobs/${j.id}`}>Xem chi tiết</Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRemovingJobId(j.id);
                          removeJob.mutate(j.id);
                        }}
                        disabled={removeJob.isPending && removingJobId === j.id}
                      >
                        {removeJob.isPending && removingJobId === j.id ? "Đang huỷ lưu..." : "Huỷ lưu"}
                      </Button>
                    </div>
                  </li>
                );
              })}
              {jobsQuery.hasNextPage ? (
                <div className="flex justify-center">
                  <Button variant="outline" size="sm" onClick={() => jobsQuery.fetchNextPage()}>
                    Tải thêm
                  </Button>
                </div>
              ) : null}
            </ul>
          ) : (
            <div className="rounded-lg border border-[var(--border)] p-6 text-center text-sm text-[var(--muted-foreground)]">
              Chưa có việc làm nào được lưu.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SavedPageFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="rounded-lg border border-[var(--border)] p-4">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SavedPage() {
  return (
    <Suspense fallback={<SavedPageFallback />}>
      <SavedPageContent />
    </Suspense>
  );
}

