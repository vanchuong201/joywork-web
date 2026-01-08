"use client";

import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import Link from "next/link";
import { cn } from "@/lib/utils";

type MediaItem = {
  id: string;
  previewUrl: string;
  status: "uploading" | "uploaded" | "error";
  url?: string;
  key?: string;
  width?: number;
  height?: number;
};

type PreviewData = {
  content: string;
  mediaItems: MediaItem[];
  hashtags: string[];
  selectedJobIds: string[];
  jobs: Array<{ id: string; title: string; location?: string | null; employmentType: string; isActive: boolean }>;
  company: { id: string; name: string; slug: string; logoUrl?: string | null };
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewData: PreviewData | null;
};

function MediaGrid({ images }: { images: MediaItem[] }) {
  // Use uploaded URL if available, otherwise fallback to previewUrl
  const uploadedImages = images
    .filter((img) => img.status === "uploaded")
    .map((img) => ({
      ...img,
      displayUrl: img.url || img.previewUrl, // Use uploaded URL or fallback to preview
    }));
  
  if (uploadedImages.length === 0) return null;

  if (uploadedImages.length === 1) {
    const img = uploadedImages[0]!;
    return (
      <PhotoProvider maskOpacity={0.8}>
        <PhotoView src={img.displayUrl}>
          <div className="mt-3 w-full overflow-hidden rounded-md bg-[var(--muted)] cursor-zoom-in">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.displayUrl}
              alt="preview"
              className="h-auto w-full object-cover transition-transform duration-200 hover:scale-105"
            />
          </div>
        </PhotoView>
      </PhotoProvider>
    );
  }

  if (uploadedImages.length === 2) {
    return (
      <PhotoProvider maskOpacity={0.8}>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {uploadedImages.map((img, idx) => (
            <PhotoView key={img.id} src={img.displayUrl}>
              <div className="aspect-square overflow-hidden rounded-md bg-[var(--muted)] cursor-zoom-in">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.displayUrl}
                  alt={`preview ${idx + 1}`}
                  className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
                />
              </div>
            </PhotoView>
          ))}
        </div>
      </PhotoProvider>
    );
  }

  if (uploadedImages.length === 3) {
    return (
      <PhotoProvider maskOpacity={0.8}>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <PhotoView src={uploadedImages[0]!.displayUrl}>
            <div className="row-span-2 aspect-square overflow-hidden rounded-md bg-[var(--muted)] cursor-zoom-in">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={uploadedImages[0]!.displayUrl}
                alt="preview 1"
                className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
              />
            </div>
          </PhotoView>
          <PhotoView src={uploadedImages[1]!.displayUrl}>
            <div className="aspect-square overflow-hidden rounded-md bg-[var(--muted)] cursor-zoom-in">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={uploadedImages[1]!.displayUrl}
                alt="preview 2"
                className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
              />
            </div>
          </PhotoView>
          <PhotoView src={uploadedImages[2]!.displayUrl}>
            <div className="aspect-square overflow-hidden rounded-md bg-[var(--muted)] cursor-zoom-in">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={uploadedImages[2]!.displayUrl}
                alt="preview 3"
                className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
              />
            </div>
          </PhotoView>
        </div>
      </PhotoProvider>
    );
  }

  // 4+ images: grid layout
  const gridCols = uploadedImages.length === 4 ? "grid-cols-2" : "grid-cols-3";
  return (
    <PhotoProvider maskOpacity={0.8}>
      <div className={cn("mt-3 grid gap-2", gridCols)}>
        {uploadedImages.slice(0, 9).map((img, idx) => (
          <PhotoView key={img.id} src={img.displayUrl}>
            <div className="aspect-square overflow-hidden rounded-md bg-[var(--muted)] cursor-zoom-in relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.displayUrl}
                alt={`preview ${idx + 1}`}
                className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
              />
              {idx === 8 && uploadedImages.length > 9 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white font-semibold">
                  +{uploadedImages.length - 9}
                </div>
              )}
            </div>
          </PhotoView>
        ))}
      </div>
    </PhotoProvider>
  );
}

