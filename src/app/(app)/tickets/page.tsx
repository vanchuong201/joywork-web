"use client";

export const dynamic = 'force-dynamic';

import { Suspense, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useAuthStore } from "@/store/useAuth";
import type { TicketListResponse, TicketStatus } from "@/types/ticket";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STATUS_LABEL: Record<TicketStatus, string> = {
  OPEN: "Đang chờ phản hồi",
  RESPONDED: "DN đã phản hồi",
  CLOSED: "Đã đóng",
};

const STATUS_VARIANT: Record<TicketStatus, string> = {
  OPEN: "bg-amber-100 text-amber-700",
  RESPONDED: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-gray-200 text-gray-700",
};

function TicketsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const companyId = searchParams.get("companyId") ?? "";
  const scope = (searchParams.get("scope") as "sent" | "received" | null) ?? "sent";
  const memberships = useAuthStore((s) => s.memberships);

  // Auto-select company if scope=received and user chỉ có 1 DN
  useEffect(() => {
    if (scope === "received" && !companyId && memberships.length === 1) {
      const next = new URLSearchParams(searchParams.toString());
      next.set("scope", "received");
      next.set("companyId", memberships[0]!.company.id);
      router.replace(`${pathname}?${next.toString()}`);
    }
  }, [scope, companyId, memberships, pathname, router, searchParams]);

  const { data, isLoading } = useQuery<TicketListResponse>({
    queryKey: ["tickets", { scope, companyId }],
    enabled: scope === "sent" || (scope === "received" && Boolean(companyId)),
    queryFn: async () => {
      const res = await api.get("/api/tickets", {
        params: scope === "received" ? (companyId ? { companyId } : undefined) : undefined,
      });
      return res.data.data as TicketListResponse;
    },
  });

  const handleCompanyChange = (value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (!value) next.delete("companyId");
    else next.set("companyId", value);
    router.replace(next.toString() ? `${pathname}?${next.toString()}` : pathname);
  };

  const handleScopeChange = (nextScope: "sent" | "received") => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("scope", nextScope);
    if (nextScope === "sent") {
      next.delete("companyId");
    }
    router.replace(`${pathname}?${next.toString()}`);
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Ticket hỗ trợ</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          {scope === "received"
            ? "Ticket ứng viên gửi tới doanh nghiệp mà bạn là thành viên."
            : "Những ticket bạn đã gửi tới các doanh nghiệp trên JoyWork."}
        </p>
      </header>

      <section className="flex flex-wrap items-center gap-3">
        <Tabs value={scope} onValueChange={(v) => handleScopeChange(v as "sent" | "received")}>
          <TabsList>
            <TabsTrigger value="sent">Đã gửi</TabsTrigger>
            <TabsTrigger value="received">Đã nhận</TabsTrigger>
          </TabsList>
        </Tabs>

        {memberships.length ? (
          <div className={`flex items-center gap-2 ${scope === "received" ? "" : "invisible"}`}>
            <label htmlFor="ticket-company-filter" className="text-sm text-[var(--muted-foreground)]">
              Doanh nghiệp:
            </label>
            <select
              id="ticket-company-filter"
              value={companyId}
              onChange={(e) => handleCompanyChange(e.target.value)}
              className="h-9 w-56 rounded-md border border-[var(--border)] bg-[var(--card)] px-3 text-sm"
            >
              <option value="">Chọn DN</option>
              {memberships.map((m) => (
                <option key={m.membershipId} value={m.company.id}>
                  {m.company.name} ({m.role})
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </section>

      {scope === "received" && memberships.length > 1 && !companyId ? (
        <div className="rounded-md border border-[var(--border)] bg-[var(--muted)]/40 p-3 text-sm text-[var(--muted-foreground)]">
          Vui lòng chọn doanh nghiệp để xem ticket đã nhận.
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Skeleton key={idx} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : data?.tickets?.length ? (
        <div className="space-y-3">
          {data.tickets.map((ticket) => (
            <Card key={ticket.id} className="border border-[var(--border)]">
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-semibold text-[var(--foreground)]">{ticket.title}</h3>
                    <Badge className={STATUS_VARIANT[ticket.status]}>{STATUS_LABEL[ticket.status]}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {data.scope === "company"
                      ? `Ứng viên: ${ticket.applicant.name ?? ticket.applicant.email}`
                      : `Doanh nghiệp: ${ticket.company.name}`}
                  </p>
                </div>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Cập nhật {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true, locale: vi })}
                </p>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm text-[var(--muted-foreground)] sm:flex-row sm:items-center sm:justify-between">
                <div className="line-clamp-2 text-left">
                  {ticket.lastMessage
                    ? ticket.lastMessage.content
                    : "Chưa có trao đổi thêm trong ticket này."}
                </div>
                <div className="flex items-center gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link
                      href={`/tickets/${ticket.id}${scope === "received" && companyId ? `?scope=received&companyId=${companyId}` : ""}`}
                    >
                      Xem hội thoại
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Chưa có ticket"
          subtitle={
            data?.scope === "company"
              ? "Ứng viên chưa gửi thắc mắc nào tới doanh nghiệp."
              : "Gửi ticket tới doanh nghiệp từ hover card để được hỗ trợ nhanh."
          }
        />
      )}
    </div>
  );
}

export default function TicketsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Skeleton key={idx} className="h-28 rounded-lg" />
          ))}
        </div>
      }
    >
      <TicketsPageContent />
    </Suspense>
  );
}

