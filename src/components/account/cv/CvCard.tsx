"use client";

import Link from "next/link";
import { AlertTriangle, Copy, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CvExportButton from "@/components/cv/CvExportButton";
import type { CandidateCvSummary } from "@/types/candidate-cv";

type CvCardProps = {
  cv: CandidateCvSummary;
  isOnlyCv: boolean;
  isLimitReached: boolean;
  isBusy: boolean;
  onDuplicate: (cv: CandidateCvSummary) => void;
  onDelete: (cv: CandidateCvSummary) => void;
};

const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
});

export default function CvCard({ cv, isOnlyCv, isLimitReached, isBusy, onDuplicate, onDelete }: CvCardProps) {
  const deleteBlockedReason = cv.isDefault
    ? "Không thể xóa CV mặc định. Hãy chọn CV mặc định khác trước."
    : isOnlyCv
      ? "Bạn cần giữ lại ít nhất 1 CV."
      : null;
  const duplicateBlockedReason = isLimitReached ? "Bạn đã đạt giới hạn 5 CV. Xóa bớt CV để tạo mới." : null;
  const missingSections = cv.readiness?.missingSections ?? [];

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-white p-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/account/profile/cv/${encodeURIComponent(cv.id)}`}
            className="truncate text-base font-semibold hover:underline"
          >
            {cv.name}
          </Link>
          {cv.isDefault ? (
            <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">Mặc định</Badge>
          ) : null}
        </div>
        {cv.title ? <p className="text-sm text-[var(--foreground)]">{cv.title}</p> : null}
        <p className="text-xs text-[var(--muted-foreground)]">
          Cập nhật lúc {dateTimeFormatter.format(new Date(cv.updatedAt))}
        </p>
        {missingSections.length > 0 ? (
          <p className="flex items-start gap-1.5 pt-1 text-xs text-amber-700">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            CV chưa hoàn thiện {missingSections.length} mục cơ bản ({missingSections.join(", ")}) – không thể ứng
            tuyển
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2 sm:justify-end">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/account/profile/cv/${encodeURIComponent(cv.id)}`}>
            <Pencil className="mr-1.5 h-4 w-4" />
            Sửa
          </Link>
        </Button>
        <span title={duplicateBlockedReason ?? undefined}>
          <Button
            variant="outline"
            size="sm"
            disabled={isBusy || Boolean(duplicateBlockedReason)}
            onClick={() => onDuplicate(cv)}
          >
            <Copy className="mr-1.5 h-4 w-4" />
            Nhân bản
          </Button>
        </span>
        <CvExportButton mode="own" cvId={cv.id} size="sm" label="Tải về" />
        <span title={deleteBlockedReason ?? undefined}>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700"
            disabled={isBusy || Boolean(deleteBlockedReason)}
            onClick={() => onDelete(cv)}
          >
            <Trash2 className="mr-1.5 h-4 w-4" />
            Xóa
          </Button>
        </span>
      </div>
    </div>
  );
}
