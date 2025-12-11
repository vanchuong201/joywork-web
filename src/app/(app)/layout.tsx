"use client";

import Header from "@/components/common/Header";
import LeftNav from "@/components/common/LeftNav";
import RightRail from "@/components/common/RightRail";
import AuthPrompt from "@/components/auth/AuthPrompt";
import AuthBar from "@/components/auth/AuthBar";
import { useAuthStore } from "@/store/useAuth";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export const dynamic = "force-dynamic";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);
  const pathname = usePathname();

  // Chỉ hiển thị AuthBar và AuthPrompt khi đã initialized và chưa đăng nhập
  const showAuthUI = initialized && !user;

  // Ẩn RightRail ở trang chi tiết công ty và trang quản lý công ty.
  // Dùng state + effect để đảm bảo render lần đầu trên server và client giống nhau,
  // tránh hydration mismatch khi pathname khác giữa 2 phía.
  const [hideRightRail, setHideRightRail] = useState(false);

  useEffect(() => {
    if (!pathname) {
      setHideRightRail(false);
      return;
    }
    const shouldHide =
      pathname.startsWith("/companies/") && pathname !== "/companies/new" && pathname !== "/companies";
    setHideRightRail(shouldHide);
  }, [pathname]);

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/60">
        <Header />
      </div>
      <div className="mx-auto flex max-w-[1440px] gap-8 px-6 py-6 pb-24">
        <LeftNav />
        <main className="flex-1 min-w-0" suppressHydrationWarning>
          {children}
        </main>
        {!hideRightRail && <RightRail />}
      </div>
      {showAuthUI && (
        <>
          <AuthPrompt />
          <AuthBar />
        </>
      )}
    </div>
  );
}


