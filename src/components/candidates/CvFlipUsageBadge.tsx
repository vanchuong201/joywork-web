"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { CvFlipUsage } from "@/types/cv-flip";

type Props = {
  usage: CvFlipUsage | undefined;
  className?: string;
};

type UsageTone = "green" | "orange" | "red";

function getUsageTone(used: number, limit: number): UsageTone {
  if (limit <= 0) return "red";
  const ratio = used / limit;
  if (ratio >= 0.9) return "red";
  if (ratio >= 0.7) return "orange";
  return "green";
}

const toneStyles: Record<UsageTone, string> = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  orange: "border-amber-200 bg-amber-50 text-amber-800",
  red: "border-red-200 bg-red-50 text-red-700",
};

const toneValueStyles: Record<UsageTone, string> = {
  green: "text-emerald-900",
  orange: "text-amber-950",
  red: "text-red-900",
};

function formatExpiresOn(expiresOn: string | undefined): string | null {
  if (!expiresOn) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(expiresOn);
  if (!match) return null;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export default function CvFlipUsageBadge({ usage, className }: Props) {
  if (!usage) return null;

  const remaining = usage.total.remaining;
  const tone = getUsageTone(usage.total.used, usage.total.limit);
  const expiresLabel = formatExpiresOn(usage.expiresOn);

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex max-w-full shrink-0 cursor-default items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
              toneStyles[tone],
              className,
            )}
          >
            <span>Số lượt mở CV còn lại</span>
            <span className={cn("font-semibold tabular-nums", toneValueStyles[tone])}>{remaining}</span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end" className="max-w-xs text-xs">
          {expiresLabel ? (
            <p>Số lượt này sẽ hết hạn vào ngày {expiresLabel}.</p>
          ) : (
            <p>Số lượt này sẽ hết hạn vào cuối chu kỳ hiện tại.</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
