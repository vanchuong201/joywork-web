"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Grid3x3, List, Search } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type CourseListItem = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  thumbnailUrl: string | null;
  visibility: string;
  updatedAt: string;
};

type ListResponse = {
  courses: CourseListItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export default function CoursesPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");

  const query = useQuery({
    queryKey: ["courses", page, q],
    queryFn: async () => {
      const res = await api.get<{ data: ListResponse }>("/api/courses", {
        params: { page, limit: 12, ...(q.trim() ? { q: q.trim() } : {}) },
      });
      return res.data.data;
    },
  });

  const courses = query.data?.courses ?? [];
  const pagination = query.data?.pagination;

  const empty = !query.isLoading && courses.length === 0;

  const onSearch = () => {
    setPage(1);
    setQ(qInput.trim());
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">Khóa học</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Học kỹ năng mới với video và tài liệu đính kèm.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex min-w-[200px] flex-1 items-center gap-2 sm:max-w-xs">
            <Input
              placeholder="Tìm theo tên…"
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearch()}
              className="h-9"
            />
            <Button type="button" variant="secondary" size="icon" className="h-9 w-9 shrink-0" onClick={onSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex rounded-md border border-[var(--border)] p-0.5">
            <Button
              type="button"
              variant={view === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-2"
              onClick={() => setView("grid")}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={view === "list" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-2"
              onClick={() => setView("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {query.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-4 h-48" />
          ))}
        </div>
      ) : empty ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--muted)]/20 px-6 py-16 text-center text-sm text-[var(--muted-foreground)]">
          Chưa có khóa học phù hợp.
        </div>
      ) : view === "grid" ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <Link
              key={c.id}
              href={`/courses/${c.slug}`}
              className="group flex flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm transition hover:border-[var(--brand)]/40 hover:shadow-md"
            >
              <div className="relative aspect-video w-full bg-[var(--muted)]">
                {c.thumbnailUrl ? (
                  <Image
                    src={c.thumbnailUrl}
                    alt=""
                    fill
                    className="object-cover transition group-hover:scale-[1.02]"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    unoptimized={c.thumbnailUrl.includes("X-Amz-Algorithm=")}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-[var(--muted-foreground)]">
                    Khóa học
                  </div>
                )}
                {c.visibility === "PRIVATE" ? (
                  <span className="absolute right-2 top-2 rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-medium text-white">
                    Riêng tư
                  </span>
                ) : null}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <h2 className="line-clamp-2 text-base font-semibold text-[var(--foreground)] group-hover:text-[var(--brand)]">
                  {c.title}
                </h2>
                <p className="line-clamp-2 text-sm text-[var(--muted-foreground)]">{c.shortDescription}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <ul className="space-y-3">
          {courses.map((c) => (
            <li key={c.id}>
              <Link
                href={`/courses/${c.slug}`}
                className="flex gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 transition hover:border-[var(--brand)]/40"
              >
                <div className="relative h-24 w-40 shrink-0 overflow-hidden rounded-lg bg-[var(--muted)]">
                  {c.thumbnailUrl ? (
                    <Image
                      src={c.thumbnailUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="160px"
                      unoptimized={c.thumbnailUrl.includes("X-Amz-Algorithm=")}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] text-[var(--muted-foreground)]">
                      Khóa học
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 py-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-[var(--foreground)]">{c.title}</h2>
                    {c.visibility === "PRIVATE" ? (
                      <span className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-[10px] text-[var(--muted-foreground)]">
                        Riêng tư
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-[var(--muted-foreground)]">{c.shortDescription}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {pagination && pagination.totalPages > 1 ? (
        <div className="flex justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Trước
          </Button>
          <span className="flex items-center px-2 text-sm text-[var(--muted-foreground)]">
            {page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau
          </Button>
        </div>
      ) : null}
    </div>
  );
}
