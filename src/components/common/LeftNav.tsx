"use client";

import {
  Home,
  Briefcase,
  Building2,
  MessageSquareText,
  UserRound,
  ClipboardList,
  Bookmark,
  Heart,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuth";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type NavItem = {
  icon: LucideIcon;
  label: string;
  href: string;
  exact?: boolean;
  badge?: string;
};

const primaryNav: NavItem[] = [
  { icon: Home, label: "Feed", href: "/" },
  { icon: Briefcase, label: "Jobs", href: "/jobs" },
  { icon: Building2, label: "Companies", href: "/companies" },
  { icon: MessageSquareText, label: "Inbox", href: "/inbox" },
];

const personalNav: NavItem[] = [
  { icon: UserRound, label: "Hồ sơ của tôi", href: "/profile" },
  { icon: ClipboardList, label: "Ứng tuyển của tôi", href: "/applications" },
  { icon: Bookmark, label: "Việc đã lưu", href: "/saved-jobs" },
  { icon: Heart, label: "Công ty theo dõi", href: "/following" },
];

function NavSection({ title, items, pathname }: { title: string; items: NavItem[]; pathname: string }) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{title}</div>
      <ul className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-[var(--muted)] text-[var(--foreground)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                )}
              >
                <Icon size={16} />
                <span className="flex-1 font-medium">{item.label}</span>
                {item.badge ? (
                  <span className="rounded-full bg-[var(--brand)]/10 px-2 py-0.5 text-[11px] text-[var(--brand)]">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function LeftNav() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const memberships = useAuthStore((s) => s.memberships);
  const initialized = useAuthStore((s) => s.initialized);
  const loading = useAuthStore((s) => s.loading);

  const isReady = initialized && !loading;

  if (!isReady) {
    return (
      <aside className="hidden w-64 shrink-0 border-r border-[var(--border)] bg-[var(--card)] md:block">
        <div className="flex h-full flex-col gap-4 p-4">
          <Skeleton className="h-16 rounded-md" />
          <Skeleton className="h-28 rounded-md" />
          <Skeleton className="h-28 rounded-md" />
          <Skeleton className="h-28 rounded-md" />
        </div>
      </aside>
    );
  }

  if (!user) {
    return (
      <aside className="hidden w-64 shrink-0 border-r border-[var(--border)] bg-[var(--card)] md:block">
        <div className="p-4">
          <div className="rounded-md border border-dashed border-[var(--border)] bg-[var(--background)] p-4 text-sm text-[var(--muted-foreground)]">
            <p className="font-medium text-[var(--foreground)]">Đăng nhập để cá nhân hóa trải nghiệm</p>
            <p className="mt-1 text-xs">
              Theo dõi công ty, lưu việc làm và nhận thông báo ứng tuyển nhanh chóng.
            </p>
            <div className="mt-3 flex gap-2 text-sm">
              <Link
                href="/login"
                className="flex-1 rounded-md border border-[var(--brand)] px-3 py-1 text-center text-[var(--brand)] hover:bg-[var(--brand)]/10"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="flex-1 rounded-md bg-[var(--brand)] px-3 py-1 text-center text-white hover:opacity-90"
              >
                Đăng ký
              </Link>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  const companyItems: NavItem[] = memberships.map((membership) => ({
    icon: Building2,
    label: membership.company.name,
    href: `/companies/${membership.company.slug}`,
    badge: membership.role === "OWNER" || membership.role === "ADMIN" ? "Quản trị" : undefined,
  }));

  return (
    <aside className="hidden w-64 shrink-0 border-r border-[var(--border)] bg-[var(--card)] md:block">
      <nav className="flex h-full flex-col gap-6 p-4">
        <div className="rounded-md border border-[var(--border)] bg-[var(--background)] p-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-[var(--brand)]/20" />
            <div className="text-sm">
              <div className="font-medium text-[var(--foreground)]">{user.name ?? user.email}</div>
            </div>
          </div>
        </div>

        <NavSection title="Khám phá" items={primaryNav} pathname={pathname} />
        <NavSection title="Không gian của tôi" items={personalNav} pathname={pathname} />

        {companyItems.length > 0 ? (
          <NavSection title="Công ty của tôi" items={companyItems} pathname={pathname} />
        ) : null}

        {user.role === "ADMIN" ? (
          <NavSection
            title="System"
            items={[
              { icon: ClipboardList, label: "Moderation", href: "/system" },
            ]}
            pathname={pathname}
          />
        ) : null}
      </nav>
    </aside>
  );
}


