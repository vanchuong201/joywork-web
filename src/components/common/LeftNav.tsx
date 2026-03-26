"use client";

import {
  LifeBuoy,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuth";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import CreateTicketModal from "@/components/tickets/CreateTicketModal";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  buildCompanyManageNav,
  buildLeftAdminNav,
  buildLeftExploreNav,
  isNavItemActive,
  leftPersonalNav,
  type NavItem,
} from "./navigation-config";

const MAX_COMPANY_NAV_ITEMS = 6;

function StaticPageLinks() {
  return (
    <div className="mt-auto border-t border-[var(--border)] pt-3 text-xs text-[var(--muted-foreground)]">
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        <Link
          href="/gioi-thieu"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[var(--foreground)] hover:underline"
        >
          Giới thiệu
        </Link>
        <span>·</span>
        <Link
          href="/dieu-khoan-hoat-dong"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[var(--foreground)] hover:underline"
        >
          Điều khoản hoạt động
        </Link>
      </div>
      <p className="mt-1">JOYWORK © {new Date().getFullYear()}</p>
    </div>
  );
}

function NavSection({
  title,
  items,
  pathname,
  truncateLabel = false,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
  truncateLabel?: boolean;
}) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{title}</div>
      <ul className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = isNavItemActive(pathname, item);
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
                <span className={cn("flex-1 font-medium", truncateLabel && "truncate")}>{item.label}</span>
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
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const memberships = useAuthStore((s) => s.memberships);
  const initialized = useAuthStore((s) => s.initialized);
  const loading = useAuthStore((s) => s.loading);
  const [avatarError, setAvatarError] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  
  const joyworkCompanyId = process.env.NEXT_PUBLIC_JOYWORK_COMPANY_ID;
  
  // Fetch JoyWork company info
  const { data: joyworkCompany } = useQuery({
    queryKey: ["joywork-company", joyworkCompanyId],
    queryFn: async () => {
      if (!joyworkCompanyId) return null;
      try {
        const res = await api.get(`/api/companies/by-id/${joyworkCompanyId}`);
        return res.data.data.company as { id: string; name: string; slug: string };
      } catch (error: unknown) {
        const status = (error as { response?: { status?: number } })?.response?.status;
        // Gracefully handle stale/missing configured company id to avoid noisy console errors.
        if (status === 404) return null;
        throw error;
      }
    },
    enabled: Boolean(joyworkCompanyId) && Boolean(user),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    retry: false,
  });

  const isReady = initialized && !loading;

  const displayName = user?.name?.trim() || user?.email || "";
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?";

  // Reset avatar error khi user hoặc avatar thay đổi
  useEffect(() => {
    if (user?.avatar) {
      setAvatarError(false);
    }
  }, [user?.avatar, user?.id]);

  if (!isReady) {
    return (
      <aside className="hidden w-64 shrink-0 border-r border-[var(--border)] bg-[var(--card)] md:sticky md:top-24 md:block md:h-[calc(100vh-6rem)]">
        <div className="flex h-full flex-col gap-4 p-4">
          <Skeleton className="h-16 rounded-md" />
          <Skeleton className="h-28 rounded-md" />
          <Skeleton className="h-28 rounded-md" />
          <Skeleton className="h-28 rounded-md" />
          <StaticPageLinks />
        </div>
      </aside>
    );
  }

  if (!user) {
    return (
      <aside className="hidden w-64 shrink-0 border-r border-[var(--border)] bg-[var(--card)] md:sticky md:top-24 md:block md:h-[calc(100vh-6rem)]">
        <div className="flex h-full flex-col p-4">
          <div className="rounded-md border border-dashed border-[var(--border)] bg-[var(--background)] p-4 text-sm text-[var(--muted-foreground)]">
            <p className="font-medium text-[var(--foreground)]">Đăng nhập để cá nhân hóa trải nghiệm</p>
            <p className="mt-1 text-xs">
              Theo dõi công ty, lưu việc làm và nhận thông báo ứng tuyển nhanh chóng.
            </p>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <Link
                href="/login"
                className="w-full rounded-md border border-[var(--brand)] px-3 py-1 text-center text-[var(--brand)] hover:bg-[var(--brand)]/10"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="w-full rounded-md bg-[var(--brand)] px-3 py-1 text-center text-white hover:opacity-90"
              >
                Đăng ký
              </Link>
            </div>
          </div>
          <StaticPageLinks />
        </div>
      </aside>
    );
  }

  const primaryNav = buildLeftExploreNav();
  const personalNav = leftPersonalNav;
  const companyItems = buildCompanyManageNav(memberships);
  const visibleCompanyItems = companyItems.slice(0, MAX_COMPANY_NAV_ITEMS);
  const hasMoreCompanyItems = companyItems.length > MAX_COMPANY_NAV_ITEMS;
  const adminNav = buildLeftAdminNav(user);

  return (
    <aside className="hidden w-64 shrink-0 border-r border-[var(--border)] bg-[var(--card)] md:sticky md:top-24 md:block md:h-[calc(100vh-6rem)]">
      <nav className="flex h-full flex-col p-4">
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto pr-1">
        <div className="rounded-md border border-[var(--border)] bg-[var(--background)] p-3">
          <div className="flex items-center gap-3">
            {user.avatar && !avatarError ? (
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[var(--border)]">
              <Image
                src={user.avatar}
                alt={displayName}
                width={36}
                height={36}
                  className="h-full w-full object-cover"
                  unoptimized
                  onError={() => setAvatarError(true)}
              />
              </div>
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand)] text-sm font-semibold uppercase text-white">
                {initials}
              </div>
            )}
            <div className="text-sm">
              <div className="font-medium text-[var(--foreground)]">{user.name ?? user.email}</div>
            </div>
          </div>
        </div>

        <NavSection title="Khám phá" items={primaryNav} pathname={pathname} />
        
        {/* Support Section - Highlighted */}
        {user && joyworkCompanyId && (
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Hỗ trợ</div>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => {
                    if (joyworkCompany) {
                      setSupportModalOpen(true);
                    } else {
                      // Show loading or error toast if company not loaded
                      // Modal will handle the case when company is not available
                      setSupportModalOpen(true);
                    }
                  }}
                  disabled={!joyworkCompany}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors",
                    "bg-[var(--brand)]/10 text-[var(--brand)] hover:bg-[var(--brand)]/20 font-semibold",
                    !joyworkCompany && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <LifeBuoy size={16} />
                  <span className="flex-1 font-medium">Hỗ trợ</span>
                </button>
              </li>
            </ul>
          </div>
        )}

        <NavSection title="Không gian của tôi" items={personalNav} pathname={pathname} />

        {companyItems.length > 0 ? (
          <div>
            <NavSection title="Công ty của tôi" items={visibleCompanyItems} pathname={pathname} truncateLabel />
            {hasMoreCompanyItems ? (
              <Link
                href="/companies"
                className="mt-1 inline-block px-2 text-xs font-medium text-[var(--brand)] hover:underline"
              >
                Xem thêm ({companyItems.length - MAX_COMPANY_NAV_ITEMS})
              </Link>
            ) : null}
          </div>
        ) : null}

        {adminNav.length > 0 ? <NavSection title="Hệ thống" items={adminNav} pathname={pathname} /> : null}
        </div>

        {/* Support Modal */}
        {joyworkCompanyId && joyworkCompany && (
          <CreateTicketModal
            open={supportModalOpen}
            onOpenChange={setSupportModalOpen}
            companyId={joyworkCompany.id}
            companyName={joyworkCompany.name}
            onCreated={(ticket) => {
              setSupportModalOpen(false);
              router.push(`/tickets/${ticket.id}`);
            }}
          />
        )}
        {joyworkCompanyId && !joyworkCompany && supportModalOpen && (
          <CreateTicketModal
            open={supportModalOpen}
            onOpenChange={setSupportModalOpen}
            companyId={joyworkCompanyId}
            companyName="JoyWork"
            onCreated={(ticket) => {
              setSupportModalOpen(false);
              router.push(`/tickets/${ticket.id}`);
            }}
          />
        )}
        <StaticPageLinks />
      </nav>
    </aside>
  );
}


