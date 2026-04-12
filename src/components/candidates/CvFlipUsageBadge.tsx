"use client";

import type { CvFlipUsage } from "@/types/cv-flip";

type Props = {
  usage: CvFlipUsage | undefined;
};

export default function CvFlipUsageBadge({ usage }: Props) {
  if (!usage) return null;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-white p-3 text-xs text-[var(--muted-foreground)]">
      <p>
        Tổng lượt:{" "}
        <span className="font-semibold text-[var(--foreground)]">
          {usage.total.used}/{usage.total.limit}
        </span>{" "}
        (còn {usage.total.remaining})
      </p>
      <p className="mt-1">
        Qua yêu cầu:{" "}
        <span className="font-semibold text-[var(--foreground)]">
          {usage.request.used}/{usage.request.limit}
        </span>{" "}
        (còn {usage.request.remaining})
      </p>
    </div>
  );
}
