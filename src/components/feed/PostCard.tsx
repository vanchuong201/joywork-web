"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  images?: { id?: string; url: string; width?: number | null; height?: number | null; order?: number }[] | null;
};

function MediaGrid({ images }: { images: NonNullable<PostCardData["images"]> }) {
  const imgs = images.slice(0, 5);
  const extra = (images?.length ?? 0) - imgs.length;
  if (imgs.length === 1) {
    return (
      <div className="mt-3 aspect-video w-full overflow-hidden rounded-md bg-[var(--muted)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imgs[0].url} alt="media" className="h-full w-full object-cover" />
      </div>
    );
  }
  if (imgs.length === 2) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-2">
        {imgs.map((m) => (
          <div key={m.id ?? m.url} className="aspect-video overflow-hidden rounded-md bg-[var(--muted)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.url} alt="media" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
    );
  }
  if (imgs.length === 3) {
    return (
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="col-span-2 row-span-2 aspect-[2/1] overflow-hidden rounded-md bg-[var(--muted)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgs[0].url} alt="media" className="h-full w-full object-cover" />
        </div>
        {imgs.slice(1).map((m) => (
          <div key={m.id ?? m.url} className="aspect-video overflow-hidden rounded-md bg-[var(--muted)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.url} alt="media" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
    );
  }
  // 4 or 5+
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {imgs.slice(0, 4).map((m, idx) => (
        <div key={m.id ?? m.url} className="relative aspect-video overflow-hidden rounded-md bg-[var(--muted)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={m.url} alt="media" className="h-full w-full object-cover" />
          {idx === 3 && extra > 0 ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-semibold text-white">
              +{extra}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export default function PostCard({ post, onLike }: { post: PostCardData; onLike?: (p: PostCardData) => void }) {
  const hasImages = (post.images?.length ?? 0) > 0;
  return (
    <article className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-0 overflow-hidden">
      <div className="p-4">
        <div className="mb-1 flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
          <div className="h-7 w-7 rounded-full bg-[var(--muted)]" />
          <div className="flex flex-col">
            <a className="font-medium hover:text-[var(--foreground)]" href={`/companies/${post.company.slug}`}>
              {post.company.name}
            </a>
            {post.company.slogan ? (
              <span className="text-xs">{post.company.slogan}</span>
            ) : null}
          </div>
        </div>
        <h3 className="text-base font-semibold">{post.title}</h3>
        {hasImages ? (
          <MediaGrid images={post.images!} />
        ) : post.coverUrl ? (
          <div className="mt-3 aspect-video w-full overflow-hidden rounded-md bg-[var(--muted)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.coverUrl} alt="cover" className="h-full w-full object-cover" />
          </div>
        ) : null}
        <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">{post.content}</p>
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
        <Button size="sm" onClick={() => onLike?.(post)}>
          {post.isLiked ? "Unlike" : "Like"}
        </Button>
        <Button size="sm" variant="outline">
          Save
        </Button>
        <Button size="sm" variant="outline">
          Share
        </Button>
        <a className="ml-auto text-sm text-[var(--brand)]" href={`/companies/${post.company.slug}`}>
          View company
        </a>
      </div>
      {(post.likesCount || post.sharesCount) ? (
        <div className="border-t border-[var(--border)] px-3 py-2 text-xs text-[var(--muted-foreground)]">
          {(post.likesCount ?? 0)} likes · {(post.sharesCount ?? 0)} shares
        </div>
      ) : null}
    </article>
  );
}


