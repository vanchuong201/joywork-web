"use client";

import { Lock, Sparkles } from "lucide-react";

export default function TalentPoolLocked({ reason }: { reason?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-950/30">
        <Lock className="h-10 w-10 text-amber-600 dark:text-amber-400" />
      </div>

      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-amber-500" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Talent Pool — Tính năng Premium
        </h2>
      </div>

      <p className="mx-auto mb-6 max-w-md text-sm text-slate-500 dark:text-slate-400">
        Talent Pool là danh sách ứng viên tài năng được JoyWork tuyển chọn. Tính năng này chỉ dành cho doanh nghiệp đã đăng ký gói Premium.
      </p>

      {reason === "NO_ELIGIBLE_COMPANY" && (
        <p className="text-sm text-slate-500">
          Bạn cần là Owner hoặc Admin của một doanh nghiệp để truy cập.
        </p>
      )}

      {reason === "NO_PREMIUM_ACCESS" && (
        <p className="text-sm text-slate-500">
          Doanh nghiệp của bạn chưa kích hoạt gói Premium. Vui lòng liên hệ JoyWork để biết thêm.
        </p>
      )}

      <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50/50 px-6 py-4 dark:border-amber-900/40 dark:bg-amber-950/20">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
          Liên hệ: <a href="mailto:support@joywork.vn" className="underline">support@joywork.vn</a>
        </p>
      </div>
    </div>
  );
}
