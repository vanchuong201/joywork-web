/**
 * AutoLinkText Component
 *
 * Renders text with automatic URL detection and safe hyperlink conversion.
 *
 * Security:
 * - Uses React nodes (no dangerouslySetInnerHTML)
 * - All hrefs are validated through the URL constructor
 * - Only http/https protocols are allowed
 * - External links get rel="noopener noreferrer nofollow" and target="_blank"
 *
 * Features:
 * - Preserves whitespace and line breaks
 * - Renders multiple URLs in a single string
 * - Detects bare www. links and prepends https://
 * - Strips trailing sentence-ending punctuation from URLs
 * - Gracefully falls back to plain text for invalid URLs
 */

import { memo, useId } from "react";
import { cn } from "@/lib/utils";
import { linkify, type TextPart } from "@/lib/linkify";

export type AutoLinkTextProps = {
  /** Text content to render with auto-linked URLs */
  text: string;
  /** Additional class names for the container */
  className?: string;
  /** Class names applied to link elements */
  linkClassName?: string;
  /**
   * Whether to open links in a new tab.
   * Default: true (safer — keeps user on your site)
   */
  newTab?: boolean;
  /**
   * Custom renderer for URL segments.
   * Use this to customize link appearance or behavior.
   *
   * @param href - Validated, normalized URL (always has protocol)
   * @param display - Display text for the link
   * @param index - Index of the link in the parts array (for keys)
   * @returns React node to render as the link
   */
  renderLink?: (href: string, display: string, index: number) => React.ReactNode;
};

const AutoLinkText = memo(function AutoLinkText({
  text,
  className,
  linkClassName,
  newTab = true,
  renderLink,
}: AutoLinkTextProps) {
  // React useId() must be called before any early returns (hooks rules)
  const baseId = useId();
  const parts: TextPart[] = linkify(text);

  // Fast path: no URLs found, render as plain text
  if (parts.length === 0 || (parts.length === 1 && parts[0].type === "text")) {
    return <span className={className}>{text}</span>;
  }

  let urlCounter = 0;

  return (
    <span className={cn("break-words", className)}>
      {parts.map((part, i) => {
        if (part.type === "text") {
          return (
            <span key={`${baseId}-t${i}`} className="whitespace-pre-wrap">
              {part.value}
            </span>
          );
        }

        const urlKey = `${baseId}-u${urlCounter++}`;
        if (renderLink) {
          return (
            <span key={urlKey} className="inline">
              {renderLink(part.href, part.display, urlCounter - 1)}
            </span>
          );
        }

        // All external links (newTab=true, the default) get noopener + nofollow.
        // noopener: prevents the opened page from accessing window.opener (security)
        // nofollow: prevents SEO PageRank flow (required for user-generated content links)
        // ugc: explicitly marks these as user-generated content (Google best practice)
        const rel = newTab ? "noopener noreferrer nofollow ugc" : undefined;

        return (
          <a
            key={urlKey}
            href={part.href}
            target={newTab ? "_blank" : undefined}
            rel={rel}
            className={cn(
              "break-all font-medium text-[var(--brand)] underline underline-offset-2 hover:opacity-80",
              linkClassName,
            )}
          >
            {part.display}
          </a>
        );
      })}
    </span>
  );
});

export { AutoLinkText };