function PostContent({ content }: { content: string }) {
  if (!content.trim()) return null;
  
  return (
    <div className="mt-3">
      <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--muted-foreground)]">
        {content}
      </p>
    </div>
  );
}

export default function PostPreviewModal({ open, onOpenChange, previewData }: Props) {
  const previewPost = useMemo(() => {
    if (!previewData) return null;

    const uploadedImages = previewData.mediaItems
      .filter((img) => img.status === "uploaded" && img.url)
      .map((img, idx) => ({
        id: img.id,
        url: img.url!,
        width: img.width,
        height: img.height,
        order: idx,
      }));

    const selectedJobs = previewData.selectedJobIds
      .map((id) => previewData.jobs.find((j) => j.id === id))
      .filter(Boolean) as Array<{ id: string; title: string; location?: string | null; employmentType: string; isActive: boolean }>;

    const hashtagLabels = previewData.hashtags.map((tag) => {
      // Extract label from hashtag (remove # if present)
      const label = tag.startsWith("#") ? tag.slice(1).trim() : tag.trim();
      return label;
    });

    return {
      content: previewData.content,
      images: uploadedImages,
      hashtags: hashtagLabels,
      jobs: selectedJobs,
      company: previewData.company,
    };
  }, [previewData]);

  if (!previewPost) return null;

  const hasImages = previewPost.images.length > 0;
  const hasHashtags = previewPost.hashtags.length > 0;
  const hasJobs = previewPost.jobs.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Xem trước bài đăng</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <article className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-0 overflow-hidden">
            <div className="p-4">
              {/* Company Header */}
              <div className="mb-1 flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
                {previewPost.company.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewPost.company.logoUrl}
                    alt={previewPost.company.name}
                    className="h-7 w-7 rounded-full object-cover border border-[var(--border)]"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-[var(--muted)] flex items-center justify-center text-[10px] font-semibold text-[var(--muted-foreground)]">
                    {previewPost.company.name.slice(0, 1)}
                  </div>
                )}
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      className="font-medium hover:text-[var(--foreground)] text-[var(--foreground)]"
                      href={`/companies/${previewPost.company.slug}`}
                    >
                      {previewPost.company.name}
                    </Link>
                  </div>
                  <div className="text-xs flex items-center gap-2">
                    <span>Vừa xong</span>
                  </div>
                </div>
              </div>

              {/* Images */}
              {hasImages && (
                <MediaGrid images={previewData!.mediaItems.filter((img) => img.status === "uploaded")} />
              )}

              {/* Content */}
              <PostContent content={previewPost.content} />

              {/* Hashtags */}
              {hasHashtags && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {previewPost.hashtags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center rounded-full bg-[var(--muted)]/50 px-2.5 py-0.5 text-xs font-medium text-[var(--brand)] border border-transparent"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Jobs */}
              {hasJobs && (
                <div className="mt-3 space-y-2">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {previewPost.jobs.map((job) => (
                      <div
                        key={job.id}
                        className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 hover:border-[var(--brand)]/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-[var(--foreground)] truncate">
                              {job.title}
                            </h4>
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                              <span
                                className={cn(
                                  "inline-block w-1.5 h-1.5 rounded-full",
                                  job.isActive ? "bg-emerald-500" : "bg-gray-300"
                                )}
                              />
                              <span>{job.isActive ? "Đang mở" : "Đã đóng"}</span>
                              {job.location && (
                                <>
                                  <span>·</span>
                                  <span className="truncate">{job.location}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Bar Placeholder */}
              <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-sm text-[var(--muted-foreground)]">
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-1.5 hover:text-[var(--foreground)] transition-colors">
                    <span>Thích</span>
                  </button>
                  <button className="flex items-center gap-1.5 hover:text-[var(--foreground)] transition-colors">
                    <span>Lưu bài</span>
                  </button>
                  <button className="flex items-center gap-1.5 hover:text-[var(--foreground)] transition-colors">
                    <span>Chia sẻ</span>
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>
      </DialogContent>
    </Dialog>
  );
}

