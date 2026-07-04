"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { isNavItemActive, type NavItem } from "./navigation-config";

/**
 * Titled nav section shared by the desktop LeftNav and the mobile menu panel.
 * When `onProtectedClick` is provided (logged-out state), internal items render
 * as buttons that trigger the auth prompt instead of navigating.
 */
export default function NavSection({
  title,
  items,
  pathname,
  truncateLabel = false,
  onProtectedClick,
  onNavigate,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
  truncateLabel?: boolean;
  onProtectedClick?: (item: NavItem) => void;
  onNavigate?: () => void;
}) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{title}</div>
      <ul className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = isNavItemActive(pathname, item);
          const className = cn(
            "flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors",
            isActive
              ? "bg-[var(--muted)] text-[var(--foreground)]"
              : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          );
          const label = (
            <>
              <Icon size={16} />
              <span className={cn("flex-1 font-medium", truncateLabel && "truncate")}>{item.label}</span>
              {item.badge ? (
                <span className="rounded-full bg-[var(--brand)]/10 px-2 py-0.5 text-[11px] text-[var(--brand)]">
                  {item.badge}
                </span>
              ) : null}
            </>
          );
          return (
            <li key={`${item.href}-${item.label}`}>
              {onProtectedClick && !item.external ? (
                <button type="button" onClick={() => onProtectedClick(item)} className={cn(className, "w-full text-left")}>
                  {label}
                </button>
              ) : item.external ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={className}
                  onClick={onNavigate}
                >
                  {label}
                </a>
              ) : (
                <Link href={item.href} className={className} onClick={onNavigate}>
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
