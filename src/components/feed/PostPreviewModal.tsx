"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Play, Maximize2, X } from "lucide-react";
import { createPortal } from "react-dom";

// Video Modal for fullscreen video viewing
function VideoModal({ videoUrl, onClose }: { videoUrl: string; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        aria-label="Đóng"
      >
        <X className="h-6 w-6" />
      </button>
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        autoPlay
        playsInline
        className="max-h-[90vh] max-w-[90vw] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body
  );
}

type MediaItem = {
  id: string;
  previewUrl: string;
  status: "uploading" | "uploaded" | "error";
  url?: string;
  key?: string;
  width?: number;
  height?: number;
  type?: "IMAGE" | "VIDEO";
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
  const [fullscreenVideoUrl, setFullscreenVideoUrl] = useState<string | null>(null);
  
  // Use uploaded URL if available, otherwise fallback to previewUrl
  const uploadedImages = images
    .filter((img) => img.status === "uploaded")
    .map((img) => ({
      ...img,
      displayUrl: img.url || img.previewUrl, // Use uploaded URL or fallback to preview
    }));
  
  if (uploadedImages.length === 0) return null;

  const renderMediaItem = (item: typeof uploadedImages[number], className: string) => {
    // Check if it's a video by type or file extension
    const isVideo = item.type === "VIDEO" || 
                    item.displayUrl.match(/\.(mp4|webm|mov)(\?|$)/i) !== null;
    
    if (isVideo) {
      return (
        <div className={cn(className, "group relative cursor-pointer")} onClick={() => setFullscreenVideoUrl(item.displayUrl)}>
          <video
            src={item.displayUrl}
            className="h-full w-full object-cover pointer-events-none"
            playsInline
            muted
            preload="metadata"
          />
          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white group-hover:scale-110 transition-transform">
              <Play className="h-5 w-5 ml-0.5" fill="white" />
            </div>
          </div>
          {/* Fullscreen hint */}
          <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/60 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
            <Maximize2 className="h-3 w-3" /> Xem toàn màn hình
          </div>
        </div>
      );
    }
    return (
      <PhotoView src={item.displayUrl}>
        <div className={className}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.displayUrl}
            alt="preview"
            className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
          />
        </div>
      </PhotoView>
    );
  };

  const renderContent = () => {
    if (uploadedImages.length === 1) {
      const img = uploadedImages[0]!;
      return (
        <PhotoProvider maskOpacity={0.8}>
          {renderMediaItem(img, "mt-3 w-full overflow-hidden rounded-md bg-[var(--muted)] cursor-zoom-in")}
        </PhotoProvider>
      );
    }

    if (uploadedImages.length === 2) {
      return (
        <PhotoProvider maskOpacity={0.8}>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {uploadedImages.map((img) => (
              <div key={img.id}>
                {renderMediaItem(img, "aspect-square overflow-hidden rounded-md bg-[var(--muted)] cursor-zoom-in")}
              </div>
            ))}
          </div>
        </PhotoProvider>
      );
    }

    if (uploadedImages.length === 3) {
      return (
        <PhotoProvider maskOpacity={0.8}>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="row-span-2">
              {renderMediaItem(uploadedImages[0]!, "aspect-square overflow-hidden rounded-md bg-[var(--muted)] cursor-zoom-in")}
            </div>
            {uploadedImages.slice(1).map((img) => (
              <div key={img.id}>
                {renderMediaItem(img, "aspect-square overflow-hidden rounded-md bg-[var(--muted)] cursor-zoom-in")}
              </div>
            ))}
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
            <div key={img.id} className="relative">
              {renderMediaItem(img, "aspect-square overflow-hidden rounded-md bg-[var(--muted)] cursor-zoom-in")}
              {idx === 8 && uploadedImages.length > 9 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white font-semibold pointer-events-none">
                  +{uploadedImages.length - 9}
                </div>
              )}
            </div>
          ))}
        </div>
      </PhotoProvider>
    );
  };

  return (
    <>
      {renderContent()}
      {fullscreenVideoUrl && (
        <VideoModal videoUrl={fullscreenVideoUrl} onClose={() => setFullscreenVideoUrl(null)} />
      )}
    </>
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
        type: img.type ?? "IMAGE",
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

