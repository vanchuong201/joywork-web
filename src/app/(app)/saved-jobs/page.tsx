"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import useInView from "@/hooks/useInView";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import JobSaveButton from "@/components/jobs/JobSaveButton";

type FavoriteItem = {
  id: string;
  jobId: string;
  createdAt: string;
  job: {
    id: string;
    title: string;
    location?: string | null;
    remote: boolean;
    employmentType: string;
    experienceLevel: string;
    salaryMin?: number | null;
    salaryMax?: number | null;
    currency: string;
    company: {
      id: string;
      name: string;
      slug: string;
      logoUrl?: string | null;
    };
  };
};

const PAGE_SIZE = 10;

export default function SavedJobsPage() {
  const { ref, inView } = useInView({ rootMargin: "0px 0px 200px 0px" });

  const query = useInfiniteQuery({
    queryKey: ["job-favorites"],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const res = await api.get("/api/jobs/me/favorites", {
        params: { page: pageParam, limit: PAGE_SIZE },
      });
      return res.data.data as {
        favorites: FavoriteItem[];
        pagination: { page: number; totalPages: number };
      };
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
  });

  const favorites = useMemo(
    () => query.data?.pages.flatMap((page) => page.favorites) ?? [],
    [query.data]
  );

  const lastPage = query.data?.pages[query.data.pages.length - 1];
  const hasMore = lastPage ? lastPage.pagination.page < lastPage.pagination.totalPages : false;

  useEffect(() => {
    if (inView && hasMore && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  }, [inView, hasMore, query]);

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, idx) => (
          <Card key={idx}>
            <CardHeader className="space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!favorites.length) {
    return (
      <EmptyState
        title="Chưa có việc làm nào được lưu"
        subtitle="Hãy nhấn nút Lưu việc khi duyệt danh sách để thêm vào mục này."
      />
    );
  }

  return (
    <div className="space-y-4">
      {favorites.map((favorite) => (
        <Card key={favorite.id}>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-[var(--foreground)]">{favorite.job.title}</h2>
              <p className="text-sm text-[var(--muted-foreground)]">{favorite.job.company.name}</p>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <p className="text-xs uppercase text-[var(--muted-foreground)]">
                Lưu ngày {new Date(favorite.createdAt).toLocaleDateString()}
              </p>
              <JobSaveButton jobId={favorite.jobId} showLabel />
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-[var(--foreground)]">
            <p>
              <span className="text-[var(--muted-foreground)]">Hình thức: </span>
              {favorite.job.employmentType}
            </p>
            <p>
              <span className="text-[var(--muted-foreground)]">Cấp bậc: </span>
              {favorite.job.experienceLevel}
            </p>
            <p>
              <span className="text-[var(--muted-foreground)]">Địa điểm: </span>
              {favorite.job.remote ? "Remote" : favorite.job.location ?? "Không ghi rõ"}
            </p>
            {(favorite.job.salaryMin || favorite.job.salaryMax) && (
              <p>
                <span className="text-[var(--muted-foreground)]">Mức lương: </span>
                {favorite.job.salaryMin && favorite.job.salaryMax
                  ? `${favorite.job.salaryMin.toLocaleString()} - ${favorite.job.salaryMax.toLocaleString()} ${favorite.job.currency}`
                  : favorite.job.salaryMin
                  ? `${favorite.job.salaryMin.toLocaleString()} ${favorite.job.currency}`
                  : favorite.job.salaryMax
                  ? `${favorite.job.salaryMax.toLocaleString()} ${favorite.job.currency}`
                  : "Thỏa thuận"}
              </p>
            )}
            <div className="pt-2">
              <Link href={`/jobs/${favorite.job.id}`} className="text-[var(--brand)] hover:underline">
                Xem chi tiết việc làm
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}

      {hasMore ? (
        <div ref={ref} className="flex justify-center pt-2">
          {query.isFetchingNextPage ? (
            <Skeleton className="h-9 w-36" />
          ) : (
            <Button variant="outline" onClick={() => query.fetchNextPage()}>
              Tải thêm
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}

