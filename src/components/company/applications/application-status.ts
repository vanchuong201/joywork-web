export const APPLICATION_STATUS_LABEL: Record<string, string> = {
  RECEIVED: "Doanh nghiệp đã nhận hồ sơ",
  SUITABLE: "Phù hợp",
  INTERVIEW_SCHEDULED: "Hẹn phỏng vấn",
  OFFER_SENT: "Gửi đề nghị",
  HIRED: "Nhận việc",
  NOT_SUITABLE: "Không phù hợp",
  NOT_SUITABLE_SAVED: "Chưa phù hợp và sẽ lưu hồ sơ",
};

export const APPLICATION_STATUS_COLORS: Record<string, string> = {
  RECEIVED: "bg-yellow-100 text-yellow-700 border-yellow-200",
  SUITABLE: "bg-blue-100 text-blue-700 border-blue-200",
  INTERVIEW_SCHEDULED: "bg-indigo-100 text-indigo-700 border-indigo-200",
  OFFER_SENT: "bg-green-100 text-green-700 border-green-200",
  HIRED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  NOT_SUITABLE: "bg-red-100 text-red-700 border-red-200",
  NOT_SUITABLE_SAVED: "bg-orange-100 text-orange-700 border-orange-200",
};

export const APPLICATION_STATUS_FALLBACK_COLOR =
  "border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)]";

export const APPLICATION_STATUS_OPTIONS = Object.keys(APPLICATION_STATUS_LABEL);
