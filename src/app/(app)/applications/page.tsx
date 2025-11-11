"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EmptyState from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import useInView from "@/hooks/useInView";
import { useEffect, useMemo } from "react";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Đang chờ",
  REVIEWING: "Đang xem xét",
  SHORTLISTED: "Đã shortlist",
  REJECTED: "Từ chối",
  HIRED: "Đã tuyển",
};

type ApplicationItem = {
  id: string;
  jobId: string;
  status: string;
  coverLetter?: string | null;
  resumeUrl?: string | null;
  notes?: string | null;
  appliedAt: string;
  updatedAt: string;
  job: {
    id: string;
    title: string;
    company: {
      id: string;
      name: string;
      slug: string;
      logoUrl?: string | null;
    };
  };
};

const PAGE_SIZE = 10;

export default function ApplicationsPage() {
  const { ref, inView } = useInView({ rootMargin: "0px 0px 200px 0px" });

  const query = useInfiniteQuery({
    queryKey: ["my-applications"],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const res = await api.get("/api/jobs/me/applications", {
        params: { page: pageParam, limit: PAGE_SIZE },
      });
      return res.data.data as {
        applications: ApplicationItem[];
        pagination: { page: number; totalPages: number };
      };
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
  });

  const applications = useMemo(
    () => query.data?.pages.flatMap((page) => page.applications) ?? [],
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

  if (!applications.length) {
    return (
      <EmptyState
        title="Bạn chưa ứng tuyển vị trí nào"
        subtitle="Bắt đầu khám phá các cơ hội việc làm và lưu hồ sơ ngay hôm nay."
      />
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((application) => (
        <Card key={application.id}>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-[var(--foreground)]">
                {application.job.title}
              </h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                {application.job.company.name}
              </p>
            </div>
            <Badge className="bg-[var(--brand)]/10 text-[var(--brand)]">
              {STATUS_LABEL[application.status] ?? application.status}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[var(--foreground)]">
            <p>
              <span className="text-[var(--muted-foreground)]">Ứng tuyển ngày: </span>
              {new Date(application.appliedAt).toLocaleDateString()}
            </p>
            {application.resumeUrl ? (
              <p>
                <span className="text-[var(--muted-foreground)]">CV: </span>
                <a
                  href={application.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--brand)] hover:underline"
                >
                  Xem CV
                </a>
              </p>
            ) : null}
            {application.coverLetter ? (
              <div>
                <p className="text-[var(--muted-foreground)]">Thư giới thiệu:</p>
                <p className="mt-1 leading-relaxed text-[var(--foreground)]">
                  {application.coverLetter}
                </p>
              </div>
            ) : null}
            {application.notes ? (
              <p className="text-[var(--muted-foreground)]">
                Ghi chú: {application.notes}
              </p>
            ) : null}
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

