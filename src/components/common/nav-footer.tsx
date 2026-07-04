"use client";

import { LifeBuoy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuth";
import { useAuthPrompt } from "@/contexts/AuthPromptContext";
import CreateTicketModal from "@/components/tickets/CreateTicketModal";

export function StaticPageLinks() {
  return (
    <div className="text-xs text-[var(--muted-foreground)]">
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

/**
 * Support entry + static page links shared by the desktop LeftNav and the
 * mobile menu panel. Owns the JOYWORK company lookup and the ticket modal;
 * logged-out users get the auth prompt instead.
 */
export default function NavFooter({ className }: { className?: string }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { openPrompt } = useAuthPrompt();
  const [supportModalOpen, setSupportModalOpen] = useState(false);

  const joyworkCompanyId = process.env.NEXT_PUBLIC_JOYWORK_COMPANY_ID;

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

  const handleSupportClick = () => {
    if (!user) {
      openPrompt("Hỗ trợ");
      return;
    }
    setSupportModalOpen(true);
  };

  return (
    <div className={cn("space-y-3 border-t border-[var(--border)] pt-3", className)}>
      {joyworkCompanyId ? (
        <button
          type="button"
          onClick={handleSupportClick}
          disabled={Boolean(user) && !joyworkCompany}
          className={cn(
            "flex w-full items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-left transition-colors",
            "hover:border-[var(--brand)]/35 hover:bg-[var(--muted)]/50",
            user && !joyworkCompany && "cursor-not-allowed opacity-50"
          )}
        >
          <LifeBuoy size={18} className="mt-0.5 shrink-0 text-[var(--brand)]" aria-hidden />
          <span className="min-w-0">
            <span className="block text-sm font-medium text-[var(--foreground)]">Hỗ trợ</span>
            <span className="mt-0.5 block text-xs leading-snug text-[var(--muted-foreground)]">
              Mở ticket với đội JOYWORK khi bạn cần trợ giúp.
            </span>
          </span>
        </button>
      ) : null}
      <StaticPageLinks />

      {user && joyworkCompanyId && joyworkCompany && (
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
          companyName="JOYWORK"
          onCreated={(ticket) => {
            setSupportModalOpen(false);
            router.push(`/tickets/${ticket.id}`);
          }}
        />
      )}
    </div>
  );
}
