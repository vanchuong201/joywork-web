"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, BookmarkCheck, BookmarkPlus, MoreVertical, Pencil, Trash2, Briefcase, X, Check, MessageCircle, Play, Maximize2, ShieldCheck } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import { toast } from "sonner";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/store/useAuth";
import { useAuthPrompt } from "@/contexts/AuthPromptContext";
import { cn } from "@/lib/utils";
import CompanyHoverCard from "@/components/company/CompanyHoverCard";
import CompanyFollowButton from "@/components/company/CompanyFollowButton";
import { format, formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { uploadCompanyPostImage } from "@/lib/uploads";
import { createPortal } from "react-dom";
import HashtagInput from "@/components/shared/HashtagInput";
import CreateTicketModal from "@/components/tickets/CreateTicketModal";
import useInView from "@/hooks/useInView";

// Video Modal for fullscreen video viewing
function VideoModal({ videoUrl, onClose }: { videoUrl: string; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Lock body scroll
    document.body.style.overflow = "hidden";
    // Play video when modal opens
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Close on escape key
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

type Company = { id: string; name: string; slug: string; slogan?: string; logoUrl?: string };
export type PostCardData = {
  id: string;
  title: string;
  content: string;
  company: Company;
  createdAt?: string | null;
  publishedAt?: string | null;
  createdBy?: { id: string; name?: string | null; email?: string } | null;
  coverUrl?: string | null;
  type?: string | null;
  tags?: string[] | null;
  hashtags?: { id: string; slug: string; label: string }[] | null;
  likesCount?: number | null;
  sharesCount?: number | null;
  isLiked?: boolean | null;
  isSaved?: boolean | null;
  images?: { id?: string; url: string; width?: number | null; height?: number | null; order?: number; type?: string }[] | null;
  jobs?: { id: string; title: string; location?: string | null; employmentType: string; isActive: boolean }[] | null;
  reactions?: { JOY: number; TRUST: number; SKEPTIC: number } | null;
  userReaction?: "JOY" | "TRUST" | "SKEPTIC" | null;
  statementId?: string | null;
  statementSnapshot?: { title: string; description?: string | null; percentYes: number; totalRecipients: number; yesCount: number; respondedCount: number; snapshotAt: string } | null;
  hiddenFromFeed?: boolean | null;
};

const MediaGrid = memo(function MediaGrid({ images }: { images: NonNullable<PostCardData["images"]> }) {
  const [fullscreenVideoUrl, setFullscreenVideoUrl] = useState<string | null>(null);
  const hiddenCount = Math.max(0, images.length - 4);
  const primary = hiddenCount > 0 ? images.slice(0, 4) : images.slice(0, images.length);
  const backup = images.slice(primary.length);

  const renderMediaItem = (media: (typeof images)[number], className: string) => {
    // Check if it's a video by type or file extension
    const isVideo = media.type === "VIDEO" || 
                    media.url.match(/\.(mp4|webm|mov)(\?|$)/i) !== null;
    
    if (isVideo) {
      return (
        <div className={cn(className, "group relative cursor-pointer")} onClick={() => setFullscreenVideoUrl(media.url)}>
          <video
            src={media.url}
            className="h-full w-full object-cover pointer-events-none"
            playsInline
            muted
            preload="metadata"
          />
          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/60 text-white group-hover:scale-110 transition-transform">
              <Play className="h-6 w-6 ml-1" fill="white" />
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
      <PhotoView key={media.id ?? media.url} src={media.url}>
        <div className={className}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={media.url}
            alt="media"
            className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
          />
        </div>
      </PhotoView>
    );
  };

  const renderSingle = (image: (typeof images)[number]) => (
    <div key={image.id ?? image.url}>
      {renderMediaItem(image, "mt-3 aspect-video w-full overflow-hidden rounded-md bg-[var(--muted)] cursor-zoom-in")}
    </div>
  );

  const renderPair = () => (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {primary.map((m) => (
        <div key={m.id ?? m.url}>
          {renderMediaItem(m, "aspect-video overflow-hidden rounded-md bg-[var(--muted)] cursor-zoom-in")}
        </div>
      ))}
    </div>
  );

  const renderTriple = () => (
    <div className="mt-3 grid grid-cols-3 gap-2">
      <div key={primary[0].id ?? primary[0].url} className="col-span-2 row-span-2">
        {renderMediaItem(primary[0]!, "aspect-[2/1] overflow-hidden rounded-md bg-[var(--muted)] cursor-zoom-in")}
      </div>
      {primary.slice(1).map((m) => (
        <div key={m.id ?? m.url}>
          {renderMediaItem(m, "aspect-video overflow-hidden rounded-md bg-[var(--muted)] cursor-zoom-in")}
        </div>
      ))}
    </div>
  );

  const renderQuad = () => (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {primary.map((m, idx) => (
        <div key={m.id ?? m.url} className="relative">
          {renderMediaItem(m, "aspect-video overflow-hidden rounded-md bg-[var(--muted)] cursor-zoom-in")}
          {idx === primary.length - 1 && hiddenCount > 0 ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-semibold text-white pointer-events-none">
              +{hiddenCount}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );

  return (
    <>
      <PhotoProvider maskOpacity={0.8}>
        {primary.length === 1
          ? renderSingle(primary[0]!)
          : primary.length === 2
          ? renderPair()
          : primary.length === 3
          ? renderTriple()
          : renderQuad()}

        {backup.map((m) => {
          const isVideo = m.type === "VIDEO" || m.url.match(/\.(mp4|webm|mov)(\?|$)/i) !== null;
          return isVideo ? (
            <video key={m.id ?? m.url} src={m.url} className="hidden" />
          ) : (
            <PhotoView key={m.id ?? m.url} src={m.url}>
              <div className="hidden" />
            </PhotoView>
          );
        })}
      </PhotoProvider>
      
      {/* Video fullscreen modal */}
      {fullscreenVideoUrl && (
        <VideoModal videoUrl={fullscreenVideoUrl} onClose={() => setFullscreenVideoUrl(null)} />
      )}
    </>
  );
});

function stripHtml(input: string) {
  return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function extractHtmlTagContent(content: string, tag: string) {
  const regex = new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, "i");
  const match = content.match(regex);
  return match ? stripHtml(match[1] ?? "") : null;
}

function extractStatementExtraText(content: string) {
  if (!content) return "";
  if (!content.includes("<")) return content.trim();
  const matches = [...content.matchAll(/<div[^>]*margin-top:\s*16px[^>]*>(.*?)<\/div>/gi)];
  if (matches.length > 0) {
    const last = matches[matches.length - 1]?.[1] ?? "";
    return stripHtml(last);
  }
  return stripHtml(content);
}

type StatementCardProps = {
  title: string;
  percentYes?: number | null;
  totalRecipients?: number | null;
  yesCount?: number | null;
  verifiedAt?: string | null;
  statementAt?: string | null;
};

const StatementCard = memo(function StatementCard({
  title,
  percentYes,
  totalRecipients,
  yesCount,
  verifiedAt,
  statementAt,
}: StatementCardProps) {
  const total = totalRecipients ?? 0;
  const percent = percentYes ?? 0;
  const hasVerification = total > 0;
  const safeTitle = title?.trim() || "Tuyên bố công ty";
  const verifiedLabel = verifiedAt ? format(new Date(verifiedAt), "HH:mm dd/MM/yyyy") : null;
  const verifiedLabelMobile = verifiedAt ? format(new Date(verifiedAt), "HH:mm dd/MM") : null;
  const statementLabel = statementAt ? format(new Date(statementAt), "HH:mm dd/MM/yyyy") : null;
  const statementLabelMobile = statementAt ? format(new Date(statementAt), "HH:mm dd/MM") : null;
  return (
    <div className="relative mt-3 overflow-hidden rounded-xl border border-blue-200 bg-blue-50/50 p-3 sm:p-4">
      {/* Background decoration */}
      <div className="pointer-events-none absolute right-0 top-0 p-4 opacity-[0.03] sm:p-8">
        <ShieldCheck className="h-16 w-16 sm:h-[120px] sm:w-[120px]" />
      </div>
      
      <div className="relative z-10">
        <div className="mb-2 flex flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:gap-2">
          <Badge className="flex max-w-full items-center gap-1 border-blue-200 bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-100">
            <ShieldCheck className="w-3 h-3" />
            <span className="sm:hidden">Tuyên bố</span>
            <span className="hidden sm:inline">Tuyên bố công ty</span>
          </Badge>
          {hasVerification ? (
            verifiedLabel ? (
              <span className="text-[11px] leading-tight text-slate-500 sm:text-xs">
                <span className="sm:hidden">Xác thực {verifiedLabelMobile}</span>
                <span className="hidden sm:inline">Được xác thực lúc {verifiedLabel}</span>
              </span>
            ) : null
          ) : statementLabel ? (
            <span className="text-[11px] leading-tight text-slate-500 sm:text-xs">
              <span className="sm:hidden">Tuyên bố {statementLabelMobile}</span>
              <span className="hidden sm:inline">Tuyên bố lúc {statementLabel}</span>
            </span>
          ) : null}
        </div>

        <h3 className="mb-2 line-clamp-2 break-words text-base font-bold leading-tight text-slate-900 sm:text-lg">
          {safeTitle}
        </h3>

        {hasVerification && (
          <div className="rounded-lg border border-blue-100 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-2 text-xs sm:text-sm">
              <span className="font-medium text-slate-700">Mức độ đồng thuận</span>
              <span className="shrink-0 font-bold text-blue-700">
                {Math.round(percent)}% ({yesCount ?? 0}/{total})
              </span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-blue-600 rounded-full" 
                style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500 sm:text-xs">
              {yesCount ?? 0}/{total} người đồng ý với tuyên bố
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

const PostContent = memo(function PostContent({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
  const contentRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!contentRef.current || expanded) return;
    const el = contentRef.current;
    const checkOverflow = () => {
      const hasOverflow = el.scrollHeight > el.clientHeight + 4;
      setShowReadMore(hasOverflow);
    };
    checkOverflow();
    const onResize = () => checkOverflow();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [expanded, content]);

  return (
    <>
      <div className="relative mt-3">
        <p
          ref={contentRef}
          className={cn(
            "whitespace-pre-wrap text-sm leading-6 text-[var(--muted-foreground)]",
            expanded ? "" : "line-clamp-4 max-h-24 overflow-hidden",
          )}
        >
          {content}
        </p>
        {!expanded && showReadMore ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[var(--card)] to-transparent" />
        ) : null}
      </div>
      {showReadMore ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs font-medium text-[var(--brand)] hover:underline"
        >
          {expanded ? "Thu gọn" : "Xem thêm"}
        </button>
      ) : null}
    </>
  );
});

const LazyMediaBlock = memo(function LazyMediaBlock({
  images,
  coverUrl,
}: {
  images?: NonNullable<PostCardData["images"]> | null;
  coverUrl?: string | null;
}) {
  const inViewOptions = useMemo(() => ({ rootMargin: "300px" }), []);
  const { ref, inView } = useInView<HTMLDivElement>(inViewOptions);

  if (!images?.length && !coverUrl) return null;

  if (!inView) {
    return <div ref={ref} className="mt-3 aspect-video w-full rounded-md bg-[var(--muted)]/60 animate-pulse" />;
  }

  return (
    <div ref={ref}>
      {images?.length ? (
        <MediaGrid images={images} />
      ) : coverUrl ? (
        <PhotoProvider maskOpacity={0.8}>
          <PhotoView src={coverUrl}>
            <div className="mt-3 aspect-video w-full overflow-hidden rounded-md bg-[var(--muted)] cursor-zoom-in">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverUrl}
                alt="cover"
                className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
              />
            </div>
          </PhotoView>
        </PhotoProvider>
      ) : null}
    </div>
  );
});

const JOYWORK_HIDDEN_TOOLTIP_TITLE = "Bài viết đang bị giới hạn hiển thị";
const JOYWORK_HIDDEN_TOOLTIP_DESC =
  "Nội dung này vẫn hiển thị trong trang quản lý doanh nghiệp nhưng đã được ẩn khỏi Bảng tin chung bởi JOYWORK.";
const JOYWORK_HIDDEN_TOOLTIP_CONTACT = "Liên hệ hỗ trợ: contact@joywork.vn | 033 868 5855";

const PostCard = memo(function PostCard({
  post,
  showJoyworkModerationBadge = false,
}: {
  post: PostCardData;
  showJoyworkModerationBadge?: boolean;
}) {
  const hasImages = (post.images?.length ?? 0) > 0;
  const isStatementPost = (post.type ?? "").toUpperCase() === "STATEMENT" || Boolean(post.statementId);
  const rawSnapshot = post.statementSnapshot && Object.keys(post.statementSnapshot).length > 0 ? post.statementSnapshot : null;
  const statementTitle =
    rawSnapshot?.title ??
    extractHtmlTagContent(post.content ?? "", "h3") ??
    (post.title ? post.title.replace(/^Tuyên bố:\s*/i, "").trim() : "") ??
    "";
  const verifiedAt = (rawSnapshot?.totalRecipients ?? 0) > 0 ? rawSnapshot?.snapshotAt ?? null : null;
  const statementAt = post.publishedAt ?? post.createdAt ?? null;
  const statementExtraText = isStatementPost ? extractStatementExtraText(post.content ?? "") : post.content;
  const user = useAuthStore((s) => s.user);
  const memberships = useAuthStore((s) => s.memberships);
  const { openPrompt } = useAuthPrompt();
  const qc = useQueryClient();
  const [isSaved, setIsSaved] = useState(Boolean(post.isSaved));
  useEffect(() => {
    setIsSaved(Boolean(post.isSaved));
  }, [post.isSaved]);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  /* reaction state is defined above */
  const [myReaction, setMyReaction] = useState<PostCardData["userReaction"]>(post.userReaction ?? null);
  const [reactionCounts, setReactionCounts] = useState<{ JOY: number; TRUST: number; SKEPTIC: number }>({
    JOY: post.reactions?.JOY ?? 0,
    TRUST: post.reactions?.TRUST ?? 0,
    SKEPTIC: post.reactions?.SKEPTIC ?? 0,
  });
  useEffect(() => {
    setMyReaction(post.userReaction ?? null);
    setReactionCounts({
      JOY: post.reactions?.JOY ?? 0,
      TRUST: post.reactions?.TRUST ?? 0,
      SKEPTIC: post.reactions?.SKEPTIC ?? 0,
    });
  }, [post.userReaction, post.reactions?.JOY, post.reactions?.TRUST, post.reactions?.SKEPTIC]);
  const [isEditing, setIsEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isMobileLikeMode, setIsMobileLikeMode] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const likeAreaRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const apply = () => setIsMobileLikeMode(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);
  useEffect(() => {
    if (!showReactionPicker) return;
    function onDocClick(e: MouseEvent | TouchEvent) {
      if (!likeAreaRef.current) return;
      if (!likeAreaRef.current.contains(e.target as Node)) {
        setShowReactionPicker(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("touchstart", onDocClick, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("touchstart", onDocClick);
    };
  }, [showReactionPicker]);
  const myRole = useMemo(() => memberships.find((m) => m.company.id === post.company.id)?.role, [memberships, post.company.id]);
  const isOwnerOrAdmin = myRole === "OWNER" || myRole === "ADMIN";
  const isMember = myRole === "MEMBER";
  const isAuthor = Boolean(user?.id) && Boolean((post as any)?.createdBy?.id) && (post as any)?.createdBy?.id === user?.id;
  const canEdit = Boolean(user) && (isOwnerOrAdmin || (isMember && isAuthor));
  const saveMutation = useMutation({
    mutationFn: async (nextSaved: boolean) => {
      if (nextSaved) {
        await api.post(`/api/posts/${post.id}/favorite`);
      } else {
        await api.delete(`/api/posts/${post.id}/favorite`);
      }
    },
    onSuccess: (_, nextSaved) => {
      // Update all feed queries (with any params) directly without refetching
      qc.setQueriesData(
        { queryKey: ["feed"], exact: false },
        (oldData: any) => {
          if (!oldData || !oldData.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              posts: (page.posts || []).map((p: PostCardData) =>
                p.id === post.id ? { ...p, isSaved: nextSaved } : p
              ),
            })),
          };
        }
      );

      // Update company-posts cache (all variants)
      qc.setQueriesData(
        { queryKey: ["company-posts"], exact: false },
        (oldData: any) => {
          if (!oldData || !oldData.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              posts: (page.posts || []).map((p: PostCardData) =>
                p.id === post.id ? { ...p, isSaved: nextSaved } : p
              ),
            })),
          };
        }
      );

      // Update company-posts-feed cache
      qc.setQueriesData(
        { queryKey: ["company-posts-feed"], exact: false },
        (oldData: any) => {
          if (!oldData || !oldData.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              posts: (page.posts || []).map((p: PostCardData) =>
                p.id === post.id ? { ...p, isSaved: nextSaved } : p
              ),
            })),
          };
        }
      );

      // Update tag-feed cache
      qc.setQueriesData(
        { queryKey: ["tag-feed"], exact: false },
        (oldData: any) => {
          if (!oldData || !oldData.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              posts: (page.posts || []).map((p: PostCardData) =>
                p.id === post.id ? { ...p, isSaved: nextSaved } : p
              ),
            })),
          };
        }
      );

      // Update single post cache
      qc.setQueriesData<{ data: { post: PostCardData } }>(
        { queryKey: ["post", post.id] },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: {
              ...oldData.data,
              post: { ...oldData.data.post, isSaved: nextSaved },
            },
          };
        }
      );

      // Only invalidate saved-posts to refresh the saved list
      qc.invalidateQueries({ queryKey: ["saved-posts"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? "Không thể lưu bài viết"),
  });
  const handleSave = useCallback(() => {
    if (!user) {
      openPrompt("save");
      return;
    }
    if (saveMutation.isPending) return;
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    saveMutation.mutate(nextSaved, {
      onError: () => setIsSaved(!nextSaved),
    });
  }, [user, openPrompt, saveMutation, isSaved]);
  const handleShare = useCallback(async () => {
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const url = `${origin}/posts/${post.id}`;
      await navigator.clipboard.writeText(url);
      toast.success("Đã sao chép link bài viết");
    } catch {
      toast.error("Không thể sao chép link");
    }
  }, [post.id]);
  const reactMutation = useMutation({
    mutationFn: async (type: "JOY" | "TRUST" | "SKEPTIC" | null) => {
      if (type === null) {
        await api.delete(`/api/posts/${post.id}/react`);
        return { type: null };
      }
      await api.post(`/api/posts/${post.id}/react`, { type });
      return { type };
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? "Không thể phản ứng"),
  });
  const toggleReaction = useCallback((type: "JOY" | "TRUST" | "SKEPTIC") => {
    if (!user) {
      openPrompt("like");
      return;
    }
    const nextType: "JOY" | "TRUST" | "SKEPTIC" | null = myReaction === type ? null : type;
    const prevType = myReaction;
    setReactionCounts((prev) => {
      const copy = { ...prev };
      if (prevType) copy[prevType] = Math.max(0, copy[prevType] - 1);
      if (nextType) copy[nextType] = copy[nextType] + 1;
      return copy;
    });
    setMyReaction(nextType);
    reactMutation.mutate(nextType, {
      onError: () => {
        // revert
        setReactionCounts((prev) => {
          const copy = { ...prev };
          if (nextType) copy[nextType] = Math.max(0, copy[nextType] - 1);
          if (prevType) copy[prevType] = copy[prevType] + 1;
          return copy;
        });
        setMyReaction(prevType);
      },
      onSuccess: () => {
        setShowReactionPicker(false);
        qc.invalidateQueries({ queryKey: ["feed"] });
        qc.invalidateQueries({ queryKey: ["company-posts"] });
        qc.invalidateQueries({ queryKey: ["company-posts-feed"] });
        qc.invalidateQueries({ queryKey: ["post"] });
      },
    });
  }, [user, openPrompt, myReaction, reactMutation, qc, post.id]);
  /* reaction handlers are defined once above */
  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.patch(`/api/posts/${post.id}`, payload);
      return data?.data?.post as PostCardData;
    },
    onSuccess: () => {
      toast.success("Đã cập nhật bài viết");
      setIsEditing(false);
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["company-posts"] });
      qc.invalidateQueries({ queryKey: ["company-posts-feed"] });
      qc.invalidateQueries({ queryKey: ["post"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? "Không thể cập nhật bài viết"),
  });
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/api/posts/${post.id}`);
    },
    onSuccess: () => {
      toast.success("Đã xoá bài viết");
      setMenuOpen(false);
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["company-posts"] });
      qc.invalidateQueries({ queryKey: ["company-posts-feed"] });
      qc.invalidateQueries({ queryKey: ["post"] });
      qc.invalidateQueries({ queryKey: ["saved-posts"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? "Không thể xoá bài viết"),
  });
  const handleDelete = useCallback(() => {
    if (!user) {
      openPrompt("login");
      return;
    }
    if (!canEdit) {
      toast.error("Bạn không có quyền xoá bài viết này");
      return;
    }
    const ok = window.confirm("Bạn chắc chắn muốn xoá bài viết này?");
    if (!ok) return;
    deleteMutation.mutate();
  }, [user, canEdit, deleteMutation, openPrompt]);
  return (
    <article className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-0 overflow-hidden">
      <div className="p-4">
        <div className="mb-1 flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
          {post.company.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.company.logoUrl}
              alt={post.company.name}
              className="h-7 w-7 rounded-full object-cover border border-[var(--border)]"
            />
          ) : (
            <div className="h-7 w-7 rounded-full bg-[var(--muted)] flex items-center justify-center text-[10px] font-semibold text-[var(--muted-foreground)]">
              {post.company.name.slice(0, 1)}
            </div>
          )}
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CompanyHoverCard
                companyId={post.company.id}
                slug={post.company.slug}
                companyName={post.company.name}
              >
                <Link
                  className="max-w-[180px] truncate font-medium text-[var(--foreground)] hover:text-[var(--foreground)] sm:max-w-[280px]"
                  href={`/companies/${post.company.slug}`}
                >
                  {post.company.name}
                </Link>
              </CompanyHoverCard>
              {user && (
                <CompanyFollowButton
                  companyId={post.company.id}
                  companySlug={post.company.slug}
                  variant="link"
                  size="sm"
                  className={cn(
                    "p-0 h-auto font-normal text-sm text-[#2563eb] hover:text-[#1d4ed8] hover:underline",
                    isStatementPost && "hidden sm:inline-flex"
                  )}
                />
              )}
              {showJoyworkModerationBadge && Boolean(post.hiddenFromFeed) ? (
                <div className="ml-auto">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="secondary"
                          className="cursor-help border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-100"
                        >
                          Đã ẩn bởi JOYWORK
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        align="end"
                        className="max-w-xs rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-[12px] leading-relaxed text-slate-100 shadow-2xl"
                      >
                        <p className="font-semibold text-white">{JOYWORK_HIDDEN_TOOLTIP_TITLE}</p>
                        <p className="mt-1 text-slate-200">{JOYWORK_HIDDEN_TOOLTIP_DESC}</p>
                        <p className="mt-2 border-t border-slate-700 pt-2 text-slate-300">
                          {JOYWORK_HIDDEN_TOOLTIP_CONTACT}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              ) : null}
            </div>
            <div className="flex min-w-0 items-center gap-2 text-xs">
              {post.company.slogan ? (
                <span className={cn("truncate", isStatementPost && "hidden sm:inline")}>{post.company.slogan}</span>
              ) : null}
              {(() => {
                const dateStr = (post.publishedAt ?? post.createdAt) ?? null;
                if (!dateStr) return null;
                const dateObj = new Date(dateStr);
                const relative = formatDistanceToNow(dateObj, { addSuffix: true, locale: vi });
                const exact = format(dateObj, "HH:mm dd/MM/yyyy");
                return (
                  <span className={cn("shrink-0", isStatementPost && "text-[11px] sm:text-xs")} title={exact}>
                    {relative}
                  </span>
                );
              })()}
            </div>
          </div>
          <div className="relative ml-auto flex items-center gap-2" ref={menuRef}>
            {canEdit ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => setMenuOpen((v) => !v)}
                  title="Tuỳ chọn"
                  aria-label="Tuỳ chọn"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
                {menuOpen ? (
                  <div className="absolute right-0 top-8 z-20 min-w-36 rounded-md border border-[var(--border)] bg-[var(--card)] p-1 shadow-md">
                    <button
                      className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-[var(--muted)]"
                      onClick={() => {
                        setMenuOpen(false);
                        setIsEditing(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      Sửa bài
                    </button>
                    <button
                      className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      onClick={handleDelete}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                      {deleteMutation.isPending ? "Đang xoá..." : "Xoá bài"}
                    </button>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
        {isStatementPost ? (
          <>
            {/* User content (intro) */}
            {statementExtraText ? <PostContent content={statementExtraText} /> : null}
            
            {/* Statement Card */}
            <StatementCard
              title={statementTitle}
              percentYes={rawSnapshot?.percentYes ?? null}
              totalRecipients={rawSnapshot?.totalRecipients ?? null}
              yesCount={rawSnapshot?.yesCount ?? null}
              verifiedAt={verifiedAt ? String(verifiedAt) : null}
              statementAt={statementAt ? String(statementAt) : null}
            />
            
            {/* Media if any */}
            <LazyMediaBlock images={post.images} />
          </>
        ) : (
          <>
            {/* {post.title && (
              <h3 className="text-base font-semibold mb-2">
                <Link href={`/posts/${post.id}`} className="hover:underline">
                  {post.title}
                </Link>
              </h3>
            )} */}
            <LazyMediaBlock images={post.images} coverUrl={post.coverUrl} />
            <PostContent content={post.content} />
          </>
        )}
        {post.hashtags?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.hashtags.map((h) => (
              <Link key={h.id} href={`/tags/${h.slug}`}>
                <span className="inline-flex items-center rounded-full bg-[var(--muted)]/50 px-2.5 py-0.5 text-xs font-medium text-[var(--brand)] hover:bg-[var(--brand)]/10 border border-transparent hover:border-[var(--brand)]/20 transition-colors">
                  #{h.label}
                </span>
              </Link>
            ))}
          </div>
        ) : null}
        {post.jobs && post.jobs.length ? (
          <div className="mt-3 space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              {post.jobs.map((j) => (
                <Link
                  key={j.id}
                  href={`/jobs/${j.id}`}
                  target="_blank"
                  className="group flex items-center gap-3 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 hover:border-[var(--brand)]/50 hover:bg-[var(--muted)]/30 transition-all"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[var(--muted)] text-[var(--muted-foreground)] group-hover:bg-[var(--brand)]/10 group-hover:text-[var(--brand)]">
                     <Briefcase className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--brand)]">
                        {j.title}
                      </div>
                    <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                       <span className={cn("inline-block h-1.5 w-1.5 rounded-full", j.isActive ? "bg-emerald-500" : "bg-gray-300")} />
                       <span>{j.employmentType}</span>
                       {j.location && <span className="truncate">· {j.location}</span>}
                      </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      {/* Reaction summary row */}
      {(reactionCounts.JOY > 0 || reactionCounts.TRUST > 0 || reactionCounts.SKEPTIC > 0) && (
        <div className="flex items-center gap-1.5 px-4 py-2 text-xs text-[var(--muted-foreground)]">
          <div className="flex -space-x-1">
            {reactionCounts.JOY > 0 && <span className="text-base">😍</span>}
            {reactionCounts.TRUST > 0 && <span className="text-base">👍</span>}
            {reactionCounts.SKEPTIC > 0 && <span className="text-base">🤔</span>}
          </div>
          <span>{(reactionCounts.JOY + reactionCounts.TRUST + reactionCounts.SKEPTIC).toLocaleString("vi-VN")}</span>
        </div>
      )}
      {/* Action buttons row - Facebook style */}
      <div className="flex items-center border-t border-[var(--border)]">
        {/* Thích button with hover reactions */}
        <div className="relative flex-1 group/like" ref={likeAreaRef}>
          {/* Reaction popup - pb-2 bridges hover gap so cursor can move from button to picker without losing group-hover (desktop) */}
          <div
            className={cn(
              "absolute bottom-full left-2 z-50 pb-2 transition-all duration-200 sm:left-1/2 sm:-translate-x-1/2",
              isMobileLikeMode
                ? showReactionPicker
                  ? "visible opacity-100"
                  : "invisible opacity-0 pointer-events-none"
                : "invisible opacity-0 pointer-events-none group-hover/like:visible group-hover/like:opacity-100 group-hover/like:pointer-events-auto"
            )}
          >
            <div className="flex max-w-[calc(100vw-2.5rem)] items-center gap-1 rounded-full border border-[var(--border)] bg-white p-1.5 shadow-lg">
              <button
                type="button"
                onClick={() => toggleReaction("TRUST")}
                disabled={reactMutation.isPending}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full transition-transform hover:scale-110 hover:bg-blue-50",
                  myReaction === "TRUST" && "ring-2 ring-blue-400 bg-blue-50"
                )}
                title="Tin tưởng"
              >
                <span className="text-2xl leading-none">👍</span>
              </button>
              <button
                type="button"
                onClick={() => toggleReaction("JOY")}
                disabled={reactMutation.isPending}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full transition-transform hover:scale-110 hover:bg-pink-50",
                  myReaction === "JOY" && "ring-2 ring-pink-400 bg-pink-50"
                )}
                title="Yêu thích"
              >
                <span className="text-2xl leading-none">😍</span>
              </button>
              <button
                type="button"
                onClick={() => toggleReaction("SKEPTIC")}
                disabled={reactMutation.isPending}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full transition-transform hover:scale-110 hover:bg-orange-50",
                  myReaction === "SKEPTIC" && "ring-2 ring-orange-400 bg-orange-50"
                )}
                title="Hoài nghi"
              >
                <span className="text-2xl leading-none">🤔</span>
              </button>
            </div>
          </div>
          {/* Main like button */}
          <button
            type="button"
            onClick={() => {
              if (!user) {
                openPrompt("like");
                return;
              }
              if (isMobileLikeMode) {
                setShowReactionPicker((prev) => !prev);
                return;
              }
              // Toggle: if has reaction, remove it; else add TRUST (default like)
              if (myReaction) {
                toggleReaction(myReaction);
              } else {
                toggleReaction("TRUST");
              }
            }}
            disabled={reactMutation.isPending}
            className={cn(
              "w-full flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium whitespace-nowrap transition-colors hover:bg-[var(--muted)] sm:flex-row sm:gap-2 sm:py-2.5 sm:text-sm",
              myReaction === "JOY" && "text-[#d946ef]",
              myReaction === "TRUST" && "text-[#2563eb]",
              myReaction === "SKEPTIC" && "text-[#ea580c]",
              !myReaction && "text-[var(--muted-foreground)]"
            )}
          >
            {myReaction === "JOY" ? (
              <>
                <span className="text-lg">😍</span>
                <span className="sm:hidden">Yêu</span>
                <span className="hidden sm:inline">Yêu thích</span>
              </>
            ) : myReaction === "TRUST" ? (
              <>
                <span className="text-lg">👍</span>
                <span className="sm:hidden">Tin</span>
                <span className="hidden sm:inline">Tin tưởng</span>
              </>
            ) : myReaction === "SKEPTIC" ? (
              <>
                <span className="text-lg">🤔</span>
                <span className="sm:hidden">Nghi</span>
                <span className="hidden sm:inline">Hoài nghi</span>
              </>
            ) : (
              <>
                <Heart className="h-5 w-5" />
                <span>Thích</span>
              </>
            )}
          </button>
        </div>

        {/* Lưu bài */}
        <div className="flex-1 border-l border-[var(--border)]">
          <button
            type="button"
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className={cn(
              "w-full flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium whitespace-nowrap transition-colors hover:bg-[var(--muted)] sm:flex-row sm:gap-2 sm:py-2.5 sm:text-sm",
              isSaved ? "text-[var(--brand)]" : "text-[var(--muted-foreground)]"
            )}
          >
            {isSaved ? <BookmarkCheck className="h-5 w-5" /> : <BookmarkPlus className="h-5 w-5" />}
            <span>{isSaved ? "Đã lưu" : "Lưu bài"}</span>
          </button>
        </div>

        {/* Trò chuyện */}
        <div className="flex-1 border-l border-[var(--border)]">
          <button
            type="button"
            onClick={() => {
              if (!user) {
                openPrompt("like");
                return;
              }
              setTicketModalOpen(true);
            }}
            className="w-full flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium whitespace-nowrap text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] sm:flex-row sm:gap-2 sm:py-2.5 sm:text-sm"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="sm:hidden">Chat</span>
            <span className="hidden sm:inline">Trò chuyện</span>
          </button>
        </div>

        {/* Chia sẻ */}
        <div className="flex-1 border-l border-[var(--border)]">
          <button
            type="button"
            onClick={handleShare}
            className="w-full flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium whitespace-nowrap text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] sm:flex-row sm:gap-2 sm:py-2.5 sm:text-sm"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            <span>Chia sẻ</span>
          </button>
        </div>
      </div>
      {/* Edit Modal */}
      {isEditing ? (
        <EditPostModal
          open={isEditing}
          onClose={() => setIsEditing(false)}
          post={post}
          companyId={post.company.id}
          isSubmitting={updateMutation.isPending}
          onSubmit={(payload) => {
            if (!user) {
              openPrompt("login");
              return;
            }
            if (!canEdit) {
              toast.error("Bạn không có quyền sửa bài viết này");
              return;
            }
            updateMutation.mutate({
              title: payload.title,
              content: payload.content,
              images: payload.images.map((img) => ({
                ...(img.id ? { id: img.id } : {}),
                ...(img.key ? { key: img.key } : {}),
                url: img.url,
                ...(typeof img.width === "number" ? { width: img.width } : {}),
                ...(typeof img.height === "number" ? { height: img.height } : {}),
                order: img.order,
                type: img.type ?? "IMAGE",
              })),
              jobIds: payload.jobIds,
              hashtags: payload.hashtags,
            } as any);
          }}
        />
      ) : null}

      {/* Create Ticket Modal */}
      <CreateTicketModal
        open={ticketModalOpen}
        onOpenChange={setTicketModalOpen}
        companyId={post.company.id}
        companyName={post.company.name}
        onCreated={(ticket) => {
          setTicketModalOpen(false);
          toast.success("Đã tạo tin nhắn, chuyển tới trang hội thoại");
          // Optionally navigate to ticket page
          // router.push(`/tickets/${ticket.id}`);
        }}
      />
    </article>
  );
});

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type EditableImage = { id?: string; key?: string; url: string; width?: number; height?: number; order: number; type?: "IMAGE" | "VIDEO" };

function EditPostModal({
  open,
  onClose,
  post,
  companyId,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onClose: () => void;
  post: PostCardData;
  companyId: string;
  onSubmit: (payload: { title: string; content: string; images: EditableImage[]; jobIds: string[]; hashtags: string[] }) => void;
  isSubmitting: boolean;
}) {
  const [title, setTitle] = useState(post.title ?? "");
  const [content, setContent] = useState(post.content ?? "");
  const [images, setImages] = useState<EditableImage[]>(
    (post.images ?? []).map((img, idx) => ({ 
      id: img.id, 
      url: img.url, 
      order: img.order ?? idx,
      type: (img.type as "IMAGE" | "VIDEO") ?? "IMAGE"
    }))
  );
  const [jobIds, setJobIds] = useState<string[]>(
    (post.jobs ?? []).map((j) => j.id)
  );
  const [hashtags, setHashtags] = useState<string[]>(
    (post.hashtags ?? []).map((h) => h.label)
  );
  const [showJobSelector, setShowJobSelector] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [availableJobs, setAvailableJobs] = useState<
    { id: string; title: string; isActive: boolean; location?: string | null; employmentType: string }[]
  >([]);

  useEffect(() => {
    if (open) {
      setTitle(post.title ?? "");
      setContent(post.content ?? "");
      setImages((post.images ?? []).map((img, idx) => ({ 
        id: img.id, 
        url: img.url, 
        order: img.order ?? idx,
        type: (img.type as "IMAGE" | "VIDEO") ?? "IMAGE"
      })));
      setJobIds((post.jobs ?? []).map((j) => j.id));
      setHashtags((post.hashtags ?? []).map((h) => h.label));
      // Prefill available jobs từ post hiện tại để luôn hiển thị tối thiểu các job đã gắn
      setAvailableJobs(
        (post.jobs ?? []).map((j) => ({
          id: j.id,
          title: j.title,
          isActive: j.isActive,
          location: j.location,
          employmentType: j.employmentType,
        }))
      );
      // fetch jobs of company for selection
      (async () => {
        setJobsLoading(true);
        try {
          const { data } = await api.get("/api/jobs", {
            params: { companyId, page: 1, limit: 50 },
          });
          const jobs = (data?.data?.jobs ?? []).map((j: any) => ({
            id: j.id as string,
            title: j.title as string,
            isActive: Boolean(j.isActive),
            location: j.location ?? null,
            employmentType: j.employmentType as string,
          }));
          // Merge với các job đã có từ post (đảm bảo không mất các job đã chọn)
          const mergedMap = new Map<string, any>();
          for (const j of jobs) mergedMap.set(j.id, j);
          for (const j of (post.jobs ?? []).map((pj) => ({
            id: pj.id,
            title: pj.title,
            isActive: pj.isActive,
            location: pj.location,
            employmentType: pj.employmentType,
          }))) {
            if (!mergedMap.has(j.id)) mergedMap.set(j.id, j);
          }
          setAvailableJobs(Array.from(mergedMap.values()));
        } catch {
          setAvailableJobs([]);
        } finally {
          setJobsLoading(false);
        }
      })();
    }
  }, [open, post, companyId]);

  if (!open) return null;

  const pickFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
    const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
    const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
    const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
    const ACCEPTED_TYPES = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES];
    const MAX_MEDIA = 16;
    const availableSlots = MAX_MEDIA - images.length;
    if (availableSlots <= 0) {
      toast.info(`Bạn đã đạt giới hạn ${MAX_MEDIA} media cho một bài viết`);
      return;
    }
    const selected = files.slice(0, availableSlots);
    if (selected.length < files.length) {
      toast.info(`Một số file bị bỏ qua vì vượt quá giới hạn ${MAX_MEDIA} media.`);
    }
    
    let next = [...images];
    for (const file of selected) {
      try {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          toast.error(`Định dạng ${file.type} không được hỗ trợ.`);
          continue;
        }
        const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type);
        const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_FILE_SIZE;
        if (file.size > maxSize) {
          const sizeLimit = isVideo ? "50MB" : "8MB";
          toast.error(`${isVideo ? "Video" : "Ảnh"} ${file.name} vượt quá giới hạn ${sizeLimit}.`);
          continue;
        }
        const dataUrl = await toBase64(file);
        const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
        const { key, assetUrl, type } = await uploadCompanyPostImage({
          companyId,
          fileName: file.name,
          fileType: file.type,
          fileData: base64,
        });
        next.push({ 
          key, 
          url: assetUrl, 
          order: next.length,
          type: type ?? (isVideo ? "VIDEO" : "IMAGE")
        });
      } catch (err: any) {
        const message =
          err?.response?.data?.error?.message ??
          err?.message ??
          `Tải media thất bại: ${file.name}`;
        toast.error(message);
      }
    }
    setImages(next);
    e.target.value = "";
  };

  const removeAt = (idx: number) => {
    const next = images.filter((_, i) => i !== idx).map((img, i) => ({ ...img, order: i }));
    setImages(next);
  };

  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    const tmp = next[idx];
    next[idx] = next[j];
    next[j] = tmp;
    setImages(next.map((img, i) => ({ ...img, order: i })));
  };

  const toggleJob = (id: string) => {
    setJobIds((prev) => {
      if (prev.includes(id)) {
        // Remove job
        return prev.filter((x) => x !== id);
      } else {
        // Add job - but only if under limit
        if (prev.length >= 2) return prev;
        return [...prev, id];
      }
    });
  };

  const modalContent = (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40">
      <div className="w-[min(680px,92vw)] max-h-[90vh] overflow-auto rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-[var(--foreground)]">Chỉnh sửa bài viết</h3>
          <Button size="sm" variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
        <div className="space-y-3">
          <Textarea rows={8} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Nội dung" />

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--foreground)]">Ảnh/video (tối đa 16)</span>
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[var(--brand)]">
                <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" multiple hidden onChange={pickFiles} />
                Thêm ảnh/video
              </label>
            </div>
            {images.length ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {images.map((img, idx) => {
                  const isVideo = img.type === "VIDEO" || img.url.match(/\.(mp4|webm|mov)(\?|$)/i) !== null;
                  return (
                    <div key={(img.id ?? img.key ?? img.url) + idx} className="relative overflow-hidden rounded-md border">
                      {isVideo ? (
                        <video
                          src={img.url}
                          className="h-32 w-full object-cover"
                          muted
                          playsInline
                        />
                      ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={img.url} alt="" className="h-32 w-full object-cover" />
                      )}
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/40 px-2 py-1 text-xs text-white">
                        <span>#{idx + 1}</span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => move(idx, -1)} className="rounded bg-white/20 px-1">↑</button>
                          <button onClick={() => move(idx, +1)} className="rounded bg-white/20 px-1">↓</button>
                          <button onClick={() => removeAt(idx)} className="rounded bg-red-500/80 px-1">Xóa</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-md border border-dashed p-4 text-center text-sm text-[var(--muted-foreground)]">
                Chưa có ảnh/video. Nhấn "Thêm ảnh/video" để tải lên.
              </div>
            )}
          </div>

          {/* Hashtags */}
          <div className="space-y-2">
            <div className="mb-2 text-sm font-medium text-[var(--foreground)]">Thẻ bắt đầu bằng #</div>
            <HashtagInput value={hashtags} onChange={setHashtags} placeholder="Thêm chủ đề (hashtag)..." />
          </div>

          {/* Jobs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--foreground)]">
                Việc làm đính kèm {jobIds.length > 0 && <span className="text-[var(--muted-foreground)]">({jobIds.length}/2)</span>}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowJobSelector(!showJobSelector)}
                disabled={jobIds.length >= 2 && !showJobSelector}
                className={cn(
                  "h-6 gap-1 px-2 text-xs text-[var(--brand)] hover:bg-[var(--brand)]/10",
                  (showJobSelector || jobIds.length > 0) && "bg-[var(--brand)]/10 hover:bg-[var(--brand)]/20",
                  jobIds.length >= 2 && !showJobSelector && "opacity-50 cursor-not-allowed"
                )}
                title={jobIds.length >= 2 && !showJobSelector ? "Đã đạt giới hạn tối đa 2 việc làm" : undefined}
              >
                <Briefcase className="h-3 w-3" />
                {showJobSelector ? "Đóng danh sách" : "Thêm/Xóa việc làm"}
              </Button>
            </div>

            {/* Chips */}
            {jobIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                    {jobIds.map(id => {
                        const j = availableJobs.find(x => x.id === id);
                        if (!j) return null;
                        return (
                             <span key={id} className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs shadow-sm">
                                <span className="truncate max-w-[220px] font-medium text-[var(--foreground)]">{j.title}</span>
                                <button
                                  className="rounded-full hover:bg-[var(--muted)] p-0.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                  onClick={() => toggleJob(id)}
                                  title="Gỡ"
                                  type="button"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                        );
                    })}
                </div>
            )}

            {/* Selector - Improved UI */}
            {showJobSelector && (
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-lg animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                    <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--muted)]/50 px-3 py-2">
                        <span className="text-xs font-medium text-[var(--muted-foreground)]">Chọn từ danh sách</span>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowJobSelector(false)}
                            className="h-6 px-2 text-xs hover:bg-[var(--background)]"
                        >
                            Xong
                        </Button>
                    </div>
                    <div className="max-h-56 overflow-auto p-1">
                        {jobsLoading ? (
                        <div className="p-4 text-center text-sm text-[var(--muted-foreground)]">Đang tải danh sách việc làm...</div>
                    ) : availableJobs.length ? (
                        <ul className="divide-y divide-[var(--border)]">
                        {availableJobs.map((j) => {
                            const checked = jobIds.includes(j.id);
                            const isDisabled = !checked && jobIds.length >= 2;
                            return (
                            <li 
                                key={j.id} 
                                className={cn(
                                    "group flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5 transition-colors text-sm",
                                    checked ? "bg-[var(--brand)]/5 text-[var(--brand)]" : "hover:bg-[var(--muted)] text-[var(--foreground)]",
                                    isDisabled && "opacity-50 cursor-not-allowed"
                                )}
                                onClick={() => !isDisabled && toggleJob(j.id)}
                            >
                                <div className="flex flex-col min-w-0">
                                    <span className="font-medium truncate">{j.title}</span>
                                    <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]/80">
                                        <span className={cn("inline-block w-1.5 h-1.5 rounded-full", j.isActive ? "bg-emerald-500" : "bg-gray-300")} />
                                        <span>{j.isActive ? "Đang mở" : "Đã đóng"}</span>
                                        {j.location && (
                                            <>
                                            <span>·</span>
                                            <span className="truncate">{j.location}</span>
                                            </>
                                        )}
                                        <span>·</span>
                                        <span>{j.employmentType}</span>
                                    </div>
                                </div>
                                {checked && <Check className="h-4 w-4 shrink-0 text-[var(--brand)]" />}
                            </li>
                            );
                        })}
                        </ul>
                    ) : (
                        <div className="p-4 text-center text-sm text-[var(--muted-foreground)]">Chưa có việc làm nào trong công ty này.</div>
                    )}
                    </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Huỷ</Button>
          <Button
            onClick={() => onSubmit({ title, content, images, jobIds, hashtags })}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </div>
    </div>
  );
  if (typeof window === "undefined") return null;
  return createPortal(modalContent, document.body);
}

export default PostCard;

