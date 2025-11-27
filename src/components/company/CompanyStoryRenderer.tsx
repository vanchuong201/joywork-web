"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { type CompanyStoryBlock } from "@/types/company";
import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";

type Props = {
  blocks?: CompanyStoryBlock[] | null;
  fallbackDescription?: string | null;
  canEditDescription?: boolean;
  onEditDescription?: () => void;
};

export default function CompanyStoryRenderer({
  blocks,
  fallbackDescription,
  canEditDescription,
  onEditDescription,
}: Props) {
  const sanitizedFallback = fallbackDescription;

  function AboutCard() {
    // Read-more state for long description content
    const [expanded, setExpanded] = useState(false);
    const [showReadMore, setShowReadMore] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!containerRef.current || expanded) return;
      const el = containerRef.current;
      const checkOverflow = () => {
        const hasOverflow = el.scrollHeight > el.clientHeight + 4; // tolerance
        setShowReadMore(hasOverflow);
      };
      checkOverflow();
      const onResize = () => checkOverflow();
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }, [expanded, sanitizedFallback]);

    return (
      <Card>
        <CardHeader className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Về doanh nghiệp</h2>
          {canEditDescription ? (
            <Button size="sm" variant="outline" onClick={onEditDescription}>
              <Pencil className="mr-1 h-3 w-3" />
              Chỉnh sửa
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="text-sm leading-relaxed text-[var(--muted-foreground)]">
          <div
            ref={containerRef}
            className={cn(
              "relative transition-[max-height]",
              expanded ? "max-h-none" : "max-h-[320px] overflow-hidden",
            )}
          >
            <div
              className="space-y-3 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-[var(--foreground)] [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[var(--foreground)] [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-[var(--foreground)] [&_strong]:text-[var(--foreground)] [&_a]:text-[var(--brand)] hover:[&_a]:text-[var(--brand)] [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--brand)] [&_blockquote]:bg-[var(--brand)]/5 [&_blockquote]:p-4 [&_code]:rounded [&_code]:bg-[var(--muted)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[var(--foreground)]"
              dangerouslySetInnerHTML={{ __html: sanitizedFallback! }}
            />
            {!expanded && showReadMore ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--card)] to-transparent" />
            ) : null}
          </div>
          {showReadMore ? (
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                className="text-sm underline underline-offset-2 text-[var(--brand)] hover:text-[var(--brand)] focus:outline-none"
              >
                {expanded ? "Thu gọn" : "Xem thêm"}
              </button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  if (!blocks?.length) {
    if (!sanitizedFallback) {
      return (
        <Card>
          <CardContent className="py-10 text-center text-sm text-[var(--muted-foreground)]">
            Doanh nghiệp chưa cập nhật nội dung giới thiệu chi tiết.
          </CardContent>
        </Card>
      );
    }

    return <AboutCard />;
  }

  return (
    <div className="space-y-6">
      {sanitizedFallback ? (
        <AboutCard />
      ) : null}
      {blocks.map((block, index) => {
        const key = block.id ?? `${block.type}-${index}`;
        switch (block.type) {
          case "text":
            return <TextSection key={key} block={block} />;
          case "list":
            return <ListSection key={key} block={block} />;
          case "quote":
            return <QuoteSection key={key} block={block} />;
          case "stats":
            return <StatsSection key={key} block={block} />;
          case "media":
            return <MediaSection key={key} block={block} />;
          default:
            return null;
        }
      })}
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
}: {
  title?: string;
  subtitle?: string;
}) {
  if (!title && !subtitle) return null;
  return (
    <div className="space-y-2">
      {title ? <h2 className="text-lg font-semibold text-[var(--foreground)]">{title}</h2> : null}
      {subtitle ? <p className="text-sm text-[var(--muted-foreground)]">{subtitle}</p> : null}
    </div>
  );
}

function TextSection({ block }: { block: Extract<CompanyStoryBlock, { type: "text" }> }) {
  if (!block.body && !block.title) return null;
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <SectionHeader title={block.title} subtitle={block.subtitle} />
        {block.body ? (
          <div className="whitespace-pre-line text-sm leading-relaxed text-[var(--muted-foreground)]">
            {block.body}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ListSection({ block }: { block: Extract<CompanyStoryBlock, { type: "list" }> }) {
  if (!block.items?.length) return null;
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <SectionHeader title={block.title} subtitle={block.subtitle} />
        <ul className="space-y-3 text-sm text-[var(--muted-foreground)]">
          {block.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-1.5 w-1.5 rounded-full bg-[var(--brand)]" />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function QuoteSection({ block }: { block: Extract<CompanyStoryBlock, { type: "quote" }> }) {
  if (!block.quote?.text) return null;
  return (
    <Card className="border-l-4 border-l-[var(--brand)] bg-[var(--brand)]/3">
      <CardContent className="space-y-4 pt-6">
        <SectionHeader title={block.title} />
        <blockquote className="space-y-3">
          <p className="text-lg font-medium italic text-[var(--foreground)]">“{block.quote.text}”</p>
          {(block.quote.author || block.quote.role) && (
            <footer className="text-sm text-[var(--muted-foreground)]">
              {block.quote.author}
              {block.quote.author && block.quote.role ? " · " : ""}
              {block.quote.role}
            </footer>
          )}
        </blockquote>
      </CardContent>
    </Card>
  );
}

function StatsSection({ block }: { block: Extract<CompanyStoryBlock, { type: "stats" }> }) {
  if (!block.stats?.length) return null;
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <SectionHeader title={block.title} subtitle={block.subtitle} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {block.stats.map((stat, idx) => (
            <div
              key={stat.id ?? idx}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4"
            >
              <p className="text-sm font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                {stat.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{stat.value}</p>
              {stat.description ? (
                <p className="mt-2 text-xs text-[var(--muted-foreground)]">{stat.description}</p>
              ) : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MediaSection({ block }: { block: Extract<CompanyStoryBlock, { type: "media" }> }) {
  if (!block.media?.length) return null;
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <SectionHeader title={block.title} subtitle={block.subtitle} />
        <div
          className={cn(
            "grid gap-3",
            block.media.length === 1
              ? "grid-cols-1"
              : block.media.length === 2
              ? "grid-cols-1 sm:grid-cols-2"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
          )}
        >
          {block.media.map((item, idx) => (
            <figure key={item.id ?? idx} className="overflow-hidden rounded-lg border border-[var(--border)]">
              <div className="relative aspect-video w-full bg-[var(--muted)]">
                <Image
                  src={item.url}
                  alt={item.caption ?? `Media ${idx + 1}`}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              {item.caption ? (
                <figcaption className="px-3 py-2 text-xs text-[var(--muted-foreground)]">{item.caption}</figcaption>
              ) : null}
            </figure>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

