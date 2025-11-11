import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import { type CompanyStoryBlock } from "@/types/company";
import { cn } from "@/lib/utils";

type Props = {
  blocks?: CompanyStoryBlock[] | null;
  fallbackDescription?: string | null;
};

export default function CompanyStoryRenderer({ blocks, fallbackDescription }: Props) {
  if (!blocks?.length) {
    if (!fallbackDescription) {
      return (
        <Card>
          <CardContent className="py-10 text-center text-sm text-[var(--muted-foreground)]">
            Doanh nghiệp chưa cập nhật nội dung giới thiệu chi tiết.
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Về doanh nghiệp</h2>
        </CardHeader>
        <CardContent className="whitespace-pre-line text-sm leading-relaxed text-[var(--muted-foreground)]">
          {fallbackDescription}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
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

