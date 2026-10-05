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

/** Link "Xem CV công khai" của chủ CV. CV mặc định mở trang ứng viên; CV khác chỉ chủ xem được. */
export function buildOwnedCvPublicHref(
  cv: { id: string; isDefault: boolean },
  account?: { id: string; slug?: string | null } | null,
): string | null {
  if (cv.isDefault) {
    if (!account) return null;
    return buildCandidateProfileUrl(account.slug || account.id);
  }
  return `/account/profile/cv/${encodeURIComponent(cv.id)}/preview`;
}

/** URL màn DN xem đơn ứng tuyển (CV theo snapshot tại thời điểm nộp). */
export function buildApplicationUrl(companySlug: string, applicationId: string): string {
  return `/companies/${encodeURIComponent(companySlug)}/manage/applications/${encodeURIComponent(applicationId)}`;
}
