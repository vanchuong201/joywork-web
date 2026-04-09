"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Play } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuth";
import type { CourseDetailPayload } from "@/components/courses/course-media";

export default function CourseIntroPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const user = useAuthStore((s) => s.user);

  const detailQuery = useQuery({
    queryKey: ["course-detail", slug, user?.id ?? "anon"],
    queryFn: async () => {
      const res = await api.get<{ data: CourseDetailPayload }>(`/api/courses/${encodeURIComponent(slug)}`);
      return res.data.data;
    },
    enabled: Boolean(slug),
  });

  const data = detailQuery.data;
  const lessons = data?.lessons ?? [];
  const firstLessonId = lessons[0]?.id;

  if (detailQuery.isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-[var(--muted)]" />
        <div className="aspect-[21/9] max-w-3xl animate-pulse rounded-xl bg-[var(--muted)]" />
      </div>
    );
  }

  if (detailQuery.isError || !data) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center text-sm text-[var(--muted-foreground)]">
        Không tải được khóa học.{" "}
        <Link href="/courses" className="font-medium text-[var(--brand)] hover:underline">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const { course } = data;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Link
        href="/courses"
        className="inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      >
        <ChevronLeft className="h-4 w-4" />
        Khóa học
      </Link>

      <div className="grid max-w-md grid-cols-2 gap-1 rounded-lg bg-[var(--muted)]/40 p-1">
        <span className="rounded-md bg-[var(--card)] px-2 py-2 text-center text-xs font-semibold text-[var(--foreground)] shadow-sm">
          Giới thiệu
        </span>
        {firstLessonId ? (
          <Link
            href={`/courses/${encodeURIComponent(slug)}/learn/${encodeURIComponent(firstLessonId)}`}
            className="rounded-md px-2 py-2 text-center text-xs font-medium text-[var(--muted-foreground)] transition hover:bg-[var(--card)] hover:text-[var(--foreground)]"
          >
            Bài học
          </Link>
        ) : (
          <span className="rounded-md px-2 py-2 text-center text-xs text-[var(--muted-foreground)]/70">Bài học</span>
        )}
      </div>

      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">{course.title}</h1>
        <p className="text-sm text-[var(--muted-foreground)]">{course.shortDescription}</p>
        {course.description ? (
          <p className="text-sm leading-relaxed text-[var(--muted-foreground)] whitespace-pre-wrap">{course.description}</p>
        ) : null}
      </header>

      {course.thumbnailUrl ? (
        <div className="relative aspect-[21/9] w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--muted)]">
          <Image
            src={course.thumbnailUrl}
            alt=""
            fill
            className="object-cover opacity-95"
            sizes="(max-width: 768px) 100vw, 768px"
            unoptimized={course.thumbnailUrl.includes("X-Amz-Algorithm=")}
          />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {firstLessonId ? (
          <Button asChild size="lg" className="gap-2">
            <Link href={`/courses/${encodeURIComponent(slug)}/learn/${encodeURIComponent(firstLessonId)}`}>
              <Play className="h-4 w-4" />
              Bắt đầu học
            </Link>
          </Button>
        ) : (
          <p className="text-sm text-[var(--muted-foreground)]">Khóa học chưa có bài học.</p>
        )}
      </div>
    </div>
  );
}
