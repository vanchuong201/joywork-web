"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuth";
import { cn } from "@/lib/utils";
import {
  CourseVideoFrame,
  type CourseDetailPayload,
} from "@/components/courses/course-media";

export default function CourseLessonPage() {
  const params = useParams<{ slug: string; lessonId: string }>();
  const router = useRouter();
  const slug = params?.slug ?? "";
  const lessonIdParam = params?.lessonId ?? "";
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
  const contentUnlocked = data?.contentUnlocked ?? false;

  const [videoIdx, setVideoIdx] = useState(0);

  useEffect(() => {
    if (!lessons.length) return;
    const exists = lessons.some((l) => l.id === lessonIdParam);
    if (!exists) {
      router.replace(`/courses/${encodeURIComponent(slug)}/learn/${encodeURIComponent(lessons[0].id)}`);
    }
  }, [lessons, lessonIdParam, router, slug]);

  useEffect(() => {
    setVideoIdx(0);
  }, [lessonIdParam]);

  const activeLesson = useMemo(
    () => lessons.find((l) => l.id === lessonIdParam) ?? null,
    [lessons, lessonIdParam],
  );

  const videos = activeLesson?.videos ?? [];
  const currentVideo = videos[videoIdx] ?? null;

  if (detailQuery.isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-[var(--muted)]" />
        <div className="aspect-video animate-pulse rounded-xl bg-[var(--muted)]" />
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

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <aside className="lg:w-72 lg:shrink-0">
        <Link
          href="/courses"
          className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <ChevronLeft className="h-4 w-4" />
          Khóa học
        </Link>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3">
          <div className="mb-3 grid grid-cols-2 gap-1 rounded-lg bg-[var(--muted)]/40 p-1">
            <Link
              href={`/courses/${encodeURIComponent(slug)}`}
              className="rounded-md px-2 py-2 text-center text-xs font-medium text-[var(--muted-foreground)] transition hover:bg-[var(--card)] hover:text-[var(--foreground)]"
            >
              Giới thiệu
            </Link>
            <span className="rounded-md bg-[var(--card)] px-2 py-2 text-center text-xs font-semibold text-[var(--foreground)] shadow-sm">
              Bài học
            </span>
          </div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
            Danh sách
          </p>
          <ul className="max-h-[50vh] space-y-1 overflow-y-auto pr-1">
            {lessons.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/courses/${encodeURIComponent(slug)}/learn/${encodeURIComponent(l.id)}`}
                  className={cn(
                    "block w-full rounded-md px-2 py-2 text-left text-sm transition",
                    l.id === lessonIdParam
                      ? "bg-[var(--brand)]/15 font-medium text-[var(--foreground)]"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]",
                  )}
                >
                  <span className="line-clamp-2">{l.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="min-w-0 flex-1 space-y-6">
        {activeLesson ? (
          <>
            <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)] sm:text-2xl">
              {activeLesson.title}
            </h1>

            <div className="relative rounded-xl border border-[var(--border)] bg-black/5 p-4 dark:bg-black/20">
              {!contentUnlocked ? (
                <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 rounded-lg bg-[var(--muted)] px-6 text-center">
                  <Lock className="h-10 w-10 text-[var(--muted-foreground)]" />
                  {!user ? (
                    <>
                      <p className="text-sm text-[var(--muted-foreground)]">Đăng nhập để xem video và tải tài liệu.</p>
                      <Button asChild>
                        <Link
                          href={`/login?redirect=${encodeURIComponent(`/courses/${slug}/learn/${lessonIdParam}`)}`}
                        >
                          Đăng nhập
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Bạn chưa được cấp quyền truy cập nội dung khóa học này.
                    </p>
                  )}
                </div>
              ) : currentVideo?.playbackUrl ? (
                <CourseVideoFrame playbackUrl={currentVideo.playbackUrl} />
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-lg bg-[var(--muted)] text-sm text-[var(--muted-foreground)]">
                  Chưa có video cho bài học này.
                </div>
              )}

              {contentUnlocked && videos.length > 1 ? (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
                  <span className="text-sm text-[var(--muted-foreground)]">
                    Phần video {videoIdx + 1} / {videos.length}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={videoIdx <= 0}
                      onClick={() => setVideoIdx((i) => Math.max(0, i - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Trước
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={videoIdx >= videos.length - 1}
                      onClick={() => setVideoIdx((i) => Math.min(videos.length - 1, i + 1))}
                    >
                      Sau
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>

            {activeLesson.attachments.length > 0 ? (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                <h3 className="text-sm font-semibold text-[var(--foreground)]">Tài liệu đính kèm</h3>
                <ul className="mt-3 space-y-2">
                  {activeLesson.attachments.map((a) => (
                    <li key={a.id}>
                      {contentUnlocked && a.url ? (
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-[var(--brand)] hover:underline"
                        >
                          {a.name}
                        </a>
                      ) : (
                        <span className="text-sm text-[var(--muted-foreground)]">{a.name}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-[var(--muted-foreground)]">Khóa học chưa có bài học.</p>
        )}
      </main>
    </div>
  );
}
