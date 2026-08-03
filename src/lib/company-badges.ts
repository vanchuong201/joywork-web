export type CompanyBadgeType = "GOOD_COMPANY" | "BASIC_COMMITMENT";
export type CompanyBadgeInput = CompanyBadgeType | string | { type?: CompanyBadgeType | string | null } | null | undefined;

type CompanyBadgeMeta = {
  icon: string;
  corner: "left" | "right";
  alt: string;
  tooltip: string;
  href: string;
};

export const COMPANY_BADGES: Record<CompanyBadgeType, CompanyBadgeMeta> = {
  GOOD_COMPANY: {
    icon: "/badge/badge.png",
    corner: "left",
    alt: "Huy hiệu doanh nghiệp tốt",
    tooltip: "Đây là Huy hiệu chứng nhận Doanh Nghiệp có môi trường làm việc tốt.",
    href: "https://doanhnghieptot.joywork.vn/",
  },
  BASIC_COMMITMENT: {
    icon: "/badge/badge-commitment.png",
    corner: "right",
    alt: "Huy hiệu doanh nghiệp cam kết đạt chuẩn",
    tooltip:
      "Đây là Huy hiệu cho Doanh Nghiệp đã cam kết đạt chuẩn điều kiện làm việc cơ bản theo tiêu chí của JOBVUI và JOYWORK.",
    href: "https://camket.joywork.vn/",
  },
};

/** Labels for badge filter checkboxes / chips on /jobs and /companies. */
export const COMPANY_BADGE_FILTER_OPTIONS: {
  value: CompanyBadgeType;
  label: string;
  detailHref: string;
}[] = [
  {
    value: "GOOD_COMPANY",
    label: "DN đạt khảo sát môi trường làm việc tốt",
    detailHref: COMPANY_BADGES.GOOD_COMPANY.href,
  },
  {
    value: "BASIC_COMMITMENT",
    label: "DN cam kết đạt chuẩn điều kiện làm việc",
    detailHref: COMPANY_BADGES.BASIC_COMMITMENT.href,
  },
];

const COMPANY_BADGE_ORDER: CompanyBadgeType[] = ["GOOD_COMPANY", "BASIC_COMMITMENT"];

function toBadgeType(value: CompanyBadgeInput): CompanyBadgeType | null {
  const raw = typeof value === "string" ? value : value?.type;
  if (!raw) return null;
  return (COMPANY_BADGE_ORDER as string[]).includes(raw) ? (raw as CompanyBadgeType) : null;
}

export function normalizeCompanyBadges(input: CompanyBadgeInput[] | null | undefined): CompanyBadgeType[] {
  if (!Array.isArray(input) || input.length === 0) {
    return [];
  }

  const badgeSet = new Set(
    input
      .map((item) => toBadgeType(item))
      .filter((badge): badge is CompanyBadgeType => Boolean(badge))
  );

  return COMPANY_BADGE_ORDER.filter((badge) => badgeSet.has(badge));
}
