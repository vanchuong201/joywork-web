"use client";

export type LessonVideo = {
  id: string;
  sortOrder: number;
  source: string;
  requiresAuth: boolean;
  playbackUrl: string | null;
};

export type LessonAttachment = {
  id: string;
  name: string;
  sortOrder: number;
  requiresAuth: boolean;
  url: string | null;
};

export type LessonDetail = {
  id: string;
  title: string;
  sortOrder: number;
  videos: LessonVideo[];
  attachments: LessonAttachment[];
};

export type CourseDetailPayload = {
  course: {
    id: string;
    title: string;
    slug: string;
    shortDescription: string;
    description: string | null;
    thumbnailUrl: string | null;
    visibility: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  lessons: LessonDetail[];
  contentUnlocked: boolean;
};

export function youtubeEmbedFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace(/^\//, "").split("?")[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) {
        return `https://www.youtube.com/embed/${v}`;
      }
      const m = u.pathname.match(/\/embed\/([^/?]+)/);
      if (m?.[1]) {
        return `https://www.youtube.com/embed/${m[1]}`;
      }
      const shorts = u.pathname.match(/\/shorts\/([^/?]+)/);
      if (shorts?.[1]) {
        return `https://www.youtube.com/embed/${shorts[1]}`;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function CourseVideoFrame({ playbackUrl }: { playbackUrl: string }) {
  const embed = youtubeEmbedFromUrl(playbackUrl);
  if (embed) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
        <iframe
          title="Video bài học"
          src={embed}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
      <video src={playbackUrl} controls className="h-full w-full" playsInline />
    </div>
  );
}
