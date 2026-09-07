"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuth";
import { listMyCvFlipRequests, respondMyCvFlipRequest } from "@/lib/api/cv-flip";
import { CV_FLIP_REQUEST_STATUS_LABEL } from "@/lib/cv-flip-copy";
import { buildJobUrl } from "@/lib/job-url";
import { cn } from "@/lib/utils";
import type { CvFlipRequestStatus } from "@/types/cv-flip";
import { CompanyAvatar } from "@/components/company/CompanyAvatar";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 20;

const STATUS_FILTERS: Array<{ value: "all" | CvFlipRequestStatus; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "REJECTED", label: CV_FLIP_REQUEST_STATUS_LABEL.REJECTED },
  { value: "PENDING", label: CV_FLIP_REQUEST_STATUS_LABEL.PENDING },
  { value: "APPROVED", label: CV_FLIP_REQUEST_STATUS_LABEL.APPROVED },
  { value: "EXPIRED", label: CV_FLIP_REQUEST_STATUS_LABEL.EXPIRED },
];

export default function CandidateCvFlipRequestsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, initialized, loading } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<"all" | CvFlipRequestStatus>("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (initialized && !loading && !user) {
      router.replace("/login");
    }
  }, [initialized, loading, user, router]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const requestsQuery = useQuery({
    queryKey: ["cv-flip-my-requests", statusFilter, currentPage],
    queryFn: () =>
      listMyCvFlipRequests({
        page: currentPage,
        limit: PAGE_SIZE,
        status: statusFilter === "all" ? undefined : statusFilter,
      }),
    enabled: initialized && !loading && !!user,
  });

  const respondRequestMutation = useMutation({
    mutationFn: async ({
      requestId,
      action,
    }: {
      requestId: string;
      action: "approve" | "reject";
    }) => respondMyCvFlipRequest(requestId, action),
    onSuccess: (_data, variables) => {
      toast.success(
        variables.action === "approve"
          ? "Bạn đã đồng ý yêu cầu mở CV."
          : "Bạn đã từ chối yêu cầu mở CV.",
      );
      queryClient.invalidateQueries({ queryKey: ["cv-flip-my-requests"] });
    },
    onError: (error: unknown) => {
      const maybeAxiosError = error as {
        response?: { data?: { error?: { code?: string; message?: string } } };
      };
      const code = maybeAxiosError.response?.data?.error?.code;
      const message = maybeAxiosError.response?.data?.error?.message;
      const isExpired =
        code === "CV_FLIP_REQUEST_EXPIRED" || /hết hạn/i.test(message ?? "");
      toast.error(
        isExpired ? "Yêu cầu đã hết hạn" : message || "Không thể xử lý yêu cầu lúc này.",
      );
      queryClient.invalidateQueries({ queryKey: ["cv-flip-my-requests"] });
    },
  });

  const requests = requestsQuery.data?.requests ?? [];
  const pagination = requestsQuery.data?.pagination ?? {
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  };

  if (!initialized || loading) {
    return (
      <div className="mx-auto max-w-6xl p-4 text-sm text-[var(--muted-foreground)]">
        Đang tải dữ liệu...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">Doanh nghiệp kết nối</h1>
        <div className="space-y-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
          <p>Đây là trang để bạn quản lý những yêu cầu kết nối từ phía doanh nghiệp.</p>
          <p>
            Những yêu cầu dưới đây thể hiện rằng Doanh Nghiệp đã đánh giá những kỹ năng và
            kinh nghiệm trong CV của bạn rất phù hợp với vị trí tuyển dụng của họ.
          </p>
          <p>Nếu bạn bấm vào đồng ý, doanh nghiệp sẽ được xem thông tin liên hệ của bạn.</p>
          <p>Nếu bạn thấy doanh nghiệp hoặc công việc chưa phù hợp, hãy bấm vào từ chối.</p>
          <p>
            Mỗi yêu cầu kết nối có thời hạn 10 ngày, sau đó sẽ tự động chuyển thành trạng thái
            hết hạn.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--card)] p-1">
        {STATUS_FILTERS.map((filter) => (
          <Button
            key={filter.value}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setStatusFilter(filter.value)}
            className={cn(
              "h-8 px-3 text-xs",
              statusFilter === filter.value && "bg-[var(--muted)] font-medium text-[var(--foreground)]",
            )}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {requestsQuery.isLoading ? (
        <p className="text-sm text-[var(--muted-foreground)]">Đang tải danh sách yêu cầu...</p>
      ) : requestsQuery.isError ? (
        <p className="text-sm text-[var(--muted-foreground)]">
          Không tải được danh sách yêu cầu. Vui lòng thử lại.
        </p>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
          Chưa có yêu cầu kết nối nào{statusFilter === "all" ? "" : " ở trạng thái này"}.
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => {
            const companyHref = `/companies/${encodeURIComponent(request.company.slug)}`;

            return (
              <div
                key={request.id}
                className="rounded-xl border border-[var(--border)] p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <CompanyAvatar
                      logoUrl={request.company.logoUrl}
                      name={request.company.name}
                      badges={request.company.badges}
                      size={44}
                      shape="square"
                      badgeSize="compact"
                      imgClassName="object-cover"
                    />
                    <div className="min-w-0 space-y-1">
                      <Link
                        href={companyHref}
                        className="text-sm font-semibold text-[var(--foreground)] underline-offset-2 hover:underline"
                      >
                        {request.company.name}
                      </Link>
                      {request.job ? (
                        <p className="text-xs text-[var(--muted-foreground)]">
                          Việc làm phù hợp:{" "}
                          <Link
                            href={buildJobUrl(request.job)}
                            className="font-medium text-[var(--foreground)] underline underline-offset-2"
                          >
                            {request.job.title}
                          </Link>
                        </p>
                      ) : null}
                      {request.message ? (
                        <p className="whitespace-pre-line text-sm text-[var(--foreground)]">
                          <span className="font-medium">Lời nhắn:</span> {request.message}
                        </p>
                      ) : null}
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Hết hạn: {new Date(request.expiresAt).toLocaleString("vi-VN")}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                    <span
                      className={cn(
                        "inline-flex rounded-md border border-[var(--border)] px-2 py-0.5 text-xs",
                        request.status === "APPROVED" && "border-transparent bg-[var(--muted)] font-medium",
                        (request.status === "REJECTED" || request.status === "EXPIRED") &&
                          "text-[var(--muted-foreground)]",
                      )}
                    >
                      {CV_FLIP_REQUEST_STATUS_LABEL[request.status]}
                    </span>
                    {request.status === "PENDING" ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            respondRequestMutation.mutate({
                              requestId: request.id,
                              action: "approve",
                            })
                          }
                          disabled={respondRequestMutation.isPending}
                        >
                          Đồng ý
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            respondRequestMutation.mutate({
                              requestId: request.id,
                              action: "reject",
                            })
                          }
                          disabled={respondRequestMutation.isPending}
                        >
                          Từ chối
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
