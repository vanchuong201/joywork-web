import type { LucideIcon } from "lucide-react";
import { CheckCircle, Eye, HelpCircle, MinusCircle } from "lucide-react";
import type { UserStatus } from "@/types/user";

export type JobSeekingStatusValue = UserStatus | null | undefined;

export type JobSeekingStatusConfig = {
  key: UserStatus | "UNSET";
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
    className: "bg-green-50 text-green-700 border-green-200",
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
    employerHint:
      "Ứng viên chưa khai báo đang chủ động tìm việc. Hồ sơ vẫn có thể hiển thị trong danh sách theo cài đặt của ứng viên.",
    className: "bg-slate-100 text-slate-600 border-slate-200",
    icon: MinusCircle,
  },
};

const UNSET_CONFIG: JobSeekingStatusConfig = {
  key: "UNSET",
  label: "Chưa khai báo",
  shortLabel: "Chưa khai báo",
  employerHint:
    "Ứng viên chưa cập nhật mức độ tìm việc. Việc này không ảnh hưởng đến việc hồ sơ xuất hiện trong danh sách.",
  className: "bg-slate-50 text-slate-500 border-slate-200 border-dashed",
  icon: HelpCircle,
};

export function resolveJobSeekingStatusConfig(
  status: JobSeekingStatusValue
): JobSeekingStatusConfig {
  if (!status) return UNSET_CONFIG;
  return STATUS_CONFIG[status] ?? UNSET_CONFIG;
}

export function hasDeclaredJobSeekingStatus(status: JobSeekingStatusValue): boolean {
  return status === "OPEN_TO_WORK" || status === "LOOKING" || status === "NOT_AVAILABLE";
}
