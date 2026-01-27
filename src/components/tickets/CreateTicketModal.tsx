"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X, AlertTriangle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import type { CompanyTicket, TicketListResponse, TicketStatus } from "@/types/ticket";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  companyName: string;
  onCreated?: (ticket: CompanyTicket) => void;
};

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

const MAX_OPEN_TICKETS_PER_COMPANY = 5;

export default function CreateTicketModal({ open, onOpenChange, companyId, companyName, onCreated }: Props) {
  const router = useRouter();
  const defaultTitle = useMemo(
    () => (companyName ? `Trao đổi với ${companyName}` : "Trao đổi với doanh nghiệp"),
    [companyName],
  );
  const [title, setTitle] = useState(defaultTitle);
  const [content, setContent] = useState("");

  // Fetch existing open tickets with this company
  const { data: existingTicketsData, refetch: refetchTickets, isLoading: isLoadingTickets } = useQuery<TicketListResponse>({
    queryKey: ["tickets", { companyId }],
    queryFn: async () => {
      const res = await api.get("/api/tickets", {
        params: { companyId },
      });
      return res.data.data as TicketListResponse;
    },
    enabled: open && !!companyId,
    staleTime: 0, // Always fetch fresh data when modal opens
  });

  const openTickets = existingTicketsData?.tickets?.filter(
    (t) => t.status === "OPEN" || t.status === "RESPONDED"
  ) || [];
  const hasReachedLimit = openTickets.length >= MAX_OPEN_TICKETS_PER_COMPANY;
  
  // Also show warning if mutation failed with limit error
  const [showLimitWarning, setShowLimitWarning] = useState(false);

  useEffect(() => {
    setTitle(defaultTitle);
  }, [defaultTitle]);

  useEffect(() => {
    if (open) {
      setTitle(defaultTitle);
      setContent("");
      setShowLimitWarning(false);
      // Refetch tickets when modal opens to get latest count
      refetchTickets();
    }
  }, [open, defaultTitle, refetchTickets]);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/api/tickets", {
        companyId,
        title: title.trim(),
        content: content.trim(),
      });
      return res.data.data.ticket as CompanyTicket;
    },
    onSuccess: (ticket) => {
      toast.success("Đã gửi tin nhắn tới doanh nghiệp");
      setContent("");
      onOpenChange(false);
      refetchTickets();
      onCreated?.(ticket);
    },
    onError: (error: any) => {
      const errorCode = error?.response?.data?.error?.code;
      const message = error?.response?.data?.error?.message ?? "Không thể gửi tin nhắn, vui lòng thử lại";
      toast.error(message);
      // Refetch tickets in case limit was reached to show the list
      if (errorCode === "TICKET_LIMIT_PER_COMPANY") {
        setShowLimitWarning(true);
        refetchTickets();
      }
    },
  });

  const closeTicketMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      await api.patch(`/api/tickets/${ticketId}/status`, { status: "CLOSED" });
    },
    onSuccess: () => {
      toast.success("Đã đóng hội thoại");
      refetchTickets();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message ?? "Không thể đóng hội thoại";
      toast.error(message);
    },
  });

  const handleContinueConversation = (ticketId: string) => {
    onOpenChange(false);
    router.push(`/tickets/${ticketId}`);
  };

  const canSubmit = title.trim().length >= 10 && content.trim().length >= 20 && !mutation.isPending;

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !mutation.isPending && onOpenChange(next)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl focus:outline-none">
          <div className="flex items-start justify-between gap-4">
            <Dialog.Title className="text-lg font-semibold text-[var(--foreground)]">
              Gửi tin nhắn tới {companyName}
            </Dialog.Title>
            <Dialog.Close
              className="rounded-full p-1 text-[var(--muted-foreground)] transition hover:bg-[var(--muted)]"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <Dialog.Description className="mt-2 text-sm text-[var(--muted-foreground)]">
            Hãy mô tả ngắn gọn yêu cầu hoặc câu hỏi của bạn. Doanh nghiệp sẽ nhận thông báo và phản hồi ngay khi có thể.
          </Dialog.Description>

          {(hasReachedLimit || showLimitWarning) && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium text-amber-900">
                    Bạn đang có {openTickets.length} cuộc hội thoại đang mở với {companyName}
                  </p>
                  <p className="text-xs text-amber-700">
                    Để tạo ticket mới, vui lòng đóng một trong các cuộc hội thoại hiện có hoặc gửi tin nhắn vào cuộc hội thoại đã có.
                  </p>
                </div>
              </div>

              <div className="mt-4">
                {isLoadingTickets ? (
                  <div className="text-center text-sm text-[var(--muted-foreground)] py-4">
                    Đang tải danh sách hội thoại...
                  </div>
                ) : openTickets.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {openTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="rounded-lg border border-amber-200 bg-white p-3 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-semibold text-[var(--foreground)] truncate">
                                {ticket.title}
                              </h4>
                              <Badge className={STATUS_VARIANT[ticket.status]}>{STATUS_LABEL[ticket.status]}</Badge>
                            </div>
                            {ticket.lastMessage && (
                              <p className="text-xs text-[var(--muted-foreground)] line-clamp-2">
                                {ticket.lastMessage.content}
                              </p>
                            )}
                            <p className="text-xs text-[var(--muted-foreground)] mt-1">
                              Cập nhật {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true, locale: vi })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-amber-100">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={() => closeTicketMutation.mutate(ticket.id)}
                            disabled={closeTicketMutation.isPending}
                          >
                            {closeTicketMutation.isPending ? "Đang xử lý..." : "Đóng"}
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={() => handleContinueConversation(ticket.id)}
                            disabled={closeTicketMutation.isPending}
                          >
                            Tiếp tục cuộc hội thoại này
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-sm text-[var(--muted-foreground)] py-4">
                    Không tìm thấy hội thoại đang mở
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground)]" htmlFor="ticket-title">
                Tiêu đề
              </label>
              <Input
                id="ticket-title"
                value={title}
                maxLength={120}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Quan tâm tới vị trí Product Designer"
                disabled={hasReachedLimit}
              />
              <p className="text-xs text-[var(--muted-foreground)]">{title.trim().length}/120 ký tự</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground)]" htmlFor="ticket-content">
                Nội dung
              </label>
              <Textarea
                id="ticket-content"
                rows={6}
                value={content}
                maxLength={4000}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Chia sẻ câu hỏi hoặc yêu cầu của bạn..."
                disabled={hasReachedLimit}
              />
              <p className="text-xs text-[var(--muted-foreground)]">{content.trim().length}/4000 ký tự</p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="outline" disabled={mutation.isPending || closeTicketMutation.isPending}>
                Huỷ
              </Button>
            </Dialog.Close>
            <Button
              onClick={() => mutation.mutate()}
              disabled={!canSubmit || hasReachedLimit || closeTicketMutation.isPending}
            >
              {mutation.isPending ? "Đang gửi..." : "Gửi tin nhắn"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

