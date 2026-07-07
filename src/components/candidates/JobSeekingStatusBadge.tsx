"use client";

import { cn } from "@/lib/utils";
import {
  hasDeclaredJobSeekingStatus,
  resolveJobSeekingStatusConfig,
  type JobSeekingStatusValue,
} from "@/lib/job-seeking-status";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type JobSeekingStatusBadgeProps = {
  status: JobSeekingStatusValue;
  /** Trang dành cho nhà tuyển dụng: hiện cả trạng thái chưa khai báo */
  employerView?: boolean;
  size?: "sm" | "md";
  className?: string;
};

export default function JobSeekingStatusBadge({
  status,
  employerView = false,
  size = "md",
  className,
}: JobSeekingStatusBadgeProps) {
  const declared = hasDeclaredJobSeekingStatus(status);
  if (!declared && !employerView) {
    return null;
  }

  const config = resolveJobSeekingStatusConfig(status);
  const Icon = config.icon;
  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-[10px] gap-1"
      : "px-3 py-1 text-xs gap-1.5";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex cursor-default items-center rounded-full border font-semibold",
            sizeClasses,
            config.className,
            className
          )}
        >
          <Icon size={size === "sm" ? 11 : 13} className="shrink-0" />
          {size === "sm" ? config.shortLabel : config.label}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
        {config.employerHint}
      </TooltipContent>
    </Tooltip>
  );
}
