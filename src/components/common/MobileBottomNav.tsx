"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { buildHeaderExploreNav, isNavItemActive } from "./navigation-config";
import { isAiChatEnabled } from "@/lib/is-ai-chat-enabled";
import { useChatStore } from "@/store/useChatStore";
import { cn } from "@/lib/utils";

const navItems = buildHeaderExploreNav(null);

export default function MobileBottomNav() {
  const pathname = usePathname();
  const aiChatEnabled = isAiChatEnabled();
  const chatOpen = useChatStore((s) => s.open);
  const toggleChat = useChatStore((s) => s.toggle);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--card)] md:hidden">
      <div className="flex h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isNavItemActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors",
                active
                  ? "text-[var(--brand)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span className={cn("font-medium", active && "font-semibold")}>{item.label}</span>
            </Link>
          );
        })}

        {aiChatEnabled && (
          <button
            type="button"
            onClick={toggleChat}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors",
              chatOpen
                ? "text-[var(--brand)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            )}
            aria-label={chatOpen ? "Thu nhỏ chat" : "Mở chat tìm việc"}
          >
            <MessageCircle size={22} strokeWidth={chatOpen ? 2.5 : 2} />
            <span className={cn("font-medium", chatOpen && "font-semibold")}>AI Chat</span>
          </button>
        )}
      </div>
    </nav>
  );
}
