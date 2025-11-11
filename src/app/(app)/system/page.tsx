"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import EmptyState from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/useAuth";

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
  applications: "Hồ sơ ứng tuyển",
  follows: "Lượt theo dõi",
  jobFavorites: "Việc được lưu",
};

export default function SystemPage() {
  const user = useAuthStore((s) => s.user);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["system-overview"],
    queryFn: async () => {
      const res = await api.get("/api/system/overview");
      return res.data.data.stats as SystemStats;
    },
    enabled: user?.role === "ADMIN",
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

  return (
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
  );
}

