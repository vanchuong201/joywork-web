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
import { LayoutGrid, List, MapPin, Briefcase, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Image from "next/image";

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
        isActive?: boolean;
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

function formatSalary(j: SavedJobsResponse["data"]["favorites"][0]["job"]) {
  if (!j.salaryMin && !j.salaryMax) return "Thoả thuận";
  if (j.salaryMin && j.salaryMax) return `${j.salaryMin.toLocaleString("vi-VN")} - ${j.salaryMax.toLocaleString("vi-VN")} ${j.currency}`;
  if (j.salaryMin) return `${j.salaryMin.toLocaleString("vi-VN")} ${j.currency}`;
  return `${j.salaryMax?.toLocaleString("vi-VN")} ${j.currency}`;
}

function translateEmploymentType(type?: string) {
  switch (type) {
    case "FULL_TIME": return "Toàn thời gian";
    case "PART_TIME": return "Bán thời gian";
    case "CONTRACT": return "Hợp đồng";
    case "INTERNSHIP": return "Thực tập";
    case "FREELANCE": return "Tự do";
    default: return type ?? "";
  }
}

function SavedPageContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [tab, setTab] = useState<"posts" | "jobs">((sp.get("tab") as any) || "posts");
  const [jobView, setJobView] = useState<"list" | "grid">("list");
  const [postView, setPostView] = useState<"list" | "grid">("list");
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
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
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

  const ViewToggle = ({ view, onChange }: { view: "list" | "grid"; onChange: (v: "list" | "grid") => void }) => (
    <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] p-0.5">
      <button
        onClick={() => onChange("list")}
        className={cn(
          "p-1.5 rounded-md transition-colors",
          view === "list" ? "bg-[var(--brand)] text-white" : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
        )}
      >
        <List className="w-4 h-4" />
      </button>
      <button
        onClick={() => onChange("grid")}
        className={cn(
          "p-1.5 rounded-md transition-colors",
          view === "grid" ? "bg-[var(--brand)] text-white" : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
        )}
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-[var(--foreground)]">Đã lưu</h1>
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="posts">Bài viết</TabsTrigger>
          <TabsTrigger value="jobs">Việc làm</TabsTrigger>
        </TabsList>

        {/* === POSTS TAB === */}
        <TabsContent value="posts">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-[var(--muted-foreground)]">{savedPosts.length} bài viết đã lưu</p>
            <ViewToggle view={postView} onChange={setPostView} />
          </div>
          {postsQuery.isLoading ? (
            <div className={postView === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-3"}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-lg" />
              ))}
            </div>
          ) : savedPosts.length ? (
            <div className={postView === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-6"}>
              {savedPosts.map((p) => (
                <div key={p.id}>
                  <PostCard
                    post={p}
                    onLike={() => {
                      if (p.isLiked) api.delete(`/api/posts/${p.id}/like`);
                      else api.post(`/api/posts/${p.id}/like`);
                    }}
                  />
                </div>
              ))}
              {postsQuery.hasNextPage ? (
                <div className={cn("flex justify-center", postView === "grid" && "col-span-full")}>
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

        {/* === JOBS TAB === */}
        <TabsContent value="jobs">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-[var(--muted-foreground)]">{savedJobs.length} việc làm đã lưu</p>
            <ViewToggle view={jobView} onChange={setJobView} />
          </div>
          {jobsQuery.isLoading ? (
            <div className={jobView === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-3"}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          ) : savedJobs.length ? (
            <>
              {jobView === "list" ? (
                <ul className="space-y-3">
                  {savedJobs.map((fav) => {
                    const j = fav.job;
                    const salary = formatSalary(j);
                    const isActive = j.isActive !== false;
                    return (
                      <li key={fav.id} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 flex items-start gap-4">
                        <Link href={`/companies/${j.company.slug}`} className="shrink-0">
                          {j.company.logoUrl ? (
                            <Image src={j.company.logoUrl} alt={j.company.name} width={48} height={48} className="rounded-lg object-cover border border-[var(--border)]" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-[var(--muted)] flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-[var(--muted-foreground)]" />
                            </div>
                          )}
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link href={`/jobs/${j.id}`} target="_blank" className="font-medium hover:underline text-[var(--foreground)] truncate">
                              {j.title}
                            </Link>
                            <Badge className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0",
                              isActive
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-slate-100 text-slate-500 border border-slate-200"
                            )}>
                              {isActive ? "Đang tuyển" : "Đã đóng"}
                            </Badge>
                          </div>
                          <Link href={`/companies/${j.company.slug}`} className="text-sm text-[var(--muted-foreground)] hover:underline block mt-0.5">
                            {j.company.name}
                          </Link>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted-foreground)]">
                            {(j.remote || j.location) && (
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{j.remote ? "Remote" : j.location}</span>
                            )}
                            <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{translateEmploymentType(j.employmentType)}</span>
                            <span>{salary}</span>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/jobs/${j.id}`} target="_blank">Xem chi tiết</Link>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => { setRemovingJobId(j.id); removeJob.mutate(j.id); }}
                              disabled={removeJob.isPending && removingJobId === j.id}
                            >
                              {removeJob.isPending && removingJobId === j.id ? "Đang huỷ..." : "Huỷ lưu"}
                            </Button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedJobs.map((fav) => {
                    const j = fav.job;
                    const salary = formatSalary(j);
                    const isActive = j.isActive !== false;
                    return (
                      <div key={fav.id} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <Link href={`/companies/${j.company.slug}`} className="shrink-0">
                            {j.company.logoUrl ? (
                              <Image src={j.company.logoUrl} alt={j.company.name} width={40} height={40} className="rounded-lg object-cover border border-[var(--border)]" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-[var(--muted)] flex items-center justify-center">
                                <Building2 className="w-4 h-4 text-[var(--muted-foreground)]" />
                              </div>
                            )}
                          </Link>
                          <div className="min-w-0 flex-1">
                            <Link href={`/companies/${j.company.slug}`} className="text-xs text-[var(--muted-foreground)] hover:underline truncate block">
                              {j.company.name}
                            </Link>
                          </div>
                          <Badge className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0",
                            isActive
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          )}>
                            {isActive ? "Đang tuyển" : "Đã đóng"}
                          </Badge>
                        </div>
                        <Link href={`/jobs/${j.id}`} target="_blank" className="font-semibold text-sm text-[var(--foreground)] hover:underline line-clamp-2">
                          {j.title}
                        </Link>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted-foreground)]">
                          {(j.remote || j.location) && (
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{j.remote ? "Remote" : j.location}</span>
                          )}
                          <span>{salary}</span>
                        </div>
                        <div className="mt-auto flex gap-2 pt-2 border-t border-[var(--border)]">
                          <Button asChild size="sm" variant="outline" className="flex-1">
                            <Link href={`/jobs/${j.id}`} target="_blank">Xem chi tiết</Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => { setRemovingJobId(j.id); removeJob.mutate(j.id); }}
                            disabled={removeJob.isPending && removingJobId === j.id}
                          >
                            Huỷ lưu
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {jobsQuery.hasNextPage ? (
                <div className="flex justify-center mt-4">
                  <Button variant="outline" size="sm" onClick={() => jobsQuery.fetchNextPage()}>
                    Tải thêm
                  </Button>
                </div>
              ) : null}
            </>
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
