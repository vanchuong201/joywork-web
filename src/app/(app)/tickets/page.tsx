"use client";

export const dynamic = 'force-dynamic';

import { Suspense } from "react";
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
import type { TicketListResponse, TicketStatus } from "@/types/ticket";

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
  const { data, isLoading } = useQuery<TicketListResponse>({
    queryKey: ["tickets", { scope: "sent" }],
    queryFn: async () => {
      const res = await api.get("/api/tickets");
      return res.data.data as TicketListResponse;
    },
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Tin nhắn / Hỗ trợ</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Những tin nhắn bạn đã gửi tới các doanh nghiệp trên JoyWork.
        </p>
      </header>

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
                    Doanh nghiệp: {ticket.company.name}
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
                    : "Chưa có trao đổi thêm trong hội thoại này."}
                </div>
                <div className="flex items-center gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/tickets/${ticket.id}`}>
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
          title="Chưa có tin nhắn"
          subtitle="Liên hệ với doanh nghiệp để được hỗ trợ nhanh."
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

