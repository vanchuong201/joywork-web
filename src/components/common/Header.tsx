"use client";

import {
  Search,
  ChevronDown,
  LogOut,
  Lock,
  Menu,
  X,
  CircleUserRound,
} from "lucide-react";
import NotificationBell from "./NotificationBell";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuth";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import ChangePasswordDialog from "@/components/auth/ChangePasswordDialog";
import Image from "next/image";
import {
  accountDropdownItems,
  buildCompanyManageNav,
  buildHeaderExploreNav,
  isNavItemActive,
  mobilePersonalNav,
  type NavItem,
} from "./navigation-config";

export default function Header() {
  const user = useAuthStore((s) => s.user);
  const memberships = useAuthStore((s) => s.memberships);
  const signOut = useAuthStore((s) => s.signOut);
  const initialized = useAuthStore((s) => s.initialized);
  const loading = useAuthStore((s) => s.loading);
  const pathname = usePathname();
  const accountRef = useRef<HTMLDetailsElement>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuId = "mobile-navigation-menu";

  const isReady = initialized && !loading;

  const navItems = useMemo(() => buildHeaderExploreNav(user), [user]);
  const mobileCompanyItems = useMemo(() => buildCompanyManageNav(memberships), [memberships]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    if (accountRef.current) {
      accountRef.current.open = false;
    }
  }, [pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    if (accountRef.current) {
      accountRef.current.open = false;
    }
    await signOut();
    // signOut already redirects to home, no need for router.refresh()
  };

  const renderMobileMenuItems = (items: NavItem[]) =>
    items.map((item) => {
      const active = isNavItemActive(pathname, item);
      const Icon = item.icon;
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setIsMobileMenuOpen(false)}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
            active
              ? "bg-[var(--muted)] text-[var(--foreground)]"
              : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          )}
        >
          <Icon size={16} />
          <span>{item.label}</span>
        </Link>
      );
    });

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur supports-[backdrop-filter]:bg-[var(--card)]/60">
      <div className="relative mx-auto flex h-14 max-w-[1440px] items-center gap-3 px-4">
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border)] text-[var(--foreground)] md:hidden"
          aria-label={isMobileMenuOpen ? "Ẩn menu" : "Hiện menu"}
          aria-expanded={isMobileMenuOpen}
          aria-controls={mobileMenuId}
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
        >
          {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2 text-[var(--foreground)] md:static md:translate-x-0"
        >
          <div className="relative h-8 w-8 md:hidden">
            <Image
              src="/JW-320x320.png"
              alt="JoyWork Logo"
              fill
              sizes="32px"
              className="object-contain"
              priority
            />
          </div>
          <div className="relative hidden h-8 w-32 md:block">
            <Image
              src="/JW-mid.png"
              alt="JoyWork Logo"
              fill
              sizes="128px"
              className="object-contain"
              priority
            />
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:ml-2 md:flex">
          {isReady
            ? navItems.map((item) => {
                const active = isNavItemActive(pathname, item);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1 rounded-md px-2 py-1 text-sm transition-colors",
                      active
                        ? "bg-[var(--muted)] text-[var(--foreground)]"
                        : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    )}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                );
              })
            : Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-7 w-16" />)}
        </nav>
        <div className="ml-auto flex items-center justify-end gap-3">
          <div className="relative hidden w-full max-w-md md:block">
            <input
              className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--input)] pl-9 pr-3 text-sm outline-none placeholder:text-[var(--muted-foreground)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              placeholder="Tìm kiếm công ty hoặc việc làm..."
            />
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" size={16} />
          </div>
          {!isReady ? (
            <Skeleton className="h-9 w-9 rounded-md md:h-8 md:w-32" />
          ) : user ? (
            <>
              <NotificationBell />
              <details ref={accountRef} className="relative">
              <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-md text-sm text-[var(--foreground)] hover:bg-[var(--muted)] md:h-auto md:w-auto md:gap-2 md:px-2 md:py-1">
                <CircleUserRound size={18} className="md:hidden" />
                <span className="hidden font-medium leading-tight md:inline">{user.name ?? user.email}</span>
                <ChevronDown size={14} className="hidden md:inline" />
              </summary>
              <div className="absolute right-0 mt-2 w-56 rounded-md border border-[var(--border)] bg-[var(--card)] shadow-lg">
                <div className="flex flex-col py-2 text-sm">
                  {accountDropdownItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="px-3 py-2 text-left text-[var(--foreground)] hover:bg-[var(--muted)]"
                      onClick={() => {
                        if (accountRef.current) accountRef.current.open = false;
                      }}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      if (accountRef.current) accountRef.current.open = false;
                      setShowChangePassword(true);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-left text-[var(--foreground)] hover:bg-[var(--muted)]"
                  >
                    <Lock size={14} /> Đổi mật khẩu
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 text-left text-[var(--destructive)] hover:bg-[var(--muted)]"
                  >
                    <LogOut size={14} /> Đăng xuất
                  </button>
                </div>
              </div>
            </details>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] md:hidden"
                aria-label="Đăng nhập"
              >
                <CircleUserRound size={18} />
              </Link>
              <div className="hidden items-center gap-2 text-sm md:flex">
              <Link
                href="/login"
                className="rounded-md border border-[var(--brand)] px-3 py-1 text-[var(--brand)] hover:bg-[var(--brand)]/10"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-[var(--brand)] px-3 py-1 text-white hover:opacity-90"
              >
                Đăng ký
              </Link>
              </div>
            </>
          )}
        </div>
      </div>
      {isMobileMenuOpen && (
        <div id={mobileMenuId} className="border-t border-[var(--border)] px-4 py-2 md:hidden">
          <nav className="flex flex-col gap-4">
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Khám phá</div>
              <div className="space-y-1">
                {isReady
                  ? renderMobileMenuItems(navItems)
                  : Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
              </div>
            </div>

            {isReady && user && (
              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Không gian của tôi
                </div>
                <div className="space-y-1">{renderMobileMenuItems(mobilePersonalNav)}</div>
              </div>
            )}

            {isReady && user && mobileCompanyItems.length > 0 && (
              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Công ty của tôi
                </div>
                <div className="space-y-1">{renderMobileMenuItems(mobileCompanyItems)}</div>
              </div>
            )}
          </nav>
          {isReady && !user && (
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[var(--border)] pt-3">
              <Link
                href="/login"
                className="rounded-md border border-[var(--brand)] px-3 py-2 text-center text-sm font-medium text-[var(--brand)] hover:bg-[var(--brand)]/10"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-[var(--brand)] px-3 py-2 text-center text-sm font-medium text-white hover:opacity-90"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      )}
      <ChangePasswordDialog open={showChangePassword} onClose={() => setShowChangePassword(false)} />
    </header>
  );
}


