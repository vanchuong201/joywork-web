"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, BookmarkCheck, BookmarkPlus, MoreVertical, Pencil, Trash2, Briefcase, X, Check } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { format, formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { uploadCompanyPostImage } from "@/lib/uploads";
import { createPortal } from "react-dom";
import HashtagInput from "@/components/shared/HashtagInput";

type LikeButtonProps = {
  liked: boolean;
  likes: number;
  onToggle?: () => void;
};

function LikeButton({ liked, likes, onToggle }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(liked);
  const [count, setCount] = useState(likes);
  const [isBusy, setBusy] = useState(false);
  const heartRef = useRef<HTMLSpanElement | null>(null);
  const prevLiked = useRef(liked);
  const prevLikes = useRef(likes);

  useEffect(() => {
    if (prevLiked.current !== liked || prevLikes.current !== likes) {
      prevLiked.current = liked;
      prevLikes.current = likes;
      setIsLiked(liked);
      setCount(likes);
    }
  }, [liked, likes]);

  useEffect(() => {
    if (!isLiked) return;
    const heartEl = heartRef.current;
    if (!heartEl) return;
    heartEl.classList.remove("animate-like-burst");
    void heartEl.offsetWidth;
    heartEl.classList.add("animate-like-burst");
  }, [isLiked]);

  const handleToggle = useCallback(() => {
    if (!onToggle || isBusy) return;
    const nextLiked = !isLiked;
    setBusy(true);
    setIsLiked(nextLiked);
    setCount((prev) => Math.max(0, prev + (nextLiked ? 1 : -1)));
    Promise.resolve(onToggle())
      .catch(() => {
        setIsLiked(isLiked);
        setCount((prev) => Math.max(0, prev + (isLiked ? 1 : -1)));
      })
      .finally(() => setBusy(false));
  }, [isLiked, isBusy, onToggle]);

  const buttonLabel = isLiked ? "Đã thích" : "Thích";
  const countLabel = count > 0 ? count.toLocaleString("vi-VN") : "";

  return (
    <Button
      size="sm"
      variant={isLiked ? "default" : "outline"}
      className={isLiked ? "border-[#ff9fb1] bg-[#fff1f4] text-[#ff2d55]" : undefined}
      onClick={handleToggle}
      disabled={isBusy}
      aria-pressed={isLiked}
      aria-live="polite"
    >
      <span
        ref={heartRef}
        className={`mr-1 inline-flex h-5 w-5 items-center justify-center rounded-full transition-transform duration-200 ease-out ${
          isLiked ? "text-[#ff2d55]" : "text-[#6b7280]"
        }`}
      >
        <Heart className="h-4 w-4" fill={isLiked ? "#ff2d55" : "none"} />
      </span>
      {buttonLabel}
      <span className="ml-1 font-medium tabular-nums">{countLabel}</span>
    </Button>
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
  tags?: string[] | null;
  hashtags?: { id: string; slug: string; label: string }[] | null;
  likesCount?: number | null;
  sharesCount?: number | null;
  isLiked?: boolean | null;
  isSaved?: boolean | null;
  images?: { id?: string; url: string; width?: number | null; height?: number | null; order?: number }[] | null;
  jobs?: { id: string; title: string; location?: string | null; employmentType: string; isActive: boolean }[] | null;
  reactions?: { JOY: number; TRUST: number; SKEPTIC: number } | null;
  userReaction?: "JOY" | "TRUST" | "SKEPTIC" | null;
};

function MediaGrid({ images }: { images: NonNullable<PostCardData["images"]> }) {
  const hiddenCount = Math.max(0, images.length - 4);
  const primary = hiddenCount > 0 ? images.slice(0, 4) : images.slice(0, images.length);
  const backup = images.slice(primary.length);

  const renderSingle = (image: (typeof images)[number]) => (
    <PhotoView key={image.id ?? image.url} src={image.url}>
      <div className="mt-3 aspect-video w-full overflow-hidden rounded-md bg-[var(--muted)] cursor-zoom-in">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          alt="media"
          className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
        />
      </div>
    </PhotoView>
  );

  const renderPair = () => (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {primary.map((m) => (
        <PhotoView key={m.id ?? m.url} src={m.url}>
          <div className="aspect-video overflow-hidden rounded-md bg-[var(--muted)] cursor-zoom-in">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={m.url}
              alt="media"
              className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
            />
          </div>
        </PhotoView>
      ))}
    </div>
  );

  const renderTriple = () => (
    <div className="mt-3 grid grid-cols-3 gap-2">
      <PhotoView key={primary[0].id ?? primary[0].url} src={primary[0].url}>
        <div className="col-span-2 row-span-2 aspect-[2/1] overflow-hidden rounded-md bg-[var(--muted)] cursor-zoom-in">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={primary[0].url}
            alt="media"
            className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
          />
        </div>
      </PhotoView>
      {primary.slice(1).map((m) => (
        <PhotoView key={m.id ?? m.url} src={m.url}>
          <div className="aspect-video overflow-hidden rounded-md bg-[var(--muted)] cursor-zoom-in">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={m.url}
              alt="media"
              className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
            />
          </div>
        </PhotoView>
      ))}
    </div>
  );

  const renderQuad = () => (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {primary.map((m, idx) => (
        <PhotoView key={m.id ?? m.url} src={m.url}>
          <div className="relative aspect-video overflow-hidden rounded-md bg-[var(--muted)] cursor-zoom-in">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={m.url}
              alt="media"
              className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
            />
            {idx === primary.length - 1 && hiddenCount > 0 ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-semibold text-white">
                +{hiddenCount}
              </div>
            ) : null}
          </div>
        </PhotoView>
      ))}
    </div>
  );

  return (
    <PhotoProvider maskOpacity={0.8}>
      {primary.length === 1
        ? renderSingle(primary[0]!)
        : primary.length === 2
        ? renderPair()
        : primary.length === 3
        ? renderTriple()
        : renderQuad()}

      {backup.map((m) => (
        <PhotoView key={m.id ?? m.url} src={m.url}>
          <div className="hidden" />
        </PhotoView>
      ))}
    </PhotoProvider>
  );
}

