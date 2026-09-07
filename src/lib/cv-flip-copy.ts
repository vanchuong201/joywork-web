import type { CvFlipRequestStatus } from "@/types/cv-flip";

/** Thông báo khi doanh nghiệp chưa có gói Mở CV (premium). */
export const CV_FLIP_PREMIUM_REQUIRED_MESSAGE =
  "Đây là tính năng trả phí của JOYWORK.VN. Vui lòng liên hệ contact@joywork.vn | 033 868 5855";

export const CV_FLIP_REQUEST_STATUS_LABEL: Record<CvFlipRequestStatus, string> = {
  REJECTED: "Đã từ chối",
  PENDING: "Chờ phản hồi",
  APPROVED: "Đã đồng ý",
  EXPIRED: "Hết hạn",
};

export function cvFlipRequestStatusLabel(status: string): string {
  return CV_FLIP_REQUEST_STATUS_LABEL[status as CvFlipRequestStatus] ?? status;
}

export function cvFlipCompanyRequestStatusLabel(
  status: CvFlipRequestStatus,
  source?: "REQUEST" | "DIRECT_OPEN",
): string {
  if (source === "DIRECT_OPEN") return "Đã mở";
  return CV_FLIP_REQUEST_STATUS_LABEL[status];
}
