"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import EmptyState from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/useAuth";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type SystemStats = {
  users: number;
  companies: number;
  posts: number;
  jobs: number;
  applications: number;
  follows: number;
  jobFavorites: number;
};

const STAT_LABELS: Record<keyof SystemStats, string> = {
  users: "Người dùng",
  companies: "Doanh nghiệp",
  posts: "Bài viết",
  jobs: "Việc làm",
  applications: "CV của tôi",
  follows: "Lượt theo dõi",
  jobFavorites: "Việc được lưu",
};

export default function SystemPage() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"ALL" | "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED">("PENDING");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["system-overview"],
    queryFn: async () => {
      const res = await api.get("/api/system/overview");
      return res.data.data.stats as SystemStats;
    },
    enabled: user?.role === "ADMIN",
  });

  const verificationsQuery = useQuery({
    queryKey: ["system-company-verifications", statusFilter],
    queryFn: async () => {
      const params = statusFilter === "ALL" ? undefined : { status: statusFilter };
      const res = await api.get("/api/system/company-verifications", { params });
      return res.data.data.companies as Array<{
        id: string;
        name: string;
        legalName: string | null;
        slug: string;
        verificationStatus: string;
        verificationFileUrl: string | null;
        verificationSubmittedAt: string | null;
        verificationReviewedAt: string | null;
        verificationRejectReason: string | null;
        isVerified: boolean;
      }>;
    },
    enabled: user?.role === "ADMIN",
  });

  const approveMutation = useMutation({
    mutationFn: async (companyId: string) => {
      await api.patch(`/api/system/company-verifications/${companyId}/approve`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["system-company-verifications"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ companyId, reason }: { companyId: string; reason?: string }) => {
      await api.patch(`/api/system/company-verifications/${companyId}/reject`, { reason });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["system-company-verifications"] });
    },
  });

  if (user?.role !== "ADMIN") {
    return (
      <EmptyState
        title="Chỉ dành cho quản trị hệ thống"
        subtitle="Bạn cần quyền ADMIN để truy cập bảng điều khiển hệ thống."
      />
    );
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <Card key={idx}>
            <CardHeader className="space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-8 w-1/3" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="Không tải được dữ liệu hệ thống"
        subtitle="Vui lòng thử lại sau hoặc liên hệ đội kỹ thuật."
      />
    );
  }

  const statsEntries = Object.entries(STAT_LABELS) as Array<[keyof SystemStats, string]>;
  const openDownloadUrl = async (companyId: string) => {
    const res = await api.get(`/api/system/company-verifications/${companyId}/download`);
    const url = res.data.data.url as string;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {statsEntries.map(([key, label]) => (
          <Card key={key}>
            <CardHeader className="space-y-2">
              <p className="text-sm font-medium text-[var(--muted-foreground)]">{label}</p>
              <p className="text-3xl font-semibold text-[var(--foreground)]">{data[key].toLocaleString()}</p>
            </CardHeader>
            <CardContent className="text-xs uppercase text-[var(--muted-foreground)]">
              Cập nhật {new Date().toLocaleString()}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="space-y-2">
          <p className="text-sm font-medium text-[var(--muted-foreground)]">Xác thực doanh nghiệp</p>
          <div className="flex flex-wrap gap-2">
            {["ALL", "PENDING", "UNVERIFIED", "VERIFIED", "REJECTED"].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status as typeof statusFilter)}
              >
                {status === "ALL" ? "Tất cả" : status}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {verificationsQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton key={idx} className="h-14 w-full" />
              ))}
            </div>
          ) : verificationsQuery.data && verificationsQuery.data.length > 0 ? (
            verificationsQuery.data.map((company) => (
              <div key={company.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-[var(--foreground)]">{company.name}</p>
                  <p className="text-sm text-[var(--muted-foreground)]">{company.legalName || "Chưa có tên pháp lý"}</p>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    Trạng thái: {company.verificationStatus}
                    {company.verificationRejectReason ? ` • Lý do: ${company.verificationRejectReason}` : ""}
                  </div>
                  {company.verificationFileUrl && (
                    <button
                      type="button"
                      onClick={() => openDownloadUrl(company.id)}
                      className="text-xs text-[var(--brand)] hover:underline"
                    >
                      Tải DKKD
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => approveMutation.mutate(company.id)}
                    disabled={approveMutation.isPending || company.verificationStatus === "VERIFIED"}
                  >
                    Phê duyệt
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => {
                      const reason = window.prompt("Lý do từ chối (tuỳ chọn):") || undefined;
                      rejectMutation.mutate({ companyId: company.id, reason });
                    }}
                    disabled={rejectMutation.isPending || company.verificationStatus === "REJECTED"}
                  >
                    Từ chối
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">Không có hồ sơ xác thực.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

