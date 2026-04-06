"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Sparkles, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type LatestRequest = {
  id: string;
  status: string;
  message: string | null;
  reason: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

type TalentPoolJoinDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  latestRequest: LatestRequest | null;
};

export default function TalentPoolStatus({ open, onOpenChange, latestRequest }: TalentPoolJoinDialogProps) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");

  const requestMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/api/talent-pool/requests", { message: message.trim() || undefined });
      return res.data;
    },
    onSuccess: () => {
      setMessage("");
      onOpenChange(false);
      toast.success("Nộp yêu cầu tham gia Talent Pool thành công. JOYWORK đã ghi nhận và sẽ cập nhật trạng thái qua thông báo trên hệ thống và email.");
      queryClient.invalidateQueries({ queryKey: ["talent-pool-me"] });
    },
  });

  const isRejected = latestRequest?.status === "REJECTED";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Gửi yêu cầu tham gia Talent Pool
          </DialogTitle>
          <DialogDescription>
            Viết vài dòng giới thiệu để JOYWORK đánh giá hồ sơ phù hợp với Talent Pool. Kết quả duyệt sẽ được thông báo qua email của bạn.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isRejected && latestRequest?.reason ? (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Lần trước bạn chưa được duyệt</p>
                <p className="mt-1">Lý do: {latestRequest.reason}</p>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Giới thiệu ngắn về bản thân</p>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ví dụ: Kinh nghiệm nổi bật, thành tựu, định hướng nghề nghiệp..."
              maxLength={2000}
              rows={4}
            />
            <p className="text-xs text-slate-500">{message.length}/2000</p>
          </div>

          {requestMutation.isError ? (
            <p className="text-sm text-rose-600">
              {(requestMutation.error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? "Có lỗi xảy ra"}
            </p>
          ) : null}

          <div className="flex justify-end">
            <Button onClick={() => requestMutation.mutate()} disabled={requestMutation.isPending} className="gap-2">
              <Sparkles className="h-4 w-4" />
              {requestMutation.isPending ? "Đang gửi..." : "Gửi yêu cầu"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
