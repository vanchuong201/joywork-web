"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuth";

/**
 * User info card (logged in) or login-prompt card (logged out) shared by the
 * desktop LeftNav and the mobile menu panel.
 */
export default function NavUserCard({ onNavigate }: { onNavigate?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const [avatarError, setAvatarError] = useState(false);

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

  if (!user) {
    return (
      <div className="rounded-md border border-dashed border-[var(--border)] bg-[var(--background)] p-3 text-sm text-[var(--muted-foreground)]">
        <p className="font-medium text-[var(--foreground)]">Đăng nhập để cá nhân hóa trải nghiệm</p>
        <p className="mt-1 text-xs">
          Theo dõi công ty, lưu việc làm và nhận thông báo ứng tuyển nhanh chóng.
        </p>
        <div className="mt-3 flex flex-col gap-2 text-sm">
          <Link
            href="/login"
            onClick={onNavigate}
            className="w-full rounded-md border border-[var(--brand)] px-3 py-1 text-center text-[var(--brand)] hover:bg-[var(--brand)]/10"
          >
            Đăng nhập
          </Link>
          <Link
            href="/register"
            onClick={onNavigate}
            className="w-full rounded-md bg-[var(--brand)] px-3 py-1 text-center text-white hover:opacity-90"
          >
            Đăng ký
          </Link>
        </div>
      </div>
    );
  }

  return (
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
  );
}
