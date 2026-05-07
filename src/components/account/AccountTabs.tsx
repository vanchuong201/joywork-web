"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { User, FileText, Shield, ChevronRight } from "lucide-react";

type TabId = "account" | "profile" | "security";

interface Tab {
  id: TabId;
  label: string;
  shortLabel: string;
  icon: typeof User;
}

const tabs: Tab[] = [
  { id: "account", label: "Quản lý tài khoản", shortLabel: "Tài khoản", icon: User },
  { id: "profile", label: "CV của tôi", shortLabel: "CV của tôi", icon: FileText },
  { id: "security", label: "Bảo mật", shortLabel: "Bảo mật", icon: Shield },
];

interface AccountTabsProps {
  activeTab: TabId;
}

export default function AccountTabs({ activeTab }: AccountTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);

  const handleTabChange = (tabId: TabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabId);
    router.push(`/account?${params.toString()}`);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const updateHint = () => {
      const hasOverflow = el.scrollWidth > el.clientWidth + 1;
      const nearEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
      setShowScrollHint(hasOverflow && !nearEnd);
    };

    updateHint();
    el.addEventListener("scroll", updateHint, { passive: true });
    window.addEventListener("resize", updateHint);

    return () => {
      el.removeEventListener("scroll", updateHint);
      window.removeEventListener("resize", updateHint);
    };
  }, []);

  return (
    <div className="w-full shrink-0 md:w-64">
      <div className="relative md:sticky md:top-24">
        <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-1 md:block md:space-y-1 md:overflow-visible md:pb-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "inline-flex min-w-max items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors md:flex md:w-full md:gap-3 md:px-4 md:py-3",
                isActive
                  ? "border-[var(--brand)]/25 bg-[var(--brand)]/10 text-[var(--brand)]"
                  : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              )}
            >
              <Icon size={18} />
              <span className="whitespace-nowrap md:hidden">{tab.shortLabel}</span>
              <span className="hidden whitespace-nowrap md:inline">{tab.label}</span>
            </button>
          );
        })}
        </div>

        {showScrollHint && (
          <>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[var(--background)] to-transparent md:hidden" />
            <div className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 rounded-full border border-[var(--border)] bg-[var(--card)] p-0.5 text-[var(--muted-foreground)] shadow-sm md:hidden">
              <ChevronRight className="h-3 w-3" />
            </div>
          </>
        )}

        {/* <p className="px-1 pt-1 text-[11px] text-[var(--muted-foreground)] md:hidden">
          Vuốt ngang để xem thêm mục
        </p> */}
      </div>
    </div>
  );
}