export default function PostCard({ post, onLike }: { post: PostCardData; onLike?: (p: PostCardData) => void }) {
  const hasImages = (post.images?.length ?? 0) > 0;
  const likeCount = post.likesCount ?? (post as any)?._count?.likes ?? 0;
  const shareCount = post.sharesCount ?? (post as any)?._count?.shares ?? 0;
  const user = useAuthStore((s) => s.user);
  const memberships = useAuthStore((s) => s.memberships);
  const { openPrompt } = useAuthPrompt();
  const qc = useQueryClient();
  const [isSaved, setIsSaved] = useState(Boolean(post.isSaved));
  useEffect(() => {
    setIsSaved(Boolean(post.isSaved));
  }, [post.isSaved]);
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
  const menuRef = useRef<HTMLDivElement | null>(null);
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
  const [draftTitle, setDraftTitle] = useState(post.title ?? "");
  const [draftContent, setDraftContent] = useState(post.content ?? "");
  useEffect(() => {
    setDraftTitle(post.title ?? "");
    setDraftContent(post.content ?? "");
  }, [post.title, post.content]);
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
    onSuccess: () => {
      // Invalidate any list/detail caches
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["company-posts"] });
      qc.invalidateQueries({ queryKey: ["post"] });
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
  const handleEditSave = useCallback(() => {
    if (!user) {
      openPrompt("login");
      return;
    }
    if (!canEdit) {
      toast.error("Bạn không có quyền sửa bài viết này");
      return;
    }
    updateMutation.mutate({ title: draftTitle, content: draftContent });
  }, [user, canEdit, updateMutation, draftTitle, draftContent, openPrompt]);
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
  const footerInfo = useMemo(
    () =>
      [
        likeCount > 0 ? `${likeCount.toLocaleString("vi-VN")} lượt thích` : null,
        shareCount > 0 ? `${shareCount.toLocaleString("vi-VN")} lượt chia sẻ` : null,
      ].filter(Boolean),
    [likeCount, shareCount],
  );

  function PostContent({ content }: { content: string }) {
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
  }

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
          <div className="flex flex-col">
            <CompanyHoverCard
              companyId={post.company.id}
              slug={post.company.slug}
              companyName={post.company.name}
            >
              <Link className="font-medium hover:text-[var(--foreground)]" href={`/companies/${post.company.slug}`}>
              {post.company.name}
              </Link>
            </CompanyHoverCard>
            <div className="text-xs flex items-center gap-2">
              {post.company.slogan ? <span>{post.company.slogan}</span> : null}
              {(() => {
                const dateStr = (post.publishedAt ?? post.createdAt) ?? null;
                if (!dateStr) return null;
                const dateObj = new Date(dateStr);
                const relative = formatDistanceToNow(dateObj, { addSuffix: true, locale: vi });
                const exact = format(dateObj, "HH:mm dd/MM/yyyy");
                return (
                  <span title={exact}>
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
        {/* <h3 className="text-base font-semibold">
          <Link href={`/posts/${post.id}`} className="hover:underline">
            {post.title}
          </Link>
        </h3> */}
        {hasImages ? (
          <MediaGrid images={post.images!} />
        ) : post.coverUrl ? (
          <PhotoProvider maskOpacity={0.8}>
            <PhotoView src={post.coverUrl}>
              <div className="mt-3 aspect-video w-full overflow-hidden rounded-md bg-[var(--muted)] cursor-zoom-in">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.coverUrl}
                  alt="cover"
                  className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
                />
              </div>
            </PhotoView>
          </PhotoProvider>
        ) : null}
        <PostContent content={post.content} />
        {post.jobs && post.jobs.length ? (
          <div className="mt-3 space-y-2">
            <div className="text-xs font-medium text-[var(--muted-foreground)]">Jobs đính kèm</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {post.jobs.map((j) => (
                <Link
                  key={j.id}
                  href={`/jobs/${j.id}`}
                  target="_blank"
                  className="group rounded-md border border-[var(--border)] bg-[var(--background)] p-3 hover:border-[var(--brand)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--brand)]">
                        {j.title}
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)]">
                        {j.employmentType} {j.location ? `· ${j.location}` : ""}
                      </div>
                    </div>
                    <span
                      className={
                        "inline-flex h-6 items-center rounded-full px-2 text-xs " +
                        (j.isActive
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : "bg-rose-100 text-rose-700 border border-rose-200")
                      }
                    >
                      {j.isActive ? "Đang mở" : "Đã đóng"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
        {post.hashtags?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.hashtags.map((h) => (
              <Link key={h.id} href={`/tags/${h.slug}`}>
                <Badge className="bg-[#F7FAFF] text-[#17499A] hover:bg-[#e0efff]">
                  #{h.label}
              </Badge>
              </Link>
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-2 border-t border-[var(--border)] p-3">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={myReaction === "JOY" ? "default" : "outline"}
            className={cn("gap-1", myReaction === "JOY" ? "bg-[#fff1f4] text-[#d946ef] border-[#f0abfc]" : undefined)}
            onClick={() => toggleReaction("JOY")}
            disabled={reactMutation.isPending}
          >
            <span aria-hidden>😍</span>
            <span>JOY</span>
            {reactionCounts.JOY > 0 ? <span className="ml-1 tabular-nums">{reactionCounts.JOY}</span> : null}
          </Button>
          <Button
            size="sm"
            variant={myReaction === "TRUST" ? "default" : "outline"}
            className={cn("gap-1", myReaction === "TRUST" ? "bg-[#ecfeff] text-[#0891b2] border-[#a5f3fc]" : undefined)}
            onClick={() => toggleReaction("TRUST")}
            disabled={reactMutation.isPending}
          >
            <span aria-hidden>👍</span>
            <span>Trust</span>
            {reactionCounts.TRUST > 0 ? <span className="ml-1 tabular-nums">{reactionCounts.TRUST}</span> : null}
          </Button>
          <Button
            size="sm"
            variant={myReaction === "SKEPTIC" ? "default" : "outline"}
            className={cn("gap-1", myReaction === "SKEPTIC" ? "bg-[#fff7ed] text-[#c2410c] border-[#fed7aa]" : undefined)}
            onClick={() => toggleReaction("SKEPTIC")}
            disabled={reactMutation.isPending}
          >
            <span aria-hidden>🤔</span>
            <span>Hoài nghi</span>
            {reactionCounts.SKEPTIC > 0 ? <span className="ml-1 tabular-nums">{reactionCounts.SKEPTIC}</span> : null}
          </Button>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleSave}
          aria-pressed={isSaved}
          disabled={saveMutation.isPending}
          className={cn("gap-1", isSaved ? "border-[var(--brand)] text-[var(--brand)]" : undefined)}
        >
          {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />}
          {isSaved ? "Đã lưu" : "Lưu bài"}
        </Button>
        <Button size="sm" variant="outline" onClick={handleShare}>
          Share
        </Button>
        {footerInfo.length ? (
          <span className="ml-auto text-xs text-[var(--muted-foreground)]">{footerInfo.join(" · ")}</span>
        ) : null}
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
              })),
              jobIds: payload.jobIds,
              hashtags: payload.hashtags,
            } as any);
          }}
        />
      ) : null}
    </article>
  );
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type EditableImage = { id?: string; key?: string; url: string; width?: number; height?: number; order: number };

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
    (post.images ?? []).map((img, idx) => ({ id: img.id, url: img.url, order: img.order ?? idx }))
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
      setImages((post.images ?? []).map((img, idx) => ({ id: img.id, url: img.url, order: img.order ?? idx })));
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
    let next = [...images];
    for (const file of files) {
      try {
        const dataUrl = await toBase64(file);
        const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
        const { key, assetUrl } = await uploadCompanyPostImage({
          companyId,
          fileName: file.name,
          fileType: file.type,
          fileData: base64,
        });
        next.push({ key, url: assetUrl, order: next.length });
      } catch {
        toast.error(`Tải ảnh thất bại: ${file.name}`);
      }
    }
    setImages(next.slice(0, 8));
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

  const toggleJob = (id: string) =>
    setJobIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

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
              <span className="text-sm font-medium text-[var(--foreground)]">Ảnh (tối đa 8)</span>
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[var(--brand)]">
                <input type="file" accept="image/*" multiple hidden onChange={pickFiles} />
                Thêm ảnh
              </label>
            </div>
            {images.length ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {images.map((img, idx) => (
                  <div key={(img.id ?? img.key ?? img.url) + idx} className="relative overflow-hidden rounded-md border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="" className="h-32 w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/40 px-2 py-1 text-xs text-white">
                      <span>#{idx + 1}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => move(idx, -1)} className="rounded bg-white/20 px-1">↑</button>
                        <button onClick={() => move(idx, +1)} className="rounded bg-white/20 px-1">↓</button>
                        <button onClick={() => removeAt(idx)} className="rounded bg-red-500/80 px-1">Xóa</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed p-4 text-center text-sm text-[var(--muted-foreground)]">
                Chưa có ảnh. Nhấn “Thêm ảnh” để tải lên.
              </div>
            )}
          </div>

          {/* Hashtags */}
          <div className="space-y-2">
            <div className="mb-2 text-sm font-medium text-[var(--foreground)]">Hashtags</div>
            <HashtagInput value={hashtags} onChange={setHashtags} placeholder="Thêm chủ đề (hashtag)..." />
          </div>

          {/* Jobs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--foreground)]">Jobs đính kèm</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowJobSelector(!showJobSelector)}
                className="h-6 gap-1 px-2 text-xs text-[var(--brand)] hover:bg-[var(--brand)]/10"
              >
                <Briefcase className="h-3 w-3" />
                {showJobSelector ? "Đóng danh sách" : "Thêm/Xoá Job"}
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
                        <div className="p-4 text-center text-sm text-[var(--muted-foreground)]">Đang tải danh sách job...</div>
                    ) : availableJobs.length ? (
                        <ul className="divide-y divide-[var(--border)]">
                        {availableJobs.map((j) => {
                            const checked = jobIds.includes(j.id);
                            return (
                            <li 
                                key={j.id} 
                                className={cn(
                                    "group flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5 transition-colors text-sm",
                                    checked ? "bg-[var(--brand)]/5 text-[var(--brand)]" : "hover:bg-[var(--muted)] text-[var(--foreground)]"
                                )}
                                onClick={() => toggleJob(j.id)}
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
                        <div className="p-4 text-center text-sm text-[var(--muted-foreground)]">Chưa có job nào trong công ty này.</div>
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

