"use client";

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
  RESPONDED: "Đã phản hồi",
  CLOSED: "Đã đóng",
};

const STATUS_VARIANT: Record<TicketStatus, string> = {
  OPEN: "bg-amber-100 text-amber-700",
  RESPONDED: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-gray-200 text-gray-700",
};

type Props = {
  companyId: string;
};

export default function CompanyTicketsList({ companyId }: Props) {
  const { data, isLoading } = useQuery<TicketListResponse>({
    queryKey: ["company-tickets", companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      const res = await api.get("/api/tickets", {
        params: { companyId },
      });
      return res.data.data as TicketListResponse;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <Skeleton key={idx} className="h-28 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!data?.tickets?.length) {
    return (
      <EmptyState
        title="Chưa có ticket nào"
        subtitle="Ứng viên chưa gửi thắc mắc nào tới doanh nghiệp của bạn."
      />
    );
  }

  return (
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
                Ứng viên: {ticket.applicant.name ?? ticket.applicant.email}
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
                <Link href={`/tickets/${ticket.id}?companyId=${companyId}`}>
                  Xem hội thoại
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

