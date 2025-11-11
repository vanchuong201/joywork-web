"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import EmptyState from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

type FollowItem = {
  followId: string;
  followedAt: string;
  company: {
    id: string;
    name: string;
    slug: string;
    tagline?: string | null;
    industry?: string | null;
    location?: string | null;
    logoUrl?: string | null;
    coverUrl?: string | null;
  };
};

export default function FollowingCompaniesPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["company-follows"],
    queryFn: async () => {
      const res = await api.get("/api/companies/me/follows");
      return res.data.data.follows as FollowItem[];
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Card key={idx}>
            <CardHeader>
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError || !data?.length) {
    return (
      <EmptyState
        title="Bạn chưa theo dõi công ty nào"
        subtitle="Hãy khám phá danh mục công ty và nhấn Follow để cập nhật câu chuyện mới nhất."
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {data.map((item) => (
        <Card key={item.followId} className="overflow-hidden">
          {item.company.coverUrl ? (
            <div className="h-32 w-full overflow-hidden">
              <img
                src={item.company.coverUrl}
                alt={item.company.name}
                className="h-full w-full object-cover"
              />
            </div>
          ) : null}
          <CardHeader className="flex flex-row items-center gap-3">
            {item.company.logoUrl ? (
              <img
                src={item.company.logoUrl}
                alt={item.company.name}
                className="h-10 w-10 rounded-md object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--muted)] text-sm font-semibold text-[var(--muted-foreground)]">
                {item.company.name.slice(0, 1)}
              </div>
            )}
            <div>
              <Link
                href={`/companies/${item.company.slug}`}
                className="text-base font-semibold text-[var(--foreground)] hover:text-[var(--brand)]"
              >
                {item.company.name}
              </Link>
              <p className="text-xs text-[var(--muted-foreground)]">
                Theo dõi từ {new Date(item.followedAt).toLocaleDateString()}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-[var(--foreground)]">
            <p>{item.company.tagline ?? "Chưa có tagline"}</p>
            <div className="text-xs text-[var(--muted-foreground)]">
              {item.company.industry && <span>{item.company.industry}</span>}
              {item.company.industry && item.company.location ? " • " : ""}
              {item.company.location}
            </div>
            <Link
              href={`/companies/${item.company.slug}`}
              className="text-sm text-[var(--brand)] hover:underline"
            >
              Xem chi tiết
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

