import type { LucideIcon } from "lucide-react";
import { CheckCircle, Eye, MinusCircle } from "lucide-react";
import type { UserStatus } from "@/types/user";

export type JobSeekingStatusValue = UserStatus | null | undefined;

export type JobSeekingStatusConfig = {
  key: UserStatus;
  label: string;
  shortLabel: string;
  employerHint: string;
  className: string;
  icon: LucideIcon;
};

const STATUS_CONFIG: Record<UserStatus, JobSeekingStatusConfig> = {
  OPEN_TO_WORK: {
    key: "OPEN_TO_WORK",
    label: "Đang tìm việc",
    shortLabel: "Đang tìm việc",
    employerHint: "Ứng viên đang chủ động tìm việc và sẵn sàng ứng tuyển.",
    className: "border-[#BC2153]/30 bg-[#BC2153]/10 text-[#BC2153]",
    icon: CheckCircle,
  },
  LOOKING: {
    key: "LOOKING",
    label: "Xem xét cơ hội",
    shortLabel: "Xem xét cơ hội",
    employerHint: "Ứng viên sẵn sàng xem xét cơ hội phù hợp, có thể cần thêm thời gian cân nhắc.",
    className: "bg-amber-50 text-amber-800 border-amber-200",
    icon: Eye,
  },
  NOT_AVAILABLE: {
    key: "NOT_AVAILABLE",
    label: "Không tìm việc",
    shortLabel: "Không tìm việc",
    employerHint: "Ứng viên hiện không chủ động tìm việc.",
    className: "bg-slate-100 text-slate-600 border-slate-200",
    icon: MinusCircle,
  },
};

function normalizeJobSeekingStatus(status: JobSeekingStatusValue): UserStatus {
  return status ?? "OPEN_TO_WORK";
}

export function resolveJobSeekingStatusConfig(
  status: JobSeekingStatusValue
): JobSeekingStatusConfig {
  const normalized = normalizeJobSeekingStatus(status);
  return STATUS_CONFIG[normalized] ?? STATUS_CONFIG.OPEN_TO_WORK;
}

export function hasDeclaredJobSeekingStatus(status: JobSeekingStatusValue): boolean {
  const normalized = normalizeJobSeekingStatus(status);
  return normalized === "OPEN_TO_WORK" || normalized === "LOOKING" || normalized === "NOT_AVAILABLE";
}
