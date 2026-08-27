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

export default function CvFlipUsageBadge({ usage, className }: Props) {
  if (!usage) return null;

  const tone = getUsageTone(usage.total.used, usage.total.limit);

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex shrink-0 cursor-default items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
              toneStyles[tone],
              className,
            )}
          >
            <span>Tổng lượt</span>
            <span className={cn("font-semibold tabular-nums", toneValueStyles[tone])}>
              {usage.total.used}/{usage.total.limit}
            </span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end" className="text-xs">
          <p>
            <span className="font-medium">Tổng lượt:</span>{" "}
            {usage.total.used}/{usage.total.limit} (còn {usage.total.remaining})
          </p>
          <p>
            <span className="font-medium">Qua yêu cầu:</span>{" "}
            {usage.request.used}/{usage.request.limit} (còn {usage.request.remaining})
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
