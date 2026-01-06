"use client";

export const dynamic = 'force-dynamic';

import { Suspense, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import type { TicketMessagesResponse, TicketStatus } from "@/types/ticket";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/useAuth";
import Link from "next/link";

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

function TicketThreadContent() {
  const params = useParams();
  const ticketId = Array.isArray(params?.ticketId) ? params.ticketId[0] : (params?.ticketId as string | undefined);
  const sp = useSearchParams();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [message, setMessage] = useState("");

  const query = useQuery<TicketMessagesResponse>({
    queryKey: ["ticket-messages", ticketId],
    enabled: Boolean(ticketId),
    queryFn: async () => {
      const res = await api.get(`/api/tickets/${ticketId}/messages`, { params: { limit: 100 } });
      return res.data.data as TicketMessagesResponse;
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/api/tickets/${ticketId}/messages`, { content: message.trim() });
    },
    onSuccess: () => {
      setMessage("");
      toast.success("Đã gửi tin nhắn");
      query.refetch();
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.error?.message ?? "Không thể gửi tin nhắn";
      toast.error(msg);
    },
  });

  const closeMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/api/tickets/${ticketId}/status`, { status: "CLOSED" });
    },
    onSuccess: () => {
      toast.success("Đã kết thúc hội thoại");
      query.refetch();
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.error?.message ?? "Không thể cập nhật hội thoại";
      toast.error(msg);
    },
  });

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (!query.data || !ticketId) {
    return <EmptyState title="Không tìm thấy hội thoại" subtitle="Hội thoại đã bị xoá hoặc bạn không có quyền truy cập." />;
  }

  const { ticket, messages } = query.data;
  const fromCompanyManage = Boolean(sp.get("companyId"));
  const backHref = fromCompanyManage
    ? `/companies/${ticket.company.slug}/manage?tab=tickets`
    : "/tickets";
  const canSend = message.trim().length > 0 && !sendMutation.isPending && ticket.status !== "CLOSED";

  return (
    <div className="space-y-4">
      <div>
        <Button asChild variant="outline" size="sm">
          <Link href={backHref}>← Quay lại danh sách</Link>
        </Button>
      </div>
      <header className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-[var(--foreground)]">{ticket.title}</h1>
              <Badge className={STATUS_VARIANT[ticket.status]}>{STATUS_LABEL[ticket.status]}</Badge>
            </div>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Doanh nghiệp: <span className="font-medium text-[var(--foreground)]">{ticket.company.name}</span>
            </p>
          </div>
          {ticket.status !== "CLOSED" ? (
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:bg-red-50"
              onClick={() => closeMutation.mutate()}
              disabled={closeMutation.isPending}
            >
              {closeMutation.isPending ? "Đang xử lý..." : "Kết thúc hội thoại"}
            </Button>
          ) : null}
        </div>
      </header>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="flex flex-col gap-3">
          {messages.length ? (
            messages.map((msg) => {
              const isMine = msg.senderId === currentUserId;
              return (
                <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-6 ${
                      isMine
                        ? "bg-[var(--brand)] text-white"
                        : "bg-[var(--muted)] text-[var(--foreground)]"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className="mt-1 text-xs opacity-80">
                      {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: vi })}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-sm text-[var(--muted-foreground)]">Chưa có tin nhắn nào.</p>
          )}
        </div>
      </section>

      {ticket.status === "CLOSED" ? (
        <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--muted)]/40 p-4 text-sm text-[var(--muted-foreground)]">
          Hội thoại đã kết thúc, bạn không thể tiếp tục gửi tin nhắn.
        </div>
      ) : (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-3">
          <Textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Nhập tin nhắn của bạn..."
            maxLength={4000}
          />
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <span>{message.length}/4000 ký tự</span>
            <Button onClick={() => sendMutation.mutate()} disabled={!canSend} size="sm">
              {sendMutation.isPending ? "Đang gửi..." : "Gửi tin nhắn"}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

export default function TicketThreadPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      }
    >
      <TicketThreadContent />
    </Suspense>
  );
}

