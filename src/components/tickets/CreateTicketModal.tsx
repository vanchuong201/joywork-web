"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { CompanyTicket } from "@/types/ticket";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  companyName: string;
  onCreated?: (ticket: CompanyTicket) => void;
};

export default function CreateTicketModal({ open, onOpenChange, companyId, companyName, onCreated }: Props) {
  const defaultTitle = useMemo(
    () => (companyName ? `Trao đổi với ${companyName}` : "Trao đổi với doanh nghiệp"),
    [companyName],
  );
  const [title, setTitle] = useState(defaultTitle);
  const [content, setContent] = useState("");

  useEffect(() => {
    setTitle(defaultTitle);
  }, [defaultTitle]);

  useEffect(() => {
    if (open) {
      setTitle(defaultTitle);
      setContent("");
    }
  }, [open, defaultTitle]);

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
      toast.success("Đã gửi ticket tới doanh nghiệp");
      setContent("");
      onOpenChange(false);
      onCreated?.(ticket);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message ?? "Không thể gửi ticket, vui lòng thử lại";
      toast.error(message);
    },
  });

  const canSubmit = title.trim().length >= 10 && content.trim().length >= 20 && !mutation.isPending;

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !mutation.isPending && onOpenChange(next)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl focus:outline-none">
          <div className="flex items-start justify-between gap-4">
            <Dialog.Title className="text-lg font-semibold text-[var(--foreground)]">
              Gửi ticket tới {companyName}
            </Dialog.Title>
            <Dialog.Close
              className="rounded-full p-1 text-[var(--muted-foreground)] transition hover:bg-[var(--muted)]"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <Dialog.Description className="mt-2 text-sm text-[var(--muted-foreground)]">
            Hãy mô tả ngắn gọn yêu cầu hoặc câu hỏi của bạn. Doanh nghiệp sẽ nhận thông báo qua email và phản hồi ngay khi có thể.
          </Dialog.Description>

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
              />
              <p className="text-xs text-[var(--muted-foreground)]">{content.trim().length}/4000 ký tự</p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="outline" disabled={mutation.isPending}>
                Huỷ
              </Button>
            </Dialog.Close>
            <Button onClick={() => mutation.mutate()} disabled={!canSubmit}>
              {mutation.isPending ? "Đang gửi..." : "Gửi ticket"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

