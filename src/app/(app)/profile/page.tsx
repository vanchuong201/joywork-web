"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";

type ProfileResponse = {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  createdAt: string;
  profile?: {
    avatar?: string | null;
    headline?: string | null;
    bio?: string | null;
    skills: string[];
    cvUrl?: string | null;
    location?: string | null;
    website?: string | null;
    github?: string | null;
    linkedin?: string | null;
  } | null;
};

export default function ProfilePage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await api.get("/api/users/me");
      return res.data.data.user as ProfileResponse;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="Không tải được hồ sơ"
        subtitle="Vui lòng thử lại hoặc liên hệ đội hỗ trợ nếu lỗi tiếp diễn."
      />
    );
  }

  const profile = data.profile;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {profile?.avatar ? (
            <img
              src={profile.avatar}
              alt={data.name ?? data.email}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--muted)] text-lg font-semibold text-[var(--muted-foreground)]">
              {(data.name ?? data.email).slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-[var(--foreground)]">{data.name ?? data.email}</h1>
            <p className="text-sm text-[var(--muted-foreground)]">{profile?.headline ?? "Chưa cập nhật headline"}</p>
            <p className="text-sm text-[var(--muted-foreground)]">{data.email}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Giới thiệu</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--foreground)]">
              {profile?.bio ?? "Bạn chưa cập nhật phần giới thiệu."}
            </p>
          </section>
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Kỹ năng</h2>
            {profile?.skills?.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <Badge key={skill}>{skill}</Badge>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">Chưa có kỹ năng nào.</p>
            )}
          </section>
          <section className="grid gap-3 sm:grid-cols-2">
            <InfoRow label="Vị trí" value={profile?.location ?? "Chưa có"} />
            <InfoRow label="Website" value={profile?.website} isLink />
            <InfoRow label="GitHub" value={profile?.github} isLink />
            <InfoRow label="LinkedIn" value={profile?.linkedin} isLink />
            <InfoRow label="CV" value={profile?.cvUrl} isLink />
          </section>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            Thông tin tài khoản
          </h2>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-[var(--foreground)]">
          <div className="flex justify-between">
            <span className="text-[var(--muted-foreground)]">Vai trò</span>
            <span>{data.role === "ADMIN" ? "Quản trị hệ thống" : "Ứng viên"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted-foreground)]">Tham gia</span>
            <span>{new Date(data.createdAt).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value, isLink }: { label: string; value?: string | null; isLink?: boolean }) {
  if (!value) {
    return (
      <div>
        <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">{label}</p>
        <p className="text-sm text-[var(--muted-foreground)]">Chưa cập nhật</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">{label}</p>
      {isLink ? (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-[var(--brand)] hover:underline"
        >
          {value}
        </a>
      ) : (
        <p className="text-sm text-[var(--foreground)]">{value}</p>
      )}
    </div>
  );
}

