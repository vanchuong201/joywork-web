"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Sparkles, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

type MyStatus = {
  member: { id: string; status: string; source: string; reason: string | null; createdAt: string } | null;
  latestRequest: { id: string; status: string; message: string | null; reason: string | null; createdAt: string; reviewedAt: string | null } | null;
};

export default function TalentPoolStatus() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");

  const { data, isLoading } = useQuery<MyStatus>({
    queryKey: ["talent-pool-me"],
    queryFn: async () => {
      const res = await api.get("/api/talent-pool/me");
      return res.data.data;
    },
  });

  const requestMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/api/talent-pool/requests", { message: message.trim() || undefined });
      return res.data;
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["talent-pool-me"] });
    },
  });

  if (isLoading) {
    return <div className="py-4 text-sm text-slate-500">Đang tải...</div>;
  }

  const member = data?.member;
  const req = data?.latestRequest;
  const isApprovedRequest = req?.status === "APPROVED";
  const isActive = member?.status === "ACTIVE" || isApprovedRequest;
  const hasPendingRequest = req?.status === "PENDING";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-amber-500" />
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Trạng thái Talent Pool</h3>
      </div>

      {isActive && (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
          <div>
            <p className="font-medium text-emerald-800 dark:text-emerald-300">Bạn là thành viên Talent Pool</p>
            <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">
              Hồ sơ của bạn nằm trong danh sách ứng viên tài năng được JoyWork tuyển chọn.
            </p>
          </div>
        </div>
      )}

      {member?.status === "REMOVED" && (
        <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <AlertCircle className="mt-0.5 h-5 w-5 text-slate-500" />
          <div>
            <p className="font-medium text-slate-700 dark:text-slate-300">Bạn đã bị gỡ khỏi Talent Pool</p>
            {member.reason && <p className="mt-1 text-sm text-slate-500">Lý do: {member.reason}</p>}
            <p className="mt-1 text-sm text-slate-500">Bạn có thể gửi yêu cầu tham gia lại.</p>
          </div>
        </div>
      )}

      {hasPendingRequest && !isActive && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          <Clock className="mt-0.5 h-5 w-5 text-amber-600" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-300">Yêu cầu đang chờ duyệt</p>
            <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
              Đội ngũ JoyWork sẽ xem xét yêu cầu của bạn trong thời gian sớm nhất.
            </p>
          </div>
        </div>
      )}

      {req?.status === "REJECTED" && !isActive && !hasPendingRequest && (
        <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-800 dark:bg-rose-950/30">
          <XCircle className="mt-0.5 h-5 w-5 text-rose-600" />
          <div>
            <p className="font-medium text-rose-800 dark:text-rose-300">Yêu cầu gần nhất bị từ chối</p>
            {req.reason && <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">Lý do: {req.reason}</p>}
            <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">Bạn có thể cập nhật hồ sơ và gửi lại.</p>
          </div>
        </div>
      )}

      {!isActive && !hasPendingRequest && (
        <div className="mt-4 space-y-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Giới thiệu ngắn về bản thân (không bắt buộc)..."
            maxLength={2000}
            rows={3}
            className="w-full rounded-lg border border-slate-200 p-3 text-sm placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300 dark:border-slate-700 dark:bg-slate-800"
          />
          <Button
            onClick={() => requestMutation.mutate()}
            disabled={requestMutation.isPending}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {requestMutation.isPending ? "Đang gửi..." : "Xin tham gia Talent Pool"}
          </Button>
          {requestMutation.isError && (
            <p className="text-sm text-rose-600">
              {(requestMutation.error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? "Có lỗi xảy ra"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
