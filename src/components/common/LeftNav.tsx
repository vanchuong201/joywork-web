"use client";

import { Home, User, Briefcase, MessageSquareText } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/store/useAuth";

const items = [
  { icon: Home, label: "Main Feed" },
  { icon: User, label: "My Profile" },
  { icon: Briefcase, label: "Jobs" },
  { icon: MessageSquareText, label: "Inbox" },
];

export default function LeftNav() {
  const pathname = usePathname();
  const user = useAuth((s) => s.user);
  return (
    <aside className="hidden w-60 shrink-0 border-r border-[var(--border)] bg-[var(--card)] md:block">
      <nav className="p-4">
        <div className="mb-4 rounded-md border border-[var(--border)] bg-[var(--background)] p-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-[var(--muted)]" />
            <div className="text-sm">
              <div className="font-medium text-[var(--foreground)]">{user?.name ?? user?.email ?? "Guest"}</div>
              <div className="text-[12px] text-[var(--muted-foreground)]">{user ? (user.role ?? "User") : "Not signed in"}</div>
            </div>
          </div>
        </div>
        <ul className="space-y-1">
          {items.map((i) => {
            const href = i.label === "Main Feed" ? "/" : `/${i.label.toLowerCase().replace(" ", "")}`;
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={i.label}>
                <Link
                  href={href}
                  className={`flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors ${
                    active
                      ? "bg-[var(--muted)] text-[var(--foreground)]"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <i.icon size={16} />
                  <span className="font-medium">{i.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 text-sm">
          <details className="rounded-md border border-[var(--border)] bg-[var(--background)]">
            <summary className="cursor-pointer select-none p-2 font-medium">Quick Filters</summary>
            <div className="space-y-3 p-3 text-[var(--muted-foreground)]">
              <div>
                <div className="mb-1 text-xs font-semibold text-[var(--foreground)]">Industry</div>
                <label className="flex items-center gap-2"><input type="checkbox" disabled /> Technology</label>
                <label className="flex items-center gap-2"><input type="checkbox" disabled /> Finance</label>
              </div>
              <div>
                <div className="mb-1 text-xs font-semibold text-[var(--foreground)]">Region</div>
                <label className="flex items-center gap-2"><input type="checkbox" disabled /> HN</label>
                <label className="flex items-center gap-2"><input type="checkbox" disabled /> HCM</label>
              </div>
              <div>
                <div className="mb-1 text-xs font-semibold text-[var(--foreground)]">Work Type</div>
                <label className="flex items-center gap-2"><input type="checkbox" disabled /> On-site</label>
                <label className="flex items-center gap-2"><input type="checkbox" disabled /> Hybrid</label>
                <label className="flex items-center gap-2"><input type="checkbox" disabled /> Remote</label>
              </div>
              <div className="text-[11px]">Filters đang được thiết kế cho phiên bản kế tiếp</div>
            </div>
          </details>
        </div>
      </nav>
    </aside>
  );
}


