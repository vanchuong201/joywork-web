"use client";

import {
  BriefcaseBusiness,
  Search,
  Building2,
  Inbox,
  Briefcase,
  Home,
  ChevronDown,
  LogOut,
  Settings,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuth";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import ChangePasswordDialog from "@/components/auth/ChangePasswordDialog";

const navIcons: Record<string, LucideIcon> = {
  "/": Home,
  "/jobs": Briefcase,
  "/companies": Building2,
  "/inbox": Inbox,
  "/system": Settings,
};

export default function Header() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const initialized = useAuthStore((s) => s.initialized);
  const loading = useAuthStore((s) => s.loading);
  const pathname = usePathname();
  const router = useRouter();
  const accountRef = useRef<HTMLDetailsElement>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const isReady = initialized && !loading;

  const navItems = useMemo(() => {
    const items = [
      { href: "/", label: "Feed" },
      { href: "/jobs", label: "Jobs" },
      { href: "/companies", label: "Companies" },
    ];

    if (user) {
      items.push({ href: "/inbox", label: "Inbox" });
      if (user.role === "ADMIN") {
        items.push({ href: "/system", label: "System" });
      }
    }

    return items;
  }, [user]);

  const handleLogout = async () => {
    if (accountRef.current) {
      accountRef.current.open = false;
    }
    await signOut();
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur supports-[backdrop-filter]:bg-[var(--card)]/60">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 text-[var(--foreground)]">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--brand)] text-white">
            <BriefcaseBusiness size={18} />
          </div>
          <span className="text-lg font-semibold">JoyWork</span>
        </Link>
        <nav className="ml-auto hidden items-center gap-2 md:flex">
          {isReady
            ? navItems.map((item) => {
                const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                const Icon = navIcons[item.href] ?? Home;
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
        <div className="ml-4 flex flex-1 items-center justify-end gap-3">
          <div className="relative w-full max-w-md">
            <input
              className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--input)] pl-9 pr-3 text-sm outline-none placeholder:text-[var(--muted-foreground)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              placeholder="Tìm kiếm công ty hoặc việc làm..."
            />
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" size={16} />
          </div>
          {!isReady ? (
            <Skeleton className="h-8 w-32" />
          ) : user ? (
            <details ref={accountRef} className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md px-2 py-1 text-sm text-[var(--foreground)] hover:bg-[var(--muted)]">
                <span className="font-medium leading-tight">{user.name ?? user.email}</span>
                <ChevronDown size={14} />
              </summary>
              <div className="absolute right-0 mt-2 w-48 rounded-md border border-[var(--border)] bg-[var(--card)] shadow-lg">
                <div className="flex flex-col py-2 text-sm">
                  <Link
                    href="/profile"
                    className="px-3 py-2 text-left text-[var(--foreground)] hover:bg-[var(--muted)]"
                    onClick={() => {
                      if (accountRef.current) accountRef.current.open = false;
                    }}
                  >
                    Hồ sơ của tôi
                  </Link>
                  <Link
                    href="/applications"
                    className="px-3 py-2 text-left text-[var(--foreground)] hover:bg-[var(--muted)]"
                    onClick={() => {
                      if (accountRef.current) accountRef.current.open = false;
                    }}
                  >
                    Ứng tuyển của tôi
                  </Link>
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
          ) : (
            <div className="flex items-center gap-2 text-sm">
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
          )}
        </div>
      </div>
      <ChangePasswordDialog open={showChangePassword} onClose={() => setShowChangePassword(false)} />
    </header>
  );
}


