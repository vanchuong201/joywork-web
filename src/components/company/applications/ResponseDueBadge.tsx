"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const RESPONSE_DUE_TOOLTIP =
  "Nếu sau 8 ngày kể từ ngày ứng tuyển, Doanh Nghiệp không cập nhật trạng thái ứng tuyển, hệ thống sẽ tự động cập nhật trạng thái sang “Chưa phù hợp và sẽ lưu hồ sơ”.";

export default function ResponseDueBadge() {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex cursor-default items-center rounded-full bg-red-600 px-2 py-0.5 text-xs font-medium text-white">
            Đến hạn phản hồi
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-left text-xs leading-relaxed">{RESPONSE_DUE_TOOLTIP}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
