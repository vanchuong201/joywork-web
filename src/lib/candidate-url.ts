/**
 * Build employer-facing candidate profile URL with company context for CV Flip bypass.
 */
export function buildCompanyCandidateUrl(
  slugOrId: string,
  companyId: string
): string {
  return `/candidates/${encodeURIComponent(slugOrId)}?companyId=${encodeURIComponent(companyId)}`;
}
