"use client";

import Link from "next/link";
import { CheckCircle2, Star } from "lucide-react";

import type { CandidateCvSummary } from "@/types/candidate-cv";

export type ApplyCvOption = {
  cv: CandidateCvSummary;
  hasOpenApplication: boolean;
};

export function isApplyCvSelectable(option: ApplyCvOption): boolean {
  return option.cv.readiness?.isReady === true && !option.hasOpenApplication;
}

type ApplyCvPickerProps = {
  options: ApplyCvOption[];
  selectedCvId: string | null;
  onSelect: (cvId: string) => void;
  disabled?: boolean;
};

export default function ApplyCvPicker({ options, selectedCvId, onSelect, disabled }: ApplyCvPickerProps) {
  return (
    <div className="space-y-2" role="radiogroup" aria-label="Chọn CV ứng tuyển">
      {options.map((option) => {
        const { cv, hasOpenApplication } = option;
        const selectable = isApplyCvSelectable(option);
        const selected = selectedCvId === cv.id;
        const missingSections = cv.readiness?.missingSections ?? [];

        return (
          <div
            key={cv.id}
            role="radio"
            aria-checked={selected}
            aria-disabled={!selectable || disabled}
            tabIndex={selectable && !disabled ? 0 : -1}
            onClick={() => {
              if (selectable && !disabled) onSelect(cv.id);
            }}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && selectable && !disabled) {
                e.preventDefault();
                onSelect(cv.id);
              }
            }}
            className={`flex items-start gap-3 rounded-lg border p-3 text-sm transition-colors ${
              selected
                ? "border-[var(--brand)] bg-[var(--brand-light)]"
                : "border-[var(--border)] bg-[var(--card)]"
            } ${selectable && !disabled ? "cursor-pointer hover:border-[var(--brand)]" : "cursor-not-allowed opacity-70"}`}
          >
            <span
              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                selected ? "border-[var(--brand)]" : "border-[var(--border)]"
              }`}
            >
              {selected ? <span className="h-2 w-2 rounded-full bg-[var(--brand)]" /> : null}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate font-medium text-[var(--foreground)]">{cv.name}</span>
                {cv.isDefault ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--muted)] px-2 py-0.5 text-xs text-[var(--muted-foreground)]">
                    <Star className="h-3 w-3" />
                    Mặc định
                  </span>
                ) : null}
              </div>
              {cv.title ? <p className="truncate text-xs text-[var(--muted-foreground)]">{cv.title}</p> : null}
              {hasOpenApplication ? (
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">Đang có đơn mở với CV này</p>
              ) : missingSections.length > 0 ? (
                <p className="mt-1 text-xs text-amber-700">
                  Thiếu: {missingSections.join(", ")} ·{" "}
                  <Link
                    href={`/account/profile/cv/${cv.id}`}
                    className="font-medium underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Sửa CV
                  </Link>
                </p>
              ) : (
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" />
                  Sẵn sàng ứng tuyển
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
