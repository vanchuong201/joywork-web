"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, BookmarkCheck, BookmarkPlus, MoreVertical, Pencil, Trash2 } from "lucide-react";
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
  likesCount?: number | null;
  sharesCount?: number | null;
  isLiked?: boolean | null;
  isSaved?: boolean | null;
  images?: { id?: string; url: string; width?: number | null; height?: number | null; order?: number }[] | null;
  jobs?: { id: string; title: string; location?: string | null; employmentType: string; isActive: boolean }[] | null;
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
  const updateMutation = useMutation({
    mutationFn: async (payload: { title?: string; content?: string }) => {
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
        {post.tags?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <Badge key={t} className="bg-[#F7FAFF] text-[#17499A]">
                #{t}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-2 border-t border-[var(--border)] p-3">
        <LikeButton liked={Boolean(post.isLiked)} likes={likeCount} onToggle={onLike ? () => onLike(post) : undefined} />
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
  onSubmit: (payload: { title: string; content: string; images: EditableImage[] }) => void;
  isSubmitting: boolean;
}) {
  const [title, setTitle] = useState(post.title ?? "");
  const [content, setContent] = useState(post.content ?? "");
  const [images, setImages] = useState<EditableImage[]>(
    (post.images ?? []).map((img, idx) => ({ id: img.id, url: img.url, order: img.order ?? idx }))
  );

  useEffect(() => {
    if (open) {
      setTitle(post.title ?? "");
      setContent(post.content ?? "");
      setImages((post.images ?? []).map((img, idx) => ({ id: img.id, url: img.url, order: img.order ?? idx })));
    }
  }, [open, post]);

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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
      <div className="w-[min(680px,92vw)] rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-[var(--foreground)]">Chỉnh sửa bài viết</h3>
          <Button size="sm" variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
        <div className="space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề" />
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
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Huỷ</Button>
          <Button
            onClick={() => onSubmit({ title, content, images })}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </div>
    </div>
  );
}

