import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { getPublicSiteUrl } from "@/lib/seo-url-metadata";

export type BreadcrumbItem = {
  name: string;
  href?: string;
};

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const siteUrl = getPublicSiteUrl();
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.href ? { item: `${siteUrl}${item.href}` } : {}),
    })),
  };

  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-[var(--muted-foreground)]">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.name}-${index}`} className="flex items-center gap-1">
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {item.href && !last ? (
                <Link href={item.href} className="hover:text-[var(--foreground)] hover:underline">
                  {item.name}
                </Link>
              ) : (
                <span className={last ? "text-[var(--foreground)]" : undefined}>{item.name}</span>
              )}
            </li>
          );
        })}
      </ol>
      <JsonLd data={data} />
    </nav>
  );
}
