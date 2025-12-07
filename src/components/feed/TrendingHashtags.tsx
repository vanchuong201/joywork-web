"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function TrendingHashtags() {
  const { data, isLoading } = useQuery({
    queryKey: ["trending-hashtags"],
    queryFn: async () => {
      const res = await api.get("/api/hashtags/trending", { params: { window: "7d", limit: 10 } });
      return (res.data?.data?.items ?? []) as { id: string; slug: string; label: string; count: number }[];
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3 mb-6">
        <Skeleton className="h-5 w-32 mb-3" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  return (
    <section className="mb-6">
      <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Chủ đề nổi bật</h3>
      <ul className="space-y-2">
        {data.map((tag) => (
          <li key={tag.id}>
            <Link
              href={`/tags/${tag.slug}`}
              className="group flex items-center justify-between text-sm text-[var(--muted-foreground)] hover:text-[var(--brand)]"
            >
              <span className="font-medium truncate mr-2">#{tag.label}</span>
              <span className="shrink-0 text-xs bg-[var(--muted)] px-2 py-0.5 rounded-full text-[var(--muted-foreground)] group-hover:bg-[var(--brand)]/10 group-hover:text-[var(--brand)]">
                {tag.count}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}


