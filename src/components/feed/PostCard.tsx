"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, BookmarkCheck, BookmarkPlus } from "lucide-react";
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
  coverUrl?: string | null;
  tags?: string[] | null;
  likesCount?: number | null;
  sharesCount?: number | null;
  isLiked?: boolean | null;
  isSaved?: boolean | null;
  images?: { id?: string; url: string; width?: number | null; height?: number | null; order?: number }[] | null;
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
  const { openPrompt } = useAuthPrompt();
  const qc = useQueryClient();
  const [isSaved, setIsSaved] = useState(Boolean(post.isSaved));
  useEffect(() => {
    setIsSaved(Boolean(post.isSaved));
  }, [post.isSaved]);
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
  const footerInfo = useMemo(
    () =>
      [
        likeCount > 0 ? `${likeCount.toLocaleString("vi-VN")} lượt thích` : null,
        shareCount > 0 ? `${shareCount.toLocaleString("vi-VN")} lượt chia sẻ` : null,
      ].filter(Boolean),
    [likeCount, shareCount],
  );
  const renderContent = () => {
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
    }, [expanded, post.content]);

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
            {post.content}
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
  };

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
            {post.company.slogan ? (
              <span className="text-xs">{post.company.slogan}</span>
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
        {renderContent()}
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
    </article>
  );
}


