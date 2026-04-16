"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { CvFlipUsage } from "@/types/cv-flip";

type Props = {
  usage: CvFlipUsage | undefined;
};

export default function CvFlipUsageBadge({ usage }: Props) {
  if (!usage) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-default text-xs text-[var(--muted-foreground)]">
            Tổng lượt:{" "}
            <span className="font-semibold text-[var(--foreground)]">
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
