"use client";

import Link from "next/link";
import { Globe2, Settings2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuth";
import { cn } from "@/lib/utils";

type CompanyModeSwitchBarProps = {
  slug: string;
  mode: "manage" | "public";
};

export default function CompanyModeSwitchBar({ slug, mode }: CompanyModeSwitchBarProps) {
  const memberships = useAuthStore((s) => s.memberships);

  const canManage = memberships.some(
    (membership) =>
      membership.company.slug === slug &&
      (membership.role === "OWNER" || membership.role === "ADMIN"),
  );

  if (mode === "public" && !canManage) {
    return null;
  }

  return (
    <div className="sticky top-14 z-40 border-b border-[var(--border)] bg-[var(--card)]/98 px-2 py-2 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-[var(--card)]/96 sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-center">
        <div className="inline-flex items-center rounded-xl border border-[var(--border)] bg-[var(--background)]/70 p-1 shadow-sm">
          {mode === "public" ? (
            <div
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--brand)]/10 px-3 text-sm font-semibold text-[var(--brand)]"
              aria-current="page"
            >
              <Globe2 className="h-4 w-4" />
              <span>Trang công khai</span>
            </div>
          ) : (
            <Link
              href={`/companies/${slug}`}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-[var(--muted-foreground)] transition-colors",
                "hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
              )}
            >
              <Globe2 className="h-4 w-4" />
              <span>Trang công khai</span>
            </Link>
          )}

          {canManage ? (
            mode === "manage" ? (
              <div
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--brand)]/10 px-3 text-sm font-semibold text-[var(--brand)]"
                aria-current="page"
              >
                <Settings2 className="h-4 w-4" />
                <span>Trang quản trị</span>
              </div>
            ) : (
              <Link
                href={`/companies/${slug}/manage`}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-[var(--muted-foreground)] transition-colors",
                  "hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
                )}
              >
                <Settings2 className="h-4 w-4" />
                <span>Trang quản trị</span>
              </Link>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}

