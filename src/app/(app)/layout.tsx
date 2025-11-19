"use client";

import Header from "@/components/common/Header";
import LeftNav from "@/components/common/LeftNav";
import RightRail from "@/components/common/RightRail";
import AuthPrompt from "@/components/auth/AuthPrompt";
import AuthBar from "@/components/auth/AuthBar";
import { useAuthStore } from "@/store/useAuth";

export const dynamic = 'force-dynamic';

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);

  // Chỉ hiển thị AuthBar và AuthPrompt khi đã initialized và chưa đăng nhập
  const showAuthUI = initialized && !user;

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/60">
        <Header />
      </div>
      <div className="mx-auto flex max-w-[1440px] gap-8 px-6 py-6 pb-24">
        <LeftNav />
        <main className="flex-1">{children}</main>
        <RightRail />
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


