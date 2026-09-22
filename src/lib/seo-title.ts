const ELLIPSIS = "....";
const NAME_MAX = 50;

/** Rút tên dài quá 50 ký tự, phần cắt được thay bằng `....`. */
export function truncateSeoName(value: string, max = NAME_MAX): string {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  const cut = Math.max(0, max - ELLIPSIS.length);
  return `${trimmed.slice(0, cut).trimEnd()}${ELLIPSIS}`;
}

/**
 * Title trang chi tiết việc làm.
 * Không có tỉnh/thành thì bỏ cụm `ở {tỉnh}`.
 */
export function buildJobDetailTitle(input: {
  jobTitle: string;
  companyName: string;
  province?: string | null;
}): string {
  const jobTitle = truncateSeoName(input.jobTitle);
  const companyName = truncateSeoName(input.companyName);
  const province = input.province?.replace(/\s+/g, " ").trim();
  const place = province ? ` ở ${province}` : "";
  return `${jobTitle} tại ${companyName}${place} | JOYWORK`;
}

export function buildCompanyProfileTitle(companyName: string): string {
  return `${truncateSeoName(companyName)} - Văn Hóa Doanh Nghiệp & Tuyển Dụng | JOYWORK`;
}
