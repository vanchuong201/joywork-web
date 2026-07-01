/**
 * Build employer-facing candidate profile URL with company context for CV Flip bypass.
 */
export function buildCompanyCandidateUrl(
  slugOrId: string,
  companyId: string
): string {
  return `/candidates/${encodeURIComponent(slugOrId)}?companyId=${encodeURIComponent(companyId)}`;
}

/** URL xem hồ sơ trên danh sách ứng viên (yêu cầu đăng nhập, tuân thủ CV Flip). */
export function buildCandidateProfileUrl(slugOrId: string): string {
  return `/candidates/${encodeURIComponent(slugOrId)}`;
}
